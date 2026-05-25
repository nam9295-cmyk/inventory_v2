# 초코창고 PWA: Gemini Review & Architecture Critique

This review evaluates the `docs/PLAN.md` for the '초코창고' (Choco Storage) PWA, focusing on shop floor reliability, data integrity, and mobile-first ergonomics.

## 1. Must Fix (Critical for Reliability & Data Safety)

### 1.1 Atomic Save & Race Condition Prevention
*   **Risk:** Concurrent edits from two staff members at once. If `직원1` and `직원2` both open the app, `직원1` saves 5 items, and then `직원2` saves 2 items, `직원1`'s changes might be overwritten depending on the implementation of `load -> modify -> save`.
*   **Recommendation:**
    *   **Server-side Patching:** The `api/inventory/save` endpoint should accept *diffs* (only changed items), not the full state from the client.
    *   **Timestamp Check:** Include an `initial_updated_at` timestamp in the save request. If the server's `current.json` has a newer `updated_at` than what the client started with, reject the save and force a "Conflict Resolution" (show what changed since they started).

### 1.2 "Fractional String" Parsing Rigor
*   **Risk:** The plan allows strings like `1과 1/2`. While human-readable, this will break future recipe auto-deduction and numeric history tracking if not handled strictly.
*   **Recommendation:**
    *   Implement a robust parser for Korean fractional inputs (e.g., `1과 1/2` -> `1.5`).
    *   Store *both* the `display_quantity` (string) and a `numeric_quantity` (float) in the history/current JSON to ensure recipes can deduct from the numeric value later.

### 1.3 Offline/Poor Wi-Fi "Pending Save"
*   **Risk:** Staff in a warehouse/fridge with poor Wi-Fi hits "Save", it fails/hangs, they think it's done and close the app.
*   **Recommendation:**
    *   Use `Workbox` or a custom Service Worker to queue saves.
    *   Visual indicator (e.g., "3 saves pending") when offline.
    *   Use `localStorage` as a draft buffer so if the browser crashes/reloads during a count, they don't lose the whole session's work.

---

## 2. Should Fix (UX & Workflow Efficiency)

### 2.1 The "Fat Finger" & Accidental Navigation
*   **Problem:** Busy staff accidentally hitting 'Back' or 'Reload' mid-inventory count.
*   **Recommendation:**
    *   Implement `beforeunload` warning if there are unsaved changes.
    *   Auto-save drafts to `localStorage` every time a card is edited.

### 2.2 Direct Number Entry Ergonomics
*   **Problem:** Tapping a card to open an "Edit Panel" is an extra click per item.
*   **Recommendation:**
    *   **Inline Steppers:** For +/- 1, keep buttons on the card itself.
    *   **Input Mode:** Ensure `<input type="text" inputmode="decimal">` is used for the "Direct Entry" to trigger the numeric keypad on iOS/Android, not the full QWERTY.

### 2.3 Visual "Done" State
*   **Problem:** In a list of 100+ items, it's hard to see what has already been counted.
*   **Recommendation:**
    *   Change card background color or add a "checked" badge to items that have been modified/confirmed in the current session.
    *   Add a "Hide Completed" toggle to the search bar.

---

## 3. Later (Recipe System & Scalability)

### 3.1 Recipe Auto-Deduction Preparation
*   **Insight:** MVP 1 uses strings for quantities. To make MVP 3 (Recipes) work, you need `baseUnit` and `conversionFactor` early.
*   **Recommendation:** Add optional `baseUnit` (e.g., `g`) and `conversion` (e.g., `1개 = 200g`) to the item schema now, even if not used in the UI, to prevent a massive data migration later.

### 3.2 Obsidian Linkage
*   **Insight:** Appending to `YYYY-MM-DD.md` is great, but consider using Obsidian properties (frontmatter) for better indexing.
*   **Recommendation:** Instead of just a list, use a Dataview-compatible table format in the markdown output so Obsidian users can query history easily.

### 3.3 Admin "Undo"
*   **Insight:** Mistakes happen.
*   **Recommendation:** Implement a "Recent History" view where a staff member can "Revert" a specific save event within the last hour.

---

## 4. UI/UX Risk Assessment

| Feature | Game-like Benefit | Potential Annoyance |
| :--- | :--- | :--- |
| **Category Collapse** | Reduces vertical scrolling. | Important items might be "hidden" if category is closed by default. |
| **Icons/Emojis** | Fast visual recognition. | If emojis are too similar (e.g., all chocolate bars look the same), it slows down recognition. |
| **Change Review** | Safety check. | If it takes too long to load/confirm, staff will skip it. Keep it snappy. |

---

## 5. Summary of Recommended Implementation Changes

1.  **Schema Change:** Add `numeric_value` alongside `quantity` (string).
2.  **API Change:** `api/inventory/save` should be a `PATCH` style operation or include versioning.
3.  **UI Change:** Add "Modified" visual state to cards and "Numerical Keypad" optimization.
4.  **Local Persistence:** Use `localStorage` for session recovery.

**Reviewer Note:** The plan is solid, but the transition from "Paper/Telegram" to "PWA" succeeds only if the PWA is *faster*. Every extra tap or loading spinner is a reason for staff to go back to Telegram.
