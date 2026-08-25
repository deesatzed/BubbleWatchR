# RISK_NOTES.md

## Risks

| Risk | Severity | Why It Matters | Mitigation |
|---|---|---|---|
| Dirty worktree after crash recovery | High | The recovered implementation is not in the foundation commit and must not be discarded | Preserve current files; inspect diff before any commit or cleanup |
| macOS Chromium Mach-port denial in restricted execution | Medium | Aggregate browser verification can fail or hang before app code runs | Use the authorized process route; isolated and aggregate runs passed there |
| Physical drive health not independently measured | Medium | Successful writes prove access now, not hardware health | Keep local backups/checkpoints; run privileged disk diagnostics separately if needed |
| `node:sqlite` experimental warning | Low | Runtime API behavior may change with Node versions | Pin Node 24 in the implementation contract and keep tests green |
| Internal composite keys contain NUL separators | Low | Raw display can create binary exports or confusing text | Keep separator internal; serializer maps it to `asset / account` and tests reject raw NUL |

## Safe Next Step

Review the dirty diff, then make an explicitly authorized checkpoint commit if
desired. Continue only with the next bounded trigger-state goal; do not broaden
this slice into live data, brokerage, external model, or recommendation logic.
