# Data protection review — 36 Crime Counsel Directory

**Status: DRAFT for sign-off.** Prepared for the practice manager + a data-
protection adviser (DPO) and a developer review before any real data is loaded.
Entries marked **(confirm)** are decisions for the chambers, not the build.

## 1. Scope & residency
- The directory processes personal data of **counsel** (the people listed),
  **instructing clients** (enquirers), **admins** (clerks), and **client
  contacts** (access allowlist).
- **Residency:** database, auth, and storage in **Supabase London (`eu-west-2`)**.
  Hosting/edge on **Vercel Dublin (`dub1`)** — EU. The `/directory` payload
  (which contains counsel PII) is cached `private` and per-chambers; **(confirm)**
  no counsel PII is cached on a non-EU edge.
- `noindex` app-wide (meta + `X-Robots-Tag`) — the portal is not publicly
  indexed. Access is gated (magic link, allowlist).

## 2. PII inventory
| Data | Where | Subject | Purpose | Lawful basis (confirm) | Retention (confirm) |
|---|---|---|---|---|---|
| Name, year of call, appointments, panels/grades, specialisms, bio, notable cases | `counsel` (+ junctions) | Counsel | Present counsel to instructing clients | Legitimate interest / contract | While a member + review period |
| Headshot image | `images` + Storage | Counsel | Recognition on profile | **Consent** (see §4) | Until archived / withdrawn |
| Enquirer name, firm, email, message | `enquiries` | Client | Route enquiry to clerks | Legitimate interest | Define (e.g. 12–24 mo) |
| Admin email | `auth.users` / `users` | Clerk | Admin authentication | Contract | While employed |
| Client email / domain, last used | `client_access` | Client contact | Portal access control | Legitimate interest | While access is granted |

- **No client-visible personal contact for counsel (D4)** — no personal emails/
  phones are stored as client-facing fields; all contact routes via the clerks.

## 3. Access & security
- **Tenant isolation** by PostgreSQL RLS on every tenant table; chambers derived
  from session, never a request parameter. Verify with `scripts/verify/rls.sql`.
- **Least privilege:** clients are read-only (payload gate); the service-role key
  is server-only and **absent from the client bundle** (`scripts/verify/secrets.sh`).
- **Client gate:** magic link + allowlist (exact email or firm domain), revocable.
- **Rate limiting:** enquiry + link requests — **REQUIRED before launch: replace
  the in-memory limiter with a durable one (Upstash)**.

## 4. Headshot consent & retention (confirm)
- **(confirm)** Consent basis: obtain each barrister's consent before uploading
  their headshot; record who/when. BSB Handbook + Data (Use and Access) Act 2025.
- **(confirm)** Retention: delete the stored object + `images` row on archival or
  on withdrawal of consent (the editor's Remove does this; confirm the process).
- EXIF/location metadata is stripped on upload (no embedded GPS/camera data).

## 5. Data-subject rights (confirm)
- **(confirm)** Process for access / correction / erasure requests (counsel and
  enquirers), and the owner of that process.

## 6. Sign-off
- [ ] Practice manager: ____________________  date: ______
- [ ] Data-protection adviser (DPO): ____________________  date: ______
- [ ] Developer review of auth, RLS, and data protection: ____________________  date: ______
