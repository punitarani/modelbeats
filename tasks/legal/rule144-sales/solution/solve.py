#!/usr/bin/env python3
"""Reference solver for the rule144-sales task (iteration 3: law not supplied to the agent).

The facts of /app/materials (issuer files and position files) are transcribed below as data. The
solver applies Rule 144, Rule 145(c)/(d), Rule 701(g)(3), Securities Act Section 4(e) and the SEC
staff C&DIs to compute the deliverable. Volume figures are computed from the CSVs in /app/materials.

Set RULE_OFF=<name>[,<name>...] to disable one rule (used to check the grader detects each rule).
"""
import csv
import datetime as dt
import json
import math
import os
from pathlib import Path

APP_DIR = Path(os.environ.get("APP_DIR", "/app"))
OUT = Path(os.environ.get("OUT_PATH", APP_DIR / "output" / "rule144_analysis.json"))
RULE_OFF = set(filter(None, os.environ.get("RULE_OFF", "").split(",")))


def on(rule):
    return rule not in RULE_OFF


D = dt.date.fromisoformat
SALE = D("2026-10-21")


def add_months(d, n):
    y, m = divmod(d.month - 1 + n, 12)
    y += d.year
    m += 1
    last = [31, 29 if (y % 4 == 0 and (y % 100 != 0 or y % 400 == 0)) else 28, 31, 30, 31, 30,
            31, 31, 30, 31, 30, 31][m - 1]
    return dt.date(y, m, min(d.day, last))


# ---------------------------------------------------------------------------------------------
# Issuers
# ---------------------------------------------------------------------------------------------
# subject_since: date the issuer became subject to Section 13/15(d) (C&DI 131.03: S-1 effectiveness),
# None if not subject (a voluntary filer is not "subject to": C&DIs 131.07, 132.09).
# form10_date: for an issuer that was ever a shell, the date it filed Form 10 information (144(i)).
ISSUERS = {
    "VRNB": dict(subject_since=D("2021-06-17"), current=True, ever_shell=False, voluntary=False,
                 price=12.40, quoted_only_otc=False),
    "SLVN": dict(subject_since=D("2026-08-03"), current=True, ever_shell=False, voluntary=False,
                 price=31.00, quoted_only_otc=False),
    "NGFT": dict(subject_since=D("2023-01-01"), current=True, ever_shell=True, voluntary=False,
                 form10_date=D("2025-12-16"), price=8.75, quoted_only_otc=False),
    "KSTM": dict(subject_since=D("2015-01-01"), current=True, ever_shell=False, voluntary=False,
                 price=9.10, quoted_only_otc=True),
    "BRSA": dict(subject_since=None, current=True, ever_shell=False, voluntary=True,
                 price=14.20, quoted_only_otc=True),
}


def reporting_90(iss):
    """Issuer is, and has been for at least 90 days, subject to Section 13 or 15(d)."""
    i = ISSUERS[iss]
    if i["voluntary"] and not on("voluntary_filer_not_subject"):
        return True  # wrong reading: voluntary filing counts
    s = i["subject_since"]
    if s is None:
        return False
    if not on("ninety_day_test"):
        return True
    return (SALE - s).days >= 90


# ---------------------------------------------------------------------------------------------
# Volume limitation, Rule 144(e)(1)
# ---------------------------------------------------------------------------------------------
def four_week_window():
    """C&DI 133.06: the four calendar weeks preceding the week in which Form 144 is transmitted."""
    if not on("calendar_weeks"):
        return None
    week_start = SALE - dt.timedelta(days=(SALE.weekday() + 1) % 7)  # Sunday of the filing week
    return week_start - dt.timedelta(weeks=4), week_start


def avg_weekly(path, col, adjust=None):
    rows = list(csv.DictReader(open(path)))
    vols = []
    for r in rows:
        d = D(r["date"])
        v = int(r[col])
        if adjust:
            v = adjust(r, v)
        vols.append((d, v))
    win = four_week_window()
    if win is None:  # wrong reading: last 20 trading days before the sale
        days = [x for x in vols if x[0] < SALE][-20:]
    else:
        days = [x for x in vols if win[0] <= x[0] < win[1]]
    return sum(v for _, v in days) / 4.0


def vrnb_volume_limit():
    # 1%: most recent report or statement published by the issuer. Both candidate share counts are
    # computed; the weekly average exceeds either, so the choice does not affect the result.
    one_pct = max(50_765_412, 52_565_412) / 100.0

    def adj(r, v):
        # C&DI 133.05: the issuer's public offering is excluded from the computation.
        if on("exclude_offering") and r["date"] == "2026-09-30":
            v -= 1_800_000
        # C&DI 533.08: only reported volume counts (the unreported Oct. 6 block is not in the data).
        if not on("reported_only") and r["date"] == "2026-10-06":
            v += 150_000
        return v

    avg = avg_weekly(APP_DIR / "materials/market/vrnb_daily_volume.csv", "consolidated_volume", adj)
    return math.floor(max(one_pct, avg))


def kstm_volume_limit():
    # Most recent report or statement published by the issuer: the Sept. 15, 2026 8-K (post-split).
    shares_out = 18_640_000 if on("latest_statement") else 9_320_000
    one_pct = shares_out / 100.0
    if ISSUERS["KSTM"]["quoted_only_otc"] and on("otc_no_market_test"):
        # C&DI 133.02: OTC Link is not an "automated quotation system"; no market-based test.
        return math.floor(one_pct)

    def adj(r, v):
        # C&DI 133.03: give effect to the split throughout the period.
        if on("split_adjust") and "pre-split" in (r.get("note") or ""):
            v *= 2
        return v

    avg = avg_weekly(APP_DIR / "materials/market/kstm_daily_volume_otcqx.csv", "otcqx_volume", adj)
    return math.floor(max(one_pct, avg))


# ---------------------------------------------------------------------------------------------
# Lots: each lot is (shares, restricted, hp_start, extra). hp_start None = no holding period applies.
# The constructors below encode how the holding period / restricted status is determined.
# ---------------------------------------------------------------------------------------------
def lot(shares, restricted, hp_start=None, **extra):
    return dict(shares=shares, restricted=restricted, hp_start=hp_start, **extra)


def open_market(n):
    return lot(n, False)


def registered(n):
    return lot(n, False)


def from_issuer(n, paid):
    return lot(n, True, paid)


def subscription(n, signed_paid, accepted, issued):
    # C&DI 132.07: holding period starts when the issuer accepts the subscription (price paid in full).
    return lot(n, True, accepted if on("subscription_acceptance") else signed_paid)


def note_lots_qualifying(n, purchase_date, paid_off):
    # Rule 144(d)(2); C&DI 532.18: full recourse, secured by other property worth >= the price, paid
    # off before the sale -> the note is full payment and the holding period starts at purchase.
    return [lot(n, True, purchase_date if on("note_other_collateral") else paid_off)]


def note_lots_nonqualifying(n, payments):
    # C&DI 532.09: a non-qualifying note is not payment; the holding period runs from each payment,
    # pro rata to the shares paid for.
    if not on("partial_payment"):
        return [lot(n, True, payments[0][0])]
    return [lot(round(n * frac), True, d) for d, frac in payments]


def net_exercise(n, warrant_acquired, exercised):
    # Rule 144(d)(3)(x): cashless exercise tacks to the warrant.
    return lot(n, True, warrant_acquired if on("cashless_tack") else exercised)


def cash_exercise(n, warrant_acquired, exercised):
    # C&DI 132.13: even a de minimis cash payment defeats tacking.
    return lot(n, True, exercised if on("deminimis_cash") else warrant_acquired)


def employee_option(n, granted, exercised, rule701=False):
    # C&DI 132.11; Note 2 to Rule 144(d)(3)(x): starts on exercise and full payment, even if net.
    return lot(n, True, exercised if on("option_exercise_start") else granted, rule701=rule701)


def rsa_agreement(n, agreement, vested):
    # C&DI 532.06: full-value award vesting only on continued service -> date of the agreement.
    return lot(n, True, agreement if on("rsa_agreement_date") else vested)


def gift_from_affiliate(n, donor_start, gift_date):
    # Rule 144(d)(3)(v); C&DI 132.16 (non-affiliate donee: (b)(1) only).
    return lot(n, True, donor_start if on("gift_tack") else gift_date, from_affiliate_transfer=True)


def pledge(n, pledgor_restricted, pledgor_start, pledge_date, recourse):
    if not pledgor_restricted:
        # C&DI 532.01: open-market shares pledged by an affiliate are restricted in the pledgee's
        # hands but subject to no holding period.
        return lot(n, True, None if on("pledge_open_market") else pledge_date, from_affiliate_transfer=True)
    # Rule 144(d)(3)(iv); C&DI 530.02: without recourse -> acquired at the time of the pledge.
    if recourse or not on("nonrecourse_pledge"):
        return lot(n, True, pledgor_start, from_affiliate_transfer=True)
    return lot(n, True, pledge_date, from_affiliate_transfer=True)


def pro_rata_distribution(n, entity_start, dist_date):
    # C&DIs 132.02, 532.05: ratable in-kind distribution without consideration tacks.
    return lot(n, True, entity_start if on("distribution_tack") else dist_date, from_affiliate_transfer=True)


def bonus_from_affiliate(n, entity_start, transfer_date):
    # C&DI 532.11: compensatory transfer, no tacking.
    return lot(n, True, transfer_date if on("bonus_no_tack") else entity_start)


def purchase_from_affiliate_spouse(n, date):
    # Rule 144(a)(2)(i); C&DI 129.02: same-household spouse = the affiliate; private purchase restricted.
    if not on("spouse_same_person"):
        return lot(n, False)
    return lot(n, True, date)


def purchase_4a7(n, seller_start, purchase_date):
    # Securities Act 4(e)(1)(C): restricted. Holding period runs from the last acquisition from the
    # issuer or an affiliate; the seller was a non-affiliate, so it tacks.
    return lot(n, True, seller_start if on("tack_4a7") else purchase_date)


def estate_decedent(n, decedent_start, estate_affiliate):
    # Rule 144(d)(3)(vii): no holding period for a non-affiliate estate.
    if not estate_affiliate and on("estate_no_hp"):
        return lot(n, True, None)
    return lot(n, True, decedent_start)


def estate_option(n, exercised):
    # C&DI 132.04: (d)(3)(vii) covers only securities owned by the decedent.
    return lot(n, True, exercised if on("estate_option_hp") else None)


def conversion(n, preferred_bought):
    # Rule 144(d)(3)(ii): conversion solely for securities of the same issuer tacks.
    return lot(n, True, preferred_bought)


def s4_merger(n, party_affiliate):
    # Rule 145(c): only parties (and their affiliates) to a shell-company transaction are deemed
    # underwriters; others hold registered, unrestricted shares.
    return lot(n, False, None, deemed_underwriter=party_affiliate or not on("r145c_parties_only"))


# ---------------------------------------------------------------------------------------------
# Eligibility
# ---------------------------------------------------------------------------------------------
def lot_ok(issuer, l, affiliate):
    i = ISSUERS[issuer]
    if not l["restricted"] and not affiliate and not l.get("deemed_underwriter"):
        return True  # outside Rule 144 altogether
    if l.get("deemed_underwriter"):
        # Rule 145(d) would require 144(i)(2) satisfied (one year after Form 10 information).
        return i.get("form10_date") is not None and add_months(i["form10_date"], 12) <= SALE
    if i["ever_shell"] and on("shell_144i"):
        # Rule 144(i)(1)(ii), (i)(2); C&DI 137.01.
        if not (i["current"] and add_months(i["form10_date"], 12) <= SALE):
            return False
    if not l["restricted"]:
        return True
    if l.get("rule701") and not affiliate:
        sub = i["subject_since"]
        if sub is not None and (sub + dt.timedelta(days=90) <= SALE or not on("r701_wait_90")):
            return True  # Rule 701(g)(3): no (c) or (d) for non-affiliates
    start = l["hp_start"]
    if start is None:
        return True
    if on("one_year_unless_reporting_90"):
        months = 6 if reporting_90(issuer) else 12  # C&DI 132.14: tested at the time of sale
    else:
        months = 6 if (i["subject_since"] is not None or i["voluntary"]) else 12
    return add_months(start, months) <= SALE


def current_info_ok(issuer):
    """Rule 144(c): (c)(1) for issuers subject >= 90 days; (c)(2) only for issuers not subject."""
    i = ISSUERS[issuer]
    if reporting_90(issuer):
        return i["current"]
    if i["subject_since"] is None:
        return True  # (c)(2) information assumed publicly available (OTCQX disclosure)
    return not on("affiliate_needs_90_days")


def sold_in_window(sales, split_events=()):
    """Sales within the three months ending on the Sale Date that count toward 144(e)."""
    start = add_months(SALE, -3)
    total = 0
    for s in sales:
        if s["date"] < start:
            continue
        if s.get("private_to_issuer") and on("repurchase_excluded"):
            continue  # Rule 144(e)(3)(vii)(C); C&DI 133.07
        if s.get("tenb51") and not on("tenb51_counts"):
            continue
        if s.get("spouse") and not on("spouse_aggregated"):
            continue
        if s.get("concert_other") and not on("concert"):
            continue
        n = s["shares"]
        if s.get("pre_split") and on("split_adjust"):
            n *= 2  # C&DI 133.03
        total += n
    return total


def evaluate(p, limits):
    issuer, affiliate = p["issuer"], p["affiliate"]
    eligible = sum(l["shares"] for l in p["lots"] if lot_ok(issuer, l, affiliate))
    if affiliate:
        if not current_info_ok(issuer):
            eligible = 0
        if eligible > 0:
            # Only VRNB and KSTM affiliates can sell in the correct analysis; a missing limit can arise
            # only in an ablation run, where the volume cap is then ignored.
            room = max(0, limits.get(issuer, float("inf")) - sold_in_window(p.get("sales", [])))
            eligible = min(eligible, room)
    amt = min(p["proposed"], eligible)
    form = False
    if amt > 0:
        filer = affiliate or (not on("nonaffiliate_no_form144") and p.get("from_affiliate"))
        own_amt = amt
        if p.get("sales") and not on("deminimis_per_seller"):
            own_amt += sold_in_window(p["sales"])
        elif p.get("sales"):
            own_amt += sold_in_window([s for s in p["sales"] if not s.get("concert_other")])
        price = ISSUERS[issuer]["price"]
        form = bool(filer and (own_amt > 5000 or own_amt * price > 50000))
    return eligible, form


# ---------------------------------------------------------------------------------------------
# Positions (transcribed from /app/materials/positions)
# ---------------------------------------------------------------------------------------------
def positions():
    P = {}
    okafor_sales = [
        dict(date=D("2026-07-02"), shares=25_000),
        dict(date=D("2026-08-10"), shares=40_000, tenb51=True),
        dict(date=D("2026-08-20"), shares=60_000, private_to_issuer=True),
        dict(date=D("2026-09-01"), shares=30_000, spouse=True),
        dict(date=D("2026-09-10"), shares=40_000, tenb51=True),
    ]
    P["P01"] = dict(issuer="VRNB", affiliate=True, proposed=300_000, sales=okafor_sales,
                    lots=[from_issuer(545_000, D("2017-02-14")), open_market(50_000)])
    P["P02"] = dict(issuer="VRNB", affiliate=False, proposed=600_000, from_affiliate=True,
                    lots=[gift_from_affiliate(600_000, D("2017-02-14"), D("2026-09-18"))])
    P["P03"] = dict(issuer="VRNB", affiliate=False, proposed=50_000,
                    lots=[purchase_from_affiliate_spouse(50_000, D("2026-07-01"))])
    P["P04"] = dict(issuer="VRNB", affiliate=False, proposed=400_000, from_affiliate=True,
                    lots=[pledge(300_000, True, D("2017-02-14"), D("2026-06-01"), recourse=False),
                          pledge(100_000, False, None, D("2026-06-01"), recourse=False)])
    P["P05"] = dict(issuer="VRNB", affiliate=False, proposed=3_000, from_affiliate=True,
                    lots=[estate_decedent(40_000, D("2026-06-01"), estate_affiliate=False),
                          estate_option(25_000, D("2026-09-15"))])
    P["P06"] = dict(issuer="VRNB", affiliate=False, proposed=80_000,
                    lots=[purchase_4a7(80_000, D("2025-02-10"), D("2026-09-01"))])
    P["P07"] = dict(issuer="VRNB", affiliate=False, proposed=45_000,
                    lots=[employee_option(15_000, D("2024-03-01"), D("2026-08-03")),
                          rsa_agreement(30_000, D("2025-11-03"), D("2026-09-01"))])
    P["P08"] = dict(issuer="VRNB", affiliate=False, proposed=825_000,
                    lots=[from_issuer(600_000, D("2025-03-03")),
                          net_exercise(125_000, D("2025-03-03"), D("2026-09-08")),
                          cash_exercise(100_000, D("2025-03-03"), D("2026-09-08"))])
    P["P09"] = dict(issuer="VRNB", affiliate=False, proposed=60_000,
                    lots=note_lots_qualifying(40_000, D("2025-12-01"), D("2026-10-01"))
                    + note_lots_nonqualifying(20_000, [(D("2026-03-02"), 0.5), (D("2026-08-03"), 0.5)]))
    P["P10"] = dict(issuer="VRNB", affiliate=False, proposed=70_000, from_affiliate=True,
                    lots=[pro_rata_distribution(70_000, D("2026-01-15"), D("2026-09-10"))])
    P["P11"] = dict(issuer="VRNB", affiliate=False, proposed=5_000,
                    lots=[bonus_from_affiliate(5_000, D("2026-01-15"), D("2026-09-10"))])
    P["P12"] = dict(issuer="VRNB", affiliate=False, proposed=120_000,
                    lots=[subscription(120_000, D("2026-04-10"), D("2026-04-24"), D("2026-05-05"))])
    P["P13"] = dict(issuer="SLVN", affiliate=False, proposed=32_000,
                    lots=[employee_option(20_000, D("2021-06-01"), D("2025-09-15"), rule701=True),
                          employee_option(12_000, D("2021-06-01"), D("2026-02-20"), rule701=True)])
    P["P14"] = dict(issuer="SLVN", affiliate=True, proposed=10_000, sales=[],
                    lots=[employee_option(30_000, D("2021-06-01"), D("2023-06-12"), rule701=True),
                          registered(5_000)])
    P["P15"] = dict(issuer="SLVN", affiliate=False, proposed=550_000,
                    lots=[conversion(400_000, D("2021-05-03")), conversion(150_000, D("2025-12-01"))])
    P["P16"] = dict(issuer="NGFT", affiliate=False, proposed=600_000,
                    lots=[from_issuer(500_000, D("2025-12-10")), open_market(100_000)])
    P["P17"] = dict(issuer="NGFT", affiliate=False, proposed=50_000,
                    lots=[s4_merger(40_000, party_affiliate=False), from_issuer(10_000, D("2025-12-10"))])
    hale_sales = [dict(date=D("2026-07-15"), shares=10_000, pre_split=True),
                  dict(date=D("2026-08-12"), shares=20_000, pre_split=True),
                  dict(date=D("2026-09-28"), shares=30_000)]
    P["P18"] = dict(issuer="KSTM", affiliate=True, proposed=50_000, sales=hale_sales,
                    lots=[from_issuer(400_000, D("2019-06-01"))])  # split shares tack (144(d)(3)(i))
    cole_sales = [dict(s, concert_other=True) for s in hale_sales if s["date"] >= D("2026-08-01")]
    P["P19"] = dict(issuer="KSTM", affiliate=True, proposed=2_000, sales=cole_sales,
                    lots=[from_issuer(300_000, D("2018-06-01"))])
    P["P20"] = dict(issuer="BRSA", affiliate=False, proposed=100_000,
                    lots=[from_issuer(40_000, D("2025-08-01")), from_issuer(60_000, D("2026-02-02"))])
    return P


def main():
    limits = {"VRNB": vrnb_volume_limit(), "KSTM": kstm_volume_limit()}
    out = {"volume_limits": dict(limits), "positions": {}}
    for pid, p in sorted(positions().items()):
        mx, form = evaluate(p, limits)
        out["positions"][pid] = {"max_shares_sellable_now": int(mx), "form_144_required": form}
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, indent=2) + "\n")
    print(json.dumps(out))


if __name__ == "__main__":
    main()
