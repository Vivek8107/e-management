# 🇮🇳 HyperKhata (हाइपर खाता)
### Hyper-Local Business Digitalization, Digital Ledger (Khata) & Invoicing SaaS

A modern, mobile-first SaaS web application designed for Kirana stores, local shops, repair technicians, and small merchants across Bharat.

---

## 🌟 Key Features

1. **Digital Ledger (Khata / खाता)**
   - **🔴 Aapne Diye (You Gave / Credit):** Record credit given to customers with 1 tap.
   - **🟢 Aapko Mile (You Got / Payment):** Record cash or UPI settlements.
   - **Atomic Balances:** Prevents race conditions with transactional updates.
   - **Customer Directory:** Filter by *Udhaar Baaki* (Receivables), *Advance*, or *Hisaab Chukta* (Settled).

2. **Quick POS-Style Invoicing (पक्का बिल)**
   - Itemized billing (Item name, Qty, Unit, Rate, Discount, GST).
   - Walk-in cash customers or registered customer selection.
   - **"Add to Khata" Toggle:** Automatically records unpaid bills into customer ledger.
   - **Thermal Printer Friendly:** 80mm printable receipt template (`window.print()`).

3. **Zero-Cost WhatsApp Integration & UPI Payment Links**
   - Click-to-chat `wa.me` links with customizable polite reminders in Hindi and English.
   - **Embedded NPCI UPI Intent:** Includes merchant VPA (`upi://pay?pa=...`) for instant 1-tap customer payment.

4. **Merchant Dashboard**
   - **Total Udhaar Baaki (Receivables):** High-contrast red highlight.
   - **Today's Billed Sales & Cash Collections:** Real-time visibility.
   - **Recent Activity Feed:** Timeline of latest transactions.

5. **Local Context & Language Toggle**
   - Seamless one-click switch between **🇮🇳 हिंदी / Hinglish** and **🌐 English**.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js 18+ (tested on v24)
- npm or pnpm

### 2. Run Local Development Server
```bash
# Navigate to project directory
cd hyper-khata

# Start Next.js dev server on port 3000
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your mobile or desktop browser.

### 3. Database Tools
The app uses SQLite (`prisma/dev.db`) locally for zero-setup execution:
```bash
# Push schema changes
npm run db:push

# Seed realistic demo Kirana data
npm run db:seed

# Launch interactive Prisma Studio GUI
npm run db:studio
```

---

## 🚢 Deploying to Production (Vercel + Supabase)

### Step 1: Create Supabase PostgreSQL Database
1. Go to [Supabase](https://supabase.com) and create a free project.
2. Under Project Settings -> Database, copy the **Connection String (Transaction Pooler)**.

### Step 2: Switch Prisma to PostgreSQL
In `prisma/schema.prisma`, update the datasource:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Step 3: Deploy on Vercel
1. Push this folder to your GitHub repository.
2. Import the repository in [Vercel](https://vercel.com).
3. Set the Environment Variable:
   - `DATABASE_URL`: Your Supabase connection string.
4. Deploy! Next.js will build and deploy serverless endpoints globally.

---

## 📁 Project Structure

```
hyper-khata/
├── app/
│   ├── api/
│   │   ├── customers/       # Customer CRUD & Passbook
│   │   ├── dashboard/       # Aggregated financial analytics
│   │   ├── invoices/        # Billing engine & Khata sync
│   │   ├── transactions/    # Atomic credit/debit records
│   │   └── user/            # Merchant profile & settings
│   ├── customers/           # Khata UI & Passbook screen
│   ├── invoices/            # Billing UI & WhatsApp receipt generator
│   ├── settings/            # Shop profile, UPI & language
│   ├── layout.tsx           # Mobile-first shell & bottom nav
│   └── page.tsx             # Main Merchant Dashboard
├── components/
│   ├── AppContext.tsx       # Global state & language provider
│   ├── BottomNav.tsx        # Mobile bottom navigation tabs
│   └── Header.tsx           # Shop identity & language toggle
├── lib/
│   ├── i18n.ts              # Hindi & English localization dictionary
│   ├── prisma.ts            # Prisma client singleton
│   ├── utils.ts             # Currency formatter (INR) & date helpers
│   └── whatsapp.ts          # WhatsApp message & UPI link generator
├── prisma/
│   ├── schema.prisma        # Database models & relationships
│   └── dev.db               # Local SQLite database
└── scripts/
    └── seed.mjs             # Realistic demo data seeder
```
