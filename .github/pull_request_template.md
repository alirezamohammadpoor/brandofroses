## Summary

<!-- 1–3 sentences: what changed and why. For small PRs, roll "why" in here and delete the Why section. -->

## Why

<!-- Optional. Delete this section if Summary already covers the rationale.
     Keep it when the motivation is non-obvious or deserves its own paragraph
     (e.g. "why split from the parent branch", "what incident this fences"). -->

## What's in

<!-- Bullet list. For multi-commit PRs, use `### <commit subject>` subsections
     so reviewers can map commits → changes at a glance. -->

-

## Test plan

- [ ] `bun run build` → 0 errors
- [ ] `bun run test` → all pass
- [ ] `shopify theme check` → 0 offenses
- [ ] Verified keyboard + screen reader behavior for changed UI surfaces
- [ ] Manually tested on mobile and desktop breakpoints

<!--
Target branch + title conventions:
- feature/* → staging  (squash merge, short descriptive title)
- staging   → main     (merge commit, title format: `v2.13.0: <headline feature>`)
-->
