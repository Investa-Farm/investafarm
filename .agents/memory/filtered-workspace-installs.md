---
name: Filtered workspace installs
description: Workspace dependency installation can be narrowed to the artifact being verified when an unrelated package blocks the full install.
---

When a full workspace install is blocked by a package that the target artifact does not use, use a focused pnpm filter for the artifact and its workspace dependencies rather than changing registries or weakening package-firewall settings.

**Why:** The monorepo can contain unrelated code-generation or server packages whose dependencies may be unavailable even when the selected web artifact's dependencies are already cached and installable.

**How to apply:** Prefer `pnpm install --filter <target-package>... --frozen-lockfile` for targeted preview/build verification, then run the artifact workflow and inspect the browser preview.