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
- `artifacts/mobile/app/student/` — student details, edit form, calendar, and PDF export
- `artifacts/mobile/context/StudentsContext.tsx` — student and attendance state
- `artifacts/mobile/lib/student-utils.ts` — attendance and date helpers
- `artifacts/mobile/constants/colors.ts` — mobile color palette

## Architecture decisions

- Student records are stored locally on the device with AsyncStorage; there is no account or cloud sync.
- A day in the student's monthly calendar cycles between unrecorded, present, and absent.
- PDF reports include the student's study status and the selected month's attendance.

## Product

- Add, search, edit, and remove student records.
- Track the current surah and review item, including whether each is complete.
- Record a student's attendance for each day and view monthly totals.
- Export an individual student's study and attendance report as PDF.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
