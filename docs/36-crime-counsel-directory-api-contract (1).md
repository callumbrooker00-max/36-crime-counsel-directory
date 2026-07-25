# 36 Crime Counsel Directory — API Contract

**Version:** 0.1 (Draft for review)
**Pairs with:** PRD v0.1, Wireframe spec v0.1, Data model v0.1
**Scope:** The contract between client and server — endpoints, request/response shapes, auth, caching, and errors. Request/response bodies are shown as JSON because they *are* the contract; there is no server implementation code here.

---

## 1. Shape of the system

Two very different paths, by design:

- **Read path (clients).** The published directory for a chambers is small (tens–low hundreds of counsel). The server builds it into **one cached payload**; the browser downloads it once and does all searching and filtering **in memory**. There is no per-keystroke, per-filter server call. This is what makes filtering feel instant.
- **Write path (admin).** Clerks mutate data through a conventional authenticated REST API. Every successful write **revalidates** the cached read payload, so client changes go live within seconds without a deploy.

Availability is **not** part of this contract — the directory neither stores nor serves it (no diary integration; a hand-kept status would only go stale).

---

## 2. Conventions

- **Base URL:** `https://api.<host>/v1` — the `/v1` prefix is the version boundary.
- **Format:** JSON only. `Content-Type: application/json; charset=utf-8`.
- **Casing:** API is **camelCase**; the database is snake_case. The API layer translates. Consumers never see DB column names.
- **IDs:** string UUIDs.
- **Timestamps:** ISO 8601 UTC (`2026-07-20T10:00:00Z`).
- **Tenancy:** the chambers is derived from the authenticated session (admin) or the published host/slug (client) — never a client-supplied parameter — and enforced by row-level security. One tenant can never address another's data.
- **Idempotency:** unsafe methods accept an `Idempotency-Key` header so retries don't double-write.
- **Errors:** a single envelope (see §8).
- **Rate limits:** applied to the two public write-ish endpoints — magic-link requests and enquiries (§7, §9).

---

## 3. Authentication

Two audiences, two mechanisms; both yield an HttpOnly, Secure, SameSite session cookie.

**Client (magic link — passwordless, revocable per firm; PRD decision D1)**

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/auth/link` | Request a sign-in link for an email. Always returns `202` regardless of whether the address has access (no enumeration). Rate-limited. |
| `POST` | `/auth/verify` | Exchange a link token for a client session cookie. |
| `POST` | `/auth/logout` | Clear the session. |

**Admin (clerks / practice managers)**

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/admin/auth/session` | Sign in (email + password, or SSO later) → admin session cookie. |
| `DELETE` | `/admin/auth/session` | Sign out. |
| `GET` | `/admin/auth/me` | Current user + their memberships and per-chambers role. |

Authorisation is by the membership role on the active chambers: `viewer` < `clerk` < `chambers_admin` < `platform_admin`. Write endpoints require `clerk` or above; user/access management requires `chambers_admin`; cross-tenant operations require `platform_admin`.

---

## 4. Client (read) endpoints

### `GET /directory`
The whole published directory for the chambers, plus the vocabularies needed to render filters — **one request, then everything is client-side.** Heavily cached; carries an `ETag`; served from the edge.

- Auth: valid client session.
- Caching: `Cache-Control: private, max-age=60, stale-while-revalidate=300` + `ETag`; clients send `If-None-Match` for a cheap `304`.
- Contains only **published** counsel and only client-safe fields (no drafts, no PII, no audit).

```json
{
  "chambers": { "name": "The 36 Group", "slug": "36-crime" },
  "generatedAt": "2026-07-25T09:00:00Z",
  "filters": {
    "panels":        [ { "slug": "rasso", "name": "RASSO", "type": "specialist" },
                       { "slug": "general-crime", "name": "General Crime", "type": "general" } ],
    "grades":        [ { "slug": "level-4", "name": "Level 4", "rank": 4 },
                       { "slug": "level-3", "name": "Level 3", "rank": 3 } ],
    "practiceAreas": [ { "slug": "serious-sexual-offences", "name": "Serious sexual offences" },
                       { "slug": "fraud", "name": "Fraud & financial crime" } ],
    "roles":         [ { "slug": "kc", "name": "King's Counsel", "abbreviation": "KC" },
                       { "slug": "junior", "name": "Junior" } ],
    "practiceCapacities": [ "prosecution", "defence", "both" ]
  },
  "counsel": [
    {
      "id": "0192f...",
      "slug": "a-chen",
      "fullName": "A. Chen",
      "yearOfCall": 2009,
      "practiceCapacity": "both",
      "shortBio": "…",
      "roles": [ { "name": "King's Counsel", "abbreviation": "KC" } ],
      "practiceAreas": [
        { "slug": "serious-sexual-offences", "name": "Serious sexual offences", "isPrimary": true },
        { "slug": "homicide", "name": "Homicide" }
      ],
      "panels": [
        { "panelSlug": "rasso", "panelName": "RASSO", "type": "specialist", "grade": "Level 4", "gradeRank": 4 },
        { "panelSlug": "general-crime", "panelName": "General Crime", "type": "general", "grade": "Level 4", "gradeRank": 4 }
      ],
      "notableCases": [
        { "title": "R v …", "citation": "[2023] EWCA Crim 123", "year": 2023,
          "court": "Court of Appeal", "roleInCase": "Leading junior, prosecution", "summary": "…" }
      ],
      "image": { "url": "https://cdn.<host>/counsel/a-chen.webp", "alt": "A. Chen" },
      "updatedAt": "2026-07-20T10:00:00Z"
    }
  ]
}
```

### `GET /counsel/{slug}`
A single published profile — for deep links and sharing (SSR/meta). Same object as an entry in `/directory.counsel`. Returns `404` for unknown, unpublished, or archived slugs (see §8 for the client-friendly message).

### `GET /taxonomy`
The filter vocabularies alone (`panels`, `grades`, `practiceAreas`, `roles`). Redundant with `filters` in `/directory`; exposed for lightweight consumers. Cached like `/directory`.

### `POST /enquiries`
Route a "Contact clerks" enquiry to the clerking inbox. Rate-limited; abuse-protected.

```json
// request
{
  "counselIds": ["0192f..."],
  "enquirerName": "D. Okafor",
  "firm": "Okafor & Co Solicitors",
  "email": "d.okafor@firm.example",
  "caseType": "Serious sexual offences",
  "urgency": "urgent",              // "routine" | "soon" | "urgent"
  "message": "Trial listed 12 Aug at Snaresbrook; conflict on current counsel."
}
// 202 Accepted
{ "id": "enq_0192…", "status": "received" }
```

---

## 5. Admin (write) endpoints

All require an admin session; all are tenant-scoped by the session's chambers.

**Members**

| Method | Path | Role | Purpose |
|--------|------|------|---------|
| `GET` | `/admin/members` | clerk | List incl. drafts. Paginated (§6); supports `?status=`, `?panel=`, `?q=`. |
| `POST` | `/admin/members` | clerk | Create (starts as `draft`). |
| `GET` | `/admin/members/{id}` | clerk | Full record for editing. |
| `PATCH` | `/admin/members/{id}` | clerk | Partial update. |
| `POST` | `/admin/members/{id}/publish` | clerk | Publish — validated (name, year of call, ≥1 practice area). |
| `POST` | `/admin/members/{id}/unpublish` | clerk | Return to draft. |
| `DELETE` | `/admin/members/{id}` | chambers_admin | Archive (soft delete). |

**Member associations** (edited from the member editor)

| Method | Path | Purpose |
|--------|------|---------|
| `PUT` | `/admin/members/{id}/practice-areas` | Replace the member's practice-area set (array of slugs + `isPrimary`). |
| `PUT` | `/admin/members/{id}/roles` | Replace the member's role set. |
| `GET·POST` | `/admin/members/{id}/panel-memberships` | List / add a panel membership (`panelId`, `gradeId?`, `dateAdmitted?`, `dateExpires?`). |
| `PATCH·DELETE` | `/admin/members/{id}/panel-memberships/{pmId}` | Update / remove a membership. |
| `GET·POST` | `/admin/members/{id}/cases` | List / add a notable case. |
| `PATCH·DELETE` | `/admin/members/{id}/cases/{caseId}` | Update / remove a case. |
| `POST` | `/admin/members/{id}/images` | Upload a headshot → returns stored `url` + dimensions. |
| `PATCH` | `/admin/members/{id}/images/{imageId}` | Set primary / alt text. |
| `DELETE` | `/admin/members/{id}/images/{imageId}` | Remove. |

**Taxonomy** (retire, don't delete, when in use — §8)

| Method | Path | Role | Purpose |
|--------|------|------|---------|
| `GET·POST` | `/admin/taxonomy/{kind}` | clerk | `{kind}` ∈ `practice-areas` \| `roles` \| `panels` \| `grades`. |
| `PATCH` | `/admin/taxonomy/{kind}/{id}` | clerk | Rename, reorder, or set `isActive=false` (retire). |
| `DELETE` | `/admin/taxonomy/{kind}/{id}` | chambers_admin | Only if unused; otherwise `409` telling the caller to retire. |

**Users, access & audit**

| Method | Path | Role | Purpose |
|--------|------|------|---------|
| `GET·POST` | `/admin/users` | chambers_admin | List / invite users. |
| `PATCH·DELETE` | `/admin/memberships/{id}` | chambers_admin | Change role / revoke a user's access to this chambers. |
| `GET·POST·DELETE` | `/admin/client-access` | chambers_admin | Issue / revoke client access (pending PRD D1). |
| `GET` | `/admin/audit` | chambers_admin | Read-only, paginated audit log; filter by `entityType`, `entityId`, `actor`, date. |

**Revalidation.** Every successful admin write enqueues a revalidation of the cached `/directory` (and `/counsel/{slug}` where relevant) for that chambers. This is an internal mechanism, not a public endpoint; the effect is that published changes reach clients within seconds.

---

## 6. Pagination, filtering, sorting (admin lists)

Client reads need no pagination — the whole published set ships at once. Admin lists do:

- **Cursor pagination:** `?limit=50&cursor=<opaque>` → `{ "data": [...], "nextCursor": "…" | null }`.
- **Filter/search:** endpoint-specific query params (`?status=`, `?panel=`, `?q=` full-text over name/specialism).
- **Sort:** `?sort=name` / `-updatedAt` (leading `-` = descending).

---

## 7. Caching, freshness & performance

- `/directory`, `/counsel/{slug}`, `/taxonomy` are cacheable with `ETag`/`304`; served from the edge, scoped per chambers.
- Writes trigger targeted revalidation; there is no manual publish/deploy step for data changes.
- If the payload can't be fetched and a cached copy exists, clients render the cached copy (the "showing the last saved version" state from the wireframes) rather than failing.
- `/auth/link` and `/enquiries` are rate-limited per IP and per email.

---

## 8. Errors

One envelope everywhere. Messages are user-facing, plain, and directive (matching the wireframe voice); codes are stable for programmatic handling.

```json
{
  "error": {
    "code": "validation_error",
    "message": "Enter a valid email address.",
    "fields": { "email": "Enter a valid email address." },
    "requestId": "req_0192…"
  }
}
```

| HTTP | `code` | When |
|------|--------|------|
| 400 | `validation_error` | Malformed body / failed field validation (`fields` map populated). |
| 401 | `unauthenticated` | Missing/expired session. |
| 403 | `forbidden` | Authenticated but role insufficient. |
| 404 | `not_found` | Unknown route or (client) unpublished/archived slug → surfaced as "This profile isn't available." |
| 409 | `conflict` | e.g. deleting an in-use taxonomy term → "In use by N counsel — retire it instead." |
| 422 | `publish_blocked` | Publish attempted with missing required fields (`fields` lists them). |
| 429 | `rate_limited` | Too many magic-link or enquiry requests; includes `Retry-After`. |
| 500 | `server_error` | Unexpected; generic message + `requestId`, never internals. |

---

## 9. Security & privacy

- Tenant isolation is enforced by RLS keyed on the session's chambers; the chambers is never a request parameter.
- No secrets or service keys reach the client; the client bundle only ever holds published, client-safe data.
- The client payload excludes drafts, archived records, audit data, and any counsel PII beyond what a profile displays.
- The whole app is `noindex` (client portal, not the public website).
- Enquiry and magic-link endpoints are rate-limited and abuse-protected; CORS is locked to the portal origin(s).
- Data residency UK/EU (PRD decision D2).

---

## 10. Open items to confirm

- **API-1** — Client access model (PRD D1) finalises the `/auth/*` and `/admin/client-access` shapes.
- **API-2** — Is `/counsel/{slug}` a distinct server-rendered endpoint (for share previews/SEO-safe meta) or purely resolved from the cached `/directory` in the browser? Affects deep-link cold loads.
- **API-3** — Enquiry delivery: inbox email only, or email **and** stored + surfaced in an admin "Enquiries" view (PRD fast-follow FR-15). The `POST /enquiries` contract already supports storage.
- **API-4** — Confirm whether `/taxonomy` is needed separately or `/directory.filters` suffices (leaning: drop the separate endpoint).
