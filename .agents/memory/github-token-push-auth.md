---
name: GitHub token push auth
description: Non-secret fallback for pushing with a Replit-managed GitHub token
---

When pushing to GitHub with a token held in the `GIT` environment secret, a Bearer authorization header may be rejected even when the token is valid. GitHub accepts the same token through an `x-access-token:<token>` Basic authorization header.

**Why:** The first non-persistent push attempt using Bearer auth returned invalid credentials, while the Basic header succeeded.

**How to apply:** Keep the token out of the remote URL and shell output. Construct the Basic header in memory for the one push command, then leave the configured remote unchanged.