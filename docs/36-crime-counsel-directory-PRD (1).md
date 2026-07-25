# 36 Crime Counsel Directory — Product Requirements Document & Technical Specification

**Version:** 0.1 (Draft for review)
**Owner:** Callum, Crime Team BD Manager, The 36 Group
**Status:** Pre-development — no code written
**Document purpose:** Define scope, users, requirements, and architecture for a standalone, client-facing counsel directory that replaces the Excel list currently emailed to CPS clients.

---

## 0. Reading notes and open decisions

This document makes explicit, senior-level assumptions rather than blocking on questions. Anything that materially changes the build is flagged as a **Decision (D#)** below and revisited in context. Resolve these before development starts.

| ID | Decision | Recommendation | Why it matters |
|----|----------|----------------|----------------|
| D1 | Client access model — open, gated, or link-based? | Lightweight gated access (magic link or single shared access, per-client), not a full account system | Drives auth architecture, friction, and data-exposure risk |
| D2 | Data residency / hosting jurisdiction | UK/EU region, UK preferred given BSB + Data (Use and Access) Act 2025 exposure | Compliance; affects host choice |
| D4 | Are direct contact details exposed, or is everything routed via clerks? | Route via a single "Contact clerks" CTA per member; no personal emails/mobiles exposed | PII exposure, and it protects the clerking channel |
| D5 | Source of truth for member data | Admin CMS in this app initially; later sync from/into the wider CMS | Avoids double-keying long term |

---

## 1. Product vision

The 36 Crime Counsel Directory is the fastest way for a CPS lawyer or instructing solicitor to answer one question: *"Who in 36's crime team can take this brief, and are they the right level for it?"*

Today that question is answered by opening an emailed Excel file — which is stale the moment it is sent, hard to filter on a phone, and impossible to keep consistent across every client's inbox. The directory replaces that artefact with a single, always-current, beautifully presented web destination that a client can open in one tap and filter to a shortlist in seconds.

The product is deliberately narrow. It is **not** the chambers marketing website and does not try to be. It is a working tool for people who instruct counsel for a living, optimised for the decision they actually make: matching a case to counsel by **CPS panel level, specialism, and seniority**. Everything else is secondary. (Availability is deliberately out of scope — there is no diary integration, and a hand-kept status would only reproduce the spreadsheet's staleness; clients enquire through the clerks, who hold the real diary.)

Success looks like clients preferring the link to the spreadsheet, clerks maintaining one dataset instead of many files, and the directory becoming the default answer to "send me your crime list."

**Positioning:** premium, fast, trustworthy, read-only. It should feel like a product a serious set has invested in — not a database dump with a search box.

---

## 2. User personas

### Persona A — Priya, CPS Crown Advocate / instructing CPS lawyer
- **Context:** Instructs prosecution counsel under tight listing pressure, often the day a case is uplifted or a trial advocate falls out. On a laptop in the office, frequently on a phone between courts.
- **Mental model:** Thinks in **panel levels and specialist panels first** — "I need a Level 4 on the RASSO panel," "a Serious Crime Group advocate," "someone graded for this fraud." Seniority and prior dealings come next.
- **Needs:** Filter to a correct-grade shortlist in seconds; confidence the panel data is accurate; a frictionless way to enquire.
- **Frustrations:** Spreadsheets that don't say panel level; not knowing who is free; ringing round.
- **Success:** Two taps to a shortlist of correctly-graded prosecutors; one tap to enquire.

### Persona B — Daniel, instructing solicitor (defence)
- **Context:** Defence firm, needs counsel of the right call and specialism for a specific case, sometimes urgently (returns, conflicts).
- **Mental model:** Specialism and seniority/experience first ("silk for a murder," "a strong junior for a POCA"), then experience and prior dealings.
- **Needs:** Browse by specialism, see experience/notable cases, gauge seniority quickly.
- **Success:** Finds a credible junior or KC for the case type without a phone call.

### Persona C — Sam, internal clerk (privileged admin user)
- **Context:** Maintains the data the whole product depends on. Time-poor, not technical, updates on the move.
- **Mental model:** "Keep the list right and current." Cares about editing being fast and low-risk.
- **Needs:** Add/edit a member, update panels and grades, publish, upload a headshot — in minimal clicks, with no chance of breaking the site.
- **Frustrations:** Fiddly admin, double-keying, fear of publishing something wrong.
- **Success:** Any change is live within seconds and instantly reflected for clients; nothing requires a developer.

### Persona D — Rowan, senior clerk / practice manager (super-admin)
- **Context:** Owns data quality and access. Decides who can administer and who can see the directory.
- **Needs:** Manage admin users, manage client access, see an audit trail of changes.

---

## 3. User journeys

### J1 — CPS lawyer, urgent shortlist (the primary journey)
1. Opens the directory link (already trusted/bookmarked, or via magic link).
2. Lands on the directory with all counsel visible and filters immediately to hand.
3. Selects **CPS Panel: Level 4** + **Specialist panel: RASSO** + **Capacity: prosecution**.
4. Results narrow instantly (client-side, no page reload) to a handful of cards.
5. Taps a card → concise profile (call year, appointments, panels, specialisms, notable experience).
6. Taps **Contact clerks** → pre-filled enquiry routed to the clerking team.
- *Target: shortlist in under 10 seconds, enquiry in under 30.*

### J2 — Solicitor, considered browse
1. Opens directory, filters by **Specialism: Fraud** and **Seniority: KC**.
2. Sorts by year of call / seniority; scans profiles and notable cases.
3. Shares a specific counsel's profile with a colleague via a direct link.

### J3 — Clerk, keep a record current (highest-frequency admin action)
1. Signs in to admin.
2. Finds member (search-as-you-type).
3. Updates a detail — e.g. adds a new panel grade or edits the bio — and publishes.
4. Change is live for clients within seconds.

### J4 — Clerk, new member onboarding
1. Signs in → "Add member."
2. Completes a guided form (name, call year, appointments, panels, specialisms, bio, headshot).
3. Publishes; member appears in the directory.

### J5 — Super-admin, access management
1. Invites/removes admin users.
2. Issues or revokes client access (see D1).
3. Reviews audit log of recent changes.

---

## 4. Functional requirements

Priority key: **M** = MVP, **F** = Fast-follow, **L** = Later.

### 4.1 Directory & discovery (client-facing, read-only)
- **FR-1 (M):** Display all published members as a responsive grid/list of cards.
- **FR-2 (M):** Free-text search across name, specialisms, and notable-case keywords, matching as the user types.
- **FR-3 (M):** Filter by **CPS Advocate Panel level** (e.g. Levels 1–4) — *the flagship filter*.
- **FR-4 (M):** Filter by **specialist panels** (e.g. RASSO, Serious Crime, Fraud, Proceeds of Crime, Counter-Terrorism — final taxonomy per §10 and confirmed against current CPS panel guidance).
- **FR-5 (M):** Filter by **seniority** (KC / Junior) and **year of call** (range).
- **FR-6 (M):** Filter by **practice area / specialism** (defence-relevant taxonomy: homicide, serious sexual offences, fraud & financial crime, drugs, regulatory, POCA, etc.).
- **FR-7 (M):** Filter by **practice capacity** (prosecution / defence / both) — CPS clients want prosecutors. *(Availability filtering is out of scope — no diary integration; clients confirm availability with the clerks.)*
- **FR-8 (M):** Combine multiple filters; results update instantly with a visible count and an easy "clear all."
- **FR-9 (M):** Member profile view: photo, name, call year, appointments (KC, Recorder, etc.), CPS panels & levels, specialisms, short bio, notable cases, and a single **Contact clerks** CTA (D4).
- **FR-10 (M):** Deep-linkable profiles and shareable filtered views (URL reflects filter state).
- **FR-11 (F):** Sort options (seniority, year of call, name).
- **FR-12 (F):** "Compare" or multi-select shortlist a client can send to clerks in one enquiry.
- **FR-13 (L):** Downloadable/printable one-page profile or shortlist (a graceful replacement for "send me the spreadsheet").

### 4.2 Enquiry / contact
- **FR-14 (M):** "Contact clerks" action opens a pre-filled enquiry (member referenced) routed to a single clerking inbox — mailto or in-app form (D4).
- **FR-15 (F):** In-app enquiry form capturing case type, urgency, and preferred counsel, delivered to clerks + logged.

### 4.3 Administration (authenticated)
- **FR-16 (M):** Secure admin sign-in for clerks.
- **FR-17 (M):** CRUD on members with a guided form and validation.
- **FR-18 (M):** One-click publish / unpublish and quick inline edit from the member list (the highest-frequency admin action).
- **FR-19 (M):** Manage the controlled vocabularies (panels, levels, specialisms, appointments) — or at minimum an admin-editable list, so the taxonomy isn't hard-coded.
- **FR-20 (M):** Headshot upload with automatic resizing/optimisation.
- **FR-21 (M):** Draft vs published state, so a member can be prepared before going live.
- **FR-22 (F):** Bulk import from the existing Excel file (one-time migration + repeatable import).
- **FR-23 (F):** Role-based access: admin (clerk) vs super-admin (practice manager).
- **FR-24 (F):** Audit log of changes (who changed what, when).
- **FR-25 (L):** Client-access management UI (issue/revoke, see D1).

### 4.4 Cross-cutting
- **FR-26 (M):** Fully responsive; touch-first interactions on mobile.
- **FR-27 (M):** Empty/zero-result states that guide the user ("no Level 4 counsel on the RASSO panel — widen your filters / contact clerks").
- **FR-28 (F):** Basic, privacy-respecting usage analytics (which filters/members are viewed) to inform BD.

---

## 5. Non-functional requirements

- **NFR-1 Performance:** First meaningful content well under ~1s on a good connection; filtering is **instantaneous** (client-side, no network round-trip). Given a small dataset (tens–low hundreds of members), the entire directory is delivered up front and searched in-memory. This is the core performance strategy, not an optimisation.
- **NFR-2 Mobile:** Designed mobile-first; fully usable one-handed between courts; large tap targets; no horizontal scroll.
- **NFR-3 Design quality:** Premium, restrained, typographically considered; consistent design system; feels bespoke, not templated.
- **NFR-4 Accessibility:** Target WCAG 2.2 AA — colour contrast, keyboard navigation, screen-reader labels, focus states. (A public-facing legal tool should not be excluding users.)
- **NFR-5 Reliability:** Static/edge-cached delivery means the client experience stays up even if the admin backend has a blip; target high uptime with a CDN.
- **NFR-6 Security:** Admin protected by strong auth; no client-side secrets; least-privilege data access; read-only client tier cannot mutate anything.
- **NFR-7 Data protection / compliance (D2):** UK/EU data residency; lawful basis and minimal PII (see §8 risk on PII); aligns with BSB Handbook expectations and the Data (Use and Access) Act 2025. Headshots and any personal data handled under a clear retention/consent position.
- **NFR-8 Scalability:** Architecture scales trivially in reads (CDN) and supports growth from one set's crime team to multiple teams/sets without redesign (multi-tenant-ready data model — see §10).
- **NFR-9 Maintainability:** Simple, conventional stack; no bespoke infrastructure a clerk or a future developer can't understand; content changes never require a deploy.
- **NFR-10 Observability:** Error monitoring and basic uptime/performance monitoring from day one.
- **NFR-11 SEO/privacy posture:** As a client portal (not the website), it should be **noindex** by default so counsel data isn't surfaced in public search (reinforces D1/D4).

---

## 6. MVP scope

**Goal of MVP:** A client can open a link and reach a correctly-filtered shortlist faster and more reliably than with the spreadsheet; a clerk can maintain the data without a developer.

**In scope (MVP):**
- Client directory with cards, profiles, and deep links (FR-1, FR-9, FR-10).
- Search + the flagship filters: CPS panel level, specialist panels, seniority/call year, specialism, practice capacity (FR-2 through FR-8).
- Instant client-side filtering; responsive, premium UI (NFR-1–3).
- "Contact clerks" enquiry (FR-14).
- Admin sign-in; member CRUD; quick publish/edit; headshot upload; draft/publish; admin-editable taxonomy (FR-16–21).
- UK/EU hosting, noindex, error monitoring (NFR-7, -10, -11).
- Lightweight client access per D1 (recommend magic link so the MVP isn't fully public).

**Explicitly out of MVP (deferred):**
- Bulk Excel import UI (do the initial migration manually/scripted; add the UI as fast-follow) — FR-22.
- Role separation, audit log — FR-23, FR-24.
- In-app enquiry form + logging — FR-15.
- Compare/shortlist, sorting, printable profiles — FR-11–13.
- Analytics — FR-28.
- Multi-tenant / multi-team — data model is *ready* for it (§10) but UI is single-team.

**MVP success criteria:** clerks migrate the real list into it; at least the primary CPS journey (J1) is faster than the spreadsheet in real use; zero developer involvement needed to update or publish a member.

---

## 7. Future roadmap

- **Phase 1 — MVP** (§6): replace the spreadsheet for the crime team.
- **Phase 2 — Operational hardening:** Excel import UI, role-based access, audit log, in-app enquiry with logging, analytics for BD (which counsel/filters clients look at is *directly useful BD intelligence*).
- **Phase 3 — Client experience:** shortlist/compare, shareable curated lists, printable/branded one-pagers (a genuinely better "send me your list"), saved searches for repeat clients.
- **Phase 4 — Integration:** stop double-keying — sync member data with the wider clerking case-management system so the directory is a *view* over the source of truth rather than a separate store.
- **Phase 5 — Productisation:** the multi-tenant data model lets this become a directory offering for other sets' crime (or other-discipline) teams — adjacent to your broader clerking-market products. Panel/grade data + enquiry logging is a defensible feature set the emailed spreadsheet can never match.

---

## 8. Risks

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| R2 | **Inaccurate panel/level data** — CPS clients rely on this | High: wrong grade = wasted brief, reputational | Treat panel data as authoritative; validate against source; clear "confirm with clerks" footer; version/audit changes (Phase 2) |
| R3 | **PII / data-protection exposure** of counsel (photos, contact) | High: BSB + Data (Use and Access) Act 2025 | Minimise PII; route contact via clerks (D4); noindex (NFR-11); UK/EU residency (D2); consent/retention position agreed before launch |
| R4 | **Access model wrong** — too open leaks data, too closed adds friction | Medium: adoption vs exposure | Resolve D1 early; magic link balances both; monitor and adjust |
| R5 | **Low clerk adoption of admin** → data rots | High: whole product depends on it | Admin must be genuinely minimal-click; the quick edit/publish flow is the hero action; involve Sam/Rowan in design |
| R6 | **Scope creep toward "chambers website"** | Medium: dilutes speed/focus | Guard the "not the website" principle; reject marketing features |
| R7 | **Double-keying** vs the wider CMS | Medium: maintenance burden | Model for integration now (§10); plan Phase 4 sync |
| R8 | **Taxonomy drift** (CPS panels change; specialisms evolve) | Medium | Admin-editable vocabularies (FR-19), not hard-coded; review against current CPS panel guidance periodically |
| R9 | **Over-engineering** for a small dataset | Low–Medium: cost/time | Keep the client-side-search architecture; resist premature backend complexity |

---

## 9. Technical architecture

### 9.1 Guiding architectural insight
The dataset is **small and read-heavy** (tens to low hundreds of members, changing occasionally). This shapes everything: the whole directory can be published as an edge-cached payload and **filtered entirely in the browser**, giving instant results with no per-keystroke server calls. Writes are rare and go through a conventional authenticated backend that revalidates the published data. This is why the app can be both extremely fast and cheap to run.

### 9.2 Recommended stack
- **Frontend:** Next.js (App Router) + TypeScript. Server components / static generation for the directory shell; the member payload delivered as a pre-built, edge-cached dataset; client-side filtering/search in-memory.
- **UI/design system:** Tailwind CSS + a headless component library (e.g. shadcn/ui / Radix) for accessible, premium, consistent components. A defined design-token set (type scale, spacing, restrained palette) to hit the "bespoke, not templated" bar. *(A dedicated design pass — see frontend-design principles — before build.)*
- **Backend / data:** Postgres as the store. A managed platform (e.g. Supabase) is a pragmatic fit: Postgres + auth + object storage (headshots) + row-level security in one, with **EU/UK region selectable** (D2). Alternatively a UK-hosted Postgres + a thin API if residency rules demand it.
- **Auth:** Managed auth for admins (email+password or SSO later). Client access via magic link (D1) — passwordless, low friction, revocable.
- **Media:** Headshots in object storage, served via CDN with automatic resizing.
- **Hosting/delivery:** CDN/edge-first hosting (e.g. Vercel with an EU region, or a UK-compliant equivalent per D2). `noindex` on the whole app.
- **Search/filter:** In-browser (e.g. a small fuzzy-search lib over the in-memory dataset). No search service needed at this scale.
- **Revalidation:** Admin writes trigger revalidation/rebuild of the published payload (ISR / on-demand revalidation), so changes are live in seconds without a manual deploy.
- **Observability:** Error monitoring (e.g. Sentry) + uptime/performance monitoring from launch.

*(Confirm current stable versions of the chosen frameworks/services at build time; the shape above is version-independent.)*

### 9.3 Environments
- Local dev → Staging (with anonymised/sample data) → Production. Migrations version-controlled. Secrets in the platform's secret store, never in the client bundle.

### 9.4 Data flow (summary)
1. Clerk edits a member in admin → write to Postgres (RLS-protected).
2. Write triggers revalidation of the published directory payload.
3. CDN serves the fresh, edge-cached payload to clients.
4. Client filters/searches entirely in-browser → instant results.
5. "Contact clerks" routes an enquiry to the clerking inbox (and logs it in Phase 2).

---

## 10. Database entities

Modelled to be **multi-tenant-ready** (an `Organisation`/team scope on core rows) even though MVP is single-team — this avoids a painful migration if the roadmap's productisation (Phase 5) happens. Names are indicative.

**Core**
- **Organisation** — id, name, slug, branding config. *(Future multi-tenant scope; single row at MVP.)*
- **Member (Counsel)** — id, org_id, full_name, slug, year_of_call, practice_capacity (enum), short_bio, notable_cases (own table), headshot (own table), status (draft/published/archived), created_at, updated_at. *(See the dedicated data-model document for the authoritative, normalised schema.)*
- **Appointment** — id, name (e.g. KC, Recorder, Deputy High Court Judge). *(Lookup.)*
- **MemberAppointment** — member_id, appointment_id. *(Junction.)*

**Specialisation & panels**
- **PracticeArea / Specialism** — id, org_id, name, description. *(Admin-editable vocabulary — FR-19.)*
- **MemberSpecialism** — member_id, specialism_id. *(Junction.)*
- **CpsPanel** — id, name (e.g. General Crime; RASSO; Serious Crime; Fraud; Proceeds of Crime; Counter-Terrorism), type (general vs specialist). *(Lookup — confirm taxonomy against current CPS panel guidance.)*
- **MemberPanel** — member_id, panel_id, level (nullable; e.g. 1–4 for the general panel), date_admitted (optional). *(Junction with attributes — powers FR-3/FR-4.)*
- **Language** — id, name. **MemberLanguage** — member_id, language_id. *(Optional MVP+.)*
- **Circuit / CourtCoverage** — id, name. **MemberCircuit** — member_id, circuit_id. *(Optional MVP+.)*

**Access, admin & audit**
- **AdminUser** — id, org_id, email, role (admin/super-admin), status, last_login. *(Auth identities may live in the auth provider; this holds app-role.)*
- **ClientAccess** — id, org_id, client_label, access_method (magic-link/token), issued_at, revoked_at, last_used_at. *(Supports D1; Phase 2 UI in FR-25.)*
- **Enquiry** — id, org_id, member_id (nullable), client_ref, case_type, urgency, message, created_at. *(Phase 2 — FR-15.)*
- **AuditLog** — id, org_id, actor_id, entity, entity_id, action, diff, created_at. *(Phase 2 — FR-24.)*

**Notes**
- Vocabularies (specialisms, panels, appointments) are tables, not hard-coded enums, so clerks can maintain them (FR-19, R8).
- All personal data kept minimal; no personal contact fields exposed to clients (D4).

---

## 11. Folder structure

Illustrative, for a Next.js (App Router) + TypeScript monorepo-in-one-app layout. Adjust to the final stack.

```
36-crime-counsel-directory/
├─ app/
│  ├─ (client)/                  # Read-only client portal (noindex)
│  │  ├─ page.tsx                # Directory (cards + filters)
│  │  ├─ counsel/[slug]/page.tsx # Member profile
│  │  └─ layout.tsx
│  ├─ (admin)/                   # Authenticated admin
│  │  ├─ layout.tsx              # Auth guard
│  │  ├─ members/                # List, new, [id]/edit
│  │  ├─ taxonomy/               # Panels, specialisms, appointments
│  │  ├─ access/                 # Client access mgmt (Phase 2)
│  │  └─ audit/                  # Audit log (Phase 2)
│  ├─ api/                       # Route handlers (writes, revalidation, enquiry)
│  └─ layout.tsx
├─ components/
│  ├─ directory/                 # Card, FilterBar, SearchInput, ResultCount, EmptyState
│  ├─ profile/                   # ProfileHeader, PanelBadges, SpecialismList, ContactClerksCTA
│  ├─ admin/                     # MemberForm, PublishToggle, ImageUpload
│  └─ ui/                        # Design-system primitives (buttons, inputs, badges…)
├─ lib/
│  ├─ data/                      # Data access, published-payload builder
│  ├─ search/                    # In-memory filter/fuzzy-search logic
│  ├─ auth/                      # Auth helpers, guards
│  └─ validation/                # Schemas (e.g. zod) for forms/API
├─ db/
│  ├─ schema/                    # Migrations / schema definitions
│  └─ seed/                      # Sample + anonymised staging data
├─ types/                        # Shared TypeScript types (Member, Panel, etc.)
├─ styles/                       # Tailwind config, design tokens
├─ public/                       # Static assets
├─ tests/                        # Unit + e2e (filter logic, admin flows)
└─ config / env / tooling files
```

---

## 12. API requirements

The client portal reads a **pre-built, edge-cached payload** rather than hitting query endpoints per keystroke (NFR-1). Write/admin operations use authenticated endpoints. Indicative contract (REST-style; adapt to the platform's data layer):

**Public / client (read-only, gated per D1)**
- `GET /api/directory` → the full published member payload (all data needed to render + filter client-side). Heavily cached; revalidated on write. *In practice this may be a static build artefact rather than a live endpoint.*
- `GET /api/members/{slug}` → single published profile (deep-link / share). Cached.
- `POST /api/enquiry` → submit a "contact clerks" enquiry (Phase 2 for logging; MVP may use mailto). Rate-limited; captcha/abuse protection.

**Admin (authenticated)**
- `POST /api/admin/auth/*` → sign-in / session (delegated to auth provider where possible).
- `GET /api/admin/members` → list with drafts.
- `POST /api/admin/members` → create.
- `GET /api/admin/members/{id}` → fetch for edit.
- `PATCH /api/admin/members/{id}` → update (incl. quick inline edits — used by FR-18).
- `DELETE /api/admin/members/{id}` → soft delete/unpublish.
- `POST /api/admin/members/{id}/media` → headshot upload (returns optimised URL).
- `GET/POST/PATCH/DELETE /api/admin/taxonomy/*` → manage panels, levels, specialisms, appointments (FR-19).
- `POST /api/admin/import` → bulk Excel import (Phase 2, FR-22).
- `GET/POST/DELETE /api/admin/access/*` → client-access issue/revoke (Phase 2, FR-25).
- `GET /api/admin/audit` → audit log (Phase 2, FR-24).
- `POST /api/internal/revalidate` → triggered on write to refresh the published payload.

**Cross-cutting API rules**
- All write endpoints require auth + role check (super-admin for access/user management).
- Input validated server-side (shared schemas with the client forms).
- Rate limiting on public enquiry; no mutation possible from the client tier (read-only guarantee, NFR-6).
- Responses typed and versioned; errors monitored (NFR-10).

---

## Appendix — key principles restated (guardrails for every decision)
Extremely fast · premium appearance · mobile friendly · minimal clicks · beautiful design · read-only for clients · simple administration · production quality · easily scalable — **and not the chambers website.**
