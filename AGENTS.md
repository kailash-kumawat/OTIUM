# OTIUM — Project Instructions

## Product Vision

OTIUM is a quiet, privacy-first personal reflection companion.

It allows users to write naturally about their day. AI processes entries in the background and identifies meaningful patterns over time.

OTIUM should never rush, interrupt or force users to rate their emotions.

## Technology Stack

### Frontend

- React + Vite
- Tailwind CSS
- Zustand
- TanStack Query
- shadcn/ui

### Backend

- Node.js
- Express.js
- Python AI worker
- Redis + BullMQ

### Database

- PostgreSQL
- Prisma ORM
- pgvector

### AI

- OpenAI text-embedding-3-small
- HDBSCAN
- Small LLM for insight generation

## Development Rules

1. Inspect existing code before modifying files.
2. Reuse existing functionality.
3. Follow established project conventions.
4. Implement one feature at a time.
5. Keep frontend and backend responsibilities separate.
6. Validate all user inputs.
7. Enforce user-level authorization.
8. Never expose secrets.
9. Write and run tests.
10. Avoid unnecessary dependencies.
11. Never make destructive database changes without approval.
12. Update docs/DEVELOPMENT.md after completing tasks.

## Security and Privacy

- Protect personal entries.
- Enforce ownership checks.
- Use secure authentication.
- Handle sensitive data carefully.
- Respect permanent account deletion requirements.

## Product Principle

Build a calm, reliable writing experience first. Introduce AI intelligence gradually without interrupting the user.
