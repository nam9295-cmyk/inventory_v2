# 초코창고 PWA Implementation Plan

> For Hermes: implement with Codex/Gemini in parallel, but keep Hermes as the integrator and final reviewer. Codex should build; Gemini should critique UX/data architecture and find risks.

Goal: Build a mobile-first PWA inventory app for Very Good Chocolate that feels like a simple game-style warehouse, lets team members update stock quickly, supports recipe-based production later, and backs up outputs to the existing Obsidian inventory vault.

Architecture: Start with a local-first Next.js PWA served from this server. The app reads/writes the existing Obsidian inventory data under `/home/john/workspace/obsidian-notes/Inventory`, generates Excel/HTML outputs under `/home/john/workspace/obsidian-notes/Print`, and later can run behind Cloudflare Tunnel as `inventory.verygoodchocolate.kr`. Use JSON files first for simplicity; design the data layer so SQLite can replace it later without changing the UI.

Tech Stack: Next.js App Router, TypeScript, Tailwind CSS, PWA manifest/service worker, JSON file storage, openpyxl-compatible output generation through existing Python scripts or a Node XLSX library, systemd deployment.

Project path:

`/home/john/workspace/choco-inventory`

Existing data paths:

- Current inventory: `/home/john/workspace/obsidian-notes/Inventory/current.json`
- Template workbook: `/home/john/workspace/obsidian-notes/Inventory/template.xlsx`
- Output directory: `/home/john/workspace/obsidian-notes/Print/`
- Daily sheet generator: `/home/john/workspace/obsidian-notes/Inventory/generate_daily_inventory_sheet.py`
- Icon assets target: `/home/john/workspace/obsidian-notes/Inventory/icons/`

Core product principle:

The UI may feel like a game, but the workflow must be faster than paper or Telegram. Drag-and-drop is optional/fun; search, tap, and direct number entry must always work.

---

## Product Scope

### MVP 1: Daily inventory PWA

Must have:

1. PWA installability
   - App name: `초코창고`
   - App icon placeholder
   - Mobile home-screen launch support
   - Responsive mobile-first layout

2. Simple PIN gate
   - No complex accounts yet
   - Default local PIN stored in environment/config, not hardcoded in UI
   - Team member name selection may be static initially: `제니`, `직원1`, `직원2`, `관리자`

3. Inventory card view
   - Read items from current inventory JSON
   - Show categories in this fixed order:
     1. `완제품 - 초콜릿`
     2. `완제품 - 디톡스티`
     3. `완제품 - 티라미수`
     4. `완제품 - 그레놀라`
     5. `원재료 - 초콜릿류`
     6. `원재료 - 견과/과일/토핑`
     7. `원재료 - 유제품/냉장`
     8. `원재료 - 베이킹/분말`
     9. `원재료 - 청/시럽/오일`
     10. `커피/음료`
     11. `포장/소모품`
     12. `굿즈/부자재`
   - Show item as a game-like card:
     - icon or emoji
     - item name
     - current quantity
     - unit
     - optional note
   - Use emoji fallback if no uploaded icon exists.

4. Fast stock editing
   - Search bar fixed near top
   - Category collapse/expand
   - Tap card to open edit panel
   - Edit current stock directly
   - Quick buttons: `-1`, `+1`, `직접입력`
   - Empty input should not overwrite existing quantity
   - `0` must be treated as real zero
   - Support string quantities such as `1과 1/2`, `1/3`, `1.5`

5. Save workflow
   - Before saving, show changed items only:
     - previous quantity → new quantity
   - Save writes to `/home/john/workspace/obsidian-notes/Inventory/current.json`
   - Save appends daily markdown to `/home/john/workspace/obsidian-notes/Inventory/YYYY-MM-DD.md`
   - Save writes history JSON to `/home/john/workspace/obsidian-notes/Inventory/history/YYYY-MM-DD.json`
   - Preserve unchanged items and item order

6. Output generation
   - Button: `엑셀 만들기`
   - Button: `인쇄용 보기`
   - Reuse existing Python generator if practical:
     `/home/john/.hermes/venvs/inventory-xlsx/bin/python /home/john/workspace/obsidian-notes/Inventory/generate_daily_inventory_sheet.py`
   - Generated outputs should use:
     - `Print/Inventory-Input-YYYY-MM-DD.xlsx`
     - `Print/Inventory-Input-YYYY-MM-DD.html`
     - `Print/Inventory-Input-YYYY-MM-DD.txt`

7. Obsidian compatibility
   - All durable data and outputs remain under `obsidian-notes`
   - Do not require a database for MVP
   - Do not break the existing Telegram `재고.` workflow

---

## MVP 2: Icon and admin polish

After MVP 1 works:

1. Item icon support
   - Icons stored under `/home/john/workspace/obsidian-notes/Inventory/icons/`
   - Item JSON may include `icon` path
   - Admin can upload/change icon
   - Fallback to category emoji

2. Admin item management
   - Add item
   - Hide/delete item
   - Rename item
   - Change category
   - Change unit
   - Change sort order

3. Low-stock indicators
   - Optional `minStock` field
   - Card color:
     - green: enough
     - yellow: low
     - red: out/urgent
     - gray: inactive/hidden

---

## MVP 3: Recipe/production system

After daily inventory is stable:

1. Recipe data file
   - `/home/john/workspace/obsidian-notes/Inventory/recipes.json`

2. Recipe model

Example:

```json
{
  "id": "butter_tteok_batter",
  "name": "버터떡 반죽",
  "emoji": "🍡",
  "result": {
    "itemId": "butter_tteok_batter",
    "quantity": "1",
    "unit": "배치"
  },
  "ingredients": [
    { "itemId": "sweet_rice_flour", "amountBase": 1000, "baseUnit": "g" },
    { "itemId": "butter", "amountBase": 500, "baseUnit": "g" },
    { "itemId": "sugar", "amountBase": 300, "baseUnit": "g" },
    { "itemId": "milk", "amountBase": 1000, "baseUnit": "ml" },
    { "itemId": "egg", "amountBase": 10, "baseUnit": "개" }
  ]
}
```

3. Production flow
   - Select recipe
   - Enter batch count
   - Show expected material deduction
   - Show resulting product/half-product increase
   - Confirm
   - Save production event to history and markdown

4. Unit conversion requirement
   - Add item fields later:
     - `displayUnit`
     - `baseUnit`
     - `quantityBase`
     - `conversion`
   - Do not force all current items into numeric base units in MVP 1.
   - Start with 3-5 recipes only.

---

## UX Requirements

### Mobile-first

The app is primarily for phones in a busy shop.

Rules:

- Large buttons
- Large number inputs
- Minimal typing
- Search always available
- Category filters/collapsible sections
- No tiny table-only UI on mobile
- Must be usable with one hand
- Must tolerate partial work and accidental navigation

### Game-like, not game-slow

Allowed:

- Item cards
- Icons
- Category colors
- Warehouse/stockroom language
- “오늘 마감” progress feeling
- Optional drag later

Avoid in MVP:

- Mandatory drag-and-drop for stock entry
- Complex animations that slow input
- RPG-style gimmicks that hide actual numbers

### Empty vs zero

Important rule:

- Empty field = no change
- `0` = actual zero

### Save confirmation

Before commit, show changed items only.

Example:

```text
변경된 항목 4개

두바이 초콜릿: 10 → 3
클래식 티라미수: 2 → 13
다크초콜릿 100%: 2kg → 1.3kg
버터: 14개 → 12개

[돌아가기] [저장]
```

---

## Data Design

### Keep current.json compatible

Current shape is item list. Preserve existing fields:

```json
{
  "updated_at": "2026-05-25T15:24:00+09:00",
  "source": "...",
  "template": "...",
  "items": [
    {
      "order": 1,
      "category": "완제품 - 초콜릿",
      "name": "두바이 초콜릿",
      "quantity": "3",
      "unit": "개",
      "note": "",
      "updated_at": "..."
    }
  ],
  "history": []
}
```

### Add item IDs carefully

MVP may generate stable IDs from names, but do not destroy existing data.

Recommended approach:

- If `id` exists, use it
- Else derive slug from name and category
- When saving, preserve old fields and add `id` only if safe

### History event format

```json
{
  "at": "2026-05-25T16:00:00+09:00",
  "actor": "제니",
  "source": "pwa",
  "type": "inventory_update",
  "changes": [
    {
      "name": "두바이 초콜릿",
      "category": "완제품 - 초콜릿",
      "before": "10",
      "after": "3",
      "unit": "개"
    }
  ]
}
```

---

## Proposed File Structure

```text
/home/john/workspace/choco-inventory/
  docs/
    PLAN.md
  app/
    layout.tsx
    page.tsx
    globals.css
    api/
      auth/route.ts
      inventory/route.ts
      inventory/save/route.ts
      inventory/export/route.ts
  components/
    AppShell.tsx
    PinGate.tsx
    InventoryDashboard.tsx
    CategorySection.tsx
    InventoryCard.tsx
    ItemEditSheet.tsx
    ChangeReviewDialog.tsx
    BottomNav.tsx
  lib/
    inventory/
      paths.ts
      types.ts
      load.ts
      save.ts
      history.ts
      export.ts
      categories.ts
      icons.ts
    auth.ts
    time.ts
  public/
    manifest.json
    icons/
      app-icon.svg
  scripts/
    smoke-test.mjs
  package.json
  next.config.mjs
  tailwind.config.ts
  tsconfig.json
```

---

## Parallel Agent Strategy

### Hermes role

Hermes is the integrator.

Responsibilities:

- Maintain this PLAN.md
- Spawn/guide Codex and Gemini
- Review final changes
- Run tests/build
- Verify generated outputs
- Keep existing Obsidian/Telgram workflows safe
- Decide merges and resolve conflicts

### Codex role

Codex should implement the MVP.

Prompt file target:

`docs/prompts/CODEX_MVP_PROMPT.md`

Codex task summary:

- Create Next.js PWA app in current repo
- Implement file-backed inventory API
- Implement mobile inventory card UI
- Implement save/review/export flows
- Keep paths configurable but default to existing Obsidian paths
- Run build/lint and fix issues

Recommended command:

```bash
cd /home/john/workspace/choco-inventory
codex exec --full-auto "$(cat docs/prompts/CODEX_MVP_PROMPT.md)"
```

### Gemini role

Gemini should be reviewer/critic, not primary implementer.

Prompt file target:

`docs/prompts/GEMINI_REVIEW_PROMPT.md`

Gemini task summary:

- Review PLAN.md
- Identify UX risks for busy staff
- Identify data-loss risks
- Suggest exact improvements before/after Codex implementation
- Do not rewrite the whole app unless explicitly asked

Recommended command:

```bash
cd /home/john/workspace/choco-inventory
gemini -p "$(cat docs/prompts/GEMINI_REVIEW_PROMPT.md)"
```

### Parallel strategy

Best quality approach:

1. Create PLAN.md and prompts
2. Start Gemini review first or in parallel
3. Start Codex implementation
4. Hermes monitors both
5. When Codex finishes, run build/tests
6. Apply Gemini’s useful feedback
7. Run final verification
8. Commit stable result

Avoid letting two coding agents edit the same files at the same time unless using git worktrees. For this project:

- Codex edits main workspace
- Gemini reviews only and writes review notes
- Hermes applies changes after review

If later using multiple coding agents, use git worktrees:

```bash
cd /home/john/workspace/choco-inventory
git worktree add -b codex-mvp /tmp/choco-inventory-codex master
git worktree add -b gemini-ui /tmp/choco-inventory-gemini master
```

---

## Implementation Tasks

### Task 1: Bootstrap Next.js app

Objective: Create the initial Next.js TypeScript app without losing PLAN.md.

Files:

- Create/modify package files
- Create app structure
- Preserve `docs/PLAN.md`

Acceptance:

- `npm install` succeeds
- `npm run dev` starts
- Home page renders placeholder `초코창고`

### Task 2: Add PWA basics

Objective: Make the app installable as PWA.

Files:

- `public/manifest.json`
- `app/layout.tsx`
- optional service worker setup

Acceptance:

- Manifest is served
- App name is `초코창고`
- Mobile theme color set
- App icon placeholder exists

### Task 3: Add inventory types and file paths

Objective: Add typed data layer for existing Obsidian inventory.

Files:

- `lib/inventory/types.ts`
- `lib/inventory/paths.ts`
- `lib/inventory/categories.ts`

Acceptance:

- Paths default to existing Obsidian paths
- Env vars can override paths
- Category order is fixed as above

### Task 4: Implement inventory load API

Objective: API returns sorted inventory items from current.json.

Files:

- `app/api/inventory/route.ts`
- `lib/inventory/load.ts`

Acceptance:

- `GET /api/inventory` returns JSON
- Items are sorted by category/order
- Missing current.json returns clear error, not crash page

### Task 5: Implement mobile inventory dashboard

Objective: Display inventory as cards.

Files:

- `components/InventoryDashboard.tsx`
- `components/CategorySection.tsx`
- `components/InventoryCard.tsx`
- `app/page.tsx`

Acceptance:

- Shows real items
- Search works
- Category collapse works
- Quantity/unit visible

### Task 6: Implement edit workflow

Objective: Let user edit quantities locally before saving.

Files:

- `components/ItemEditSheet.tsx`
- `components/ChangeReviewDialog.tsx`
- `components/InventoryDashboard.tsx`

Acceptance:

- Tap card opens editor
- Direct quantity input works
- Quick +/- works for numeric values
- Changed items are tracked
- Save review shows only changed items

### Task 7: Implement save API

Objective: Persist changes safely to Obsidian inventory files.

Files:

- `app/api/inventory/save/route.ts`
- `lib/inventory/save.ts`
- `lib/inventory/history.ts`

Acceptance:

- Save updates current.json
- Save preserves unchanged fields
- Save writes history JSON
- Save appends daily markdown
- Empty string does not overwrite existing quantity
- `0` is saved as zero

### Task 8: Implement export API

Objective: Generate daily XLSX/HTML/TXT through existing generator.

Files:

- `app/api/inventory/export/route.ts`
- `lib/inventory/export.ts`

Acceptance:

- Button triggers generator
- API returns generated file paths
- Existing generator command works
- UI shows success and paths

### Task 9: Add simple PIN gate

Objective: Keep app private enough for MVP.

Files:

- `components/PinGate.tsx`
- `lib/auth.ts`
- `app/api/auth/route.ts`

Acceptance:

- User must enter PIN before seeing inventory
- PIN can be configured by env var
- Actor name is included in save event

### Task 10: Polish mobile UI

Objective: Make it feel like a clean game-like warehouse.

Files:

- `app/globals.css`
- dashboard/card components

Acceptance:

- Looks good on phone width
- Category colors
- Emoji/icon support
- Clear bottom actions
- No desktop-only table layout

### Task 11: Smoke tests and build

Objective: Verify app works.

Commands:

```bash
npm run lint
npm run build
npm run dev
```

Also test APIs manually:

```bash
curl http://localhost:3000/api/inventory
```

Acceptance:

- Build passes
- Inventory loads
- Save works on test change
- Export works

### Task 12: Deployment plan

Objective: Prepare for server deployment.

Files:

- `docs/DEPLOY.md`
- optional `scripts/choco-inventory.service`

Acceptance:

- Document how to run with systemd
- Document env vars
- Document Cloudflare Tunnel/nginx option

---

## Quality Gates

Before calling MVP done:

- No destructive changes to existing Telegram inventory plugin
- `current.json` backed up before first save test
- Build passes
- Mobile layout checked at 390px width
- Save flow tested with:
  - normal number
  - `0`
  - fractional string like `1과 1/2`
  - empty field ignored
- Export flow generates files under Print
- Obsidian daily markdown created
- All new code committed

---

## Initial Codex Prompt

Create this file next:

`docs/prompts/CODEX_MVP_PROMPT.md`

It should include:

- Read `docs/PLAN.md` first
- Implement MVP 1 only
- Do not implement recipe system yet
- Do not modify `/home/john/workspace/obsidian-notes` except through app APIs and safe tests
- Preserve existing data shape
- Run build
- Report exact files changed and verification commands

---

## Initial Gemini Prompt

Create this file next:

`docs/prompts/GEMINI_REVIEW_PROMPT.md`

It should include:

- Review `docs/PLAN.md`
- Focus on busy-shop UX
- Focus on data-loss risks
- Focus on PWA and mobile usability
- Produce a prioritized review note in `docs/GEMINI_REVIEW.md` if the CLI can write files, otherwise print recommendations

---

## Current Decision

Use the server as the source development and deployment environment.

Reason:

- Current inventory data already lives here
- Hermes Gateway already lives here
- Obsidian vault and Git sync already live here
- Team PWA must ultimately be hosted here
- MacBook should be used for browser testing and icon/design work

Recommended terminal strategy:

- Use `tmux`/`cmux` style panes for long-running Codex/Gemini/dev server work
- Use Ghostty only as the terminal emulator if desired
- Do not rely on a single foreground terminal for all agents

Recommended panes:

1. Hermes/integrator
2. Codex implementation
3. Gemini review
4. Dev server/logs
5. Git/build/test

---
