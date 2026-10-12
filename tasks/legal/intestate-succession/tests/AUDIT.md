# AUDIT — legal-intestate-succession (reviewer-only)

**Jurisdiction pinned:** Montana (every decedent domiciled in Montana; the instruction says Montana law
governs the six estates). One parcel in Part 2 is North Dakota land. No statute text is supplied to the
agent. Ground truth is computed by `solution/solve.py` and was checked by hand below.

**Item count:** 37 graded items. Part 1: for each of six estates, the net intestate estate, each
expected payee's amount, and a no-extra-payees check (29 items). Part 2: each holder's fractional share
of each Rasmussen property plus a no-extra-holders check per property (8 items).
**Tags:** 31 `nuance`, 6 `routine` (84% nuance).

All deaths that matter occurred after October 1, 2019, so the current Montana text (as amended by
Ch. 313, L. 2019) governs every succession. I verified each statute against the official online
Montana Code Annotated 2025 (mca.legmt.gov) and the North Dakota Century Code (ndlegis.gov) on
October 12, 2026.

## Sources (primary)

| Cite | What it says (paraphrase) | URL |
|---|---|---|
| MCA 72-1-103(20) | "Governing instrument" includes insurance policy, account with POD designation, security registered in beneficiary form (TOD) | https://mca.legmt.gov/bills/mca/title_0720/chapter_0010/part_0010/section_0030/0720-0010-0010-0030.html |
| MCA 72-2-112 | Spouse: all; $300,000 + 3/4; $225,000 + 1/2 (all decedent's descendants are spouse's, spouse has other descendants); $150,000 + 1/2 | https://mca.legmt.gov/bills/mca/title_0720/chapter_0020/part_0010/section_0120/0720-0020-0010-0120.html |
| MCA 72-2-113 | Order: descendants; parents; descendants of parents; grandparents/descendants half and half, or the whole to one side if the other side is empty ((1)(d)(ii)); then **(1)(e) the person of the closest degree of kinship**, (2) nearer ancestor preferred. No stepchildren tier. | https://mca.legmt.gov/bills/mca/title_0720/chapter_0020/part_0010/section_0130/0720-0020-0010-0130.html |
| MCA 72-2-114 | Heir must survive by 120 hours (clear and convincing evidence), for homestead allowance, exempt property and intestate succession; **not applied if it would make the state take** | https://mca.legmt.gov/bills/mca/title_0720/chapter_0020/part_0010/section_0140/0720-0020-0010-0140.html |
| MCA 72-2-115 | No taker: state of Montana | https://mca.legmt.gov/bills/mca/title_0720/chapter_0020/part_0010/section_0150/0720-0020-0010-0150.html |
| MCA 72-2-116 | Representation: equal shares at the nearest generation with a survivor; **the share of each deceased member is divided in the same manner among that member's own descendants** (no pooling, unlike UPC 2-106 per capita at each generation) | https://mca.legmt.gov/bills/mca/title_0720/chapter_0020/part_0010/section_0160/0720-0020-0010-0160.html |
| MCA 72-2-117 | Half blood inherits the same as whole blood | https://mca.legmt.gov/bills/mca/title_0720/chapter_0020/part_0010/section_0170/0720-0020-0010-0170.html |
| MCA 72-2-118 | Individual in gestation treated as living if lives 120 hours after birth | https://mca.legmt.gov/bills/mca/title_0720/chapter_0020/part_0010/section_0180/0720-0020-0010-0180.html |
| MCA 72-2-124 | (2) adoptee is child of adopters and **not** of natural parents; only exception is adoption by the spouse of a natural parent (no relative-adoption or posthumous-adoption exception, unlike UPC 2-119(c)-(d)); **(3) inheritance from or through a child by a natural parent or that parent's kindred is precluded unless the parent openly treated the child as his and did not refuse support** | https://mca.legmt.gov/bills/mca/title_0720/chapter_0020/part_0010/section_0240/0720-0020-0010-0240.html |
| MCA 72-2-125 | Parent whose rights were terminated and not judicially reestablished is barred, treated as predeceased | https://mca.legmt.gov/bills/mca/title_0720/chapter_0020/part_0010/section_0250/0720-0020-0010-0250.html |
| MCA 72-2-412, -413, -414, -415 | Homestead $22,500; exempt property $15,000; family allowance (death of the person entitled ends unpaid allowances, 414(2)); PR may set family allowance up to $27,000 lump sum, court may allow more | https://mca.legmt.gov/bills/mca/title_0720/chapter_0020/part_0040/sections_index.html |
| MCA 72-2-613 | Antilapse covers devisee who is grandparent, descendant of grandparent, **or stepchild**; (2)(c) "if he survives me" is **not** enough to defeat it; (1)(a) a residuary clause is an alternative devise only if the will expressly sends lapsed devises there | https://mca.legmt.gov/bills/mca/title_0720/chapter_0020/part_0060/section_0130/0720-0020-0060-0130.html |
| MCA 72-2-712 | 120-hour survival for governing instruments (2) and co-owners with survivorship, half and half (3); applies to chapters 1-5 | https://mca.legmt.gov/bills/mca/title_0720/chapter_0020/part_0070/section_0120/0720-0020-0070-0120.html |
| MCA 72-2-814 | Divorce revokes revocable dispositions to the former spouse **and dispositions to a relative of the former spouse** (related by blood, adoption or affinity to the ex and not related to the decedent after the divorce); instrument read as if they disclaimed; exceptions only by express terms of the instrument, a court order, or a property-division contract | https://mca.legmt.gov/bills/mca/title_0720/chapter_0020/part_0080/section_0140/0720-0020-0080-0140.html |
| MCA 72-2-821(5) | Disclaimer irrevocable when delivered or filed | https://mca.legmt.gov/bills/mca/title_0720/chapter_0020/part_0080/section_0210/0720-0020-0080-0210.html |
| MCA 72-2-822(2)(c)(ii)-(iii) | Disclaimed interest passes as if disclaimant died first, **but if the disclaimant's descendants would take by representation, the disclaimed interest passes only to the disclaimant's descendants** | https://mca.legmt.gov/bills/mca/title_0720/chapter_0020/part_0080/section_0220/0720-0020-0080-0220.html |
| MCA 72-3-805(1) | Disallowed claim barred unless petition or proceeding within 60 days after mailing of a notice that warns of the bar | https://mca.legmt.gov/bills/mca/title_0720/chapter_0030/part_0080/section_0050/0720-0030-0080-0050.html |
| MCA 72-6-212(2)(b) | POD: if no POD payee survives, sums belong to the owner's estate | https://mca.legmt.gov/bills/mca/title_0720/chapter_0060/part_0020/section_0120/0720-0060-0020-0120.html |
| MCA 72-6-307 | TOD: if no beneficiary survives, the security belongs to the owner's estate | https://mca.legmt.gov/bills/mca/title_0720/chapter_0060/part_0030/section_0070/0720-0060-0030-0070.html |
| MCA 42-5-202 | Effect of adoption decree; "relationship of parent and child for the purposes of intestate succession is governed by Title 72" | https://mca.legmt.gov/bills/mca/title_0420/chapter_0050/part_0020/section_0020/0420-0050-0020-0020.html |
| N.D.C.C. 30.1-04-18(3)-(4), 30.1-04-14(9) | **North Dakota keeps the UPC exceptions**: adoptee adopted by a relative of a genetic parent (grandparent or descendant of a grandparent), or after both genetic parents died, still inherits from or through the genetic parents | https://ndlegis.gov/cencode/t30-1c04.pdf |
| N.D.C.C. 30.1-04-03(1) | Descendants first, by representation | https://ndlegis.gov/cencode/t30-1c04.pdf |
| N.D.C.C. 30.1-10-04 | Revocation by divorce, including relatives of the former spouse (same as MCA 72-2-814) | https://ndlegis.gov/cencode/t30-1c10.pdf |
| Restatement (Second) of Conflict of Laws § 236 (1971) | Intestate succession to land is governed by the law the situs would apply (situs law) | https://www.lexplug.com/outlines/conflict-of-laws/intestate-succession-of-real-property |
| 15 U.S.C. 260a | U.S. daylight saving time begins the second Sunday of March (March 8, 2026); Montana observes it (MST UTC-7, MDT UTC-6); St. Paul, Minnesota is Central (CDT UTC-5) | https://www.law.cornell.edu/uscode/text/15/260a |

---

## E1 — Estate of Harold James Vance (Billings)

**Survival.** Harold died 10:40 PM on March 5, 2026 (MST, UTC-7) = 05:40 UTC March 6. Owen died 11:10
PM on March 10 (MDT, UTC-6; DST began March 8) = 05:10 UTC March 11. Real elapsed time is 119.5 hours,
not the 120.5 hours the clock times suggest. Owen fails the 120-hour rule (72-2-114) and is treated as
predeceased. He left no descendants, so his line drops out. Ivy was born July 19, 2026 after 38 weeks
of gestation, so she was in gestation at Harold's death, and she lived more than 120 hours after
birth: she is treated as living (72-2-118). Theo is Lena's son, never adopted, and there was never an
agreement to adopt; a stepchild is not an heir.

| # | Item | Expected | Tag | Why |
|---|---|---|---|---|
| 1 | E1.net_intestate_estate | 1,240,000.00 | routine | Probate: A1 640,000 + A2 48,300 + A4 642,600 + A8 22,000 + A9 15,000 + A10 3,400 + A11 10,600 = 1,381,900. Excluded: A3 joint with right of survivorship with Lena (she survived), A5/A6 designated to Lena, A7 group plan § 7.3 pays the spouse. Charges: funeral 14,800; admin 31,600; card claim 9,700; hospital claim as amended 12,300; homestead 22,500 (72-2-412); exempt property 15,000 (72-2-413); family allowance 36,000 (court order; above the PR's $27,000 limit, 72-2-415). Brightline's $18,000 claim is barred: disallowance mailed June 1 with the warning, nothing filed within 60 days (72-3-805(1)). Total charges 141,900. |
| 2 | E1.V02 (Lena) | 732,500.00 | nuance | All of Harold's surviving descendants (Noah, Ivy) are Lena's, and Lena has another descendant (Theo): 72-2-112(3): 225,000 + ½ × 1,015,000. If Owen is wrongly treated as surviving (naive clock time), 112(4) gives 695,000. |
| 3 | E1.V03 (Noah) | 253,750.00 | nuance | Balance 507,500 ÷ 2 (Owen out by 120 hours across the DST change). |
| 4 | E1.V04 (Ivy) | 253,750.00 | nuance | Afterborn heir (72-2-118) plus the DST point. |
| 5 | E1.no_extra_payees | — | nuance | No ESTATE:V05 (Owen failed 120 hours), no V06 (stepchild), no V07 (parent; descendants survive). |

---

## E2 — Estate of Daniel Luis Moreau (Great Falls)

**Family.** Daniel (34, unmarried, no children). Mother Paula died 2021. Father Gary Pruitt (never
married to Paula) is alive. Paternity was adjudicated in 1994 over Gary's denial; a 1999 contempt
order found he paid nothing and never visited; the 2000 termination order found he never acknowledged
the child and refused support; his 2004 motion to reestablish was denied, no appeal. Half-siblings:
Lucy (Paula + Henri Moreau; survived Daniel, died June 20, 2026), Rosa (Paula + Tomas; died 2023;
children Nina, Omar), Samuel (Paula's son placed for agency adoption by unrelated Hendersons in 1996),
Kyle (Gary's son with Dawn).

- Gary is barred (72-2-125(1)(a), treated as predeceased) and also precluded by 72-2-124(3).
- **Kyle is excluded by 72-2-124(3)**: inheritance from or through the child by the parent "or the
  parent's kindred" is precluded unless that parent openly treated the child as his and did not refuse
  support. Gary did neither. (Under UPC 2-114 alone, only the parent is barred and Kyle would inherit
  as a descendant of a parent. Montana's 124(3) is the second-tier rule; it is stated in the statute
  for "either natural parent," and here the parents were never married, which is also the classic
  setting of the rule.)
- Samuel is not Paula's child for intestacy (72-2-124(2); not a stepparent adoption).
- 72-2-113(1)(c) and 72-2-116(3): shares at the nearest generation below the parents: Lucy (alive at
  Daniel's death, survived far more than 120 hours) and Rosa (deceased, with descendants) = 2 shares.
  Rosa's share goes to Nina and Omar equally. Lucy's share is paid to her estate (she survived Daniel),
  not to her son Liam or Ryan Fisher's trust. Half blood takes equally (72-2-117).

| # | Item | Expected | Tag | Why |
|---|---|---|---|---|
| 6 | E2.net_intestate_estate | 612,000.00 | routine | Probate A1-A5 = 650,900. IRA (to Lucy) and TOD account (to Samuel) are nonprobate. Charges: 9,800 + 18,900 + 7,200 + 3,000 (Meridian sued within 60 days of the April 20 disallowance — May 29 is day 39 — and settled for 3,000) = 38,900. |
| 7 | E2.ESTATE:M04 | 306,000.00 | nuance | ½ of 612,000; Kyle excluded by 124(3). With Kyle in (UPC-style), each of three shares would be 204,000. |
| 8 | E2.M11 (Nina) | 153,000.00 | nuance | ½ of Rosa's 306,000. |
| 9 | E2.M12 (Omar) | 153,000.00 | nuance | Same. |
| 10 | E2.no_extra_payees | — | nuance | No M03 (Gary), no M14 (Kyle), no M06 (Samuel), no M05 (Liam directly), no M09 (Tomas, stepfather). |

---

## E3 — Estate of Nora Whitfield Lane (Helena)

**Family.** Nora: widow (Carl died 2022), no descendants, parents dead, no siblings. Maternal
grandparents Arthur and Hilda Lund are dead and their only child was Nora's mother: the maternal side
has no grandparent or descendant of a grandparent. Great-aunt Opal and her son Pierce descend from
great-grandparents, not grandparents. 72-2-113(1)(d)(ii): the whole estate goes to the paternal side,
divided by representation among descendants of Walter and Edna Whitfield. Opal does not take: the
(1)(e) next-of-kin tier applies only when there is no descendant of a grandparent on either side.

Paternal side, 72-2-116(3): nearest generation below the grandparents with a survivor is the children
generation: Hugo (alive), Frank (dead, descendants), Grace (dead, descendants); Paul (Nora's father)
leaves no surviving descendant other than the decedent. Three shares of 378,000.

Quinn was born to Frank and Marisol. After both died, his first cousin Tess (Grace's daughter, a
relative) adopted him in 2015. **Montana 72-2-124(2) has no relative-adoption or posthumous-adoption
exception**: Quinn is Tess's child only and does not take through Frank. (Under UPC 2-119(c)-(d), or in
North Dakota, he would also take through Frank and the two-lines rule would apply.) No pooling
(72-2-116): Frank's 378,000 goes to his only child for this purpose, Rex; Grace's 378,000 divides
between Ward and Tess's line, and Tess's 189,000 between Vera and Quinn.

| # | Item | Expected | Tag | Why |
|---|---|---|---|---|
| 11 | E3.net_intestate_estate | 1,134,000.00 | routine | A1-A5 = 990,100; A6 cabin, tenants in common, ½ × 170,000 = 85,000; A7 farmland JTWROS with Carl, who died in 2022, so Nora owned it alone at death: 140,000. A8 policy pays contingent beneficiary Dylan (nonprobate). Total 1,215,100 − charges 81,100 (13,200 + 39,650 + 6,250 + 22,000). |
| 12 | E3.W22 (Hugo) | 378,000.00 | routine | ⅓ of the whole (maternal side empty). |
| 13 | E3.W16 (Rex) | 378,000.00 | nuance | Frank's entire third: Quinn is not Frank's child under 72-2-124(2). |
| 14 | E3.W21 (Ward) | 189,000.00 | routine | ½ of Grace's third. |
| 15 | E3.W20 (Vera) | 94,500.00 | nuance | ½ of Tess's 189,000 (Quinn shares as Tess's adopted child; no pooling). |
| 16 | E3.W17 (Quinn) | 94,500.00 | nuance | Takes only through Tess. Under UPC 2-119(c) he would claim through Frank too. |
| 17 | E3.no_extra_payees | — | nuance | No W12 (Opal), W13 (Pierce), W03 (Dylan, stepson). |

---

## E4 — Estate of Felix August Brandt (Kalispell)

**Survival.** Felix died 11:50 PM August 10, 2026 in Kalispell (MDT, UTC-6) = 05:50 UTC August 11.
Joan died 12:20 AM August 16 in St. Paul, Minnesota (CDT, UTC-5) = 05:20 UTC August 16. Elapsed:
119.5 hours (the clock times suggest 120.5). Joan is treated as predeceasing Felix for intestacy and
allowances (72-2-114), for the policy designation (72-2-712(2)), and for the survivorship property
(72-2-712(3)). The policy has no simultaneous-death clause (712(4) does not apply).

- House and joint checking: not established that either survived the other by 120 hours, so half
  passes as if Felix survived (stays in his estate) and half as if Joan survived:
  ½ × (410,000 + 48,000) = 229,000 in Felix's estate.
- Allowances claimed by Joan's estate: none payable. 72-2-114 removes homestead and exempt property;
  the family allowance fails because Joan is deemed predeceased (72-2-712(1)) and, independently,
  because the death of the person entitled ends unpaid allowances (72-2-414(2)).
- Heirs: no descendant, parent, descendant of a parent, grandparent, or descendant of a grandparent
  (aunt Hedwig and uncle Otto died without issue; the Albers had one child). **Montana has no
  stepchildren tier** (unlike UPC 2-103(b), which would give the estate to the descendants of the
  deceased spouses Ingrid and Joan). 72-2-113(1)(e): the person of the closest degree of kinship.
  The genealogist found no living blood relative other than Greta, a second cousin (sixth degree).
  72-2-114's escheat exception is not triggered because Greta takes.

| # | Item | Expected | Tag | Why |
|---|---|---|---|---|
| 18 | E4.net_intestate_estate | 708,000.00 | nuance | 229,000 + A3 487,000 + A4 23,600 + A5 18,400 + A6 26,000 = 784,000 − (11,200 + 33,800 + 31,000) = 708,000. A7 goes to Anton (contingent) or is in interpleader; either way it is not Felix's probate estate. |
| 19 | E4.B23 (Greta) | 708,000.00 | nuance | 72-2-113(1)(e). |
| 20 | E4.no_extra_payees | — | nuance | No ESTATE:B02, no stepchildren (B05, ESTATE:B06), no Hart children or grandchildren. |

---

## E5 — Estate of Dale Robert Prescott (Bozeman)

Dale divorced Karen in February 2023. The decree and MSA say nothing about life insurance, beneficiary
designations or TOD registrations, and the MSA award of the Bridger account to Dale is a property
division, not an "express term" preserving Karen's designation. They did not remarry.

- Bridger TOD (registered 2016) to Karen: revoked (72-2-814(2)(a)(i)); no other TOD beneficiary, so
  the account belongs to Dale's estate (72-6-307). 240,000 in.
- Summit Life policy: primary Karen (revoked); contingent Doris Weller, Karen's mother. Doris is a
  "relative of the divorced individual's former spouse" (related to Karen by blood, not related to
  Dale after the divorce), so her designation is revoked too (72-2-814(2)(a)(i), (1)(e)). Policy §
  9.2 pays the owner's estate. 150,000 in. The policy is individual, bought by Dale, not
  employer-provided: no ERISA preemption issue.
- First Gallatin POD to Mason (2024, after the divorce): valid, nonprobate.
- Heirs: no spouse, descendants or parents. Descendants of parents: Glen (alive, disclaimed; one son,
  Mason) and Ruth (dead; Abby, Ben, Cole). **72-2-822(2)(c)(iii)**: because Mason would share by
  representation had Glen predeceased, Glen's disclaimed half passes only to Mason. Treating Glen as
  simply predeceased would instead put all four nieces and nephews in one generation at ¼ each
  (214,500), as the PR's intake note assumes.

| # | Item | Expected | Tag | Why |
|---|---|---|---|---|
| 21 | E5.net_intestate_estate | 858,000.00 | nuance | 480,000 + 21,500 + 240,000 + 150,000 + 18,500 = 910,000 − (12,000 + 28,000 + 12,000) = 858,000. Bookkeeper's 468,000 omits the revoked designations. Without revoking Doris, the policy would be excluded (708,000). |
| 22 | E5.P07 (Mason) | 429,000.00 | nuance | Glen's ½ under 822(2)(c)(iii). |
| 23 | E5.P08 (Abby) | 143,000.00 | nuance | ⅓ of Ruth's ½. |
| 24 | E5.P09 (Ben) | 143,000.00 | nuance | Same. |
| 25 | E5.P10 (Cole) | 143,000.00 | nuance | Same. |
| 26 | E5.no_extra_payees | — | routine | No Glen, Karen, Doris. |

---

## E6 — Estate of Raymond Earl Teller (Butte)

Raymond died 4:15 PM April 11, 2026; Joyce, his only sibling and only living relative of any degree
(certified heir search), died 2:30 PM April 14 (70.25 hours later). Neither married; neither had
children; parents dead.

- **POD savings to Joyce:** the account agreement makes the balance payable to the POD payee "who
  survives the owner." For a governing instrument, an individual not shown to survive by 120 hours is
  deemed to predecease (72-2-712(2)). 72-2-712 has no escheat exception. No POD payee survives, so the
  balance belongs to Raymond's estate (72-6-212(2)(b)): 64,000 is probate.
- **Intestacy:** applying the 120-hour rule would leave no taker and the estate would pass to the State
  (72-2-115). 72-2-114 then says the 120-hour rule "is not to be applied," so Joyce, who in fact
  survived, takes as a descendant of Raymond's parents. Her share is paid to her estate.

| # | Item | Expected | Tag | Why |
|---|---|---|---|---|
| 27 | E6.net_intestate_estate | 324,000.00 | nuance | 265,000 + 64,000 + 9,800 + 12,200 = 351,000 − (9,500 + 14,500 + 3,000) = 324,000. The bookkeeper's 260,000 excludes the POD account. |
| 28 | E6.ESTATE:T02 | 324,000.00 | nuance | 72-2-114 escheat exception. |
| 29 | E6.no_extra_payees | — | nuance | No STATE. |

---

## Part 2 — Rasmussen family land (chain of four successions)

Owner: Arne Rasmussen, sole owner of both properties (deeds; no later conveyance). Every decedent in
the chain was domiciled in Montana. All successions occurred after October 1, 2019.

**Step 1 — Arne (died May 14, 2020; will of 2012; Montana).**
- Art. II: ½ ranch to Mark (survived). Art. IV: North Dakota tract to Mark (survived; no lapse issue,
  so no choice-of-law question about construing the will for North Dakota land).
- Art. III: ½ ranch "to my stepson, Peter Lund, if he survives me." Peter died in 2018. 72-2-613(2)
  covers a devisee who is a **stepchild** (child of the testator's spouse, not the testator's child,
  (1)(g)); (2)(c): "if he survives me" is not by itself a contrary intent; (1)(a): the residuary
  clause is not an alternative devise because the will does not say lapsed devises go to the residue;
  the will's alternative to Mark in Art. V is an alternative only for the residue. Substitute gift to
  Peter's surviving descendants by representation: Sara, Thomas and Vincent, ⅙ of the ranch each.
  Helen's estate (and her church) takes nothing.

**Step 2 — Vincent (died September 14, 2022; intestate; divorced; Montana ranch only).** His ⅙ goes
to his children Leah and Eli, 1/12 each (72-2-113(1)(a)).

**Step 3 — Mark (died January 9, 2024; 2021 will).** The will gives everything to Dana, or if she does
not survive, to her son Kyle. Mark and Dana divorced August 25, 2023; the MSA does not mention the
will; they did not remarry. The gift to Dana is revoked, and so is the alternative gift to Kyle,
because he is a relative of the former spouse who is not related to Mark after the divorce (never
adopted) (MCA 72-2-814(2)(a)(i), (1)(e); N.D.C.C. 30.1-10-04, same text). The will is read as if both
disclaimed; nothing remains, so Mark's interests pass by intestacy. Intestate succession to land is
governed by the law of the situs (Restatement (Second) of Conflict of Laws § 236).
- **Montana ranch (Montana law).** Mark's only descendant line is Lily (died 2019) and her son Ben.
  Ben was adopted in 2020 by Joan Webb Carver (his great-aunt: sister of Lily's mother) and her
  husband, after both of Ben's parents had died. Under 72-2-124(2) Ben is the child of the Carvers and
  not of Lily; Montana has no relative or posthumous adoption exception. So Mark has no descendant.
  Parents Arne and Ruth are dead. Descendants of parents: Owen Haines, Ruth's son by Dale Haines (half
  blood takes equally, 72-2-117). Owen takes Mark's ½.
- **North Dakota tract (North Dakota law).** N.D.C.C. 30.1-04-18(3) (adopted by a relative of a
  genetic parent: Joan is a descendant of Lily's grandparents, 30.1-04-14(9)) and (4) (adopted after
  both genetic parents died) keep Ben's right to inherit from and through Lily. Ben is Mark's
  descendant and takes the whole tract (30.1-04-03(1)).

**Step 4 — Thomas (died March 22, 2025; intestate; never married; no children; Montana ranch only).**
Parents Peter and Carol dead. Descendants of parents (72-2-116(3)): Sara (alive) and Vincent (dead,
two children): 2 shares of 1/12 each. Sara disclaimed (delivered June 12, 2025). Because her daughter
Zoe would take by representation had Sara predeceased, Sara's 1/12 passes only to Zoe
(72-2-822(2)(c)(iii)). Vincent's 1/12 goes to Leah and Eli, 1/24 each. (Treating Sara as predeceased
would instead give Zoe, Leah and Eli 1/18 each.) Sara keeps the ⅙ she took from Arne; the disclaimer
reached only Thomas's estate.

**Final.**
- Montana ranch: Owen ½; Sara ⅙; Zoe 1/12; Leah 1/12 + 1/24 = ⅛; Eli ⅛. Sum = 12/24 + 4/24 + 2/24 +
  3/24 + 3/24 = 1.
- North Dakota tract: Ben 1.

| # | Item | Expected | Tag | Why |
|---|---|---|---|---|
| 30 | rasmussen.montana_ranch.R06 (Owen) | 1/2 | nuance | Will revoked for Dana and her son Kyle (814); Ben is not Mark's descendant under Montana's adoption rule; half blood. |
| 31 | rasmussen.montana_ranch.R10 (Sara) | 1/6 | nuance | Antilapse for a stepchild despite "if he survives me"; disclaimer in Thomas's estate does not touch it. |
| 32 | rasmussen.montana_ranch.R13 (Zoe) | 1/12 | nuance | 822(2)(c)(iii). |
| 33 | rasmussen.montana_ranch.R15 (Leah) | 1/8 | nuance | 1/12 through Vincent + 1/24 through Thomas. |
| 34 | rasmussen.montana_ranch.R16 (Eli) | 1/8 | nuance | Same. |
| 35 | rasmussen.montana_ranch.no_extra_holders | — | nuance | No ESTATE:R02 (Helen / church), no Dana (R26) or Kyle (R27), no Ben (R21) in the ranch. |
| 36 | rasmussen.north_dakota_tract.R21 (Ben) | 1 | nuance | Situs law; N.D.C.C. 30.1-04-18(3)-(4); revocation by divorce. |
| 37 | rasmussen.north_dakota_tract.no_extra_holders | — | nuance | No Owen, Dana or Kyle in the tract. |

---

## Uniqueness and wording checks

- Every amount and fraction above follows from the stated facts with no discretionary step. Claims
  are either allowed, amended, settled, or barred by the documents; allowances are fixed amounts.
- Payee keys: Lucy (E2) and Joyce (E6) survived the decedent and later died, so their shares are keyed
  `ESTATE:<id>` under the instruction's rule. No graded holder in Part 2 is dead.
- The instruction asks for "current law" and pins Montana; every death post-dates the 2019 amendments.
- The chain never requires a choice of law for will construction on North Dakota land (Arne's North
  Dakota devise is to a devisee who survived; Mark's will fails under identical statutes in both
  states). The only choice-of-law point is intestate succession to land (situs), which is settled.

## Flawed-solver checks (monkeypatched `solve.py`, scored by `verify.py`)

| Variant | Score |
|---|---|
| Naive local clock times (ignore DST and zones) | 30/37 |
| UPC per capita at each generation (pooling) | 33/37 |
| UPC relative/posthumous adoption exception applied in Montana | 33/37 |
| No 72-2-124(3) kindred bar | 33/37 |
| UPC stepchildren tier instead of next of kin | 35/37 |
| Disclaimant treated as simply predeceased (no 822(2)(c)(iii)) | 30/37 |
| 120-hour rule applied even though the State would take | 35/37 |
| Divorce revokes only the ex-spouse, not her relatives | 28/37 |
| No revocation by divorce at all | 28/37 |
| "If he survives me" defeats antilapse; lapse to residue | 32/37 |
| Montana (domicile) law applied to North Dakota land | 35/37 |
| POD passes straight to Joyce's estate (no 120 hours for instruments) | 35/37 |
| Allowances paid to Joan's estate | 35/37 |
