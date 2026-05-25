You are Antigravity/Gemini acting as a reviewer, not the primary implementer, inside /home/john/workspace/choco-inventory.

Project context:
- This is the 초코창고 / choco inventory app, production-adjacent for store inventory work.
- Another agent (Codex) may be editing implementation in parallel.
- To avoid conflicts, DO NOT change application source files.
- You may create or overwrite only this report: docs/ANTIGRAVITY_REVIEW.md
- Do NOT deploy, do NOT commit, do NOT write real inventory data.

Review task:
Inspect the current app/code and produce a practical Korean review for the owner/operator.
Focus on:
1. Mobile day-to-day inventory workflow friction.
2. Admin/product add-hide-restore safety and clarity.
3. Data-loss risks around save/admin APIs/backups/history.
4. UI/UX issues that make the app feel slow, confusing, or too much like a generic AI demo.
5. A short prioritized next-steps list: P0/P1/P2.

Style constraints for the report:
- Write in Korean.
- Be concrete and actionable.
- Do not recommend a full rewrite.
- Separate must-fix safety issues from nice-to-have design polish.
- Include exact files/components/API routes you inspected when possible.

Output:
Save the final report to docs/ANTIGRAVITY_REVIEW.md only.
