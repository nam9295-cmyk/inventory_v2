Read `/home/john/workspace/choco-inventory/docs/PLAN.md`, inspect the current implementation, then redesign the MVP UI/UX only.

You are the design implementer for `초코창고`, a mobile-first inventory PWA for Very Good Chocolate. The app already loads real inventory and saves to the local Obsidian inventory files. Keep the data/API behavior intact unless a tiny UI-facing change is absolutely necessary.

User feedback:
- The current inventory data is all present.
- The UI/UX is inconvenient.
- The page scroll is too long.
- The design feels like generic AI output, not a polished/trendy product.
- Design quality matters; make it feel deliberate, compact, and premium.

Hard constraints:
- Work in `/home/john/workspace/choco-inventory`.
- Do not change the Obsidian data paths.
- Do not change the save semantics for `/home/john/workspace/obsidian-notes/Inventory/current.json`.
- Do not destructively modify inventory data.
- Do not implement Appwrite/DB.
- Do not deploy systemd.
- Preserve MVP features: PIN gate, actor selection, load inventory, search, category grouping, edit quantities, review changes, save, export.
- Empty quantity input must not overwrite existing value.
- `0` must remain a valid saved quantity.
- String quantities such as `1과 1/2`, `1/3`, `1.5` must remain supported.
- Build and typecheck must pass.

Primary UX goal:
Reduce scroll and speed up real shop inventory work. This app is used on a phone in a busy store, likely one-handed.

Required UX changes:
1. Replace the long full-page card list with a more compact navigation model.
   Recommended approach:
   - Sticky top command area with search.
   - Horizontal category chips/tabs with item counts.
   - Show one selected category at a time by default.
   - Add `전체`, `변경됨`, and maybe `미입력/확인필요` quick filters.
   - Keep category order from PLAN.md.

2. Make item rows/cards more compact.
   - Current card style is too tall.
   - Use dense premium rows or compact cards.
   - Each visible item should show: emoji/icon, name, quantity, unit, changed state.
   - Tapping opens a bottom sheet or focused edit panel.
   - Add inline `-1`, `+1` only where they do not clutter.

3. Improve edit flow.
   - Bottom sheet should be thumb-friendly.
   - Large quantity input.
   - Buttons: `-1`, `+1`, `0`, `비우기/취소`, `저장`.
   - Do not let empty input accidentally erase quantity.
   - Clearly show previous quantity → new quantity.

4. Add progress awareness.
   - Show total item count in selected category.
   - Show changed count globally.
   - Changed items should be visually obvious.
   - Sticky bottom action bar should show `변경 N개`, `검토 후 저장`, `엑셀 만들기`.

5. Make the visual design feel premium/trendy, not generic AI.
   Suggested visual direction:
   - Dark-mode native, Linear/Superhuman/Raycast inspired.
   - Near-black background: `#08090a` / `#0f1011`.
   - Elevated translucent surfaces: `rgba(255,255,255,0.03-0.06)`.
   - Whisper borders: `rgba(255,255,255,0.06-0.10)`.
   - One accent color only: chocolate-gold or muted violet. Use sparingly.
   - Use Inter/system font, tight hierarchy, no random gradients.
   - Avoid childish game UI. The app can be playful through microcopy and emoji, but it must be fast and premium.
   - Avoid generic rounded pastel AI SaaS look.

6. Mobile ergonomics:
   - Sticky search/category area must not consume too much vertical space.
   - Touch targets must be large enough.
   - Avoid tiny table-only UI.
   - One-hand operation should be plausible.
   - Long category switching should be faster than scrolling.

7. Desktop can be acceptable but mobile is the priority.

Implementation notes:
- Prefer editing `app/page.tsx` and `app/globals.css` if that is the current active UI.
- You may remove unused component complexity if it is not used, but do not break imports/build.
- Keep code simple and robust.
- If you introduce new components, keep them local and readable.

Verification:
- Run `npm run build`.
- Run `npm run lint` if available.
- Report exact changed files.
- Report exact verification commands and results.
- Do not commit unless explicitly asked.

Deliverable:
A redesigned, shorter-scroll, mobile-first UI that feels more like a polished inventory command center than a generic AI-generated app.
