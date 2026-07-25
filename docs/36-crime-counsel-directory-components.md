# 36 Crime Counsel Directory — Component Inventory & Design Tokens

**Version:** 0.1 (Draft for review)
**Pairs with:** PRD, Wireframes, Data model, API contract (all v0.1)
**Purpose:** The design system a developer builds first — exact tokens and every reusable component with its states — so the nine screens are assembled from consistent parts rather than reinvented per page.

---

## 1. Design tokens

The values behind the design language in the wireframe spec. Ship these as CSS custom properties / a Tailwind theme extension; every component derives from them.

### 1.1 Colour

| Token | Value | Use |
|-------|-------|-----|
| `--ink` | `#17171B` | Primary text |
| `--ink-2` | `#55555E` | Secondary text |
| `--ink-3` | `#8A8A92` | Tertiary / captions |
| `--paper` | `#F5F5F2` | App background (cool neutral, deliberately not cream) |
| `--card` | `#FCFCFB` | Card / surface |
| `--line` | `#E4E3DE` | Hairline borders |
| `--line-2` | `#EFEEEA` | Subtle dividers |
| `--neutral-100…400` | `#F0EFEC` / `#E6E5E0` / `#D9D8D2` / `#CBCAC3` | Fills, disabled, skeleton bases |
| `--ribbon` | `#A81C30` | **The accent.** Brief-ribbon red |
| `--ribbon-soft` | `#F1DDE0` | Accent wash (active pill fill, focus tint) |
| `--focus` | `#A81C30` @ 40% | Focus ring |

**Accent rule (non-negotiable):** `--ribbon` marks exactly one focal thing per screen — the primary action, or the panel-level badge as a credential. Never decorative, never more than one focus per view. This is the single most important rule for keeping the product feeling premium rather than busy.

### 1.2 Type

| Role | Family | Use |
|------|--------|-----|
| Display / editorial | **Spectral** (serif) | Counsel names, screen/section titles, gravitas |
| UI / body | **Inter** (grotesque) | All interface text, dense data, forms |
| Meta / label | **IBM Plex Mono** | Eyebrows, status labels, metadata, table headers |

Type scale (rem, 1rem = 16px): `xs .75` · `sm .8125` · `base .9375` · `md 1` · `lg 1.1875` · `xl 1.5` · `2xl 2` · `3xl 2.5`. Weights: body 400/500, emphasis 600; Spectral titles 500. Line-height: body 1.55, headings 1.1.

### 1.3 Space, radius, elevation

- **Spacing:** 4px base, 8-pt rhythm (`4 8 12 16 24 32 48 64`).
- **Radius:** cards `12–14px`, inputs/buttons `8px`, pills/badges full.
- **Elevation:** hairlines do most of the work; **one** soft shadow, reserved for overlays: `0 1px 2px rgba(23,23,27,.04), 0 8px 30px rgba(23,23,27,.06)`.
- **Density:** two modes — **comfortable** (client: generous padding, ≥48px targets) and **compact** (admin: tight rows, Linear-like).

### 1.4 Motion

| Token | Duration | Curve | Use |
|-------|----------|-------|-----|
| `--motion-micro` | 100–120ms | ease-out | Hover, toggle, tick |
| `--motion-ui` | 180ms | ease-out | Enters, cross-fades |
| `--motion-reflow` | 150–200ms | ease-out (FLIP) | Filter result reflow |
| `--motion-sheet` | 260ms | spring | Sheets / overlays |

All movement collapses to a plain opacity fade under `prefers-reduced-motion`.

### 1.5 Breakpoints

`sm 480` · `md 768` (filter rail → bottom sheet; admin table → stacked cards) · `lg 1024` · `xl 1280`. Directory grid: 4 → 3 → 2 → 1 columns as width falls.

---

## 2. Component inventory

Build in the order below: primitives first, then composites, then screen assemblies. Every interactive component ships with hover, focus-visible, active, disabled, and (where it fetches or submits) loading states.

### 2.1 Primitives

| Component | Variants / states | Notes |
|-----------|-------------------|-------|
| **Button** | `primary` (ribbon), `secondary`, `ghost`, `destructive`; sizes sm/md; loading, disabled | Label is a verb that names the outcome ("Send enquiry", "Publish"). Only one `primary` per view. |
| **Input** | text, email; with label, help text, error | Error shows inline under the field; label always present (no placeholder-only). |
| **Textarea** | as Input; auto-grow | Bio, notable-case summary, enquiry message. |
| **Select** | single; with label/error | Case type. |
| **Combobox / Multi-select** | searchable, chips for selected | Specialisms, roles, panels in the editor. |
| **SegmentedControl** | 2–4 options | Enquiry urgency (Routine / Soon / Urgent). |
| **Toggle (Switch)** | on/off; optimistic; saving/saved tick | **Publish toggle** — the admin hero control. |
| **Checkbox / Radio** | standard | Filters, options. |
| **Badge / Pill** | `panel-level` (ribbon accent), `specialism` (neutral), `status` (draft/published), `capacity` | The panel-level badge is the one place the accent appears on a card. |
| **Avatar** | headshot; sizes; fallback initials | Rounded 10–12px, not circular for headshots on profile; circular in dense lists. |
| **Tooltip** | on hover/focus | Sparingly; e.g. panel expiry dates. |

### 2.2 Discovery (client)

| Component | States | Notes |
|-----------|--------|-------|
| **SearchInput** | idle, typing, clear | Instant, in-memory; debounced render only, no network. |
| **FilterRail** (desktop) / **FilterSheet** (mobile) | open/closed; active count | Same filter set; sheet has a "Show N counsel" apply button reflecting the live count. Filters: panel level, specialist panels, seniority/call year, specialism, practice capacity. |
| **FilterPill** | default, active (ribbon-soft) | Toggles a filter value. |
| **ActiveFilterChips** | list + "Clear all" | Mirrors URL state (shareable). |
| **SortControl** | menu | Seniority, year of call, name. |
| **ResultCount** | rolls on change | e.g. "12 counsel". |
| **CounselCard** | default, hover (raise), focus | Headshot, name (Spectral), call year, panel-level badge (accent), a top specialism, capacity. Whole card is the link to the profile. |
| **CardGrid** | reflow (FLIP) | Position + opacity animation on filter change. |

### 2.3 Profile & enquiry (client)

| Component | Notes |
|-----------|-------|
| **ProfileHeader** | Headshot, name, KC/appointments, call year. |
| **PanelBadgeList** | Panels with grade (accent badges). |
| **SpecialismList** / **NotableCasesList** | Neutral tags; cases as citation + role + summary; omit sections that are empty (no "N/A"). |
| **CredentialsRail** | Sticky at-a-glance panel level + capacity, then the CTA. |
| **ContactClerksCTA** | Opens the enquiry sheet, pre-referencing the counsel. |
| **EnquiryForm** | In a Sheet: counsel chip(s), name, firm, email, case type, urgency, message, Send. Inline validation; in-sheet success. |
| **ShareButton** | Copies deep link → toast "Link copied". |

### 2.4 Overlays, feedback & states (shared)

| Component | Notes |
|-----------|-------|
| **Sheet** | Right (desktop) / bottom (mobile) with scrim, drag handle (mobile), focus trap, Esc-to-close, dirty-close confirm. Used for enquiry and mobile filters. |
| **Modal** | Confirmations (e.g. retire taxonomy term). |
| **Toast** | Bottom, one line, verb echoes the action ("Published", "Link copied"); auto-dismiss. |
| **Skeleton** | Card grid, profile, and admin-row variants — each **mirrors its final layout**. Never a spinner for content. |
| **EmptyState** | Directive copy + one or two actions; e.g. zero-result directory → relax filter / contact clerks. |
| **ErrorState** | "Couldn't load … Retry" with a retry action; keeps chrome; never blank. |
| **NotFound (404)** | Calm, branded, one route home. |
| **Stale/Offline chip** | "Showing the last saved version" when serving a cached payload offline. |

### 2.5 Admin

| Component | Notes |
|-----------|-------|
| **AdminShell** | Auth-guarded layout; quieter, more utilitarian than the client side. |
| **DataList / Table** | Compact rows; columns per screen 06 (member · call year · panel/level · **publish toggle** · status · last updated · edit); stacks to cards under `md`. |
| **PublishToggle** | The inline hero: optimistic draft↔published, "Saved" tick, revert + toast on failure. |
| **MemberForm** | Sectioned (Identity · Appointments · Panels & grades · Specialisms · Bio · Notable cases · Headshot); required-for-publish markers; unsaved-changes guard. |
| **LivePreview** | Renders the client card/profile beside the form; debounced live update. |
| **SaveBar** | Sticky; Save (quiet) + Publish (accent, consequential); Saving/Saved indicator. |
| **ImageUploader** | Upload → crop → optimise; progress; set primary/alt. |
| **EditableList** (taxonomy) | Row with rename-inline, drag handle (reorder), usage count, retire (not delete when in use). |

---

## 3. Cross-cutting rules (apply to every component)

- **Accessibility floor:** visible `focus-visible` ring (`--focus`), full keyboard operation, AA contrast, every input labelled, sheets/modals trap focus and close on Esc. Build it in from the first primitive, not as a pass at the end.
- **No browser storage** in the UI layer for app state — use component/framework state; the client's data is the cached directory payload.
- **Loading = skeleton, action = spinner.** Content areas use layout-matching skeletons; only discrete actions (submit, save) show an inline spinner.
- **Copy is a design material:** sentence case, plain verbs, an action keeps its name through the flow (a "Publish" button produces a "Published" toast). Errors direct; empties invite.
- **One accent per view.** If two things are red, one of them is wrong.

---

## 4. Suggested build order for the component layer

1. Tokens (colour, type, space, motion) as the theme.
2. Primitives (Button, Input, Badge, Avatar, Toggle, Sheet, Toast, Skeleton).
3. Discovery composites (SearchInput, FilterRail/Sheet, CounselCard, CardGrid).
4. Profile + EnquiryForm.
5. Admin (DataList, PublishToggle, MemberForm, SaveBar, ImageUploader, EditableList).
6. State components (Empty, Error, 404) wired into each screen.

Once primitives 1–2 exist, whole screens assemble quickly — which is the point of doing this before the screens.
