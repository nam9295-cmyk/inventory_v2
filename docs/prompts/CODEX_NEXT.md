You are Codex running inside /home/john/workspace/choco-inventory.

Project context:
- This is the 초코창고 / choco inventory app, production-adjacent for store inventory work.
- Existing real inventory data is stored outside/near the app under the user's Obsidian inventory files. Preserve existing data files and APIs.
- Do NOT deploy, do NOT commit, do NOT rewrite the app broadly.
- Do NOT write to real inventory data directly except through existing app/API code paths, and only for tests if a safe backup/test flow exists.

Task:
Continue from the current code state and make one focused, high-impact improvement that helps day-to-day inventory/admin usage on mobile. Prefer small, safe implementation over broad redesign.

Suggested areas if applicable after inspection:
- Improve admin/product management UX clarity and safety.
- Improve mobile inventory editing flow, search/category navigation, changed-count visibility, or save/reset affordances.
- Improve data validation / backup / error messaging around admin changes.
- Add small tests or smoke checks if the repo already has a pattern.

Hard constraints:
- Preserve all existing API behavior unless you find a bug and fix it narrowly.
- No DB migration or external service changes.
- No destructive deletes; hidden/restored product flow should remain safe.
- Keep Korean UI copy natural and concise.
- If you touch storage code, keep backup/history behavior intact.

Verification required before finishing:
- Run npm run lint if available.
- Run npm run build.
- Report changed files, what changed, and any verification result.
