# AUDIT: rule144-sales (iteration 3, no law supplied)

Sale Date: Wed. Oct. 21, 2026. The agent gets facts only (issuer files, position files, volume CSVs). It
has to know Rule 144 and the related rules and staff positions. There are 42 graded items: 2 volume
limits, plus 20 `max_shares_sellable_now` and 20 `form_144_required`. **Tags:** 26 nuance (62%) and
16 routine.

## Sources

Sources were verified in October 2026.
- **Rule 144** (17 CFR 230.144): https://www.law.cornell.edu/cfr/text/17/230.144
- **Rule 145(c)/(d)** (17 CFR 230.145): https://www.law.cornell.edu/cfr/text/17/230.145. Paragraph (c)
  applies only where a party is a shell company, and then only to the parties other than the issuer
  and their affiliates.
- **Rule 701(g)(3)** (17 CFR 230.701): https://www.law.cornell.edu/cfr/text/17/230.701. Starting 90 days
  after the issuer becomes subject to Section 13/15(d), non-affiliates may resell under Rule 144
  without (c) and (d), and affiliates without (d).
- **Securities Act Section 4(e)(1)(C)** (15 U.S.C. 77d(e)): https://www.law.cornell.edu/uscode/text/15/77d.
  Securities involved in a 4(a)(7) transaction are restricted securities within the meaning of Rule 144.
- **SEC Securities Act Rules C&DIs**: https://www.sec.gov/rules-regulations/staff-guidance/compliance-disclosure-interpretations/securities-act-rules.
  - Sections 128-139 and 528-539 were saved and read in full.
  - Cited: 129.02, 131.03, 131.07, 132.02, 132.04, 132.07, 132.09, 132.10, 132.11, 132.13, 132.14,
    132.16, 133.02 (as revised Sept. 25, 2026), 133.03, 133.05, 133.06, 133.07, 136.04, 137.01, 530.02,
    530.04, 532.01, 532.05, 532.06, 532.09, 532.11, 532.18, 533.05, 533.08.
- **SEC Release 33-8869** (2007 amendments) for the general framework. Since those amendments,
  non-affiliates sell under 144(b)(1), which conditions sales on (c)(1) and (d) only, so Form 144 is
  an affiliate-only obligation.

## Volume limits

**volume_limits.VRNB = 597,390** (nuance). (e)(1) takes the greater of:
- 1% of the most recent published count: 507,654 or 525,654. The weekly average exceeds both, so
  which share count is used does not matter.
- The average weekly reported volume for the four calendar weeks before the week in which the Form
  144 is filed (C&DI 133.06). Filing week is Sun. 10/18 to Sat. 10/24, so the window is 9/20 to 10/17.
  - Sum in the window: 4,189,561.
  - Less the issuer's 1,800,000-share public offering print on 9/30 (C&DI 133.05).
  - The unreported 150,000-share block on 10/6 is not added (C&DI 533.08: reported volume only).
  - (4,189,561 - 1,800,000) / 4 = 597,390.25, floored.
- Wrong approaches and what they give:
  - Including the offering: 1,047,390.
  - Last 20 trading days: a different total.
  - Adding the block: 634,890.

**volume_limits.KSTM = 186,400** (nuance).
- The stock is quoted only on OTCQX (OTC Link). C&DI 133.02 (revised 9/25/2026) says OTC Link is not
  an "automated quotation system", so the market-based test is unavailable. That leaves 1%.
- The most recent "report or statement published by the issuer" is the 9/15/2026 8-K: 18,640,000
  post-split. 1% = 186,400.
- Wrong approaches: the volume average gives 286,137; 1% of the pre-split 10-Q count gives 93,200.

## Positions

Format: expected max / expected Form 144, followed by the tags.

**P01 Okafor (CEO, affiliate): 487,390 / true.** Nuance / routine.
- She is an affiliate, and all 595,000 shares are eligible: the founder lot has been held since 2017,
  and the open-market shares have no holding period.
- Sales in the three months ending 10/21 (window starts 7/21), totalling 110,000:
  - 8/10: 40,000 under a 10b5-1 plan. These count; the (e)(3)(vii) exclusions do not cover 10b5-1
    sales.
  - 9/1: 30,000 sold by her same-household husband. These count because he is the same "person"
    under (a)(2)(i).
  - 9/10: 40,000 under the 10b5-1 plan. These count.
- Not counted:
  - 8/20: 60,000 privately repurchased by the issuer, excluded by (e)(3)(vii)(C) (C&DI 133.07).
  - 7/2: outside the window.
  - The 9/18 gift is not a sale.
- 597,390 - 110,000 = 487,390. The 300,000-share sale requires a Form 144.

**P02 Okafor Family Foundation: 600,000 / false.** Nuance / nuance.
- It is a non-affiliate donee of restricted founder shares. Under (d)(3)(v) its holding period tacks
  to the donor's 2017 acquisition, so the shares have been held for more than a year.
- C&DI 132.16: a non-affiliate donee sells under (b)(1) only. There is no aggregation with the donor
  and no Form 144.
- Misconception: the donee aggregates with the donor or must file under (e)(3)(iii).

**P03 Lumen: 0 / false.** Nuance / routine.
- Lumen privately bought open-market shares from the CEO's same-household husband on 7/1/2026.
- C&DI 129.02: those shares are restricted, because the husband is the same person as the affiliate.
  The holding period runs from 7/1/2026 and ends 1/1/2027.

**P04 Keystone (pledgee): 100,000 / false.** Nuance / nuance.
- 300,000 restricted shares were pledged without recourse on 6/1/2026. Under (d)(3)(iv) and C&DI
  530.02, the pledgee acquires them at the pledge date, so they are eligible on 12/1/2026.
- 100,000 open-market shares are restricted in the pledgee's hands, but no holding period applies and
  no other requirement except (c)(1) (C&DI 532.01). These can be sold now.
- Keystone is a non-affiliate, so no Form 144 (C&DI 132.15: (b)(1) only).

**P05 Brandt Estate: 40,000 / false.** Nuance / routine.
- The estate is a non-affiliate, and the decedent died more than three months before the Sale Date.
  C&DI 530.04 lets it use (b)(1).
- (d)(3)(vii): no holding period applies to the 40,000 shares the decedent bought on 6/1/2026.
- C&DI 132.04: the 25,000 shares from the estate's own cash option exercise on 9/15/2026 need a
  holding period, which ends 3/15/2027.
- Form 144: 3,000 shares at $12.40 = $37,200, below both thresholds, so false under any reading.
  This also sidesteps the stale Note to (d)(3)(vii), which mentions (h).

**P06 Northpine: 80,000 / false.** Nuance / routine.
- The shares were acquired in a 4(a)(7) resale, so they are restricted under §4(e)(1)(C).
- The holding period runs from the last acquisition from the issuer or an affiliate. That was Corvid's
  purchase on 2/10/2025; Corvid is a non-affiliate. More than a year has passed, so the shares are
  free.
- Misconception: the 4(a)(7) purchase restarts the clock (9/1/2026), which would give 0.

**P07 Lindgren: 30,000 / false.** Nuance / routine.
- 15,000 from the net exercise of an unregistered inducement option on 8/3/2026. The holding period
  starts at exercise (C&DI 132.11; Note 2 to (d)(3)(x)), because a compensatory option gives no
  tacking even when net exercised. Eligible 2/3/2027.
- 30,000 under a full-value RSA in an individually negotiated employment agreement, with service-only
  vesting. The holding period starts at the agreement date, 11/3/2025, not at vesting (C&DI 532.06).
  Eligible.

**P08 Harbor Point: 725,000 / false.** Nuance / routine.
- 600,000 PIPE shares (3/3/2025) are free.
- 125,000 shares from the net exercise of the common warrants tack to 3/3/2025 under (d)(3)(x).
- 100,000 shares from the cash exercise of the pre-funded warrants ($10 total) do not tack, because
  even a de minimis payment defeats tacking (C&DI 132.13). Acquired 9/8/2026, eligible 3/8/2027.

**P09 Vasquez: 50,000 / false.** Nuance / routine.
- Lot A (40,000): the note is full recourse, secured by the purchased shares plus Treasuries worth at
  least the price, and was paid before the sale. That qualifies under (d)(2) and C&DI 532.18, so the
  holding period runs from 12/1/2025. Eligible.
- Lot B (20,000): the note is secured only by the purchased shares, so it does not qualify. The
  holding period runs from each payment pro rata (C&DI 532.09).
  - Half paid 3/2/2026, so 10,000 shares are eligible.
  - Half paid 8/3/2026, so the other 10,000 are not.

**P10 Alder: 70,000 / false.** Nuance / nuance.
- It received shares in a ratable in-kind distribution, without consideration, from a closely held
  affiliate partnership. The holding period tacks to Brightwater's 1/15/2026 purchase (C&DIs 132.02,
  532.05) and was met on 7/15/2026.
- C&DI 533.05: non-affiliate partners are not subject to the volume limitation, and they file no
  Form 144.

**P11 Byrne: 0 / false.** Nuance / routine.
- He received shares from the affiliate as a compensatory bonus, so they do not tack (C&DI 532.11).
  Acquired 9/10/2026.

**P12 Pell Street: 0 / false.** Nuance / routine.
- The holding period starts when the issuer accepts the subscription, 4/24/2026 (C&DI 132.07), not at
  signing or payment (4/10). Six months gives 10/24/2026 (C&DI 132.10 method), after the Sale Date.
- The issue date (5/5) would also give 0. Only the signing date would give 120,000.

**P13 Ruiz (SLVN): 20,000 / false.** Nuance / routine.
- The S-1 was effective 8/3/2026, so on 10/21 SLVN has been reporting for 79 days.
- Rule 701(g)(3) relief begins only 90 days after the issuer becomes reporting, on 11/1/2026.
- In the meantime the issuer has not been reporting for 90 days, so (b)(1)(ii) and the one-year
  holding period apply (C&DI 132.14). The holding period runs from exercise:
  - 9/15/2025 exercise: eligible.
  - 2/20/2026 exercise: not eligible.
- Wrong readings both give 32,000: applying 701(g)(3) now, or applying a six-month holding period.

**P14 Shah (SLVN CFO): 0 / false.** Nuance / routine.
- An affiliate needs (c). (c)(1) requires 90 days of reporting; (c)(2) applies only to issuers that
  are not subject to reporting. Neither can be met on day 79.
- Rule 701(g)(3) affiliate relief (from (d) only) has not begun. IPO directed-share-program shares
  held by an affiliate are control securities and still need Rule 144.
- Corroboration: IPO prospectuses routinely state that affiliates may sell under Rule 144 "beginning
  90 days after the date of this prospectus". Examples: Jefferson Capital 424B4 (2025),
  https://www.sec.gov/Archives/edgar/data/2046042/000110465925063231/tm2430355-22_424b4.htm,
  and N-able S-1 (2021).

**P15 Granite (SLVN): 400,000 / false.** Nuance / routine.
- The preferred converted automatically, which tacks under (d)(3)(ii).
- The one-year period applies because the issuer has been reporting for less than 90 days, tested at
  the time of sale (C&DI 132.14).
  - Series A (5/3/2021): eligible.
  - Series C (12/1/2025): one year runs to 12/1/2026, so not eligible.
- Misconception: applying six months gives 550,000.

**P16 Halcyon (NGFT): 100,000 / false.** Nuance / routine.
- NGFT is a former SPAC (a shell; not a "business combination related shell company"). Under
  144(i)(1)(ii) and (i)(2), and C&DI 137.01, Rule 144 is unavailable until one year after the Form 10
  information was filed on 12/16/2025, i.e. until 12/16/2026. The 500,000 PIPE shares are blocked.
- The 100,000 shares bought on Nasdaq are not restricted, and Halcyon is a non-affiliate, so they can
  be sold.
- Misconception: ignoring 144(i) gives 600,000.

**P17 Moreau (NGFT): 40,000 / false.** Nuance / routine.
- The shares he received under the S-4 are registered. Rule 145(c) deems only the parties and their
  affiliates to be underwriters, and Moreau held 0.2% with no office, so he is not one.
- His 10,000 PIPE shares are blocked by 144(i).
- Misconceptions: treating all de-SPAC merger shares as 145(c)/144(i)-restricted gives 0; ignoring
  144(i) gives 50,000.

**P18 Hale (KSTM director): 116,400 / true.** Nuance / routine.
- The volume limit is 186,400 (above).
- Window sales are counted with the split applied through the whole period (C&DI 133.03):
  - 8/12: 20,000 pre-split, which counts as 40,000.
  - 9/28: 30,000.
  - 7/15: outside the window.
- 186,400 - 70,000 = 116,400. The holding period is long satisfied (the split shares tack under
  (d)(3)(i)). The 50,000-share sale requires a Form 144.

**P19 Cole (KSTM director): 116,400 / false.** Nuance / nuance.
- The concert agreement dated 8/1/2026 aggregates Hale's sales after that date ((e)(3)(vi)): 70,000.
  That leaves the same 116,400.
- Form 144: 2,000 shares x $9.10 = $18,200. The de minimis exemption applies per seller even when
  sales are aggregated (C&DI 136.04).

**P20 Calder (BRSA): 40,000 / false.** Nuance / routine.
- BRSA is a voluntary filer, so it is not "subject to" reporting (C&DIs 131.07, 132.09) and the
  one-year holding period applies.
  - 8/1/2025 lot: eligible.
  - 2/2/2026 lot: not eligible.
- Misconception: six months gives 100,000.

**Remaining Form 144 items: all false, all routine.** They are false because the seller is a
non-affiliate or can sell nothing: P03, P05, P06, P07, P08, P09, P11, P12, P13, P14, P15, P16, P17, P20.

## Ablations

Each disabled rule in solve.py (`RULE_OFF`) changes exactly the items listed here.
- Calendar weeks, offering exclusion, reported-only volume: VRNB and P01.
- OTC test, latest statement: KSTM, P18 and P19.
- Split adjustment: P18 and P19.
- 90-day test: P13, P14 (both fields) and P15.
- Voluntary filer: P20.
- Every holding-period rule changes its own position.
- Non-affiliate Form 144: P02, P04 and P10.
- Per-seller de minimis: P19.form.

## Doubts (candid)

1. **P14.** The conclusion that an affiliate cannot satisfy (c) during the first 90 days is a reading
   of the rule text: (c)(1) requires 90 days of reporting and (c)(2) is limited to non-reporting
   issuers. Market practice matches it (the prospectus language above), but no C&DI states it in so
   many words. The 701(g)(3) and (d) analysis gives 0 anyway for the Rule 701 lot, so the only
   exposure is the 5,000 directed-share-program shares.
2. **P02.** C&DI 132.16 settles that a non-affiliate donee uses (b)(1) only, despite the (e)(3)(iii)
   text. The instruction also says to assume no other listed holder sells on the Sale Date.
3. **NGFT.** We assume the 2024 SPAC rules (Rule 145a etc.) did not change 144(i) or 145(c) in a way
   that matters here; the rule texts on eCFR/LII were checked as current.
4. **KSTM.** C&DI 133.02 was revised on 9/25/2026. The current text names OTC Link and says the
   market-based limitation is unavailable.

## Graded subset

The deliverable has 42 fields; verify.py scores the 16 listed in expected.json `"graded"`. The subset
keeps every item a five-run Sonnet 5.5 calibration missed at least once (VRNB, P01, P03, P04.form,
P05, P07, P09, P14 both fields, P19.form) plus six nuance items it answered correctly (KSTM, P02, P06,
P08, P18, P20). The other 26 fields are routine or duplicate a rule already graded. All ten missed
items were re-verified against the current C&DIs and rule text (sec.gov, Oct. 12, 2026); the model,
not the key, was wrong on each.
