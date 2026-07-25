# 36 Crime Counsel Directory

Project context for Claude Code. Read this first, then the specs in `/docs`. Build to these specs — don't invent scope.

## What this is
A standalone, client-facing web portal for The 36 Group's crime team that replaces the Excel counsel list currently emailed to CPS clients. Clients search and filter members to find suitable counsel fast. **It is read-only for clients** and is **not** the chambers marketing website.

**Users:** CPS lawyers, instructing solicitors (read-only clients); internal clerks and practice managers (admin).

## The specs (in `/docs`) — these are the source of truth
1. `PRD.md` — vision, personas, journeys, functional/non-functional requirements, MVP scope, risks, architecture.
2. `wireframes.html` — design language + all nine screens with layout, states, and behaviour.
3. `data-model.md` — normalised PostgreSQL schema, multi-chambers, every relationship.
4. `api-contract.md` — endpoints, payload shapes, auth, caching, errors.
5. `components.md` — design tokens and the component inventory. **Build this layer first.**

If anything here conflicts with a spec, the spec wins; flag the conflict.

## Stack (confirmed direction)
- **Next.js (App Router) + TypeScript.**
- **Tailwind CSS** + a headless component base (shadcn/Radix) for accessible primitives.
- **Supabase** (PostgreSQL + Auth + Storage) in an **EU/UK region** (data residency).
- **Vercel** for hosting/edge (or a UK-compliant equivalent).
- Fonts: **Spectral** (display), **Inter** (UI), **IBM Plex Mono** (meta).

## Core architecture — do not deviate without asking
- **Read path:** the published directory for a chambers is small. Build it into **one cached payload** (`GET /directory`); the browser downloads it once and does **all** search/filtering **in memory**. No per-keystroke or per-filter server calls. This is what makes it feel instant.
- **Write path:** admin mutates via authenticated REST; every successful write **revalidates** the cached payload so client changes go live in seconds.
- **Multi-tenant from day one:** every tenant-owned row carries `chambers_id`; isolation enforced by **PostgreSQL Row-Level Security**. The chambers is derived from the session/host, never a request parameter.
- **API is camelCase; the database is snake_case;** the API layer translates.
- **UUID v7** primary keys.

## Out of scope — do not build
- **Availability.** The directory does not store or display counsel availability (no diary integration). Clients enquire via the clerks. Do not add availability fields, filters, or indicators anywhere.
- Marketing/website features, bookings/calendars, public (non-gated) access.

## Build order (vertical slices — each must be viewable/testable)
1. Scaffold the app; push to Vercel showing a blank page (prove the pipeline).
2. **Component layer** from `components.md`: tokens → primitives → composites.
3. Database: schema + RLS from `data-model.md`; seed taxonomy (panels, grades, practice areas, roles) + a few real counsel.
4. **Read path first:** `/directory` payload + directory screen with in-memory filtering (the hero — prove "instant" early).
5. Profile + Contact clerks enquiry.
6. Admin: sign-in, member list + publish toggle, member editor.
7. Taxonomy admin, image upload, empty/error/loading states, polish.
8. Migrate the real Excel list; wire the client access model; soft-launch.

## Quality floor (definition of done for any UI)
- Responsive to mobile; visible keyboard focus; WCAG 2.2 AA contrast; `prefers-reduced-motion` respected.
- Content loads behind layout-matching **skeletons** (spinners only for submit/save actions).
- **One accent (ribbon red `#A81C30`) per view** — the primary action or the panel-level badge. Never decorative.
- No browser storage (`localStorage`/`sessionStorage`) for app state.
- Copy: sentence case, plain verbs; an action keeps its name through the flow ("Publish" → "Published"). Errors direct; empty states invite.

## Open decisions — confirm before the dependent slice
- **Client access model** (magic link / shared / link) — needed before auth (slice 6) and shapes `/auth/*`.
- **Live CPS panel & grade lists** — confirm before seeding taxonomy (slice 3).
- **Data residency + counsel PII / headshot consent** (BSB, Data Use and Access Act 2025) — settle before real data goes in (slice 8). Get a developer's review of auth, RLS, and data protection before launch.
