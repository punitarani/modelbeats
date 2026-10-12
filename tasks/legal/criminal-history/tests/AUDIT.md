# AUDIT: criminal-history (v3)

Not shown to the agent. The ground truth comes from `solution/solve.py`, which encodes the
rules, and every item was then re-derived by hand below. Law: the U.S. Sentencing Commission
Guidelines Manual effective November 1, 2025 (all sentencings are October 26-30, 2026, before the
November 1, 2026 amendments take effect; §1B1.11). The task supplies no law: the agent must know
the Manual and statutes or look them up.

## Sources

- [M] USSC, 2025 Guidelines Manual, Chapter Four:
  https://www.ussc.gov/sites/default/files/pdf/guidelines-manual/2025/CHAPTER_4.pdf
  (§4A1.1 and commentary, §4A1.2 and App. Notes 1-12, §4A1.3 [deleted by amendment 836],
  §4B1.1, §4B1.2(a)-(e), §4B1.4, §4C1.1).
- [1B1.3] §1B1.3, App. Note 3(B), 2025 Manual (relevant conduct excludes conspirators' conduct
  before the defendant joined): https://guidelines.ussc.gov/gl/%C2%A71B1.3
- [A831] Amendment 831 (eff. Nov. 1, 2024), which split §4C1.1(a)(10) into (10) (no §3B1.1
  adjustment) and (11) (no CCE): https://www.ussc.gov/guidelines/amendment/831
- [924] 18 U.S.C. § 924(e)(1)-(2): https://www.law.cornell.edu/uscode/text/18/924
- [921] 18 U.S.C. § 921(a)(20): https://www.law.cornell.edu/uscode/text/18/921
- [5845] 26 U.S.C. § 5845(a)(1)-(2): https://www.law.cornell.edu/uscode/text/26/5845
- [Erlinger] Erlinger v. United States, 602 U.S. 821 (2024):
  https://supreme.justia.com/cases/federal/us/602/23-370
- [Wooden] Wooden v. United States, 595 U.S. 360 (2022):
  https://supreme.justia.com/cases/federal/us/595/20-5279
- [Small] Small v. United States, 544 U.S. 385 (2005):
  https://supreme.justia.com/cases/federal/us/544/385
- [Stokeling] Stokeling v. United States, 586 U.S. 73 (2019):
  https://supreme.justia.com/cases/federal/us/586/17-5554
- [Caron] Caron v. United States, 524 U.S. 308 (1998):
  https://www.law.cornell.edu/supct/html/97-6270.ZO.html
- [Taylor] Taylor v. United States, 495 U.S. 575 (1990) (generic burglary: unlawful entry into
  or remaining in a building or structure with intent to commit a crime).

The quotations of the 2025 Manual relied on below were checked against the text of CHAPTER_4.pdf.

## Item list (45 items: 41 nuance, 4 routine)

"Chain" marks a deliverable-level item that depends on several determinations; one wrong link
changes it.

### Global

1. `acca_occasions_finder` = `jury_beyond_reasonable_doubt` (nuance). Erlinger (2024): the
   Fifth and Sixth Amendments require a unanimous jury to find beyond a reasonable doubt (unless
   the defendant admits it in a plea) that the predicate offenses were committed on different
   occasions. The pre-2024 practice was a judge finding by a preponderance.

### Whitfield (FIP, ordinary pistol; commencement 2025-06-14; 10-yr line 2015-06-14; 15-yr line 2010-06-14)

2. `points.CR-2012-0790` = 0 (nuance). Under §4A1.2(b)(2) only the 4 unsuspended months count.
   The revocation adds 8 months under (k)(1), so the total is 12 months: (b)-type, not over
   13 months. Under (k)(2)(C) the time period for a total of 13 months or less runs from "the
   date of the original sentence," here 2012-11-05, which falls outside the 10-year period.
   Misconceptions: measuring from the revocation (2015-07-20) or the release (2016-03-18) gives
   2; counting the suspended 32 months gives 44 months and 3 points under (e)(1).
3. `points.M-25-0412` = 0 (nuance, second tier). Guilt was established but there is no sentence
   yet, so §4A1.2(a)(4) applies. False information to a police officer is a (c)(1) listed
   offense. Under the last sentence of (a)(4) and App. Note 1, ¶2, such a conviction counts only
   if the offense is similar to the instant offense. A false name is not similar to felon in
   possession. A general (a)(4) count gives 1.
4. `points.CR-2016-1402` = 1 (nuance). App. Note 10: a conviction set aside "for reasons
   unrelated to innocence or errors of law, e.g., in order to restore civil rights" is counted.
   The record is not expunged (§4A1.2(j)): it is not sealed and can be pleaded and proved later.
   The sentence was 12 months' probation, imposed within 10 years, so (c) 1.
5. `d` = 1 (nuance). CR-2017-0533 holds robbery (30 months) and aggravated assault (24 months,
   concurrent) in one information, so they are a single sentence (§4A1.2(a)(2)) scored 3 on the
   30-month robbery. The assault is a crime of violence (§4B1.2(a)(1) force clause, and
   aggravated assault is enumerated) and added no points because it was in the single sentence.
   So §4A1.1(d) and its App. Note 4 add 1 point. Neither the text nor the commentary has a
   same-occasion exception.
6. `total` = 6 (chain). (a) 3 [CR-2017-0533] + (c) 1 [CR-2016-1402] + (c) 1 [TM-24-0871, DUI
   always counted, App. Note 5] + (d) 1 = 6. Excluded: CR-2003-2210 (released 2006, before the
   15-year line), CR-2012-0790 (item 2), TM-21-3318 (driving while suspended is a (c)(1) offense
   with 12 months' probation, which is not "more than one year"), M-23-09945 (drunk in public
   is (c)(2) public intoxication), and M-25-0412 (item 3). (e): (a)-(d) = 6 < 7, so no status
   point even though he was on DUI probation. Each error flips the total: counting
   M-25-0412 gives 7, then e=1, then 8; counting CR-2012-0790 gives 8, then 9.
7. `acca_predicates.CR-2016-1402` = false (nuance; interaction of two regimes). Under § 921(a)(20)
   a conviction that has been "set aside" or for which civil rights have been restored is not a
   conviction, unless the order expressly restricts firearms. Here the order restores all
   rights including firearms, and Franklin law imposes no residual restriction, so the Caron
   "unless" clause does not apply. It is still counted under the Guidelines (item 4).
8. `acca_occasions` = 2 (nuance). The true predicates are CR-2003-2210 (generic Taylor burglary
   of a building, punishable by more than 1 year, a "violent felony"; Chapter Four time limits do
   not apply under §4B1.4 App. Note 1) and CR-2017-0533 (robbery with Stokeling force, and
   aggravated assault). The three storage-unit burglaries in one building, committed one after
   another in a single uninterrupted night, are one occasion (Wooden, materially the same
   facts). The robbery and assault in one two-minute episode are one occasion. CR-2012-0790
   is not a "serious drug offense": the maximum is 8 years, under 10, and no recidivist
   enhancement applied. CR-2016-1402 is excluded by item 7. Counting each burglary separately or
   counting CR-2016-1402 gives 3 or more, and ACCA would wrongly apply.
9. `career_offender_predicates` = 2 (nuance). The qualifying prior felony CoV/CSO convictions
   that receive points (§4B1.2 App. Note 3 applies §4A1.2) are CR-2016-1402 (robbery, CoV,
   1 point, set-aside still counted) and CR-2017-0533. CR-2017-0533 holds two CoVs in one
   single sentence, but only one may be used (§4A1.2 App. Note 3: "no more than one prior
   sentence in a given single sentence may be used as a predicate"). CR-2012-0790 (CSO) gets
   0 points, so it is not counted. CR-2003-2210: burglary has not been a §4B1.2 CoV since 2016,
   and it is also stale. (Whitfield is not a career offender anyway: felon in possession of an
   ordinary pistol is not a CoV under §4B1.2(a), whose possession prong covers only § 5845(a)
   firearms.)
10. `final_category` = III (chain). Part A total 6 gives III. Not a career offender. § 924(e)
    does not apply (2 occasions), so §4B1.4(c) does not apply.

### Brandt (FIP of a sawed-off shotgun; commencement 2025-03-08)

11. `acca_predicates.JV-91-0440` = true (nuance). Under § 924(e)(2)(B), a violent felony
    includes "any act of juvenile delinquency involving the use or carrying of a firearm, knife,
    or destructive device" that would be punishable by more than 1 year if committed by an
    adult and that satisfies the force clause. Under § 924(e)(2)(C), "conviction" includes such
    a juvenile finding. Here: armed robbery with a knife, force sufficient to overcome resistance
    (Stokeling), class 1 if committed by an adult. The adjudication followed a jury trial, which
    avoids the circuit disagreement (United States v. Tighe, 9th Cir. 2001) over non-jury
    juvenile adjudications. Chapter Four's juvenile and time limits do not apply (§4B1.4 App.
    Note 1).
12. `acca_predicates.MX-2020-118` = false (nuance). Small (2005): "convicted in any court" means
    domestic courts only. A foreign robbery conviction does not count.
13. `points.CR-2017-1702` = 3 (nuance, second tier). One 12-month revocation term covered two
    separately counted sentences: theft (probation only, 1 point) and forgery (45 days + probation,
    1 point). They are separate because of the intervening arrest on 2017-03-01 and different
    sentencing dates. Under §4A1.2 App. Note 11, ¶2, the term goes to the sentence that gives
    the greatest increase. On forgery: 45 days + 12 months > 13 months, so 3 (+2). On theft:
    12 months, so 2 (+1). Forgery therefore gets it: forgery 3, theft 1. For the time period,
    (k)(2)(A) uses the last release, 2019-08-20, which is within 15 years.
14. `points.CR-2017-0274` = 0 (routine). App. Note 6: a conviction vacated as constitutionally
    invalid (uncounseled plea) is not counted.
15. `total` = 5 (chain). M-17-1204 1 + CR-2017-1702 3 + CR-2022-0310 1 (3 years' felony probation)
    = 5. Excluded: JV-91-0440 (juvenile, released 1993); CR-93-1187 (released 1999) and CR-03-2251
    (released 2008), both before the 15-year line of 2010-03-08; CR-2017-0274 (item 14);
    M-19-00951 (resisting arrest, (c)(1), 10 days and 6 months' probation); MX (h); TC (i);
    GF-24-0056 (fish and game, (c)(2)). (e): 5 < 7, so no point. A wrong revocation allocation
    gives 4.
16. `final_category` = VI (chain). ACCA applies: JV-91-0440, CR-93-1187 (robbery at 18) and
    CR-03-2251 (heroin PWID, maximum 15 years, a serious drug offense) are three predicates on
    three separate occasions (1991, 1993, 2003), and no time limit applies. §4B1.4(c) then takes
    the greatest of the Part A category (III), Category IV, and Category VI "if the firearm
    possessed by the defendant was of a type described in 26 U.S.C. § 5845(a)." A shotgun with a
    14-inch barrel and 24.5-inch overall length meets § 5845(a)(1)-(2) (under 18 in. / under
    26 in.). So VI. Common errors: III (missing the juvenile predicate, so no ACCA) and IV
    (applying only the floor).

### Ferro (PWID cocaine; commencement 2025-08-02; 10-yr line 2015-08-02; 15-yr line 2010-08-02)

17. `points.GCMO-09-0117` = 3 (routine). §4A1.2(g): general court-martial sentences are counted.
    24 months > 13 months. Released from the brig 2010-12-15, which is within the 15-year period
    (§4A1.2(e)(1)).
18. `points.CR-2014-0861` = 3 (nuance). App. Note 2: the length of an indeterminate sentence is
    the stated maximum (2 years), not the minimum (6 months, which would give 2). The parole
    revocation added no new term. Imposed 2015-02-20, within 15 years.
19. `points.CR-2025-1130` = 3 (nuance). App. Note 1: a sentence imposed after commencement but
    before federal sentencing is a "prior sentence" when the conduct is not part of the instant
    offense. The parties stipulated, and the PSR finds, that it is not relevant conduct.
    2 years gives 3.
20. `points.M-24-5590` = 1 (routine). §4A1.2(a)(4): convicted but not yet sentenced counts under
    (c). Theft is not a (c)(1) listed offense.
21. `e` = 1 (nuance). (a)-(d) = 16 ≥ 7. At the instant offense he had failed to report for the
    20-day sentence in M-24-4415, and §4A1.2(n) treats that as escape status, a criminal justice
    sentence under §4A1.1(e). He was on no probation or parole.
22. `career_offender_predicates` = 1 (nuance; chain). CR-2016-0402 and CR-2016-0455 are separate
    informations with no intervening arrest (both offenses predate the 2016-02-01 arrest) and
    the same sentencing day, so they are one single sentence. Only one may serve as a predicate
    (App. Note 3). CR-2025-1130 does not count: §4B1.2(c) requires that the instant offense be
    committed after "sustaining" the convictions, and "sustained" means when guilt was
    established (2025-09-15), which is after 2025-08-02. CR-2011-0612 (CSO) is outside the
    10-year period, so 0 points and not counted. CR-2014-0861 (burglary of a dwelling) is not a
    CoV. CR-2019-0777 (simple possession) is not a CSO. GCMO larceny is neither.
23. `career_offender` = false (chain). Only 1 predicate. Each of the four misconceptions
    (counting both 2016 cases, counting the 2025 case, counting the stale 2011 case, treating
    burglary as a CoV) would make him a career offender.

### Pruitt (§846 conspiracy; joined 2024-03-01; indictment alleges June 2022)

24. `points.JV-17-0412` = 0 (nuance, second tier; chain). Under §4A1.2 App. Note 8, the
    "commencement of the instant offense" includes relevant conduct. Under §1B1.3 App. Note 3(B),
    a defendant's relevant conduct does not include conspirators' conduct before he joined. So
    commencement is 2024-03-01, and the 5-year period of (d)(2) begins 2019-03-01. Release from
    DYS on 2018-08-30 falls outside it, and the 2017 disposition is too old for (d)(2)(B). Using
    the indictment's June 2022 date gives 2, and the category becomes V.
25. `points.JV-18-1175` = 2 (nuance, second tier). Juvenile probation revoked, then 120 days of
    commitment (§4A1.2(k)(1)). Under (k)(2)(B), for a confinement sentence for an offense before
    age 18, the period runs from the last release from confinement (2019-06-01). That is within
    5 years of 2024-03-01, so (d)(2)(A) gives 2. Measuring from the disposition (2018-10-20) or
    the revocation (2019-02-01) gives 0.
26. `points.JV-19-0688` = 0 (nuance). §4A1.2(f): "diversion from juvenile court is not counted,"
    even though he admitted the allegations. Without this rule, (d)(2)(B) would give 1, because
    the disposition was imposed 2019-05-14, within 5 years.
27. `points.CR-2019-1630` = 2 (nuance). The offense was at age 17 and he was convicted as an
    adult. The sentence of imprisonment is the 12 unsuspended months (§4A1.2(b)(2)), which is
    not over 13 months, so (d)(1) does not apply. Under (d)(2)(A), 12 months is at least 60 days
    and the release (2020-07-21) is within 5 years, so 2. Counting the 5-year imposed term gives 3.
28. `e` = 1 (nuance). (a)-(d) = 8 ≥ 7. The probation in CR-2019-1630 would have expired
    2022-07-21. But a violation warrant issued 2022-06-10 was outstanding throughout the
    instant offense, and §4A1.2(m) deems him under a criminal justice sentence. His other
    supervision had ended by 2023-06-13.
29. `category_part_a` = IV (chain). JV-18-1175 2 + CR-2019-1630 2 + CR-2021-0870 2 (90 days) +
    M-21-5521 1 (trespass is (c)(1), but 18 months' probation is more than one year) + M-22-3049 1
    (deferred judgment after a guilty plea in open court is a (f) diversionary disposition
    counted under (c)) = 8, plus e 1 = 9, so IV.
30. `career_offender` = true (nuance; chain). The instant §846 conspiracy is a CSO by
    §4B1.2(d), which includes inchoate offenses in the guideline text since 2023 and so ends the
    commentary-deference split. He was 22. Predicates: CR-2019-1630, robbery (enumerated, and
    the force clause) committed at 17. It is an adult conviction under §4B1.2(e)(4) because
    Franklin classifies it as one (direct file, convicted as an adult), and it receives 2 points.
    CR-2021-0870 is PWID, punishable by more than 1 year, and gets 2 points. They are separated
    by an intervening arrest. So the final category is VI.

### Kessler (fentanyl distribution; commencement 2023-10-01)

31. `points.M-15-1388` = 1 (nuance). Both 2015 misdemeanors were sentenced at one hearing, with
    the 30 days consecutive to the 45. But Kessler was arrested for M-15-0904 (2015-03-02) before
    committing M-15-1388 (2015-04-10). Under §4A1.2(a)(2), sentences separated by an intervening
    arrest "always are counted separately," so 45 days gives 1 and 30 days gives 1. Aggregating
    them (75 days gives 2 on M-15-0904) is the error.
32. `points.CR-2016-1588` = 2 (nuance). §4A1.2 App. Note 2: probation counts under (c) "unless a
    condition of probation requiring imprisonment of at least sixty days was imposed." Here the
    condition was 90 days, so (b) 2.
33. `points.M-21-02904` = 0 (nuance, second tier). App. Note 4: "$300 fine or 30 days" is an
    alternative sentence, treated as non-imprisonment. Disturbing the peace is (c)(1), and with
    no 30-day imprisonment and no probation it is not counted. Treating it as 30 days gives 1.
34. `points.MC-20-0418` = 1 (nuance, second tier). App. Note 12(B): local ordinance violations
    that are also violations of state criminal law are not excluded by (c)(2). Ordinance
    shoplifting that duplicates state theft is counted under (c) like a state conviction
    (fine only, 1 point).
35. `points.M-21-3302` = 1 (nuance, second tier). App. Note 12(C): the (c)(1) "insufficient funds
    check" does not include a conviction establishing use of a non-existent account. So the
    conviction is not a listed offense, and the 12 months' probation counts 1. Treating it as
    listed gives 0, because the probation is not more than one year.
36. `e` = 0 (nuance; chain). (c) points total 8 before the cap (M-15-0904, M-15-1388,
    CR-2018-0711 [totally suspended, so (c) under §4A1.2(a)(3)], M-19-05530 [prostitution is
    (c)(1), but 45 days is at least 30], MC-20-0418, M-21-3302, M-22-2260, and M-23-6127
    [sentenced after commencement, App. Note 1]). The cap of 4 applies. (a)-(d) = 2 + 4 = 6 < 7,
    so no status point even though she was on probation (M-22-2260) during the offense.
    CR-2006-0517 is stale (released 2007).
37. `category_part_a` = III (chain). Total 6. Using the uncapped count for the 7-point test, or
    aggregating the 2015 sentences, gives IV.

### Ochoa (meth distribution; commencement 2025-04-10; 15-yr line 2010-04-10)

38. `points.CR-2007-1145` = 3 (routine). Imposed 2008 and first paroled 2009-12-15, both before
    the 15-year line. But parole was revoked, and he was incarcerated until 2011-12-30. Under
    §4A1.2(e)(1) a sentence over 13 months counts if it "resulted in the defendant being
    incarcerated during any part of such fifteen-year period"; under (k)(2)(A) the period runs
    from the date of last release. So 3.
39. `points.CR-2024-2210` = 1 (nuance). Sentenced 2025-06-30, after commencement, to probation.
    It is a prior sentence under App. Note 1, and not relevant conduct per the PSR and the
    parties. (c) 1.
40. `e` = 0 (nuance, second tier). (a)-(d) = 9 ≥ 7. But on 2025-04-10 Ochoa's only sentence was
    the game-violation probation, and §4A1.1 App. Note 5 defines a "criminal justice sentence"
    as "a sentence countable under §4A1.2." A (c)(2) fish-and-game sentence is never countable.
    Pre-sentence bond in CR-2024-2210 is not a sentence. So 0.
41. `category_part_a` = IV (chain). 3 + 3 (CR-2018-0399, 18 months) + 1 (M-21-1903, trespass
    with 18 months' probation) + 1 (M-22-0716, 30 days) + 1 = 9, so IV. A wrong status point
    gives 10 and V; missing item 38 gives III.
42. `career_offender` = true (nuance; chain). The instant offense is a CSO, and he is an adult.
    Predicates: CR-2007-1145 (aggravated assault, CoV, counted per item 38) and CR-2024-2210
    (PWID cocaine, maximum 8 years, a CSO). For CR-2024-2210, guilt was established 2025-03-20,
    before the 2025-04-10 offense, so it was "sustained" before the offense under §4B1.2(c)
    even though the sentence came later, and it receives a point. CR-2018-0399 (burglary of a
    dwelling) is not a CoV. Both errors (stale 2007, or requiring the sentence to precede the
    offense) give false.

### Halloran (wire fraud; commencement 2023-02-01) and Vance

43. `halloran.total` = 0 (nuance; chain). ON-21-4471, a Canadian impaired-driving case, is a
    foreign sentence and never counted under §4A1.2(h). The "always counted" rule of App. Note 5
    lifts only the (c)(1)/(c)(2) exclusions, not (h). Also excluded: CR-99-0311 (released 2003,
    outside 15 years); JV-81-0102 (juvenile, 1981); M-18-1120 (disorderly conduct, fine only,
    (c)(1)); CR-19-0457 (deferred prosecution without a plea or finding, (f)); ASH-20-0711
    (ordinance with no state counterpart, (c)(2)); M-22-0815 (public intoxication, (c)(2));
    TR-22-5521 (speeding, (c)(2)).
44. `halloran.zero_point_eligible` = true (nuance; chain). She has 0 points and none of the
    eleven §4C1.1(a) disqualifiers. The PSR finds no substantial financial hardship ((a)(6)). The
    §3B1.3 abuse-of-trust adjustment is not one of the listed disqualifiers; (a)(10) names only
    §3B1.1.
45. `vance.zero_point_eligible` = false (nuance). He has 0 points, but he received a §3B1.1(c)
    aggravating-role adjustment. Since amendment 831 (Nov. 1, 2024), §4C1.1(a)(10) (no §3B1.1
    adjustment) and (a)(11) (not engaged in a CCE) are separate criteria, so either one
    disqualifies. Under the earlier text, "did not receive an adjustment under §3B1.1 and was
    not engaged in a continuing criminal enterprise," some read the clause to disqualify only a
    defendant who had both.

## Notes on certainty

- All items rest on the 2025 Manual's text and commentary, on statutes, or on Supreme Court
  holdings. No circuit split is outcome-determinative. Known splits were designed around:
  non-jury juvenile adjudications for ACCA (the adjudication followed a jury trial);
  inchoate CSOs (now in guideline text, §4B1.2(d)); and the old §4C1.1(a)(10) reading
  (amended text).
- The legal character of each Franklin statute is given in its elements in the abstracts:
  force sufficient to overcome resistance, intentional serious bodily injury, a building or
  dwelling, the statutory maximum, and the absence of a recidivist enhancement.
- Items 2, 13, 24, 25, 33-35 and 40 test second-tier commentary or subsection provisos.
  Items 6, 10, 15, 16, 23, 29, 30, 37, 41-44 are chained deliverables.
- Flawed-answer checks: `DISABLE_RULE=<rule>` in solve.py switches each rule to its common
  misconception. Every one of the 33 rules lowers the score, and each fails exactly the items
  this audit attributes to it.

## Graded subset and wording fixes (calibration, Oct. 12, 2026)

verify.py now scores the 8 items listed in expected.json `"graded"`, chosen from items Sonnet 5.5
missed at least once across eight calibration runs (five before and three after the wording fixes
below). Items that became reliable once the wording was fixed (whitfield.d, ferro.e) are no longer
graded. An independent re-check against the 2025 Chapter Four text and
Amendment 709 confirmed all 11 keys (Amendment 709 deleted the old "did not arise from the same
occasion" limit, which settles the whitfield.d doubt above). Two wording fixes followed the review:
the `d`/`e` definitions now gloss the 2025 lettering (two runs had the right points under the
pre-Amendment 821 letters), and `career_offender_predicates` now says to tally predicates the way the
guidelines tally them, so the literal "can be counted" reading no longer gives a second answer.
