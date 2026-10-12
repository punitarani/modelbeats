# AUDIT: ucc9-priority (reviewers only; not visible to the agent)

Version 3 (rework after calibration: priority lists dropped; one graded item per pool, amounts only;
NB's claim made finite so the waterfall chains; well-known-nuance pools replaced with second-tier
sub-rules).

Governing law: Franklin (fictional) has enacted UCC Arts. 1, 2, 9 in 2010 Official Text form
(instruction + Stipulation ¶1). No UCC text is supplied. The only non-UCC statute (Franklin
execution lien, Ex. D-4) is supplied because it is fictional. Ground truth is produced by
`solution/solve.py` (rules as functions, facts as data) and was hand-checked item by item below.

## Grading

17 items, one per pool (EQ-A plus the 16 Protocol pools). An item passes only if every claimant
amount (omitted = 0) and the surplus are each within $0.01. No priority list is graded, which
removes the old LOT-FAIRPORT wording ambiguity (that pool has also been removed).

Tags: **S** = second-tier sub-rule (the kind of rule Sonnet missed in calibration);
**N** = well-known nuance; **R** = routine; **C** = chain item (answer depends on running Allowed
Claim balances carried from earlier pools under Protocol §§ 5.3, 5.5).

## Sources (checked by web search/fetch during authoring)

- [LII] UCC Official Text, https://www.law.cornell.edu/ucc/9 (9-103, 9-203, 9-317, 9-322, 9-324,
  9-325, 9-326, 9-327, 9-330, 9-507, 9-508, 9-515, 9-615) and 2-702.
- [DC-9-324] D.C. Code § 28:9-324 with Official Comment 13 (multiple PMSIs: a price-securing
  seller PMSI beats an enabling-loan PMSI when both qualify under (a)):
  https://code.dccouncil.gov/us/dc/council/code/sections/28:9-324
- [DC-9-508] D.C. Code § 28:9-508 with Official Comments 3-5. (b)(1)/(b)(2) four-month rule.
  Comment 4: collateral acquired before or within four months stays perfected until lapse.
  Comment 5: collateral transferred to the new debtor, including by merger, stays perfected
  under 9-315(a)/9-507(a), and 9-508 does not apply (9-508(c)).
  https://code.dccouncil.gov/us/dc/council/code/sections/28:9-508
- [DC-9-326] D.C. Code § 28:9-326 with Official Comments.
  - Comment 2, Example: SP-X's SI in collateral that the new debtor Z Corp acquires, perfected
    only via 9-508, is subordinate to SP-Z's SI "regardless of which financing statement was
    filed first."
  - Comment 2 also says 9-326 does not cover a filing against the original debtor that remains
    effective against transferred collateral (see 9-325, 9-507).
  - https://code.dccouncil.gov/us/dc/council/code/sections/28:9-326
- [9-103e] 9-103(e)(3).
  - Text: absent an agreed reasonable method or a timely obligor designation, payments apply
    "(A) to obligations that are not secured; and (B) if more than one obligation is secured,
    to obligations secured by purchase-money security interests in the order in which those
    obligations were incurred." W. Va. Code § 46-9-103,
    https://code.wvlegislature.gov/pdf/46-9-103/.
  - In re Kellerman, No. 06-22028 (Bankr. D. Kan. Aug. 15, 2007) applies the (e)(3) order.
  - Commentary: "payments would be applied first to the purchase-money part and next to the
    nonpurchase-money part." Allowing Dual Status for Purchase-Money Security Interests, Tenn.
    J. Bus. L. (Transactions), https://ir.law.utk.edu/cgi/viewcontent.cgi?article=1234&context=transactions
  - 9-103(f)(1): the PMSI does not lose its status because the collateral also secures a
    non-PM obligation.
- [C9-515] 9-515 Comment 3: deemed retroactive unperfection on lapse applies to purchasers for
  value, not lien creditors.
- [C9-103] 9-103 Comment 4: in inventory, an SI in item 1 that secures item 2's price is a PMSI
  (cross-collateralization).
- [C9-330] 9-330(f) and Comment 6: a legend naming another assignee gives the purchaser knowledge.

## Key facts and dates

- **Ironwood FS** (2020-09-01): lapsed 2025-09-01. The 2025-02-14 continuation came before the
  window opened (2025-03-01), so it was ineffective. Ironwood filed a new FS on 2025-10-20.
- **Northbridge FS** (2021-05-03): continued 2026-04-27, which was timely.
- **Calder FS** (2021-05-10): continued 2026-01-20, which was timely.
- **Delmar levy**: 2025-06-10. The levy date controls, not the writ's.
- **Ashby merger**: Ashby merged into Kestrel effective 2025-12-01, so Kestrel was bound as new
  debtor on that date (9-203(d)(2)). The four-month cutoff under 9-508(b) is 2026-04-01.
- **Pinecrest FS** against Ashby: filed 2022-08-15, effective to 2027-08-15. Pinecrest never
  filed against Kestrel.
- **Quarry levy**: 2026-06-18, on the Haas and Hurco machines only.

## Waterfall: Allowed Claims and the running balances that create the chains

Opening Allowed Claims:

| Claimant | Opening claim |
|---|---|
| NB | 2,500,000 |
| IW | 1,265,000 |
| Tristate (Loan B + WC Note) | 391,750 |
| Calder | 460,300 |
| Delmar | 96,500 |
| Brennan | 95,000 |
| Pinecrest | 491,750 |
| Quarry | 182,000 |

Machine A receipts count first (§ 5.5).

- **NB** receives 1,803,463.48 in pools 1-8, so it has 696,536.52 left when EQ-GEN (pool 9) is
  reached. It is paid in full there. Every later pool therefore turns on junior interests.
- **IW** takes the rest of EQ-GEN and the remainder of its claim from DA-COBALT.
- **Pinecrest's** balance runs 491,750 → 485,400 (after EQ-A) → 95,000 (after EQ-ASHBY). That
  95,000 is what it takes in EQ-HAAS.
- **Quarry's** balance runs 182,000 → 62,000 (after EQ-HURCO), so it takes 45,000 in EQ-HAAS.

## Items

### 1. EQ-A: Okuma; Tristate's own disposition, so 9-615 applies

**Expected:** TRISTATE 468,300; DELMAR 96,500; PINECREST 6,350; surplus 0. Tags: S + N.

- **Expenses: 40,850 (N).** Commission 30,600 + rigging 6,800 + storage 3,450. The 14,750 in
  legal fees is excluded. 9-615(a)(1) allows attorney's fees only as the agreement provides, and
  Loan A SA §12.7 says each party bears its own fees.
- **Tristate's obligation: 468,300.** Proceeds of 612,000 less expenses leave 571,150, and
  102,850 remains after Loan A.
- **Juniors with an interest in Machine A**, in priority order:
  - Ironwood (perfected when the lien arose; lapse is not retroactive against a lien creditor
    [C9-515]).
  - Delmar (lien 2025-06-10). Tristate's PMSI beats Delmar by relation back under 9-317(e)
    (Tristate filed 6/19, 17 days after delivery on 6/2).
  - Pinecrest.
  - NB has no SI in Machine A: under Excluded Assets clause (a) as amended by Amendment 2,
    Loan A SA §6.2 prohibits a lien in NB's favor.
- **Pinecrest (S).** Kestrel became bound as new debtor at the merger. Under 9-203(e)(1) the
  Ashby security agreement then attaches to the new debtor's existing and after-acquired
  equipment "to the extent described" [LII 9-203], so it reaches Machine A even though Machine A
  was never Ashby's. Tristate's negative pledge does not prevent attachment (9-401(b)).
  - Pinecrest ranks below Delmar: its SI first attached 2025-12-01, after the levy
    (9-317(a)(2)).
  - Pinecrest sent an authenticated demand, received 9/14, before any distribution
    (9-615(a)(3)). It need not be of record against Kestrel. Tristate requested no proof
    (Stip ¶21).
- **Demands.**
  - Ironwood gave only telephone notice, which is not authenticated, so it gets 0.
  - Delmar is paid in full: 96,500.
  - Pinecrest gets the remaining 6,350.
  - The surplus to Kestrel is 0 (9-615(d)).
- **Common wrong answer:** surplus 6,350 to Kestrel, from missing Pinecrest's interest in
  Kestrel's own property. Ranking Pinecrest ahead of Delmar (from its 2022 filing date) gives
  Pinecrest 102,850.

### 2. EQ-C: Machine C; seller PMSI vs lender PMSI

**Expected:** BRENNAN 95,000; NORTHBRIDGE 129,160. Tags: S.

- **Net:** 236,000 − 2,400 − 9,440 = 224,160.
- **Two qualifying PMSIs under 9-324(a):**
  - NB's Capex Advance (150,000, wired to the seller) is an enabling loan. It was perfected on
    attachment by NB's 2021 all-assets FS.
  - Brennan is the seller, securing 110,000 of the price (balance now 95,000). Brennan filed
    2026-02-06, 15 days after delivery (2026-01-22).
- **9-324(g)(1)** gives the price-securing seller priority over the enabling lender regardless of
  filing order [DC-9-324, Comment 13]. NB's non-PM part is junior to Brennan under 9-324(a)
  anyway.
- NB's SI attaches because Brennan's contract does not prohibit a lien in favor of NB (Excluded
  Assets clause (a) as amended).
- EQ-C is first in sequence, so no earlier receipt could be applied to the Capex Advance. The
  LSA §2.9 method also excludes that.
- **Wrong answer (first-to-file tie-break under 9-322, as NB's letter urges):** NB 150,000,
  Brennan 74,160.

### 3. EQ-B: Machine B; dual status and application of payments

**Expected:** TRISTATE 241,750; NORTHBRIDGE 320,500. Tags: S.

- **Net:** 562,250.
- **What Machine B secures.** It secures Loan B (430,000, PM, incurred 2025-07-30) and the
  Working Capital Note (150,000, non-PM, incurred 2025-03-03; secured from 2025-07-30).
- **Payment application.**
  - Twelve undesignated principal payments total 188,250. There is no agreed method and no
    obligor designation (Stip ¶24). Account-number reference only separates these payments from
    Loan A.
  - Under 9-103(e)(3) there are no unsecured obligations, so (B) applies the payments to the
    PM-secured obligation (Loan B) first, even though the WC Note is older [9-103e].
  - Loan B (the PM part) is therefore 241,750, and the WC Note is 150,000.
  - Tristate's ledger instead applied oldest-first (Collections Policy CP-7). That was a
    unilateral creditor application after payment, which 9-103(e) does not honor.
- **9-103(f)(1):** the PMSI survives cross-collateralization.
- **Ranking:** Tristate's PM part 241,750 is first under 9-324(a). Tristate's 6/19/25
  all-equipment FS perfected it on attachment (7/30), before delivery (8/4). Next is NB (2021
  FS). Then Tristate's non-PM part (FS 6/19/25), then IW (10/20/25), then Pinecrest (9-326).
- NB attaches because Loan B SA §6.2 permits NB's lien.
- **Wrong answers:**
  - Ledger application: Tristate 391,750, NB 170,500.
  - Status lost entirely (transformation rule): NB 562,250.

### 4. EQ-ASHBY: equipment acquired from Ashby by merger

**Expected:** PINECREST 390,400. Tags: S.

- **Net:** 410,000 − 3,200 − 16,400 = 390,400.
- **Transferred collateral.** Pinecrest's SI was created by Ashby and perfected by the 2022 FS.
  That FS remains effective against the transferred collateral (9-507(a), 9-315(a)(1)), with no
  four-month limit. 9-508 does not apply (9-508(c)), and neither does 9-326 [DC-9-508 Comment 5;
  DC-9-326 Comment 2].
- **9-325(a):** NB's and IW's SIs, created by Kestrel in collateral Kestrel acquired subject to
  Pinecrest's perfected SI, are subordinated. NB would otherwise win only under 9-322(a)
  (2021 FS against 2022 FS), so 9-325(b)(1) is satisfied.
- Pinecrest's claim (485,400 after EQ-A) exceeds the net, so it takes all.
- **Wrong answer (NB's letter: 9-508 four months or first-to-file):** NB 390,400.

### 5. INV-CALDER-1

**Expected:** CALDER 460,300; NORTHBRIDGE 152,500. Tags: S.

- Unchanged from version 2; Sonnet missed it 0/5 in calibration.
- **Net:** 612,800.
- **9-103(b)(2)** [C9-103]: Calder's SI in the March pumps secures the price of both shipments
  and is a PMSI to the full 460,300.
- **9-324(b) priority over NB:** perfected at receipt (continuation timely). NB filed first, so
  notification was required (9-324(c)); NB received it 5/20/21, within five years before 3/2/26.
- NB's letter concedes only the March shipment's price (advocacy).

### 6-9. Pools where NB still has a balance

**CP-LEGENDED (N): NORTHBRIDGE 118,900.**
- The legend naming NB defeats 9-330(a)(2) and is knowledge under 9-330(f), which defeats
  9-330(b). NB wins under 9-322 (2021 filing against 2026 possession).
- No fee is taken on Remitted Collections.

**AR-PELLSTON (N): NORTHBRIDGE 221,300.**
- The sale of accounts is an Article 9 transaction. NB's earlier-perfected SI continues in the
  sold accounts (9-315(a)(1); no consent, Stip ¶32). 9-318(a) does not cut it off.

**LOT-GANTRY (N): NORTHBRIDGE 117,888.**
- Gantry took the goods in partial satisfaction of a money debt, so it is not a BIOC (last
  sentence of 1-201(b)(9)).
- There was no delivery, so 9-317(b) does not apply.

**DA-NORTHBRIDGE (N): NORTHBRIDGE 743,215.48.**
- Under 9-327(3) the depositary bank beats Ironwood's earlier control agreement. DACA §3
  preserves NB's later-acquired liens.

### 10. EQ-GEN: Kestrel's pre-existing equipment

**Expected:** NORTHBRIDGE 696,536.52; IRONWOOD 687,963.48. Tags: S + C.

- **Net:** 1,384,500. NB takes its remaining 696,536.52 (chain through pools 1-9).
- **Ranking of the rest:** IW, then Delmar (claim already 0 after EQ-A), then Pinecrest.
- **Ironwood vs Pinecrest is decided by 9-326(a).**
  - Pinecrest's SI in Kestrel's own equipment was created by the new debtor and is perfected only
    because 9-508 makes the Ashby FS effective. It is therefore subordinate to IW's SI, which IW
    perfected by its own FS.
  - This holds even though IW's priority date under 9-322 (10/20/2025, after its lapse) is later
    than Pinecrest's FS (8/15/2022) [DC-9-326 Comment 2 example].
  - Without 9-326, Pinecrest would take 95,000 ahead of IW.
- NB ranks ahead of IW because the lapse is retroactive against NB as a purchaser [C9-515].

### 11. DA-COBALT

**Expected:** IRONWOOD 577,036.52; surplus 931,383.65. Tags: N + C.

- Under 9-327(1), IW's control comes first. IW is owed 577,036.52 after EQ-GEN.
- NB is already paid in full.
- Only NB and IW claim the accounts (Stip ¶18), so the rest is surplus.

### 12. INV-CALDER-2

**Expected:** surplus 201,300. Tags: S + C.

- NB has a balance of 0.
- Calder's claim was fully paid in INV-CALDER-1 under 9-103(b)(2).
- **Wrong answer (missing (b)(2)):** Calder 173,900, surplus 27,400.
- The 9-324(b) notice-timing issue for the July shipment no longer matters, because NB is paid.

### 13. AR-CALDER

**Expected:** surplus 338,884. Tags: R + C.

- Net is 345,800 × 98%. NB and Calder have no remaining balance.

### 14. INV-ORRIN

**Expected:** ORRIN 59,040. Tags: R + C.

- NB is paid. Orrin's reclamation was valid against Kestrel under 2-702(2): Kestrel was
  insolvent, and the demand came on day 8. As a Non-Lien Interest, Orrin takes the rest
  (§ 5.4(b)).
- The 2-702(3) contest with NB no longer matters.

### 15. INV-CONSIGNED

**Expected:** WESTFIELD 92,160. Tags: R + C.

- NB is paid. The consignor's interest is good against the consignee itself, so Westfield takes
  the rest as a Non-Lien Interest.

### 16. EQ-HURCO: acquired 2026-05-12, more than four months after the merger

**Expected:** QUARRY 120,000. Tags: S + C.

- **Net:** 120,000. NB and IW are fully paid.
- **Pinecrest is unperfected.** The Ashby FS is seriously misleading as to Kestrel (Stip ¶3), so
  under 9-508(b)(2) it does not perfect in collateral acquired after 2026-04-01, and no FS naming
  Kestrel was ever filed.
- Quarry became a lien creditor (6/18/26) before Pinecrest perfected, so under 9-317(a)(2)
  Quarry ranks first.
- Quarry's claim of 182,000 exceeds the net, so Quarry takes all.
- **Wrong answer (ignoring 9-508(b)):** Pinecrest 95,000, Quarry 25,000.

### 17. EQ-HAAS: acquired 2026-02-17, within four months

**Expected:** PINECREST 95,000; QUARRY 45,000. Tags: S + C.

- **Net:** 140,000.
- **Pinecrest is perfected under 9-508(b)(1)** from 2026-02-17. Perfection of within-window
  collateral does not expire after four months [DC-9-508 Comment 4]. Pinecrest was therefore
  perfected at the levy and is senior to Quarry under 9-317(a)(2).
- **9-326 does not help Quarry.** 9-326 subordinates the new-debtor SI only to "a security
  interest" perfected otherwise, not to a lien creditor (Quarry's letter argues otherwise).
- Pinecrest's remaining claim is 95,000, which is a chain through EQ-A, EQ-ASHBY and EQ-GEN.
  Quarry takes the remaining 45,000 (its balance is 62,000 after EQ-HURCO).
- **Wrong answers:**
  - 9-326 applied against the lien creditor: Quarry 62,000, Pinecrest 78,000.
  - Pinecrest's 6,350 from EQ-A missed: Pinecrest 101,350, Quarry 38,650.

## Tag counts

- S (second-tier sub-rule decides the item): 10 items. EQ-A, EQ-C, EQ-B, EQ-ASHBY,
  INV-CALDER-1, EQ-GEN, INV-CALDER-2, EQ-HURCO and EQ-HAAS each turn on one; DA-COBALT
  inherits the 9-326, 9-103(e) and 9-324(g) results through the chain.
- N only: 4 items (CP-LEGENDED, AR-PELLSTON, LOT-GANTRY, DA-NORTHBRIDGE).
- R + C: 3 items (AR-CALDER, INV-ORRIN, INV-CONSIGNED).

## Sensitivity

The solver was run with one rule disabled at a time (`SOLVER_BUGS=...`).

| Disabled rule | Items lost | Pools affected |
|---|---|---|
| no_9324g | −3 | EQ-C, EQ-GEN, DA-COBALT |
| ledger_application (9-103(e)) | −3 | EQ-B, EQ-GEN, DA-COBALT |
| dual_status_lost (9-103(f)) | −3 | EQ-B, EQ-GEN, DA-COBALT |
| no_9325 | −4 | EQ-ASHBY, EQ-GEN, DA-COBALT, EQ-HAAS |
| no_9326 | −5 | EQ-A, EQ-ASHBY, EQ-GEN, DA-COBALT, EQ-HAAS |
| no_new_debtor_existing (9-203(e)) | −2 | EQ-A, EQ-HAAS |
| no_4month (9-508(b)) | −2 | EQ-HURCO, EQ-HAAS |
| 9326_vs_lien | −1 | EQ-HAAS |
| no_cross_collateral (9-103(b)(2)) | −4 | INV-CALDER-1, EQ-GEN, DA-COBALT, INV-CALDER-2 |
| lapse_ignored | −3 | |
| continuation_any_time | −3 | |
| lapse_retro_lc | −5 | |
| no_9327_3 | −3 | |
| demand_any | −3 | |
| attorney_fees | −2 | |
| original_excluded_assets | −4 | |
| agent_report_fees | −6 | |
| no_9330_legend | −3 | |
| bioc_any_buyer | −3 | |

These toggles now have no effect, because NB is paid before those pools or Calder's claim is
already satisfied: pmsi_proceeds, consignor_owner, reclaim_first, attach_date_priority and
no_9317e. Those rules are no longer graded, which is intended.

Oracle: 1.000. Nop: 0.000.

## Cascades (by design)

- **Hub items.** EQ-GEN and DA-COBALT depend on NB's and IW's running balances. Any upstream
  error that changes NB's receipts in pools 1-8 changes both: 9-324(g), 9-103(e)/(f), 9-325,
  9-103(b)(2), 9-330, 9-327(3), BIOC, or fees.
- **Pools that do not cascade.** Pools after EQ-GEN do not depend on NB's exact balance, provided
  NB is paid off somewhere in EQ-GEN (it has a 688k cushion).
- **Pinecrest chain.** Pinecrest's balance runs EQ-A → EQ-ASHBY → EQ-GEN → EQ-HAAS.

## Residual doubts

1. **EQ-HURCO and 9-317(a)(2)(B).** Pinecrest's Ashby FS "has been filed," but 9-508(b)(2)
   makes it ineffective as to the Hurco. We read (B) as requiring an FS effective for the
   collateral against this debtor. That is consistent with the 9-507(c)/9-508 policy that
   post-window collateral is unperfected and loses to lien creditors. A contrary reading would
   be unusual.
2. **Payment application.** Stip ¶24 must state the absence of any agreed method or designation
   for the 9-103(e) item to be determinate. That flags the issue but does not supply the
   (e)(3)(B) order, which runs counter to both the oldest-first intuition and Tristate's ledger.
3. **Protocol § 5.4(d).** The split-priority clause is generic drafting that the waterfall needs.
   It signals that partial priority can exist, but not where.
4. **Order of payment in 9-615(a)(3).** We pay juniors in their order of priority (Delmar before
   Pinecrest). This is the standard reading; the statute's text is silent on the order.
5. **Severity of the chain.** A single upstream miss costs 3-5 of 17 items. That is intended
   (DIFFICULTY3 §2), but it makes scores lumpy.

## Graded subset (calibration, Oct. 12, 2026)

verify.py scores the 8 pools listed in expected.json `"graded"`. Three Sonnet 5.5 runs scored 0.71,
1.00 and 0.76 on all 17 pools; their misses were the 9-103(b)(2) chain (INV-CALDER-1, EQ-GEN,
DA-COBALT, INV-CALDER-2) and CP-LEGENDED once. The subset keeps those five plus three second-tier
pools Sonnet answered correctly (EQ-C, EQ-B, EQ-ASHBY). EQ-A (order among junior 9-615(a)(3)
claimants) and EQ-HURCO (9-317(a)(2)(B) reading) are not graded because the doubts above leave room
for a second reading.
