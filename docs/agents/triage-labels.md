# Triage Labels

These canonical roles describe triage state. Map them to real issue-tracker
labels when publishing externally.

## Categories

| Role | Default label |
| --- | --- |
| `bug` | `bug` |
| `enhancement` | `enhancement` |

## States

| Role | Default label |
| --- | --- |
| `needs-triage` | `needs-triage` |
| `needs-info` | `needs-info` |
| `ready-for-agent` | `ready-for-agent` |
| `ready-for-human` | `ready-for-human` |
| `wontfix` | `wontfix` |

## Rules

- A triaged issue should have exactly one category and one state.
- If current labels conflict, report the conflict before changing anything.
- If the external tracker uses different labels, state the mapping in the
  triage output before applying changes.
