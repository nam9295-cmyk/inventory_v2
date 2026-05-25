Read `/home/john/workspace/choco-inventory/docs/PLAN.md` first.

You are implementing MVP 1 of `초코창고`, a mobile-first PWA inventory app for Very Good Chocolate.

Hard constraints:
- Work in `/home/john/workspace/choco-inventory`.
- Implement MVP 1 only. Do not implement recipe production yet.
- Do not modify the Telegram Hermes plugin.
- Do not destructively rewrite `/home/john/workspace/obsidian-notes/Inventory/current.json` during development except through the app save API after creating a backup or using a clearly marked test flow.
- Preserve the current JSON data shape and existing fields.
- Keep all durable inventory data under `/home/john/workspace/obsidian-notes/Inventory`.
- Keep generated outputs under `/home/john/workspace/obsidian-notes/Print`.

Build:
- Next.js App Router
- TypeScript
- Tailwind CSS or clean CSS if Tailwind setup would slow down implementation
- PWA manifest
- Mobile-first layout

MVP features:
1. PWA app named `초코창고`.
2. Simple PIN gate with actor selection.
3. Load real inventory from `/home/john/workspace/obsidian-notes/Inventory/current.json`.
4. Show inventory as game-like cards, grouped by category order from PLAN.md.
5. Search, category collapse/expand, card detail/edit panel.
6. Track local quantity changes.
7. Review changed items before saving.
8. Save API updates current.json safely, appends daily markdown, and writes history JSON.
9. Export API runs existing generator:
   `/home/john/.hermes/venvs/inventory-xlsx/bin/python /home/john/workspace/obsidian-notes/Inventory/generate_daily_inventory_sheet.py`
10. UI button shows generated XLSX/HTML/TXT paths.

Quality requirements:
- Empty input must not overwrite an existing quantity.
- `0` must save as an actual zero.
- String quantities like `1과 1/2` must be accepted.
- Do not force numeric-only inventory.
- Build must pass.
- Prefer simple robust code over fancy abstractions.

Suggested files are in PLAN.md. You may adapt if needed, but explain changes.

After implementation:
- Run `npm run build`.
- If lint exists, run it.
- Report exact files changed.
- Report exact verification commands.
- Do not deploy systemd yet.
