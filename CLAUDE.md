# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
pnpm install          # Install dependencies
pnpm run dev          # Start dev server (Next.js)
pnpm run build        # Production build
pnpm start            # Start production server
pnpm lint             # Run ESLint
```

No test framework is configured. Package manager is **pnpm** (not npm/yarn).

## Architecture Overview

**Personal Finance Tracker** — a 100% client-side Next.js 16 app (React 19, TypeScript) with all data stored in browser localStorage. No backend, no API calls, fully offline.

### Key Directories

- `app/` — Next.js App Router. `page.tsx` is the single-page entry point with tab-based navigation (9 tabs: dashboard, expenses, incomes, budgets, analysis, simulation, loans, subscriptions, settings).
- `components/` — Feature components (dashboard, forms, lists, analysis views). Each major feature is one file (~5-30KB each).
- `components/ui/` — 59 shadcn/ui primitives (Radix UI-based). Do not edit manually; managed via shadcn CLI.
- `hooks/` — Business logic hooks. `use-expense-data.ts` (903 lines) is the **central state management hook** — all data CRUD flows through it.
- `lib/types.ts` — All TypeScript type definitions (301 lines). Single source of truth for data models.
- `lib/utils.ts` — Utility functions (cn helper for class merging).

### Data Flow Pattern

All state lives in `useExpenseData()` hook → reads/writes to localStorage. Components call hook methods (`addExpense`, `updateExpense`, etc.) which update state and persist to localStorage. No external state management library.

Data model is versioned (currently v2.2.0) with backward-compatible migrations on load (v1 → v2.0 → v2.2).

### Core Data Model (AppData)

- **Expenses** — transactions with optional line items, tags, decision notes, accounting month
- **Subscriptions** — recurring charges with statuses: A_VENIR (pending) | ACTIF | SUSPENDU; frequency: monthly/quarterly/yearly; budgetary activation dates separate from creation dates
- **Loans** — type PRETE (lent) | EMPRUNTE (borrowed); partial repayment tracking with history
- **Incomes**, **Budgets**, **Categories**, **MonthlySnapshots**
- **Settings** — currency (default XOF), locale (default fr-FR), minimal budget, transition months

### Auto-Recurrences

`useAutoRecurrences` hook auto-generates expense entries from active subscriptions at month start, checking daily via localStorage timestamp.

### Financial Calculations

`useFinancialAnalysis` hook computes: available funds = income - expenses - fixed charges - minimal budget, month comparisons, 3-month rolling averages, budget status per category.

## Tech Stack

- **UI**: Radix UI + shadcn/ui + Tailwind CSS 4 (OKLch colors) + Lucide icons
- **Forms**: react-hook-form + Zod validation
- **Charts**: Recharts
- **Dates**: date-fns
- **Deployment**: Vercel (CDG1/Paris region), config in `vercel.json`

## Design Principles

- French-language UI throughout (labels, categories, messages)
- Sober, professional design — no flashy gradients, no emojis in UI
- Decision-oriented: every view helps the user make financial decisions
- Payment methods include regional options: wave, djamo, mobile_money
- Transition months concept: non-representative months (country change, job change) are flagged to avoid misleading analytics
