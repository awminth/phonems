const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { pool } = require('../config/database');

const MAX_MESSAGE_CHARS = 2000;
const MAX_HISTORY_TURNS = 8;
const HELP_CHAT_DAILY_LIMIT = 30;

let cachedKnowledge = null;
let usageTableReady = false;

function myanmarDateStr(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Yangon',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function getGeminiConfig() {
  const apiKey = String(process.env.GEMINI_API_KEY || '').trim();
  const model = String(process.env.GEMINI_MODEL || 'gemini-2.0-flash').trim();
  return { apiKey, model, configured: Boolean(apiKey) };
}

async function ensureHelpChatUsageTable() {
  if (usageTableReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS help_chat_daily_usage (
      user_id VARCHAR(64) NOT NULL,
      usage_date DATE NOT NULL,
      request_count INT NOT NULL DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, usage_date)
    )
  `);
  usageTableReady = true;
}

async function getHelpChatQuota(userId) {
  await ensureHelpChatUsageTable();
  const usageDate = myanmarDateStr();
  const [rows] = await pool.query(
    `SELECT request_count FROM help_chat_daily_usage
     WHERE user_id = ? AND usage_date = ?
     LIMIT 1`,
    [String(userId), usageDate]
  );
  const used = Number(rows[0]?.request_count || 0);
  return {
    limit: HELP_CHAT_DAILY_LIMIT,
    used,
    remaining: Math.max(0, HELP_CHAT_DAILY_LIMIT - used),
  };
}

async function consumeHelpChatQuota(userId) {
  await ensureHelpChatUsageTable();
  const usageDate = myanmarDateStr();
  const uid = String(userId);

  const [updateResult] = await pool.query(
    `UPDATE help_chat_daily_usage
     SET request_count = request_count + 1
     WHERE user_id = ?
       AND usage_date = ?
       AND request_count < ?`,
    [uid, usageDate, HELP_CHAT_DAILY_LIMIT]
  );

  if (updateResult.affectedRows === 1) {
    return getHelpChatQuota(uid);
  }

  try {
    await pool.query(
      `INSERT INTO help_chat_daily_usage (user_id, usage_date, request_count)
       VALUES (?, ?, 1)`,
      [uid, usageDate]
    );
    return {
      limit: HELP_CHAT_DAILY_LIMIT,
      used: 1,
      remaining: HELP_CHAT_DAILY_LIMIT - 1,
    };
  } catch (err) {
    if (err?.code === 'ER_DUP_ENTRY') {
      const error = new Error(
        `ယနေ့အတွက် မေးခွန်းအကြိမ် (${HELP_CHAT_DAILY_LIMIT}) ကုန်ဆုံးပါပြီ။ မနက်ဖြန် ပြန်မေးနိုင်ပါသည်။`
      );
      error.status = 429;
      throw error;
    }
    throw err;
  }
}

function resolveKnowledgePath() {
  const candidates = [
    path.join(__dirname, '..', '..', 'knowledge', 'phonems-help-mm.md'),
    path.join(__dirname, 'knowledge', 'phonems-help-mm.md'),
    path.join(process.cwd(), 'knowledge', 'phonems-help-mm.md'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return candidates[0];
}

function loadKnowledge() {
  if (cachedKnowledge) return cachedKnowledge;
  const filePath = resolveKnowledgePath();
  if (!fs.existsSync(filePath)) {
    const error = new Error('Help knowledge file မတွေ့ပါ။');
    error.status = 500;
    throw error;
  }
  cachedKnowledge = fs.readFileSync(filePath, 'utf8');
  return cachedKnowledge;
}

function buildSystemInstruction(knowledge) {
  return `သင်သည် Marctober Phone & Service POS (phonems / marctober) အတွက် မြန်မာဘာသာ အကူအညီပေးသူ ဖြစ်သည်။

စည်းမျဉ်းများ:
1. ဤဆော့ဖ်ဝဲ အသုံးပြုနည်းနှင့်သာ သက်ဆိုင်သော မေးခွန်းများကို ဖြေပါ။
2. မေးခွန်းနှင့် အဖြေကို မြန်မာဘာသာဖြင့်သာ ရေးပါ။ အင်္ဂလိပ် သို့မဟုတ် အခြားဘာသာဖြင့် မေးလာပါက မြန်မာလို ပြန်မေးခိုင်းပါ။
3. ဆော့ဖ်ဝဲနှင့် မသက်ဆိုင်သော အကြောင်းအရာ (သတင်း၊ ဟာသ၊ ပရိုဂရမ်မင်း သင်ခန်းစာ၊ ရာဇဝတ်မှု စသည်) ကို ငြင်းပါ — မြန်မာလို တိုတို ရှင်းပြပါ။
4. အောက်ပါ အသုံးပြုလမ်းညွှန်စာရွက်ကိုသာ အခြေခံပါ။ စာရွက်တွင် မပါလျှင် မှန်းမဖြေဘဲ မသိကြောင်း ပြောပါ။
5. တကယ့် ဒေတာဘေ့စ်မှတ်တမ်း၊ စကားဝှက်၊ API key တောင်းခြင်း မလုပ်ရ။
6. အဖြေကို တိုရှင်း၊ အဆင့်လိုက် (လိုအပ်လျှင် နံပါတ်တပ်) ရေးပါ။

--- အသုံးပြုလမ်းညွှန် ---
${knowledge}
--- အဆုံး ---`;
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  const turns = [];
  for (const item of history) {
    if (!item || typeof item !== 'object') continue;
    const role = item.role;
    const text = String(item.text || '').trim();
    if ((role !== 'user' && role !== 'model') || !text) continue;
    turns.push({ role, text: text.slice(0, MAX_MESSAGE_CHARS) });
  }
  return turns.slice(-MAX_HISTORY_TURNS * 2);
}

async function askHelpChat({ userId, message, history }) {
  const { apiKey, model, configured } = getGeminiConfig();
  if (!configured) {
    const error = new Error(
      'Help Chat မရနိုင်သေးပါ။ backend/.env တွင် GEMINI_API_KEY ထည့်ပါ။'
    );
    error.status = 503;
    throw error;
  }

  const text = String(message || '').trim();
  if (!text) {
    const error = new Error('မေးခွန်း ရေးပါ။');
    error.status = 400;
    throw error;
  }
  if (text.length > MAX_MESSAGE_CHARS) {
    const error = new Error(
      `မေးခွန်း အလွန်ရှည်ပါသည် (အများဆုံး ${MAX_MESSAGE_CHARS} လုံး)။`
    );
    error.status = 400;
    throw error;
  }

  if (!userId) {
    const error = new Error('Authentication required');
    error.status = 401;
    throw error;
  }

  const quota = await consumeHelpChatQuota(userId);
  const knowledge = loadKnowledge();
  const turns = normalizeHistory(history);

  const genAI = new GoogleGenerativeAI(apiKey);
  const genModel = genAI.getGenerativeModel({
    model,
    systemInstruction: buildSystemInstruction(knowledge),
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1024,
    },
  });

  const chatHistory = turns.map((t) => ({
    role: t.role === 'model' ? 'model' : 'user',
    parts: [{ text: t.text }],
  }));

  try {
    const chat = genModel.startChat({ history: chatHistory });
    const result = await chat.sendMessage(text);
    const reply = String(result?.response?.text?.() || '').trim();

    if (!reply) {
      const error = new Error('အဖြေ မရရှိပါ။ ခဏနေပြီး ပြန်မေးပါ။');
      error.status = 502;
      throw error;
    }

    return { reply, ...quota };
  } catch (err) {
    if (err?.status) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('"code":429') || msg.includes('429')) {
      const error = new Error(
        'Gemini အသုံးပြုခွင့် ယာယီ ကုန်ဆုံးနေပါသည်။ ခဏနေပြီး ပြန်မေးပါ။'
      );
      error.status = 429;
      throw error;
    }
    if (msg.includes('FAILED_PRECONDITION') || msg.includes('User location')) {
      const error = new Error(
        'ဤတည်နေရာမှ Gemini API သုံး၍ မရပါ။ Render/server ဘက်မှ စမ်းပါ။'
      );
      error.status = 503;
      throw error;
    }
    console.error('Gemini help chat failed:', err);
    const error = new Error('Help Chat ချိတ်ဆက်၍ မရပါ။ ခဏနေပြီး ပြန်ကြိုးစားပါ။');
    error.status = 502;
    throw error;
  }
}

module.exports = {
  HELP_CHAT_DAILY_LIMIT,
  ensureHelpChatUsageTable,
  getHelpChatQuota,
  askHelpChat,
};
