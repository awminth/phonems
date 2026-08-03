import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { API_CONFIG, sessionManager } from '../config';

interface HelpChatQuota {
  limit: number;
  used: number;
  remaining: number;
}

interface HelpChatTurn {
  role: 'user' | 'model';
  text: string;
}

interface UiMessage {
  role: 'user' | 'model';
  text: string;
}

const WELCOME =
  'မင်္ဂလာပါ။ Marctober Phone & Service POS အသုံးပြုနည်းကို မြန်မာလို မေးနိုင်ပါသည်။ တစ်ရက်လျှင် အကြိမ် ၃၀ အထိ မေးနိုင်ပါသည်။';

function authHeaders(): HeadersInit {
  const user = sessionManager.getUser();
  return {
    'Content-Type': 'application/json',
    'X-User-ID': user?.id != null ? String(user.id) : '',
    'X-User-Type': user?.userType || 'user',
    'X-Branch-ID': user?.branchId != null ? String(user.branchId) : '',
  };
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data?.message || 'မေးခွန်း ပို့၍ မရပါ။ ခဏနေပြီး ပြန်ကြိုးစားပါ။';
  } catch {
    return 'မေးခွန်း ပို့၍ မရပါ။ ခဏနေပြီး ပြန်ကြိုးစားပါ။';
  }
}

async function getHelpChatQuota(): Promise<HelpChatQuota> {
  const res = await fetch(`${API_CONFIG.BASE_URL}/help-chat/quota`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

async function postHelpChat(
  message: string,
  history: HelpChatTurn[]
): Promise<{ reply: string } & HelpChatQuota> {
  const res = await fetch(`${API_CONFIG.BASE_URL}/help-chat`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ message, history }),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

const HelpChat: React.FC = () => {
  const location = useLocation();
  const [userId, setUserId] = useState<string | null>(() => sessionManager.getUser()?.id ?? null);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [quota, setQuota] = useState<HelpChatQuota | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([
    { role: 'model', text: WELCOME },
  ]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Re-read session on every route change (login → dashboard)
  useEffect(() => {
    const user = sessionManager.getUser();
    setUserId(user?.id != null ? String(user.id) : null);
    if (!user?.id) setOpen(false);
  }, [location.pathname, location.hash, location.key]);

  useEffect(() => {
    if (!open || !userId) return;
    void getHelpChatQuota()
      .then(setQuota)
      .catch(() => setQuota(null));
  }, [open, userId]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    inputRef.current?.focus();
  }, [open, messages, sending]);

  if (!userId || typeof document === 'undefined') return null;

  const remaining = quota?.remaining ?? null;
  const atLimit = remaining !== null && remaining <= 0;

  const send = async () => {
    const text = input.trim();
    if (!text || sending || atLimit) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setSending(true);

    try {
      const history: HelpChatTurn[] = messages
        .filter((m) => m.role === 'user' || m.role === 'model')
        .slice(1)
        .map((m) => ({ role: m.role, text: m.text }));

      const result = await postHelpChat(text, history);
      setQuota({
        limit: result.limit,
        used: result.used,
        remaining: result.remaining,
      });
      setMessages((prev) => [...prev, { role: 'model', text: result.reply }]);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'မေးခွန်း ပို့၍ မရပါ။ ခဏနေပြီး ပြန်ကြိုးစားပါ။';
      setMessages((prev) => [...prev, { role: 'model', text: msg }]);
      void getHelpChatQuota()
        .then(setQuota)
        .catch(() => undefined);
    } finally {
      setSending(false);
    }
  };

  // Portal to body so layout overflow / stacking never hides the FAB on mobile
  return createPortal(
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-sky-600 text-white shadow-xl shadow-sky-900/50 ring-2 ring-white/20 transition hover:bg-sky-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] right-4 md:bottom-6 md:right-6 md:h-12 md:w-12"
        aria-label={open ? 'အကူအညီ ပိတ်ရန်' : 'အကူအညီ ဖွင့်ရန်'}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div
          className="fixed z-[9999] flex max-h-[min(70vh,28rem)] w-[min(100vw-1.5rem,22rem)] flex-col overflow-hidden rounded-2xl border border-gray-600 bg-gray-900 shadow-2xl bottom-[max(9.5rem,calc(env(safe-area-inset-bottom)+8.5rem))] right-3 md:bottom-24 md:right-6"
          role="dialog"
          aria-label="အကူအညီ chat"
        >
          <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">အကူအညီ (မြန်မာ)</p>
              <p className="text-xs text-gray-400">
                {quota
                  ? `ယနေ့ ကျန် ${quota.remaining} / ${quota.limit}`
                  : 'Marctober POS အသုံးပြုနည်းသာ'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-700 hover:text-white"
              aria-label="ပိတ်ရန်"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div
            ref={listRef}
            className="flex min-h-[12rem] flex-1 flex-col gap-2 overflow-y-auto px-3 py-3"
          >
            {messages.map((m, i) => (
              <div
                key={`${i}-${m.role}`}
                className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'ml-auto bg-sky-600 text-white'
                    : 'mr-auto bg-gray-800 text-gray-100'
                }`}
              >
                {m.text}
              </div>
            ))}
            {sending && (
              <div className="mr-auto flex items-center gap-2 rounded-2xl bg-gray-800 px-3 py-2 text-xs text-gray-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                စဉ်းစားနေသည်…
              </div>
            )}
          </div>

          <div className="border-t border-gray-700 p-3">
            <p className="mb-2 text-[11px] text-gray-500">
              {atLimit
                ? 'ယနေ့ အကြိမ်ကုန်ပါပြီ။ မနက်ဖြန် ပြန်မေးနိုင်ပါသည်။'
                : 'မြန်မာလိုသာ မေးပါ။ တစ်ရက် ၃၀ ကြိမ်။'}
            </p>
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                rows={2}
                placeholder={atLimit ? 'ယနေ့ အကြိမ်ကုန်ပါပြီ' : 'မေးခွန်း ရေးပါ…'}
                disabled={sending || atLimit}
                className="min-h-[2.75rem] flex-1 resize-none rounded-xl border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={sending || atLimit || !input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="ပို့ရန်"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};

export default HelpChat;
