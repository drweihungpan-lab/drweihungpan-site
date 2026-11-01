# AGENTS.md

Agent configuration for the Dr. Wei-Hung Pan personal website.

## Agent skills

### Issue tracker

Issues and specs live as GitHub issues in `drweihungpan-lab/drweihungpan-site`,
managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, each label string equal to its name. See
`docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` at the root plus `docs/adr/`. See
`docs/agents/domain.md`.

### Testing

One seam: the built output. `npm run verify` builds the site and runs the
suite. Assertions go in `tests/*.test.ts` against the helpers documented in
`tests/site.ts`; see "How this site is tested" in `README.md`. No
component-level tests.
