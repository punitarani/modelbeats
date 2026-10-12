#!/usr/bin/env python3
"""Reference solver for the judgment-interest task.

Rules encoded (each verified in tests/AUDIT.md):
  Federal: 28 U.S.C. 1961(a)-(b) -- rate = H.15 weekly average 1-yr CMT for the calendar week
    PRECEDING the date of judgment (the week ending the Friday before the judgment's Sun-Sat week),
    computed daily from entry, compounded annually; applies in diversity cases; runs on the whole
    judgment incl. prejudgment interest. A contract rate displaces 1961 only by clear, unambiguous,
    unequivocal language (Westinghouse Credit v. D'Urso; FCS Advisors v. Fair Finance, 2d Cir.).
    FRAP 37(a): affirmed judgment -> interest from the district court's entry date.
    Partial payments: United States Rule (Story v. Livingston) -- accrued interest first.
  New York: CPLR 5001 (each item from date incurred), 5002 (decision/verdict -> entry on the total
    sum INCLUDING interest to decision), 5003, 5004 (9%; 2% for consumer debt with a natural-person
    defendant, judgments entered on/after 4/30/2022). Contract rate "until paid" governs until merger
    in judgment (NML Capital v. Argentina, 17 N.Y.3d 250). Bifurcated PI trial: CPLR 5002 interest from
    the LIABILITY verdict (Love v. State, 78 N.Y.2d 540).
  California: Civ. Code 3289(a) stipulated rate continues after breach until superseded by judgment
    (3289(b) 10% only if no stipulated rate); CCP 685.010(a)(1) 10% simple on principal amount of
    judgment (CCP 680.300: total amount as entered); 685.010(a)(2) 5% for natural-person debtor,
    personal debt < $50,000, judgments entered on/after 1/1/2023; CCP 695.220 payments to accrued
    interest first. Civ. Code 3291: 10% from the date of the FIRST 998 offer EXCEEDED by the judgment,
    not on punitive damages (Lakin v. Watkins, 6 Cal.4th 644).
  Texas: Fin. Code 304.003 (rate = prime on the 15th of the month preceding the month of rendition;
    floor 5%, cap 15%), 304.002 (contract providing for interest: lesser of contract rate or 18%),
    304.005, 304.006 (compounds annually), 304.103 (PJI rate = postjudgment rate), 304.104 (earlier of
    180th day after receipt of written notice or suit filed; ends day before rendition; simple),
    304.1045 (no PJI on future damages), 304.105(b)/304.106 (written offer: no PJI on offer amount
    while it may be accepted), CPRC 41.007 (no PJI on exemplary damages); Battaglia/Brainard
    declining-principal formula (settlement credited first to accrued PJI, then principal).
  Florida: 55.03(1),(3) -- rate fixed at the quarterly CFO rate when judgment obtained, adjusted each
    January 1 to the rate then in effect; Quality Engineered v. Higley South (fee interest from the
    date entitlement is fixed).
  Massachusetts: G.L. c. 231 s. 6B -- 12% from commencement of the action (state-court filing);
    post-judgment in federal court under 1961.
Conventions pinned by the instruction: 365-day year; interest for [start, end) = end - start days;
payments applied as of their date; annual compounding on anniversaries of the accrual start; no
intermediate rounding; payoff date 2026-11-16 (interest through 2026-11-15).
"""
from __future__ import annotations

import json
import os
from datetime import date, timedelta

APP_DIR = os.environ.get("APP_DIR", "/app")
OUT = os.path.join(APP_DIR, "output", "payoffs.json")
# Set FLAW=<name> to switch one rule off (used only to test the grader).
FLAW = os.environ.get("FLAW", "")

PAYOFF = date(2026, 11, 16)
D = date.fromisoformat

# ---------------------------------------------------------------- published data (rate_data/)
H15_WEEKLY = {}   # week-ending Friday -> 1-yr CMT weekly average (%)
_here = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(_here, "h15_weekly.csv")) as f:
    next(f)
    for line in f:
        d, v = line.strip().split(",")
        H15_WEEKLY[D(d)] = float(v)

PRIME_CHANGES = [  # Federal Reserve H.15 bank prime loan rate, effective date -> rate (%)
    ("2022-03-17", 3.50), ("2022-05-05", 4.00), ("2022-06-16", 4.75), ("2022-07-28", 5.50),
    ("2022-09-22", 6.25), ("2022-11-03", 7.00), ("2022-12-15", 7.50), ("2023-02-02", 7.75),
    ("2023-03-23", 8.00), ("2023-05-04", 8.25), ("2023-07-27", 8.50), ("2024-09-19", 8.00),
    ("2024-11-08", 7.75), ("2024-12-20", 7.50), ("2025-09-17", 7.25), ("2025-10-30", 7.00),
    ("2025-12-11", 6.75)]

FL_CFO = [  # Florida CFO judgment interest rate, effective date -> rate (%)
    ("2022-01-01", 4.25), ("2022-04-01", 4.25), ("2022-07-01", 4.34), ("2022-10-01", 4.75),
    ("2023-01-01", 5.52), ("2023-04-01", 6.58), ("2023-07-01", 7.69), ("2023-10-01", 8.54),
    ("2024-01-01", 9.09), ("2024-04-01", 9.34), ("2024-07-01", 9.46), ("2024-10-01", 9.50),
    ("2025-01-01", 9.38), ("2025-04-01", 9.15), ("2025-07-01", 8.90), ("2025-10-01", 8.65),
    ("2026-01-01", 8.44), ("2026-04-01", 8.25), ("2026-07-01", 8.06), ("2026-10-01", 7.87)]


def step_rate(table, on):
    r = None
    for d, v in table:
        if D(d) <= on:
            r = v
    return r


def fed_1961_rate(judgment):
    """Weekly average for the calendar week (Sun-Sat) preceding the judgment date's week."""
    if FLAW == "fed_week":                      # wrong: the week that contains the judgment date
        fri = judgment + timedelta(days=(4 - judgment.weekday()) % 7)
        return H15_WEEKLY[fri] / 100
    sunday = judgment - timedelta(days=(judgment.weekday() + 1) % 7)   # start of judgment's week
    fri = sunday - timedelta(days=2)                                   # Friday of preceding week
    return H15_WEEKLY[fri] / 100


def texas_postjudgment_rate(rendered):
    """304.003(b)-(c): prime on the 15th of the preceding month, floored at 5%, capped at 15%."""
    if FLAW == "tx_prime_on_date":
        p = step_rate(PRIME_CHANGES, rendered)
    else:
        first = rendered.replace(day=1)
        prev15 = (first - timedelta(days=1)).replace(day=15)
        p = step_rate(PRIME_CHANGES, prev15)
    return min(max(p, 5.0), 15.0) / 100


def days(a, b):
    return (b - a).days


def simple(p, r, a, b):
    return p * r * days(a, b) / 365


def run_balance(principal, rate_fn, start, end, payments=(), compound=False, rate_change_dates=()):
    """Accrue interest on a principal from start to end (end excluded).
    rate_fn(day) -> annual rate in force on that day (piecewise constant between event dates).
    payments: (date, amount) applied first to accrued unpaid interest, then principal (US Rule /
    CCP 695.220 / Battaglia). compound: capitalise accrued interest on each anniversary of start.
    Returns dict(total_interest, principal, accrued_unpaid, paid)."""
    events = [(D(d) if isinstance(d, str) else d, "pay", amt) for d, amt in payments]
    if compound:
        y = 1
        while True:
            try:
                ann = start.replace(year=start.year + y)
            except ValueError:                      # Feb 29 start
                ann = start.replace(year=start.year + y, day=28) + timedelta(days=1)
            if ann >= end:
                break
            events.append((ann, "cap", 0))
            y += 1
    for d in rate_change_dates:
        if start < d < end:
            events.append((d, "rate", 0))
    events.sort(key=lambda e: (e[0], {"rate": 0, "cap": 1, "pay": 2}[e[1]]))
    P, acc, tot, cur, paid = principal, 0.0, 0.0, start, 0.0
    for d, kind, amt in events:
        if not (start <= d <= end):
            continue
        i = P * rate_fn(cur) * days(cur, d) / 365
        acc += i
        tot += i
        cur = d
        if kind == "cap":
            P += acc
            acc = 0.0
        elif kind == "pay":
            paid += amt
            if FLAW == "principal_first":
                P -= amt
            else:
                to_int = min(acc, amt)
                acc -= to_int
                P -= amt - to_int
    i = P * rate_fn(cur) * days(cur, end) / 365
    acc += i
    tot += i
    return dict(total_interest=tot, principal=P, accrued_unpaid=acc, paid=paid)


def const(r):
    return lambda _d: r


R = {}

# ------------------------------------------------------------------ M01 S.D.N.Y. invoices (NY law)
invoices = [("2022-09-30", 180000), ("2022-10-31", 210000), ("2022-11-30", 195000),
            ("2023-01-03", 240000)]
J = D("2024-03-14")
pji = sum(simple(a, 0.09, D(d), J) for d, a in invoices)
judg = sum(a for _, a in invoices) + pji
r = fed_1961_rate(J)
res = run_balance(judg, const(r), J, PAYOFF, payments=[("2025-06-02", 400000)],
                  compound=FLAW != "no_compound")
R["M01"] = dict(prejudgment_interest=pji, postjudgment_interest=res["total_interest"],
                payoff_amount=res["principal"] + res["accrued_unpaid"])

# ------------------------------------------------------------------ M02 S.D.N.Y. note, affirmed
J = D("2024-09-20")
contract_rate = 0.09 if FLAW == "ny_statutory_not_contract" else 0.135
pji = simple(2_400_000, contract_rate, D("2023-07-01"), J)
judg = 2_400_000 + pji
start = D("2025-08-13") if FLAW == "mandate_date" else J
r = 0.135 if FLAW == "contract_post" else fed_1961_rate(J)
res = run_balance(judg, const(r), start, PAYOFF, payments=[("2025-10-01", 1_500_000)],
                  compound=FLAW != "no_compound")
R["M02"] = dict(prejudgment_interest=pji, postjudgment_accrual_start=start.isoformat(),
                postjudgment_interest=res["total_interest"],
                payoff_amount=res["principal"] + res["accrued_unpaid"])

# ------------------------------------------------------------------ M03 N.Y. Sup. consumer debt
ny_consumer = 0.09 if FLAW == "ny_consumer_9" else 0.02
due, dec, ent = D("2023-03-15"), D("2024-11-19"), D("2024-12-20")
i5001 = simple(86_500, ny_consumer, due, dec)
base5002 = 86_500 + (0 if FLAW == "no_5002_on_interest" else i5001)
i5002 = simple(base5002, ny_consumer, dec, ent)
pji = i5001 + i5002
judg = 86_500 + pji
res = run_balance(judg, const(ny_consumer), ent, PAYOFF)
R["M03"] = dict(prejudgment_interest=pji, postjudgment_interest=res["total_interest"],
                payoff_amount=judg + res["total_interest"])

# ------------------------------------------------------------------ M04 N.Y. Sup. commercial rent
inst = [(f"2023-{m:02d}-01", 48_000) for m in range(6, 13)]
dec, ent = D("2024-09-10"), D("2024-11-25")
i5001 = sum(simple(a, 0.09, D(d), dec) for d, a in inst)
base5002 = 336_000 + (0 if FLAW == "no_5002_on_interest" else i5001)
i5002 = simple(base5002, 0.09, dec, ent)
pji = i5001 + i5002
judg = 336_000 + pji
post = simple(judg, 0.09, ent, PAYOFF)
R["M04"] = dict(prejudgment_interest=pji, payoff_amount=judg + post)

# ------------------------------------------------------------------ M05 N.Y. Sup. bifurcated PI
liab, dmg, ent = D("2024-03-06"), D("2024-10-22"), D("2025-01-14")
start = dmg if FLAW == "love_damages_verdict" else liab
pji = simple(925_000, 0.09, start, ent)
judg = 925_000 + pji
post = simple(judg, 0.09, ent, PAYOFF)
R["M05"] = dict(prejudgment_accrual_start=start.isoformat(), prejudgment_interest=pji,
                postjudgment_interest=post, payoff_amount=judg + post)

# ------------------------------------------------------------------ M06 Cal. contract, 7.5% stated
J = D("2024-07-15")
pre_rate = 0.10 if FLAW == "ca_3289b_10" else 0.075
pji = simple(412_000, pre_rate, D("2023-04-30"), J)
judg = 412_000 + pji
res = run_balance(judg, const(0.10), J, PAYOFF,
                  payments=[("2025-01-31", 150_000), ("2025-09-30", 100_000)])
R["M06"] = dict(prejudgment_interest=pji, postjudgment_interest=res["total_interest"],
                payoff_amount=res["principal"] + res["accrued_unpaid"])

# ------------------------------------------------------------------ M07 Cal. PI, CCP 998 / 3291
offers = [("2022-08-10", 1_500_000), ("2023-06-05", 950_000)]
compensatory, punitive = 1_120_000, 300_000
J = D("2024-04-22")
start = None
for d, amt in offers:             # first offer exceeded by the judgment (any measure gives the same)
    if compensatory + punitive > amt and compensatory > amt:
        start = D(d)
        break
base = compensatory + (punitive if FLAW == "3291_on_punitive" else 0)
R["M07"] = dict(prejudgment_accrual_start=start.isoformat(),
                prejudgment_interest=simple(base, 0.10, start, J))

# ------------------------------------------------------------------ M08 Cal. personal debt judgment
J = D("2024-02-09")
rate = 0.10 if FLAW == "ca_personal_debt_10" else 0.05
res = run_balance(31_480.55, const(rate), J, PAYOFF,
                  payments=[("2024-08-01", 2_000), ("2025-03-14", 5_000), ("2026-02-02", 3_500)])
R["M08"] = dict(postjudgment_interest=res["total_interest"],
                payoff_amount=res["principal"] + res["accrued_unpaid"])

# ------------------------------------------------------------------ M09 Tex. PI (Harris County)
J = D("2024-09-26")
rate = texas_postjudgment_rate(J)
notice_received, suit_filed = D("2022-02-10"), D("2022-10-03")
start = min(notice_received + timedelta(days=180), suit_filed)
past = 212_400 + 96_300 + 350_000
future = 480_000 + 300_000
exemplary = 250_000
costs = 18_750
base = past + (future if FLAW == "tx_pji_on_future" else 0)
pji = simple(base, rate, start, J)
if FLAW != "tx_ignore_offer":
    offer_amt, open_from, open_through = 400_000, D("2023-05-15"), D("2023-06-30")
    pji -= simple(offer_amt, rate, open_from, open_through + timedelta(days=1))
judg = past + future + exemplary + costs + pji
res = run_balance(judg, const(rate), J, PAYOFF, compound=FLAW != "no_compound")
R["M09"] = dict(prejudgment_accrual_start=start.isoformat(), prejudgment_interest=pji,
                postjudgment_interest=res["total_interest"],
                payoff_amount=res["principal"] + res["accrued_unpaid"])

# ------------------------------------------------------------------ M10 Tex. property, settlement
J = D("2025-11-06")
rate = texas_postjudgment_rate(J)
start = min(D("2023-03-20") + timedelta(days=180), D("2023-06-01"))
pre = run_balance(1_840_000, const(rate), start, J, payments=[("2024-08-15", 600_000)])
damages_net, pji = pre["principal"], pre["accrued_unpaid"]
judg = damages_net + pji
res = run_balance(judg, const(rate), J, PAYOFF, compound=FLAW != "no_compound")
R["M10"] = dict(prejudgment_interest=pji, judgment_amount=judg,
                payoff_amount=res["principal"] + res["accrued_unpaid"])

# ------------------------------------------------------------------ M11 Tex. contract with 12% rate
J = D("2025-03-12")
inv = [("2024-01-31", 260_000), ("2024-02-29", 230_000), ("2024-03-31", 240_000)]
pji = sum(simple(a, 0.12, D(d), J) for d, a in inv)
judg = 730_000 + pji
post_rate = texas_postjudgment_rate(J) if FLAW == "tx_ignore_304002" else min(0.12, 0.18)
res = run_balance(judg, const(post_rate), J, PAYOFF, compound=FLAW != "no_compound")
R["M11"] = dict(prejudgment_interest=pji, postjudgment_interest=res["total_interest"],
                payoff_amount=res["principal"] + res["accrued_unpaid"])

# ------------------------------------------------------------------ M12 Fla. judgment + fee award
J, FEE_J = D("2025-11-18"), D("2025-12-17")
damages_judgment, fee_award = 1_265_000, 214_600
fixed = step_rate(FL_CFO, J) / 100


def fl_rate(day, established=None):
    """55.03(3): rate fixed when the judgment is obtained, adjusted each Jan 1 to the rate then in
    effect. For prejudgment interest (687.01) the 55.03 rate in force on each day is used; here the
    whole prejudgment fee period lies in one quarter."""
    if FLAW == "fl_fixed":
        return fixed
    if FLAW == "fl_quarterly":
        return step_rate(FL_CFO, day) / 100
    if day.year == J.year:
        return fixed
    return step_rate(FL_CFO, date(day.year, 1, 1)) / 100


jan1s = [date(y, 1, 1) for y in range(J.year + 1, PAYOFF.year + 1)]
qtrs = [D(d) for d, _ in FL_CFO] if FLAW == "fl_quarterly" else []
# Quality Engineered: interest on the fee award runs from the date entitlement was fixed (the Final
# Judgment of Nov. 18, 2025); interest up to the fee judgment is prejudgment interest included in
# the fee judgment, and the fee judgment (fees + that interest) then bears 55.03 interest.
fee_start = FEE_J if FLAW == "fl_fee_from_quantification" else J
fee_pji = sum(simple(fee_award, step_rate(FL_CFO, fee_start + timedelta(days=k)) / 100,
                     fee_start + timedelta(days=k), fee_start + timedelta(days=k + 1))
              for k in range(days(fee_start, FEE_J)))
a = run_balance(damages_judgment, fl_rate, J, PAYOFF, rate_change_dates=jan1s + qtrs)
b = run_balance(fee_award + fee_pji, fl_rate, FEE_J, PAYOFF, rate_change_dates=jan1s + qtrs)
post = a["total_interest"] + b["total_interest"]
R["M12"] = dict(fee_interest_accrual_start=fee_start.isoformat(), prejudgment_interest=fee_pji,
                postjudgment_interest=post,
                payoff_amount=damages_judgment + fee_award + fee_pji + post)

# ------------------------------------------------------------------ M13 D. Mass. (removed) PI
J = D("2025-08-11")
start = D("2023-03-20") if FLAW == "ma_service_date" else D("2023-03-03")
pji = simple(1_150_000, 0.12, start, J)
judg = 1_150_000 + pji
res = run_balance(judg, const(fed_1961_rate(J)), J, PAYOFF, compound=FLAW != "no_compound")
R["M13"] = dict(prejudgment_accrual_start=start.isoformat(), prejudgment_interest=pji,
                postjudgment_interest=res["total_interest"],
                payoff_amount=res["principal"] + res["accrued_unpaid"])

# ------------------------------------------------------------------ write deliverable
out = {"payoff_date": PAYOFF.isoformat(), "matters": {}}
for m, fields in R.items():
    out["matters"][m] = {k: (round(v + 1e-9, 2) if isinstance(v, float) else v)
                         for k, v in fields.items()}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w") as f:
    json.dump(out, f, indent=2)
print(json.dumps(out, indent=2))
