#!/usr/bin/env python3
"""Reference implementation: Project Aster closing allocation (Halvorsen Robotics, Inc.).

Reads the data-room ledgers (stock ledger, option ledger, note register, scenarios) and encodes the
operative rules from the prose documents:
  * Sixth A&R Certificate of Incorporation, Art. IV.B Secs. 2 and 4, as amended by the FILED
    Certificate of Amendment of Jan. 22, 2025 (Series B cap 2.5x). The draft Amendment No. 2 was never
    filed and is not effective (DGCL Sec. 103(d)); the Oct. 2026 Series C waiver was signed by holders
    of only 57.5% of Series C (< 60% Requisite Series C Holders) and is of no force or effect.
  * Officer's certificate: Series A Conversion Price $1.44.
  * Board consent 2020: Series Seed dividend $0.04/share declared, unpaid.
  * Note Purchase Agreement + Notes: Majority Holder election (Northgate, 60% of principal) binds all
    Notes: convert iff Base Purchase Price >= $110,000,000; else repay 1.5x principal + interest.
  * Merger Agreement definitions (Closing Cash, Indebtedness, NWC adjustment with collar, Transaction
    Expenses, Escrow, Expense Fund), Estimated Closing Statement v2 (binding, per MA 2.4(a)).
  * 2016 Plan: vesting, rounding, post-termination exercise; Board consent correcting H-125 to $1.65;
    Okafor single-trigger 50% acceleration; Raman double trigger not triggered.
  * Management Carve-Out Plan as amended (8%, $60M threshold, 100-unit denominator).
  * Okafor transaction bonus ($400,000 less carve-out payment).
Exact rational arithmetic throughout.
"""
import calendar
import csv
import json
import os
from datetime import date
from fractions import Fraction as F
from itertools import product

APP = os.environ.get("APP_DIR", "/app")
DR = os.path.join(APP, "data_room")
OUT = os.path.join(APP, "output")
FLAWS = set(filter(None, os.environ.get("SOLVE_FLAWS", "").split(",")))

CLOSING = date(2026, 11, 20)

# ---------------------------------------------------------------- holder ids (instruction table)
HOLDER_IDS = {
    "Northgate Ventures III, L.P.": "northgate",
    "Meridian Growth Partners II, L.P.": "meridian",
    "Calloway Capital Fund II, L.P.": "calloway",
    "Redwood Hollow Ventures, L.P.": "redwood",
    "Sandpiper Seed Fund I, L.P.": "sandpiper",
    "Brightline Angels LLC": "brightline",
    "Dana Okafor": "okafor",
    "Okafor Family Trust dated March 2 2021": "okafor_trust",
    "Marcus Lindqvist": "lindqvist",
    "Erik Brandt": "brandt",
    "Javier Ortiz": "ortiz",
    "Priya Raman": "raman",
    "Amara Diallo": "diallo",
    "Helen Choi": "choi",
    "Harbor Lane Capital, LLC": "harbor_lane",
}
OTHER_COMMON = "other_common"
OTHER_OPTIONS = "other_options"
ALL_HOLDERS = ["northgate", "meridian", "calloway", "redwood", "sandpiper", "brightline", "okafor",
               "okafor_trust", "lindqvist", "brandt", "ortiz", "raman", "diallo", "choi",
               "harbor_lane", OTHER_COMMON, OTHER_OPTIONS]
TREASURY_HOLDER = "Halvorsen Robotics, Inc."

# ---------------------------------------------------------------- charter terms
SERIES = ["series_c", "series_b", "series_a", "series_seed"]
CLASS_OF = {"Series C Preferred": "series_c", "Series B Preferred": "series_b",
            "Series A Preferred": "series_a", "Series Seed Preferred": "series_seed",
            "Common": "common"}
OIP = {"series_c": F("3.00"), "series_b": F("1.20"), "series_a": F("1.50"), "series_seed": F("0.50")}
CONV_PRICE = {"series_c": F("3.00"), "series_b": F("1.20"), "series_a": F("1.44"),
              "series_seed": F("0.50")}
PREF_MULT = {"series_c": F(3, 2), "series_b": F(1), "series_a": F(1), "series_seed": F(1)}
DECLARED_DIV = {"series_c": F(0), "series_b": F(0), "series_a": F(0), "series_seed": F("0.04")}
TIERS = [["series_c"], ["series_b"], ["series_a", "series_seed"]]
B_CAP_MULT = F(3)  # 2025 amendment to 2.5x is void: no Series B separate-series majority (DGCL 242(b)(2))

if "c_waiver_effective" in FLAWS:
    PREF_MULT["series_c"] = F(1)
if "b_cap_amendment_valid" in FLAWS:
    B_CAP_MULT = F(5, 2)
if "amendment2_effective" in FLAWS:  # draft would have made Series B non-participating
    B_CAP_MULT = F(1)
if "no_antidilution" in FLAWS:
    CONV_PRICE["series_a"] = F("1.50")
if "no_dividend" in FLAWS:
    DECLARED_DIV["series_seed"] = F(0)

# ---------------------------------------------------------------- merger agreement / closing statement v2
ESCROW_PCT = F(1, 10)                  # of Base Purchase Price
EXPENSE_FUND = F(250_000)
BANK_CASH = F(2_250_000)               # unrestricted operating cash per statement v2
OUTSTANDING_CHECKS = F(65_000)         # issued, uncleared (MA: Closing Cash is net of these)
RESTRICTED_CASH = F(180_000)           # excluded from Closing Cash
NWC_ITEMS = {  # v2 statement, included items only (cash, debt, TE, income taxes excluded by definition)
    "accounts_receivable": F(3_120_000), "inventory": F(1_940_000), "prepaid": F(410_000),
    "accounts_payable": -F(1_480_000), "accrued_expenses": -F(1_070_000),
    "deferred_revenue": -F(690_000),
}
if "nwc_v1" in FLAWS:
    NWC_ITEMS["accounts_payable"] = -F(1_330_000)
TARGET_NWC = F(2_600_000)
NWC_COLLAR = F(150_000)
LOAN_PAYOFF_AS_OF_NOV18 = F(2_558_200)
LOAN_PER_DIEM = F(650)
LOAN_PAYOFF_DATE_BASE = date(2026, 11, 18)
CAPITAL_LEASES = F(85_000)
BANKER_PCT = F(2, 100)
BANKER_MIN = F(1_250_000)
BANKER_RETAINER_PAID = F(100_000)
LEGAL_UNPAID = F(640_000)
ACCOUNTING_UNPAID = F(55_000)
DO_TAIL_PREMIUM = F(180_000)
DO_TAIL_COMPANY_SHARE = F(1, 2)

# ---------------------------------------------------------------- notes
NOTE_RATE = F(6, 100)
NOTE_REPAY_MULT = F(3, 2)
NOTE_CONV_PRICE = F("2.00")
NOTE_CONVERT_THRESHOLD = F(110_000_000)   # Northgate (Majority Holder) election letter

# ---------------------------------------------------------------- carve-out / bonus
CARVE_PCT = F(8, 100)                 # as amended Aug 2025 (was 6%)
CARVE_THRESHOLD = F(75_000_000)       # as amended (was $50M); no pool if Carve-Out Proceeds >= threshold
CARVE_DENOM = 100
CARVE_UNITS = {"okafor": 35, "raman": 25, "lindqvist": 15, "diallo": 10, "ortiz": 15}
CARVE_FORFEITED = {"ortiz"}           # separation 2026-07-01, before the Sale Event
CEO_BONUS = F(1_250_000)
if "carve_v1" in FLAWS:
    CARVE_PCT, CARVE_THRESHOLD = F(6, 100), F(50_000_000)

# ---------------------------------------------------------------- options
ACCEL_SINGLE = {"H-101": F(1, 2)}     # Okafor Option Agreement 4(c)
PRICE_CORRECTIONS = {"H-125": F("1.65")}  # Board consent 2024-06-12
if "ledger_price" in FLAWS:
    PRICE_CORRECTIONS = {}
TERMINATIONS = {"H-121": date(2026, 7, 1)}  # Ortiz separation; 3-month post-termination window
WARRANT = dict(holder="harbor_lane", shares=150_000, price=F("0.90"))


def add_months(d, n):
    y, m = divmod(d.month - 1 + n, 12)
    y += d.year
    m += 1
    last = calendar.monthrange(y, m)[1]
    return date(y, m, min(d.day, last))


def months_vested(vcd, asof):
    n = 0
    while add_months(vcd, n + 1) <= asof:
        n += 1
    return n


def vested_shares(total, vcd, schedule, asof):
    m = months_vested(vcd, asof)
    if schedule == "4Y-1Ycliff-monthly":
        if m < 12:
            return 0
        return min(total, total * min(m, 48) // 48)
    if schedule == "3Y-nocliff-monthly":
        return min(total, total * min(m, 36) // 36)
    raise ValueError(schedule)


def pdate(s):
    return date.fromisoformat(s)


def load():
    holdings = {}
    with open(os.path.join(DR, "03_Capitalization", "stock_ledger.csv"), newline="") as f:
        for r in csv.DictReader(f):
            name = r["holder_name"]
            sign = 1 if r["action"] == "Issued" else -1
            if name == TREASURY_HOLDER and "count_treasury" not in FLAWS:
                continue  # treasury shares are not outstanding
            hid = HOLDER_IDS.get(name, OTHER_COMMON)
            cls = CLASS_OF[r["class_series"]]
            holdings.setdefault(hid, {}).setdefault(cls, 0)
            holdings[hid][cls] += sign * int(r["shares"])
    options = []
    with open(os.path.join(DR, "03_Capitalization", "option_ledger_2026-06-30.csv"), newline="") as f:
        for r in csv.DictReader(f):
            gid = r["grant_id"]
            total = int(r["shares_granted"])
            exercised = int(r["shares_exercised"])
            cancelled = int(r["shares_cancelled"])
            if total - exercised - cancelled <= 0:
                continue
            if gid == "H-130" and "choi_service_ended" in FLAWS:
                continue  # wrong: director-to-consultant is a change in capacity, not a termination
            if gid in TERMINATIONS and "ignore_expiry" not in FLAWS:
                expiry = add_months(TERMINATIONS[gid], 3)
                if expiry < CLOSING:
                    continue  # unexercised balance expired
            hid = HOLDER_IDS.get(r["holder_name"], OTHER_OPTIONS)
            if "stale_vesting" in FLAWS:
                vested = int(r["vested_unexercised_as_of_2026-06-30"])
            else:
                vested = vested_shares(total, pdate(r["vesting_commencement_date"]),
                                       r["vesting_schedule"], CLOSING) - exercised
            if gid in TERMINATIONS and "ignore_expiry" in FLAWS:
                vested = vested_shares(total, pdate(r["vesting_commencement_date"]),
                                       r["vesting_schedule"], TERMINATIONS[gid]) - exercised
            unvested = total - exercised - cancelled - vested
            if gid in ACCEL_SINGLE and "no_acceleration" not in FLAWS:
                acc = unvested * ACCEL_SINGLE[gid]
                assert acc.denominator == 1
                vested += int(acc)
            price = PRICE_CORRECTIONS.get(gid, F(r["exercise_price"]))
            if vested > 0:
                options.append(dict(grant=gid, holder=hid, n=vested, k=price, type=r["option_type"]))
    notes = []
    with open(os.path.join(DR, "04_Debt_and_Warrants", "note_register.csv"), newline="") as f:
        for r in csv.DictReader(f):
            principal = F(r["principal"])
            days = (CLOSING - pdate(r["issue_date"])).days  # from and including issue, excluding Closing
            interest = principal * NOTE_RATE * days / 365
            notes.append(dict(no=r["note_no"], holder=HOLDER_IDS[r["holder_name"]],
                              principal=principal, interest=interest))
    scenarios = []
    with open(os.path.join(DR, "06_Merger_Agreement_and_Closing_Statements", "scenarios_base_purchase_price.csv"),
              newline="") as f:
        for r in csv.DictReader(f):
            scenarios.append((r["scenario_id"], F(r["base_purchase_price"])))
    return holdings, options, notes, scenarios


# ---------------------------------------------------------------- 280G cleansing vote (Treas. Reg. 1.280G-1 Q&A-7)
VOTE_FOR = {"northgate": 3_800_000, "calloway": 3_750_000, "redwood": 3_500_000, "sandpiper": 3_900_000,
            "lindqvist": 2_500_000, "reinholt": 180_000, "shah": 300_000, "osei": 150_000,
            "ortiz": 50_000}                                           # as-converted voting power voted FOR
TOTAL_VOTING_POWER = 9_650_000 + 4_000_000 + 6_250_000 + 5_000_000 + 4_000_000  # outstanding; treasury excluded
# Q&A-7(b)(4) sentence 1: stock actually or constructively (318(a)) owned by the DI receiving parachute payments.
#   trust: revocable grantor trust -> 318(a)(2)(B)(ii).
# Q&A-7(b)(4) sentence 2: stock of a person considered under 318(a) to own the DI's stock.
#   grandmother: 318(a)(1)(A)(ii) (she owns stock of her grandchildren).
# Half-brother Osei: siblings are not 318(a)(1) family -> counted, and his FOR vote counts.
EXCLUDED_DI = {"okafor": 4_200_000, "okafor_trust": 300_000, "jimenez": 250_000}


def vote_280g_passes():
    total = TOTAL_VOTING_POWER
    excluded = dict(EXCLUDED_DI)
    vote_for = dict(VOTE_FOR)
    if "vote_no_attribution" in FLAWS:
        excluded.pop("okafor_trust")
    if "vote_no_reverse_attribution" in FLAWS:
        excluded.pop("jimenez")
    if "vote_exclude_sibling" in FLAWS:
        excluded["osei"] = 150_000
        vote_for.pop("osei")
    if "vote_exclude_lindqvist" in FLAWS:
        excluded["lindqvist"] = 2_500_000
        vote_for.pop("lindqvist")
    if "vote_no_exclusion" in FLAWS:
        excluded = {}
    if "vote_count_treasury" in FLAWS:
        total += 600_000
    denom = total - sum(excluded.values())
    return F(sum(vote_for.values()), denom) > F(3, 4)


# ---------------------------------------------------------------- appraisal (DGCL 262)
DISSENTERS = {"brandt"}  # valid: did not consent; demand within 20 days of Oct 29 notice
if "brandt_paid" in FLAWS:
    DISSENTERS = set()
if "trust_dissent" in FLAWS:
    DISSENTERS.add("okafor_trust")   # wrong: appraisal waived in Voting Agreement (Manti)
if "ortiz_dissent" in FLAWS:
    DISSENTERS.add("ortiz")          # wrong: demand Nov 19 is after the 20-day window
if "wenli_dissent" in FLAWS:
    DISSENTERS.add("wenli")          # wrong: Wen Li consented in writing
WEN_LI_COMMON = 320_000


def ratio(s):
    return OIP[s] / CONV_PRICE[s]


def liq_ps(s):
    return PREF_MULT[s] * OIP[s] + DECLARED_DIV[s]


def closing_economics(base, notes):
    convert = base >= NOTE_CONVERT_THRESHOLD
    if "notes_always_repaid" in FLAWS:
        convert = False
    closing_cash = BANK_CASH - OUTSTANDING_CHECKS
    if "gross_cash" in FLAWS:
        closing_cash = BANK_CASH + RESTRICTED_CASH
    payoff_days = (CLOSING - LOAN_PAYOFF_DATE_BASE).days
    loan = LOAN_PAYOFF_AS_OF_NOV18 + LOAN_PER_DIEM * payoff_days
    note_repay = {n["no"]: (NOTE_REPAY_MULT * n["principal"] + n["interest"]) if not convert else F(0)
                  for n in notes}
    indebtedness = loan + CAPITAL_LEASES + sum(note_repay.values())
    nwc = sum(NWC_ITEMS.values())
    lower, upper = TARGET_NWC - NWC_COLLAR, TARGET_NWC + NWC_COLLAR
    if "nwc_full_shortfall" in FLAWS:
        lower = upper = TARGET_NWC
    nwc_adj = F(0)
    if nwc < lower:
        nwc_adj = -(lower - nwc)
    elif nwc > upper:
        nwc_adj = nwc - upper
    banker = max(BANKER_MIN, BANKER_PCT * base) - BANKER_RETAINER_PAID
    te_ex = banker + LEGAL_UNPAID + ACCOUNTING_UNPAID + DO_TAIL_PREMIUM * DO_TAIL_COMPANY_SHARE
    escrow = ESCROW_PCT * base
    if "no_escrow_deduction" in FLAWS:
        escrow = F(0)
    carve_proceeds = base + closing_cash - indebtedness + nwc_adj - te_ex - escrow - EXPENSE_FUND
    pool = CARVE_PCT * carve_proceeds if carve_proceeds < CARVE_THRESHOLD else F(0)
    carve = {}
    for p, u in CARVE_UNITS.items():
        if p in CARVE_FORFEITED and "pay_forfeited" not in FLAWS:
            carve[p] = F(0)
        else:
            carve[p] = pool * u / CARVE_DENOM
    if "carve_by_outstanding_units" in FLAWS:
        live = sum(u for p, u in CARVE_UNITS.items() if p not in CARVE_FORFEITED)
        carve = {p: (F(0) if p in CARVE_FORFEITED else pool * u / live) for p, u in CARVE_UNITS.items()}
    bonus = max(F(0), CEO_BONUS - carve["okafor"]) if vote_280g_passes() else F(0)
    if "bonus_no_offset" in FLAWS and vote_280g_passes():
        bonus = CEO_BONUS
    cmc = carve_proceeds - sum(carve.values())  # bonus is borne by Parent (MA 6.10), not a TE
    return dict(convert=convert, closing_cash=closing_cash, loan=loan, note_repay=note_repay,
                indebtedness=indebtedness, nwc=nwc, nwc_adj=nwc_adj, banker=banker, te_ex=te_ex,
                escrow=escrow, carve_proceeds=carve_proceeds, pool=pool, carve=carve, bonus=bonus,
                cmc=cmc)


class Model:
    def __init__(self, holdings, options, notes, note_conv_shares):
        self.h = holdings
        self.ser_sh = {s: sum(v.get(s, 0) for v in holdings.values()) for s in SERIES}
        self.common_sh = sum(v.get("common", 0) for v in holdings.values())
        self.note_sh = note_conv_shares  # total common from converted notes (Fraction)
        # instruments paid on a spread: options (treasury) and the warrant (net exercise; equivalent)
        self.spread = [dict(id=o["grant"], n=o["n"], k=o["k"]) for o in options]
        self.spread.append(dict(id="WARRANT", n=WARRANT["shares"], k=WARRANT["price"]))

    def waterfall(self, cmc, conv):
        insts = sorted(self.spread, key=lambda o: o["k"])
        strikes = sorted({o["k"] for o in insts})
        cands = [[o for o in insts if o["k"] < t] for t in strikes] + [insts]
        sols, seen = [], set()
        for S in cands:
            key = tuple(sorted(o["id"] for o in S))
            if key in seen:
                continue
            seen.add(key)
            res = self._alloc(cmc, conv, S)
            ids = {o["id"] for o in S}
            if all((o["k"] < res["P"]) == (o["id"] in ids) for o in insts):
                sols.append(res)
        assert len(sols) == 1, "in-the-money set not unique"
        return sols[0]

    def _alloc(self, cmc, conv, S):
        ex = sum(o["n"] * o["k"] for o in S)
        rem = cmc + ex
        paid = {s: F(0) for s in SERIES}
        for tier in TIERS:
            nc = [s for s in tier if not conv[s]]
            full = {s: self.ser_sh[s] * liq_ps(s) for s in nc}
            tot = sum(full.values())
            if tot == 0:
                continue
            if rem >= tot:
                paid.update(full)
                rem -= tot
            else:
                for s in nc:
                    if "prorata_by_shares" in FLAWS:
                        paid[s] = rem * self.ser_sh[s] / sum(self.ser_sh[x] for x in nc)
                    else:
                        paid[s] = rem * full[s] / tot
                rem = F(0)
        R = rem
        ceq = (self.common_sh + self.note_sh + sum(o["n"] for o in S)
               + sum(self.ser_sh[s] * ratio(s) for s in SERIES if conv[s]))
        b_sh = self.ser_sh["series_b"]
        b_part = F(0)
        capped = False
        if not conv["series_b"]:
            P = R / (ceq + b_sh * ratio("series_b"))
            b_part = P * b_sh * ratio("series_b")
            cap_total = B_CAP_MULT * OIP["series_b"] * b_sh
            if paid["series_b"] + b_part > cap_total:
                capped = True
                b_part = cap_total - paid["series_b"]
                P = (R - b_part) / ceq
        else:
            P = R / ceq
        per = {}
        for s in SERIES:
            per[s] = P * ratio(s) if conv[s] else paid[s] / self.ser_sh[s]
        if not conv["series_b"]:
            per["series_b"] += b_part / b_sh
        per["common"] = P
        return dict(P=P, per=per, S=S, capped=capped, total=cmc + ex)

    def totals(self, res):
        return {s: res["per"][s] * self.ser_sh[s] for s in SERIES}

    def stable(self, cmc):
        allres = {c: self.waterfall(cmc, dict(zip(SERIES, c)))
                  for c in product([False, True], repeat=4)}
        if "no_conversion" in FLAWS:
            c = (False,) * 4
            return dict(zip(SERIES, c)), allres[c]
        if "naive_conversion" in FLAWS:
            base = self.totals(allres[(False,) * 4])
            c = []
            for i, s in enumerate(SERIES):
                alt = [False] * 4
                alt[i] = True
                c.append(self.totals(allres[tuple(alt)])[s] > base[s])
            return dict(zip(SERIES, c)), allres[tuple(c)]
        stable = []
        for c, res in allres.items():
            mine = self.totals(res)
            ok = True
            for i, s in enumerate(SERIES):
                alt = list(c)
                alt[i] = not alt[i]
                other = self.totals(allres[tuple(alt)])[s]
                if c[i] and not mine[s] > other:
                    ok = False
                if not c[i] and other > mine[s]:
                    ok = False
            if ok:
                stable.append(c)
        assert len(stable) == 1, f"Stable Allocation not unique: {stable}"
        return dict(zip(SERIES, stable[0])), allres[stable[0]]


def r2(x):
    return round(float(x), 2)


def compute():
    holdings, options, notes, scenarios = load()
    results = {}
    for sid, base in scenarios:
        eco = closing_economics(base, notes)
        note_sh = {n["no"]: ((n["principal"] + n["interest"]) / NOTE_CONV_PRICE if eco["convert"] else F(0))
                   for n in notes}
        m = Model(holdings, options, notes, sum(note_sh.values()))
        conv, res = m.stable(eco["cmc"])
        P, per = res["P"], res["per"]
        itm = {o["id"] for o in res["S"]}
        # warrant: verify net-exercise equivalence
        if "WARRANT" in itm:
            X = WARRANT["shares"] * (P - WARRANT["price"]) / P
            assert X * P == WARRANT["shares"] * (P - WARRANT["price"])
        ct = m.totals(res)
        ct["common"] = P * m.common_sh
        ct["options"] = sum((P - o["k"]) * o["n"] for o in options if o["grant"] in itm)
        ct["warrants"] = (P - WARRANT["price"]) * WARRANT["shares"] if "WARRANT" in itm else F(0)
        ct["notes"] = sum(eco["note_repay"].values()) + sum(note_sh.values()) * P
        hold = {h: F(0) for h in ALL_HOLDERS}
        for hid, secs in holdings.items():
            for cls, n in secs.items():
                hold[hid] += per[cls] * n
        for o in options:
            if o["grant"] in itm:
                hold[o["holder"]] += (P - o["k"]) * o["n"]
        hold[WARRANT["holder"]] += ct["warrants"]
        for n in notes:
            hold[n["holder"]] += eco["note_repay"][n["no"]] + note_sh[n["no"]] * P
        # footing before appraisal withholding: equity + notes = CMC + repaid note amounts
        assert sum(hold.values()) == eco["cmc"] + sum(eco["note_repay"].values())
        assert sum(ct.values()) == sum(hold.values())
        # Dissenting Shares (DGCL 262; MA 2.6(d)): allocation computed as if not dissenting, but the
        # amount is not paid at Closing (retained by Parent pending appraisal).
        withheld = F(0)
        for d in DISSENTERS:
            if d == "wenli":
                amt = P * WEN_LI_COMMON
                hold[OTHER_COMMON] -= amt
            else:
                assert set(holdings[d]) == {"common"}
                amt = hold[d]
                hold[d] = F(0)
            ct["common"] -= amt
            withheld += amt
        assert sum(hold.values()) == sum(ct.values())
        results[sid] = dict(base=base, eco=eco, conv=conv, res=res, ct=ct, hold=hold, itm=itm,
                            note_sh=note_sh)
    return results, options, notes


# ---------------------------------------------------------------- Closing payroll (withholding) and 280G excise
# Federal (2026): optional flat rate 22% on supplemental wages up to $1M for the calendar year; mandatory 37%
#   on the portion of supplemental wages over $1M (Treas. Reg. 31.3402(g)-1(a)(2), (a)(7)(iii)(F)).
# FICA (2026): OASDI 6.2% up to the $184,500 wage base; HI 1.45%; Additional Medicare 0.9% withheld on wages
#   over $200,000 in the calendar year (IRC 3101, 3102(f)).
# California: supplemental flat rate for bonuses and stock options 10.23%; SDI 1.3% (2026), no wage limit.
# An ISO cash-out is not an ISO exercise: wages subject to income tax withholding and FICA.
# Non-employees (Choi: director, then consultant) are paid without withholding (Form 1099-NEC).
FED_FLAT, FED_MANDATORY, FED_SUPP_LIMIT = F(22, 100), F(37, 100), F(1_000_000)
SS_RATE, SS_BASE = F(62, 1000), F(184_500)
HI_RATE, ADDL_HI_RATE, ADDL_HI_THRESHOLD = F(145, 10000), F(9, 1000), F(200_000)
CA_SUPP_RATE, CA_SDI_RATE = F(1023, 10000), F(13, 1000)
EXCISE_RATE = F(20, 100)
TANAKA_CIC_PCT = F(1, 100)
TANAKA_RC_PRE_CHANGE = F(450_000)
PAYROLL_PEOPLE = {"okafor": "Dana Okafor", "raman": "Priya Raman", "lindqvist": "Marcus Lindqvist",
                  "diallo": "Amara Diallo", "tanaka": "Mei Tanaka"}
if "ca_rate_66" in FLAWS:
    CA_SUPP_RATE = F(66, 1000)


def cents(x):
    x = F(x)
    return F(int(x * 100 + F(1, 2)) if x >= 0 else -int(-x * 100 + F(1, 2)), 100)


def load_payroll():
    ytd = {}
    with open(os.path.join(DR, "10_Payroll", "payroll_ytd_2026-11-13.csv"), newline="") as f:
        for r in csv.DictReader(f):
            ytd[r["employee"]] = r
    return ytd


def tanaka_base_amount():
    """IRC 280G(b)(3), (d)(1)-(2); Treas. Reg. 1.280G-1 Q&A-34, -35.
    Base period = taxable years ending before the change during which she performed services = 2025 only.
    Compensation = amounts includible in gross income (W-2 box 1: 401(k) deferrals excluded).
    Short year annualized by payment frequency (2 of 24 semi-monthly salary payments);
    the once-only sign-on bonus is not annualized."""
    salary_box1 = 2 * (F(12_500) - F(1_250))     # 22,500
    sign_on = F(100_000)
    if "base_box5" in FLAWS:
        salary_box1 = F(25_000)
    if "base_no_annualize" in FLAWS:
        return salary_box1 + sign_on
    if "base_annualize_bonus" in FLAWS:
        return (salary_box1 + sign_on) * 12
    return salary_box1 * 12 + sign_on


def tanaka_excise(base_price):
    pp = TANAKA_CIC_PCT * base_price
    b = tanaka_base_amount()
    rc = TANAKA_RC_PRE_CHANGE
    test_pp = pp - rc if "rc_before_test" in FLAWS else pp
    if test_pp < 3 * b:                           # 280G(b)(2)(A)(ii): "equals or exceeds"
        return F(0)
    if "excess_over_3x" in FLAWS:
        excess = pp - 3 * b
    else:
        excess = pp - b                           # 280G(b)(1): over 1x the allocated base amount
    if "rc_full_offset" in FLAWS:
        excess -= rc
    else:
        excess -= max(F(0), rc - b)               # 280G(b)(4)(B): RC first offset against base amount
    return EXCISE_RATE * max(F(0), excess)


def withholding(gross, ytd, iso_part=F(0), excise=F(0)):
    state = ytd["work_state"]
    supp_ytd = F(ytd["ytd_supplemental_wages"])
    ss_ytd = F(ytd["ytd_social_security_wages"])
    med_ytd = F(ytd["ytd_medicare_wages"])
    fica_wages = gross - (iso_part if "iso_no_fica" in FLAWS else 0)
    room = max(F(0), FED_SUPP_LIMIT - supp_ytd)
    if "no_mandatory_37" in FLAWS:
        fit = FED_FLAT * gross
    else:
        fit = FED_FLAT * min(gross, room) + FED_MANDATORY * max(F(0), gross - room)
    ss_room = max(F(0), SS_BASE - ss_ytd)
    ss = SS_RATE * (fica_wages if "ss_no_cap" in FLAWS else min(fica_wages, ss_room))
    hi = HI_RATE * fica_wages
    if "no_addl_medicare" not in FLAWS:
        hi += ADDL_HI_RATE * max(F(0), med_ytd + fica_wages - max(med_ytd, ADDL_HI_THRESHOLD))
    ca_pit = CA_SUPP_RATE * gross if state == "CA" else F(0)
    ca_sdi = (CA_SDI_RATE * gross if state == "CA" and "no_sdi" not in FLAWS else F(0))
    comp = dict(federal_income_tax=cents(fit), section_4999_excise=cents(excise), social_security=cents(ss),
                medicare=cents(hi), state_income_tax=cents(ca_pit), state_disability_insurance=cents(ca_sdi))
    comp["gross"] = cents(gross)
    comp["net"] = comp["gross"] - sum(v for k, v in comp.items() if k != "gross")
    return comp


def compensation_payments(r, options, base_price):
    ytd = load_payroll()
    eco, P, itm = r["eco"], r["res"]["P"], r["itm"]
    opt = {h: F(0) for h in ["okafor", "raman", "diallo", "choi"]}
    iso = {h: F(0) for h in opt}
    for o in options:
        if o["grant"] in itm and o["holder"] in opt:
            amt = (P - o["k"]) * o["n"]
            opt[o["holder"]] += amt
            if o.get("type") == "ISO":
                iso[o["holder"]] += amt
    gross = {
        "okafor": opt["okafor"] + eco["carve"]["okafor"] + eco["bonus"],
        "raman": opt["raman"] + eco["carve"]["raman"],
        "lindqvist": eco["carve"]["lindqvist"],
        "diallo": opt["diallo"] + eco["carve"]["diallo"],
        "tanaka": TANAKA_CIC_PCT * base_price,
    }
    out = {}
    for pid, g in gross.items():
        exc = tanaka_excise(base_price) if pid == "tanaka" else F(0)
        out[pid] = withholding(g, ytd[PAYROLL_PEOPLE[pid]], iso_part=iso.get(pid, F(0)), excise=exc)
    if "choi_withheld" in FLAWS:
        out["choi"] = withholding(opt["choi"], dict(work_state="CA", ytd_supplemental_wages="0",
                                                    ytd_social_security_wages="0", ytd_medicare_wages="0"))
    else:
        z = dict(federal_income_tax=F(0), section_4999_excise=F(0), social_security=F(0), medicare=F(0),
                 state_income_tax=F(0), state_disability_insurance=F(0))
        z["gross"] = cents(opt["choi"])
        z["net"] = z["gross"]
        out["choi"] = z
    return out


def main():
    results, options, notes = compute()
    out = {"scenarios": {}}
    for sid, r in results.items():
        eco = r["eco"]
        out["scenarios"][sid] = {
            "closing_merger_consideration": r2(eco["cmc"]),
            "carve_out_payments": {p: r2(v) for p, v in eco["carve"].items()},
            "okafor_transaction_bonus": r2(eco["bonus"]),
            "class_totals": {k: r2(r["ct"][k]) for k in
                             ["series_c", "series_b", "series_a", "series_seed", "common", "options",
                              "warrants", "notes"]},
            "holders": {h: r2(v) for h, v in r["hold"].items()},
            "compensation_payments": {p: {k: r2(v) for k, v in d.items()}
                                      for p, d in compensation_payments(r, options, r["base"]).items()},
        }
        if os.environ.get("SOLVE_KEEP_AUDIT") == "1":
            out["scenarios"][sid]["_audit"] = {
                "notes_convert": eco["convert"], "closing_cash": r2(eco["closing_cash"]),
                "loan_payoff": r2(eco["loan"]), "indebtedness": r2(eco["indebtedness"]),
                "nwc": r2(eco["nwc"]), "nwc_adj": r2(eco["nwc_adj"]), "banker_unpaid": r2(eco["banker"]),
                "te_ex_carve_bonus": r2(eco["te_ex"]), "escrow": r2(eco["escrow"]),
                "carve_out_proceeds": r2(eco["carve_proceeds"]), "pool": r2(eco["pool"]),
                "converting_series": [s for s in SERIES if r["conv"][s]],
                "P": float(r["res"]["P"]), "b_capped": r["res"]["capped"],
                "itm": sorted(r["itm"]), "note_shares": {k: float(v) for k, v in r["note_sh"].items()},
                "note_interest": {n["no"]: r2(n["interest"]) for n in notes},
                "vested_options": {o["grant"]: (o["n"], float(o["k"])) for o in options},
            }
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, "allocation.json"), "w") as f:
        json.dump(out, f, indent=2)


if __name__ == "__main__":
    main()
