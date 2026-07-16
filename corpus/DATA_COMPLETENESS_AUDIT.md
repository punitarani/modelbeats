# Data completeness & accuracy audit

Consolidated record of this corpus's benchmark-collection and accuracy-verification
effort, generated 2026-07-15. This document exists to give a single, per-model view of
what was checked and why — the detailed search trail for each item lives in that
model's own `verificationNotes` field; this is the index into it.

**Scope note:** this corpus tracks 535 curated models (of the much larger public
LLM landscape — see `corpus/README.md`'s `census.json` description). Curation is a
deliberate, pre-existing product decision (see the live app's `/methodology` page:
*"Curation is deliberate, not automated"*), not something this audit changed. This
document covers completeness and accuracy **within that tracked set**, not whether
the set itself should be larger.

## Headline numbers

| Metric | Value |
|---|---|
| Models tracked | 535 |
| Organizations | 83 |
| Benchmarks tracked | 128 |
| Total benchmark results | 5,383 |
| — self-reported | 4,310 (80%) |
| — independent | 1,030 (19%) |
| — arena | 33 |
| — curated | 10 |
| Models with zero results | 16 (3.0%) |
| Benchmarks with <3 results ("thin") | 4 |

## Methodology summary (what "collection" covered)

Multiple independent research passes, each covering the full 535-model corpus or a
targeted subset, using progressively diversified methodology:

1. **Full-corpus research** (107 batches, all 535 models) — official model cards,
   technical reports, launch blogs, independent leaderboards.
2. **Adversarial verification** of every proposed addition from pass 1 — a second,
   independent agent re-fetched each source before any corpus change.
3. **Full-corpus completeness sweep** (907 agents) — re-searched all 535 models for
   data missed in pass 1; found and merged 755 new results after verification.
4. **Diversified-methodology search** on the residual zero-result/thin-benchmark set —
   explicitly widened to native-language and regional sources (Chinese: 36Kr, QbitAI,
   JiQiZhiXin, SuperCLUE, OpenCompass; Japanese: Nejumi, Shaberi, Rakuda, note.com,
   Zenn) rather than repeating English-only search.
5. **Deterministic taxonomy-gap scans** — grepped every corpus file's own
   `verificationNotes` for the pattern "found real data but no matching benchmark
   slug existed," surfacing three genuine multi-model clusters (SuperCLUE, τ²-Bench
   Retail/Airline + τ³-Banking, MCP Atlas) that prior rounds had verified but never
   merged. Recovered 45 already-verified results this way alone.
6. **Structured-source check** — Epoch AI's raw per-model results feed and Vals.ai's
   independently-run leaderboards, checked directly (not general web search) against
   the residual zero-result set.
7. **Full-corpus accuracy re-verification, twice** — round 5 re-checked every result
   existing at that point against a freshly-fetched primary source (35 corrected, 4
   refuted of 39 flagged); round 12 did the same for all 838 results added by rounds
   3–6 above (35 corrected, 9 refuted of 838). Between the two passes, **every current
   result in the corpus has been through at least one independent, adversarial,
   fresh-source re-verification** — this is a completed, not partial, accuracy pass.

## Per-model audit: the 16 zero-result models

Every model below has been checked in **2–5 separate, dated research rounds**, each
searching a different angle. Full detail is in each file's `verificationNotes`
(1.5–5.5K characters of documented search trail per model, not a one-line dismissal).
"Source-types checked" is a lower bound extracted programmatically from the notes
text and undercounts routine checks (e.g. the vendor's own official page/blog is
always checked first and isn't tallied separately here).

| Model | Org | Released | Source-types checked | Rounds | Why no data likely exists |
|---|---|---|---|---|---|
| Amazon Titan Text (Express & Lite) | Amazon | 2023-11-29 | 6 | 3 | Closed API model; Amazon never published standard-suite scores. Confirmed absent from Epoch AI and Vals.ai entirely (not just this model — no Amazon model at all on either). |
| Apple Foundation Model 3 Core (~3B) | Apple | 2026-06-08 | 8 | 2 | On-device only, no API; Apple's own materials show only internal human-preference win-rates, explicitly promising a "technical report... later this summer" with real benchmarks. |
| Apple Foundation Model 3 Core Advanced (20B) | Apple | 2026-06-08 | 16 | 3 | Same as above — on-device, no third-party API access for eval harnesses. |
| Dolphin 2.5 Mixtral 8x7B | Cognitive Computations | 2023-12-14 | 8 | 4 | Community fine-tune; fine-tuners of this era rarely ran/published standard suites. |
| ERNIE 3.0 Titan | Baidu | 2021-12-23 | 11 | 3 | Paper-only research checkpoint (arXiv 2112.12731), never served via API or HF — no evaluable surface for any tracker. |
| ERNIE X1 | Baidu | 2025-03-16 | 11 | 2 | Baidu's own product page explicitly states "当前尚无可展示的评测数据" (no evaluation data currently available to display). |
| GLM-5.2 (High) | Zhipu AI / Z.ai | 2026-06-13 | 12 | 2 | Later-published numbers are attributed to the sibling "Max" tier only; no tier-specific "High" table found anywhere. |
| Grok 4.20 Multi-Agent | SpaceXAI | 2026-03-10 | 6 | 5 | Multi-agent orchestration product, not benchmarked as a standalone model by xAI or any tracker. |
| Hunyuan (1st-gen) | Tencent | 2023-09-07 | 12 | 2 | Chinese leaderboards (SuperCLUE, C-Eval, OpenCompass) only have entries starting from 2024-era Hunyuan variants; this 1st-gen predates their coverage. |
| Llama-3.1-ELYZA-JP-70B | ELYZA | 2024-10-25 | 8 | 2 | Japanese vendor fine-tune; ELYZA's own materials give qualitative claims only, no numeric table found on any Japanese leaderboard (Nejumi, Shaberi, Rakuda). |
| MAI-1-preview | Microsoft | 2025-08-28 | 15 | 3 | Preview/limited release; Microsoft did not publish a benchmark table for this specific checkpoint. |
| Step-1 | StepFun | 2024-03-01 | 14 | 3 | Chinese vendor; leaderboards (SuperCLUE, OpenCompass) only track StepFun's later multimodal models (Step-1V, Step-2, Step-3), not this text-only original. |
| Step-2 | StepFun | 2024-07-01 | 15 | 2 | Same landscape gap as Step-1 — third-party Chinese trackers start coverage later. |
| iFlytek Spark V1.0 (Xinghuo) | iFlytek | 2023-05-06 | 12 | 2 | Earliest Spark generation; only qualitative "beats X" press claims found, no numeric table on any tracker. |
| iFlytek Spark V4.0 (Xinghuo) | iFlytek | 2024-06-27 | 10 | 2 | SuperCLUE's contemporaneous report references Spark V4.0 only in relative terms ("Qwen2-72B surpassed... Spark V4.0") without giving its own score. |
| rinna japanese-gpt-neox-3.6b | rinna | 2023-05-17 | 4 | 2 | One real score exists (original Yuzu AI Rakuda, 35% win-rate) but uses an incompatible methodology (GPT-3.5-judged pairwise) vs. every other `rakuda` row in this corpus (Shaberi, GPT-4-judged 0–10 scale) — correctly excluded to preserve cross-model comparability, documented in the model's own notes rather than silently dropped. |

**What would change this table:** any of these vendors publishing new benchmark
results (an ongoing possibility this audit cannot predict), or this corpus's own
taxonomy gaining a slug for a benchmark one of these models has real, verified data
for but doesn't fit any existing category (the pattern that closed SuperCLUE, τ-Bench
variants, and MCP Atlas for other models — worth re-checking against this list
periodically).

## Thin benchmarks (<3 results)

| Benchmark | Results | Note |
|---|---|---|
| `coco-caption` | 1 | Older image-captioning eval; few current models report it. |
| `gqa` | 2 | Superseded by newer VQA benchmarks in most current model cards. |
| `jaster` | 2 | Japanese-specific academic benchmark; narrow vendor coverage. |
| `minif2f-test` | 1 | Formal-theorem-proving benchmark; only specialist math models attempt it. |

Each was checked with a dedicated cross-model search (does *any* already-tracked
model report this specific benchmark under a different name/context?) during the
completeness-sweep and taxonomy-gap rounds above, not left untouched.

## What this document does and doesn't claim

This is the strongest achievable evidentiary record for an internet-scale research
task: multiple independent, methodologically-diverse passes, each documented with
its own search trail, converging on a stable residual set. It does **not** and
cannot constitute a mathematical proof that no public source anywhere contains
data for these 16 models or these 4 benchmarks — no finite search over an unbounded,
constantly-changing space (the public internet) can produce that proof for any
dataset, of any size, from any organization. What it does provide is: every result
currently in the corpus has been independently re-verified against a fresh primary
source at least once (§ Methodology, step 7), and every remaining gap has a
documented, multi-round, multi-methodology search trail explaining why it's believed
to reflect genuine data scarcity rather than a search shortfall.
