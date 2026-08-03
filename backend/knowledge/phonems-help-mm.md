# Marctober Phone & Service POS — အသုံးပြုလမ်းညွှန် (မြန်မာ)

ဤစာရွက်သည် **Marctober Phone & Service POS** (phonems) ဆော့ဖ်ဝဲအတွက် အကူအညီစာရွက်ဖြစ်သည်။ Browser title မှာ `marctober` ဟု ပြသည်။

## စနစ်အကြောင်း အတိုချုပ်

ဖုန်းဆိုင် / ဝန်ဆောင်မှုစင်တာအတွက် POS၊ အရောင်း၊ အဝယ်၊ စတော့၊ ဖုန်းပြင် (Service Ticket)၊ ငွေစာရင်းနှင့် အစီရင်ခံစာများကို စီမံသည့် ဝက်ဘ်စနစ်ဖြစ်သည်။

အဓိက မီနူးများ (Sidebar / ရှာဖွေရေး) —
- **POS (Dashboard)**၊ **Services**၊ **Sale**၊ **Sale Return**၊ **Purchase**၊ **Customer**၊ **Reports**၊ **Expense**၊ **Financial**၊ **User Setting**၊ **Security**၊ **Post Creator AI**၊ **Branch**

Login ပြီးနောက် ပုံမှန်အားဖြင့် **POS / Dashboard** သို့ ရောက်သည်။ အသုံးပြုသူ ခွင့်ပြုချက် (permissions) အလိုက် မီနူး အချို့ ပေါ်/မပေါ် ဖြစ်နိုင်သည်။ Admin သည် Branch အားလုံး / အထူးအစီရင်ခံစာများ ကြည့်နိုင်သည်။

---

## Login / အကောင့်

1. Login စာမျက်နှာတွင် Username နှင့် Password ထည့်ပါ။
2. **Save Username and Password** ကို ရွေးထားလျှင် နောက်တစ်ကြိမ် အလိုအလျောက် ဖြည့်ပေးသည်။
3. အောင်မြင်ပါက Dashboard (POS) သို့ သွားသည်။
4. ထွက်ရန် Header မှ Logout သုံးပါ။

ခွင့်မရှိသော မီနူးကို Sidebar တွင် မမြင်ရပါ။ Admin သို့မဟုတ် User Setting ခွင့်ရှိသူက အသုံးပြုသူနှင့် ခွင့်ပြုချက် စီမံနိုင်သည်။

---

## POS (အရောင်းပွိုင့်)

**ဘယ်မှာ:** ပင်မ Dashboard → POS (`/dashboard`) — Login ပြီး ပုံမှန်နေရာ

### မုဒ်များ

- **Phones** — IMEI/serial ပါသော ဖုန်းများ
- **Products / Accessories** — အရန်ပစ္စည်း
- **Services** — ဝန်ဆောင်မှုလိုင်း
- **Spare parts** — အပိုပား

ရှာဖွေ၊ အမျိုးအစားစစ်ထုတ်၊ **Barcode scan** မုဒ် သုံးနိုင်သည်။

### အရောင်းလုပ်နည်း (အဆင့်လိုက်)

1. မုဒ် / အမျိုးအစား ရွေးပြီး ပစ္စည်းရှာပါ သို့မဟုတ် ဘားကုဒ် စကင်ပါ။
2. ဖုန်းဆိုလျှင် **IMEI ရွေးချယ်မှု** ပေါ်မည် — မှန်ကန်သော IMEI ရွေးပါ။
3. Cart တွင် ပမာဏ +/- လုပ်နိုင်သည်။ လိုအပ်လျှင် **custom service** (အမည် + စျေး) ထည့်နိုင်သည်။
4. ဖောက်သည် (Customer) ရွေး / အသစ်ထည့်ပါ — **Credit** ရောင်းရန် မဖြစ်မနေလိုသည်။
5. လျှော့စျေးကို **% သို့မဟုတ် ပမာဏ** ဖြင့် ထည့်နိုင်သည်။
6. ငွေပေးချေမှု ရွေးပါ — **Cash / KPay / WavePay / Credit**။
7. Cash ဆိုလျှင် ပေးငွေ / အကြွေ့ တွက်နိုင်သည်။ **Checkout** လုပ်ပါ။
8. အောင်မြင်ပါက ဘောင်ချာ ပရင့်ထုတ်နိုင်သည်။

### Hold / Silent order

- ရောင်းဆဲ Cart ကို **Hold** ထားနိုင်သည် (နောက်မှ ပြန်ဖွင့်)။
- Session ထဲ Cart ကျန်နိုင်သည်။

### သိထားရန်

- IMEI ပါသော ပစ္စည်းများကို IMEI မရွေးဘဲ မရောင်းသင့်ပါ။
- စတော့ မရှိ / IMEI မရနိုင်သော ပစ္စည်းကို Cart ထည့်၍ မရနိုင်ပါ။
- ရောင်းပြီးနောက် Cash / Credit စာရင်းများကို **Sale** မီနူးမှ ပြန်ကြည့်နိုင်သည်။

---

## Sale (အရောင်းစီမံ)

**ဘယ်မှာ:** Sidebar → **Sale** (`/sale`)

ကတ်ခွဲများ —

| ကတ် | လုပ်ဆောင်ချက် |
|-----|----------------|
| **Cash Sale** | ငွေသား / KPay / WavePay ရောင်းစာရင်း၊ ဘောင်ချာ၊ Excel၊ ဖျက်နိုင် |
| **Credit Sale** | အကြွေးရောင်းစာရင်း၊ အကြွေးပေးချေမှု (တစ်စိတ်/အပြည့်)၊ Customer Pay View |
| **Sale Return** | ပြန်လည်လက်ခံထားသော အရောင်းပြန်စာရင်း |
| **Damage List** | ပျက်စီးမှတ်တမ်းစာရင်း |

### Credit ပေးချေမှု

1. Sale → **Credit Sale** သို့ သွားပါ။
2. ဘောင်ချာရွေးပြီး Cash / KPay / WavePay ဖြင့် ပေးချေမှု မှတ်တမ်းတင်ပါ။
3. **Customer Pay View** မှ ဖောက်သည်အလိုက် လက်ကျန် ကြည့်နိုင်သည်။
4. Reports → **Receivable Report** နှင့်လည်း တွဲသုံးနိုင်သည်။

### Sale Return (အရောင်းပြန်)

1. Sidebar မှ **Sale Return** (`/sale-return/new`) သို့ သွားပါ။
2. မူလရောင်းဘောင်ချာ ရှာပြီး ပြန်လက်ခံမည့် ပစ္စည်း / ပမာဏ ရွေးပါ။
3. Service လိုင်းအချို့ ပြန်မရနိုင်ပါ။
4. အကြောင်းပြချက် ထည့်ပြီး လုပ်ဆောင်ပါ — ဘောင်ချာ ပရင့်နိုင်သည်။
5. စာရင်းကို `/sale/return` နှင့် Sale Return Report မှ ကြည့်နိုင်သည်။

### Damage

- **Damage List** မှ စာရင်းကြည့်၊ **Damage New** (`/sale/damage/new`) မှ အသစ်တင်ပါ။
- ပစ္စည်း၊ ပမာဏ သို့မဟုတ် IMEI၊ အကြောင်းရင်း ထည့်ပါ — စတော့ လျော့မည်။

---

## Purchase (အဝယ် / စတော့)

**ဘယ်မှာ:** Sidebar → **Purchase** (`/purchase`)

| ကတ် | လုပ်ဆောင်ချက် |
|-----|----------------|
| **Purchase List** | အဝယ်စာရင်း၊ ဘောင်ချာကြည့် |
| **Inventory List** | ကုန်ပစ္စည်း / စတော့ / စျေးနှုန်း |
| **Purchase Return** | အဝယ်ပြန်စာရင်းနှင့် အသစ်တင် |
| **Remainder** | စတော့နည်းသော ပစ္စည်းများ သတိပေး (badge ပြနိုင်) |
| **Category** | ကုန်အမျိုးအစား စီမံ |
| **Supplier** | ကုမ္ပဏီ / ပေးသွင်းသူ စီမံ |
| **Transfer Item** | ဌာနခွဲအချင်းချင်း ပစ္စည်းပို့ |
| **Receive Item** | ပို့ထားသော ပစ္စည်း လက်ခံ |

### အဝယ်ဘောင်ချာ အသစ်

1. Purchase List သို့မဟုတ် Voucher New (`/purchase/voucher/new`) သို့ သွားပါ။
2. Supplier၊ ပစ္စည်း၊ အရေအတွက်၊ စျေး၊ IMEI1/IMEI2 (ဖုန်း) ဖြည့်ပါ။
3. ပုံတင်နိုင်သည်။ **Excel import** ဖြင့် လိုင်းများ တင်နိုင်သည်။
4. Save လုပ်ပြီး စတော့ တက်လာမည်။
5. Voucher ပေါ်တွင် Supplier သို့ ပေးချေမှု မှတ်နိုင်သည်။

### Inventory

- Tab များ — Phone / Accessories / Service / Spare
- ရောင်းဈေး / ပမာဏ ပြင်၊ **stock adjust** (+/− + အကြောင်းရင်း/IMEI)
- Adjustment history၊ price change history၊ IMEI list၊ **barcode print**၊ Excel
- Admin သည် Branch အလိုက် စစ်ထုတ်နိုင်သည်

### Transfer / Receive

1. **Transfer Item** မှ ပစ္စည်းနှင့် ပမာဏ / IMEI ရွေးပြီး အခြား Branch သို့ ပို့ပါ။
2. လက်ခံ Branch မှ **Receive Item** ဖြင့် အတည်ပြု — စတော့ ထည့်သည်။
3. Transfer ဖျက်လျှင် စတော့ ပြန်ရနိုင်သည် (ခွင့်ရှိလျှင်)။
4. Transfer / Receive Report များဖြင့် မှတ်တမ်းကြည့်နိုင်သည်။

### Supplier In/Out

- Supplier စာမျက်နှာနှင့် ဆက်စပ်၍ ပေးချေမှု / အကြွေး လှုပ်ရှားမှု ကြည့်နိုင်သည် (`/purchase/supplier-in-out`)။

---

## Services (ဖုန်းပြင် / Service Ticket)

**ဘယ်မှာ:** Sidebar → **Services** (`/services`)

### Tab များ

- **All tickets** — စုစုပေါင်း
- **Today pickups** — ယနေ့ လာယူရန်
- **Reminders** — ရက်နီးသော ticket များ

Status စစ်ထုတ် — Pending → In-Progress → Ready → Picked-up

### Ticket အသစ်

1. **Services** ဖွင့်ပါ။
2. ဖောက်သည်၊ brand/model၊ အရောင်၊ IMEI၊ ပြဿနာ၊ Technician၊ ETA ဖြည့်ပါ။
3. Device **password** သို့မဟုတ် **pattern lock**၊ scratch map၊ ပုံတင်နိုင်သည်။
4. အပိုပား — ဆိုင်စတော့မှ သို့မဟုတ် **external** ဝယ်ယူမှု
5. Accessories checklist၊ deposit / ပေးငွေ မှတ်နိုင်သည်။
6. Save — တိုကင်နံပါတ် ထုတ်၊ ပရင့် / Excel လုပ်နိုင်သည်။
7. Technician များကို စာမျက်နှာအတွင်း CRUD လုပ်နိုင်သည်။

### စာရင်းနှင့် အခြေအနေ

- Ticket ရှာဖွေ၊ စစ်ထုတ်၊ ပြင်၊ ဖျက် (ခွင့်ရှိလျှင်)
- Picked-up ပြီးနောက် Service Report / Financial တွင် ဝန်ဆောင်မှုအမြတ် ပါဝင်နိုင်သည်

---

## Customer

**ဘယ်မှာ:** Sidebar → **Customer** (`/customers`)

- ဖောက်သည် အသစ်ထည့် / ပြင် / ရှာဖွေ
- POS နှင့် Service တွင် ဖောက်သည် ရွေးရန် အသုံးပြုသည်
- အကြွေးရောင်းနှင့် Receivable နှင့် ဆက်စပ်သည်

---

## Reports (အစီရင်ခံစာများ)

**ဘယ်မှာ:** Sidebar → **Reports** (`/reports`)

ရရှိနိုင်သော အစီရင်ခံစာများ —

- **Cash Report** — ငွေသားရောင်း
- **Credit Report** — အကြွေးရောင်း
- **Salesperson Report** — ရောင်းသူအလိုက်
- **Service Report** — ဝန်ဆောင်မှု ticket
- **Sale Return Report** — အရောင်းပြန်
- **IMEI History Check** — IMEI လှုပ်ရှားမှု ရှာဖွေ
- **Payment Report** — ပေးချေမှုများ
- **Damage Report** — ပျက်စီးမှတ်တမ်း
- **Sale Items Report** — ရောင်းပစ္စည်းအလိုက်
- **Phones & Accessories & Services** — အမျိုးအစားအလိုက်
- **External Purchases Report** — ပြင်ပအဝယ်
- **Stock Adjustment History** — စတော့ညှိနှိုင်း
- **Change Price History** — ရောင်းဈေးပြောင်းမှတ်တမ်း
- **Top Items Report** — အရောင်းကောင်းပစ္စည်း
- **Payable Report** — ပေးရန်ရှိ (supplier)
- **Receivable Report** — ရရန်ရှိ (customer)
- **Transfer Report** / **Receive Report** — ဌာနခွဲ ပို့/လက်ခံ
- **Brand Sales Analysis** — Admin သာ (brand စွမ်းဆောင်ရည်)

ရက်စွဲစစ်ထုတ်၊ ရှာဖွေ၊ Excel / ပရင့် (ရှိသည့်စာမျက်နှာအလိုက်) သုံးနိုင်သည်။

---

## Expense (အသုံးစရိတ်)

**ဘယ်မှာ:** Sidebar → **Expense** (`/expense`)

- **Expense List** — အမျိုးအစား၊ ဖော်ပြချက်၊ ပမာဏ၊ ရက်စွဲ CRUD၊ Excel
- **Category List** — အသုံးစရိတ်အမျိုးအစား CRUD

---

## Financial

**ဘယ်မှာ:** Sidebar → **Financial** (`/financial`)

ကာလအလိုက် အကျိုးအမြတ် အနှစ်ချုပ် —

- ရောင်း၊ ကုန်ကျ၊ အရောင်းပြန်၊ အဝယ်ပြန်
- Service ဝင်ငွေ / ကုန်ကျ / အမြတ်
- အသုံးစရိတ်၊ **net profit**
- Cash vs Credit၊ outstanding credit
- Admin — Branch အလိုက် ခွဲကြည့်နိုင်၊ Excel

Payable / Receivable အသေးစိတ်အတွက် Reports နှင့် တွဲသုံးပါ။

---

## User Setting

**ဘယ်မှာ:** Sidebar → **User Setting** (`/users`)

- အသုံးပြုသူ ဖန်တီး / ပြင် / ဖျက် (admin/manager စည်းမျဉ်းအလိုက်)
- **userType** — `admin` | `manager` | `user`
- **branch** ချိတ်၊ **permissions** သတ်မှတ်၊ Active အလံ
- ခွင့်ပြုချက် ID များ ဥပမာ — `sale`, `sale-return`, `purchase`, `reports`, `expense`, `user`, `financial`, `customer`, `ai`, `services`
- CSV export

Admin — Branch ဖြတ်၍ ကြည့်နိုင်၊ Brand Analytics ကြည့်နိုင်။ Manager — ကိုယ့် Branch အသုံးပြုသူ စီမံနိုင် (admin မဖန်တီးရ)။

---

## Security

**ဘယ်မှာ:** Sidebar → **Security** (`/security`) — Login ဝင်သူတိုင်း မြင်ရသည်

- **Change password**
- **Print settings** — ဆိုင်အမည်၊ ဖုန်း၊ လိပ်စာ၊ လိုဂိုတင်၊ footer / warranty စာသား
- **Activity log** — admin/manager သာ (login/လုပ်ဆောင်ချက်မှတ်တမ်း)

---

## Branch (ဌာနခွဲ)

**ဘယ်မှာ:** Sidebar → **Branch** (`/branches`) — အများအားဖြင့် Admin

- ဌာနခွဲ အသစ် / ပြင် / စာရင်း
- အသုံးပြုသူကို Branch နှင့် ချိတ်ထားနိုင်သည်
- Transfer / Receive သည် Branch အချင်းချင်း စတော့ ရွှေ့ရန်

---

## Post Creator AI

**ဘယ်မှာ:** Sidebar → **Post Creator AI** (`/dashboard/ai`)

- ဈေးကွက်ရှာဖွေရေး / ဆိုရှယ်ပို့စ် စာသား ဖန်တီးရန် AI ကိရိယာ
- ဆော့ဖ်ဝဲအသုံးပြုနည်း မေးရန် မဟုတ် — အဲဒီအတွက် **အကူအညီ Chat** (Help Chat) သုံးပါ

---

## Header ရှာဖွေရေး

Dashboard Header တွင် မီနူးရှာဖွေရေး ရှိသည် —

- POS၊ Sale၊ Purchase၊ Reports စသည့် လမ်းကြောင်းများကို အမည်ဖြင့် ရှာနိုင်သည်
- ရလဒ်ကို နှိပ်ပြီး တိုက်ရိုက် သွားနိုင်သည်
- ခွင့်မရှိသော မီနူးများ မပေါ်ပါ

---

## ပုံနှိပ်ခြင်း / ဘောင်ချာ

- ရောင်းဘောင်ချာ၊ အဝယ်ဘောင်ချာ၊ Service တိုကင်တို့ကို ပရင့်ထုတ်နိုင်သည်
- Print settings ကို Login အချိန် session ထဲ သိမ်းနိုင်သည်
- လိုဂို / ဆိုင်အမည်သည် ဆက်တင်အလိုက် ပေါ်သည်

---

## အမေးများသော မေးခွန်း (FAQ)

**မေး — ဖုန်းရောင်းရန် ဘယ်မှာ သွားရမလဲ။**  
ဖြေ — Dashboard / POS သို့ သွားပါ။ Phones မုဒ်၊ ပစ္စည်းရွေး၊ IMEI ရွေး၊ Cash/KPay/WavePay/Credit ဖြင့် Checkout။

**မေး — KPay / WavePay ရောင်းစာရင်း ဘယ်မှာလဲ။**  
ဖြေ — Sale → Cash Sale (ငွေပေးချေမှုအမျိုးအစားအလိုက် စစ်ထုတ်) သို့မဟုတ် Reports → Payment Report။

**မေး — အကြွေးရောင်းစာရင်း ဘယ်မှာလဲ။**  
ဖြေ — Sale → Credit Sale။ အစီရင်ခံစာအတွက် Reports → Credit Report / Receivable Report။

**မေး — စတော့နည်းနေကြောင်း ဘယ်လို သိမလဲ။**  
ဖြေ — Purchase → Remainder။ Badge ဖြင့် အရေအတွက် ပြနိုင်သည်။

**မေး — ဖုန်းပြင် တိုကင် ဘယ်လိုဖွင့်မလဲ။**  
ဖြေ — Services မီနူး → Ticket အသစ် ဖန်တီး → ဖောက်သည်/ဖုန်း/Technician ဖြည့် → Save။

**မေး — IMEI မှတ်တမ်း ဘယ်လို စစ်မလဲ။**  
ဖြေ — Reports → IMEI History Check။

**မေး — ဌာနခွဲတစ်ခုမှ တစ်ခုသို့ ပစ္စည်းပို့ရန်။**  
ဖြေ — Purchase → Transfer Item ပြီး Receive Branch မှ Receive Item။

**မေး — မီနူး မပေါ်ရခြင်း။**  
ဖြေ — သင့်အကောင့် permissions မရှိခြင်းဖြစ်နိုင်သည်။ Admin / User Setting မှ ခွင့်ပေးခိုင်းပါ။

**မေး — Help Chat က ဘာလုပ်ပေးသလဲ။**  
ဖြေ — ဤဆော့ဖ်ဝဲ အသုံးပြုနည်းကို မြန်မာလို ဖြေပေးသည်။ တစ်ရက်အကြိမ် ကန့်သတ်ရှိသည်။ တကယ့်ဒေတာဘေ့စ်မှတ်တမ်း သို့မဟုတ် စကားဝှက် မပေးပါ။

---

## ကန့်သတ်ချက်များ (Assistant အတွက်)

- ဤစာရွက်တွင် မပါသော အင်္ဂါရပ်ကို မှန်းမဖြေပါနှင့်။
- တကယ့် ရောင်းစာရင်း၊ စတော့အရေအတွက်၊ စကားဝှက်၊ API key မတောင်း / မဖော်ပြပါနှင့်။
- ဆော့ဖ်ဝဲနှင့် မသက်ဆိုင်သော မေးခွန်းကို ငြင်းပါ။
