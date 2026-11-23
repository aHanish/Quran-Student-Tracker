# حلقتي — متابعة الطلاب والحفظ

تطبيق عربي للمعلمين لإدارة الطلاب ومتابعة حفظ السور والمراجعة والحضور الشهري، مع تقرير PDF لكل طالب.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/mobile run dev` — run the mobile app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/mobile/app/(tabs)/` — home, students, and monthly attendance
- `artifacts/mobile/app/student/` — student details, daily record editor, and student form
- `artifacts/mobile/context/StudentsContext.tsx` — student and attendance state
- `artifacts/mobile/lib/student-utils.ts` — attendance and date helpers
- `artifacts/mobile/constants/colors.ts` — mobile color palette

## Architecture decisions

- Student records are stored locally on the device with AsyncStorage; there is no account or cloud sync.
- Monthly study plans are stored separately from each day's attendance and progress.
- New daily records start with that month's planned surah and review; daily results remain separate.
- PDF reports include the monthly plan and a row for every day in the selected month.

## Product

- Add, search, edit, and remove student records.
- Track the current surah and review item, including whether each is complete.
- Set each student's monthly surah and review plan in one roster.
- Record daily attendance, memorization, surah, and review, with quick roster controls.
- Export an individual student's monthly plan and daily progress as PDF.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
