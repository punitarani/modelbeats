# ModelBeats legal tasks

Ten [Harbor](https://harborframework.com) tasks that put an agent in the seat of a lawyer working a real
file. Each task hands the agent the documents a lawyer would have (dockets, contracts, ledgers, records,
correspondence) but not the governing law, and asks for a deliverable of dates or dollar amounts that
come out of a chain of legal determinations. Graders are deterministic Python (stdlib only): exact dates,
money within a stated tolerance, no model judging.

The set is calibrated so that Claude Sonnet 5.5, run as a shell agent without web access, scores between
0.3 and 0.7 on each task.

| Task | Area | Graded items | Sonnet 5.5 mean (runs) |
|---|---|---|---|
| `rule144-sales` | Securities: Rule 144 resale limits | 16 | 0.48 (7) |
| `frcp-deadlines` | Federal civil procedure deadlines | 10 | 0.57 (7) |
| `ca-civil-deadlines` | California civil procedure deadlines | 13 | 0.53 (7) |
| `criminal-history` | Federal sentencing: USSG criminal history | 8 | 0.58 (3) |
| `intestate-succession` | Montana intestacy and title | 37 | 0.42 (5) |
| `ucc9-priority` | UCC Article 9 priority waterfall | 8 | 0.68 (5) |
| `liquidation-waterfall` | Delaware merger allocation, 280G and closing payroll | 20 | 0.50 (5) |
| `cam-reconciliation` | California commercial lease taxes and supplemental assessments | 17 | 0.62 (6) |
| `judgment-interest` | Prejudgment and post-judgment interest (federal, NY, CA, TX, FL, MA) | 20 | 0.59 (5) |
| `limitations-tolling` | Statutes of limitations and tolling (NY, CA, federal) | 19 | 0.61 (5) |

## Layout

Each task follows the Harbor task format:

```
<task>/
  task.toml            metadata, timeouts, environment
  instruction.md       the assignment the agent reads
  environment/         Dockerfile and app/ (copied to /app): the file materials
  solution/            solve.py encodes the rules and writes the oracle answer
  tests/               test.sh, verify.py, expected.json, AUDIT.md
```

`tests/AUDIT.md` explains every expected answer and cites the primary sources it was checked against.
Several tasks score a subset of the fields the agent fills in: `expected.json` lists those ids under
`graded`, the instruction tells the agent that a selection is spot-checked without saying which, and the
AUDIT explains how the subset was chosen. Items whose answer could reasonably be argued either way were
removed rather than graded.

## Running

```sh
# oracle (expects 1.0) and no-op (expects 0.0) for one task
harbor run -p tasks/legal/rule144-sales -a oracle
harbor run -p tasks/legal/rule144-sales -a nop

# the whole dataset with a real agent
harbor run -p tasks/legal -a claude-code -m anthropic/claude-sonnet-5-5
```

## Publishing

`dataset.toml` is the dataset manifest (`punitarani/legal`). After any task change, refresh its digests
with `harbor sync tasks/legal`, then publish with `harbor auth login` and `harbor publish tasks/legal`.
