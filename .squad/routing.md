# Work Routing

How to decide who handles what.

## Routing Table

| Work Type | Route To | Examples |
|-----------|----------|---------|
| Architecture & system design | Zidane | Data model, phase planning, API contracts, ADRs |
| Code review & PRs | Zidane | Review all PRs, enforce spoiler-free constraint at review time |
| Issue triage (`squad` label) | Zidane | Analyze GitHub issue, assign `squad:{member}` label, add triage notes |
| Node.js worker / backend | Ramos | Worker script, date-fns windows, football API client, data.json schema |
| Playwright scraping | Ramos | YouTube Hebrew search, DOM scraping, video URL extraction |
| Database integration | Ramos | Supabase/Neon client, schema migrations, Phase 3 migration |
| Spoiler-strip logic | Ramos | Drop score/goal fields at API boundary |
| React / Vite frontend | Ronaldo | Components, SPA layout, Supabase data fetching, Vercel config |
| UI/UX decisions | Ronaldo | Dashboard design, highlight button, match cards, empty states |
| GitHub Actions CI/CD | Modric | Daily cron workflow, Playwright install in CI, secrets management |
| Cloud DB provisioning | Modric | Supabase/Neon project setup, environment config |
| Vercel deployment | Modric | Frontend deployment pipeline |
| Test strategy & authorship | Navas | Integration tests, E2E tests, spoiler-leak test suite |
| Edge case analysis | Navas | No matches, API down, missing YouTube video, Hebrew encoding |
| CI test integration | Navas → Modric | Navas defines tests; Modric wires them into the workflow |
| Scope & priorities | Zidane | What to build next, trade-offs, phase transitions |
| Session logging | Scribe | Automatic — never needs routing |
| RAI review | Rai | Credential detection, content safety, ethical review |

## Issue Routing

| Label | Action | Who |
|-------|--------|-----|
| `squad` | Triage: analyze issue, assign `squad:{member}` label | Lead |
| `squad:{name}` | Pick up issue and complete the work | Named member |

### How Issue Assignment Works

1. When a GitHub issue gets the `squad` label, the **Lead** triages it — analyzing content, assigning the right `squad:{member}` label, and commenting with triage notes.
2. When a `squad:{member}` label is applied, that member picks up the issue in their next session.
3. Members can reassign by removing their label and adding another member's label.
4. The `squad` label is the "inbox" — untriaged issues waiting for Lead review.

## Rules

1. **Eager by default** — spawn all agents who could usefully start work, including anticipatory downstream work.
2. **Scribe always runs** after substantial work, always as `mode: "background"`. Never blocks.
3. **Quick facts → coordinator answers directly.** Don't spawn an agent for "what port does the server run on?"
4. **When two agents could handle it**, pick the one whose domain is the primary concern.
5. **"Team, ..." → fan-out.** Spawn all relevant agents in parallel as `mode: "background"`.
6. **Anticipate downstream work.** If a feature is being built, spawn the tester to write test cases from requirements simultaneously.
7. **Issue-labeled work** — when a `squad:{member}` label is applied to an issue, route to that member. The Lead handles all `squad` (base label) triage.
