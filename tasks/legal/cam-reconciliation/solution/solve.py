#!/usr/bin/env python3
"""Reference implementation for the cam-reconciliation task.

Encodes the operating-expense and tax provisions of the three Meridian Tower leases
(Brightwater Analytics, Inc.; Harlow & Pike LLP; Copperline Software, Inc.), as amended
and supplemented, and applies them to the landlord's ledger and supporting schedules in
/app/materials. Writes /app/output/cam_audit.json.

The only constants below are facts stated in the narrative exhibits and correspondence
(each cited) and the lease terms themselves; every dollar figure is computed.
"""
import csv
import datetime as dt
import json
import os
from collections import defaultdict

APP = os.environ.get("APP_DIR", "/app")
MAT = os.path.join(APP, "materials")
OUT = os.path.join(APP, "output", "cam_audit.json")

AS_OF = dt.date(2026, 10, 12)  # date of the assignment
YEARS = (2024, 2025)

# ---------------------------------------------------------------------------
# Facts from narrative exhibits / correspondence
# ---------------------------------------------------------------------------
# building/insurance_claims_summary.md
CASUALTY = {
    2023: {"gross": 128000.0, "insurer_paid": 98000.0},
    2024: {"gross": 165000.0, "insurer_paid": 125000.0},
}
# building/capital_projects.md (independent engineer's certificate)
LED_COST = 420000.0
LED_USEFUL_LIFE_YEARS = 12
LED_SAVINGS = {2024: 27500.0, 2025: 38000.0}
# building/tax_matters_memo.md: the FY 2023-24 Harbor Gateway EIFD assessment ($184,000) was refunded
# in August 2025; the $46,000 contingency fee for the claim was paid in August 2025.
EIFD_REFUND = {"amount": 184000.0, "fee": 46000.0, "fy": "2023-24", "calendar_year_received": 2025}
# correspondence: managing agent's email of 2026-02-27 corrects 2024 occupancy to 88.0%
OCCUPANCY_CORRECTIONS = {2024: 0.88}
# Copperline Expansion Commencement Date Memorandum: Expansion Commencement Date 2025-07-15
COPPERLINE_EXPANSION_START = dt.date(2025, 7, 15)

# Statement transmittals (statements + correspondence): (method, date deposited / delivered)
TRANSMITTALS = {
    ("brightwater", 2024): ("overnight", dt.date(2025, 5, 9)),
    ("brightwater", 2025): ("certified", dt.date(2026, 6, 16)),
    ("harlow_pike", 2024): ("hand", dt.date(2025, 8, 12)),
    ("harlow_pike", 2025): ("hand", dt.date(2026, 3, 24)),
    # 2025: the June 1, 2026 e-mail is not a permitted notice method (s. 24.1); the operative
    # transmittal is the FedEx shipment tendered July 10, 2026.
    ("copperline", 2024): ("overnight", dt.date(2025, 5, 23)),
    ("copperline", 2025): ("overnight", dt.date(2026, 7, 10)),
}


def _nth_weekday(year, month, weekday, n):
    d = dt.date(year, month, 1)
    d += dt.timedelta(days=(weekday - d.weekday()) % 7)
    return d + dt.timedelta(days=7 * (n - 1))


def _last_weekday(year, month, weekday):
    d = dt.date(year + (month == 12), month % 12 + 1, 1) - dt.timedelta(days=1)
    return d - dt.timedelta(days=(d.weekday() - weekday) % 7)


# California Government Code section 6700 holidays (other than Sundays, which are not business days
# anyway), 2025-2027. Lunar New Year and Diwali are listed by their dates in these years; none falls
# within any period computed here. Thanksgiving is a holiday as a day appointed by the President.
LUNAR_NEW_YEAR_AND_DIWALI = {dt.date(2025, 1, 29), dt.date(2026, 2, 17), dt.date(2027, 2, 6),
                             dt.date(2025, 10, 20), dt.date(2026, 11, 8), dt.date(2027, 10, 29)}


def ca_holidays(year):
    MON, THU, FRI = 0, 3, 4
    h = {
        dt.date(year, 1, 1),
        _nth_weekday(year, 1, MON, 3),     # Dr. Martin Luther King, Jr. Day
        dt.date(year, 2, 12),              # Lincoln Day
        _nth_weekday(year, 2, MON, 3),     # third Monday in February
        dt.date(year, 3, 31),              # Cesar Chavez Day / Farmworkers Day
        dt.date(year, 4, 24),              # Genocide Remembrance Day
        _last_weekday(year, 5, MON),       # last Monday in May
        dt.date(year, 6, 19),              # Juneteenth
        dt.date(year, 7, 4),
        _nth_weekday(year, 9, MON, 1),     # first Monday in September
        dt.date(year, 9, 9),               # Admission Day
        _nth_weekday(year, 9, FRI, 4),     # Native American Day
        _nth_weekday(year, 10, MON, 2),    # Columbus Day
        dt.date(year, 11, 11),             # Veterans Day
        _nth_weekday(year, 11, THU, 4),    # Thanksgiving (appointed by the President)
        dt.date(year, 12, 25),
    }
    h |= {d for d in LUNAR_NEW_YEAR_AND_DIWALI if d.year == year}
    # Sunday rule: fixed-date holidays falling on a Sunday are observed the following Monday.
    for d in list(h):
        if d.weekday() == 6 and (d.month, d.day) in {(1, 1), (2, 12), (3, 31), (6, 19), (7, 4), (9, 9), (11, 11), (12, 25)}:
            h.add(d + dt.timedelta(days=1))
    return h


CA_HOLIDAYS = set().union(*(ca_holidays(y) for y in (2025, 2026, 2027)))


# ---------------------------------------------------------------------------
# Lease terms (as amended / supplemented)
# ---------------------------------------------------------------------------
LEASES = {
    "brightwater": {
        "base_year": 2022,
        "cap": "cumulative",
        # s. 5.7 as amended by First Amendment s. 3: 4% for years before 2024, 3% from 2024;
        # Base Year not recomputed.
        "mgmt": ("gr_cap", {2022: 0.04, 2023: 0.04, 2024: 0.03, 2025: 0.03}),
        "gr_excludes_insurance": True,
        "tax_compare": "combined",
        "cio_window": None,
        "refunds": "relate",
        "deductible_cap": 25000.0,
        "capital_savings_limit": True,
        "vp_salary_excluded": True,
        "gross_up_to": 0.95,
        "prs": {2024: 30000 / 500000, 2025: 31200 / 480000},
        "objection": ("days", 120),  # First Amendment s. 2 (was 90)
    },
    "harlow_pike": {
        "base_year": 2023,
        "cap": "noncumulative",
        "mgmt": ("in_lieu", 0.04),  # side letter para. 1 (lease says 5%)
        "gr_excludes_insurance": True,
        "tax_compare": "separate",
        # s. 5.1(d): changes in ownership occurring in the first 60 months of the Term (2023-2027)
        "cio_window": (dt.date(2023, 1, 1), dt.date(2027, 12, 31)),
        "refunds": "relate",
        "deductible_cap": 25000.0,
        "capital_savings_limit": True,
        "vp_salary_excluded": True,
        "gross_up_to": 0.95,
        "prs": {2024: 40000 / 500000, 2025: 40000 / 500000},
        "objection": ("months", 18),  # side letter para. 2 (lease says 12 months)
    },
    "copperline": {
        "base_year": None,
        "cap": None,
        "mgmt": ("gr_cap", {2024: 0.04, 2025: 0.04}),
        "gr_excludes_insurance": False,
        "tax_compare": "stop",
        # s. 5.4: changes in ownership occurring in the first five Lease Years (2020-2024)
        "cio_window": (dt.date(2020, 1, 1), dt.date(2024, 12, 31)),
        "refunds": "received",
        "deductible_cap": None,
        "capital_savings_limit": False,
        "vp_salary_excluded": False,
        "gross_up_to": 1.00,
        "objection": ("days", 90),
    },
}

VAR_CTRL = {"6100", "6110"}           # janitorial, trash: variable, controllable
VAR_UNCTRL = {"6200", "6210"}         # electricity, water/sewer: variable, uncontrollable
FIXED_UNCTRL = {"6300", "6400"}       # insurance premiums, snow and ice removal
FIXED_CTRL = {"6500", "6510", "6520", "6600", "6700", "6800", "6900"}
EXCLUDED_ALL = {
    "6205",  # sub-metered electricity separately charged to tenants
    "6530",  # correction of original construction defect
    "7100", "7110", "7120",  # leasing costs
    "7115",  # litigation with tenants
    "7200",  # tenant improvements
    "7300", "7310",  # debt and financing
    "7320",  # depreciation
    "7400",  # reserves
    "7500",  # charitable
    "7510", "7511",  # penalties / late charges
    "7520",  # art
    "7530",  # ownership entity
    "7540",  # bad debt
    "7600",  # capital, not within capital exception
    "8100",  # franchise tax
}
BASE_YEAR_ONLY = {"6105", "6206"}
TAX_GLS = {"8000", "8010", "8020", "8030"}  # none in the current ledger; kept for safety


def money(x):
    return round(x + 0.0, 2)


def load_ledger():
    led = defaultdict(list)
    with open(os.path.join(MAT, "building", "expense_ledger_2022_2025.csv")) as f:
        for r in csv.DictReader(f):
            led[int(r["year"])].append((r["gl_account"], float(r["amount"])))
    return led


def load_occupancy():
    occ = {}
    with open(os.path.join(MAT, "building", "occupancy.csv")) as f:
        for r in csv.DictReader(f):
            occ[int(r["year"])] = float(r["average_occupancy_percent"]) / 100.0
    occ.update(OCCUPANCY_CORRECTIONS)
    return occ


def load_gross_receipts():
    rows = []
    with open(os.path.join(MAT, "building", "gross_receipts.csv")) as f:
        for r in csv.DictReader(f):
            rows.append((int(r["year"]), r["item"].lower(), float(r["amount"])))
    return rows


LEDGER = load_ledger()
OCC = load_occupancy()
GR_ROWS = load_gross_receipts()


def gross_receipts(tenant, year):
    lease = LEASES[tenant]
    tot = 0.0
    for y, item, amt in GR_ROWS:
        if y != year:
            continue
        if "security deposits" in item or "refinancing" in item:
            continue
        if "insurance proceeds" in item and lease["gr_excludes_insurance"]:
            continue
        tot += amt
    return tot


def opex_buckets(tenant, year, is_base_year=False):
    """(controllable, uncontrollable) for the year before any controllable cap."""
    lease = LEASES[tenant]
    var_c = var_u = fix_c = fix_u = 0.0
    mgmt_actual = 0.0
    for gl, amt in LEDGER[year]:
        if gl in TAX_GLS or gl in EXCLUDED_ALL:
            continue
        if gl in VAR_CTRL:
            var_c += amt
        elif gl in VAR_UNCTRL:
            var_u += amt
        elif gl in FIXED_UNCTRL:
            fix_u += amt
        elif gl in FIXED_CTRL:
            fix_c += amt
        elif gl in BASE_YEAR_ONLY:
            if is_base_year:
                continue
            if gl == "6105":
                var_c += amt
            else:
                var_u += amt
        elif gl == "6710":
            if lease["vp_salary_excluded"]:
                continue
            fix_c += amt
        elif gl == "6525":
            if is_base_year:
                continue
            c = CASUALTY[year]
            retained = c["gross"] - c["insurer_paid"]
            if lease["deductible_cap"] is not None:
                retained = min(retained, lease["deductible_cap"])
            fix_c += retained
        elif gl == "7610":
            if is_base_year:
                continue
            annual = LED_COST / LED_USEFUL_LIFE_YEARS
            if lease["capital_savings_limit"]:
                annual = min(annual, LED_SAVINGS[year])
            fix_c += annual
        elif gl == "7000":
            mgmt_actual += amt
        else:
            raise ValueError(f"unclassified GL {gl} in {year}")
    occ = OCC[year]
    target = lease["gross_up_to"]
    g = target / occ if occ < target else 1.0
    var_c *= g
    var_u *= g
    kind, param = lease["mgmt"]
    if kind == "gr_cap":
        mgmt = min(mgmt_actual, param[year] * gross_receipts(tenant, year))
    else:
        mgmt = param * (var_c + var_u + fix_c + fix_u)
    return var_c + fix_c + mgmt, var_u + fix_u


def opex_for(tenant, year):
    lease = LEASES[tenant]
    by = lease["base_year"]
    if lease["cap"] is None:
        c, u = opex_buckets(tenant, year)
        return c + u
    base_c, base_u = opex_buckets(tenant, by, True)
    if year == by:
        return base_c + base_u
    c, u = opex_buckets(tenant, year)
    if lease["cap"] == "cumulative":
        cap = base_c * (1.05 ** (year - by))
    else:
        prior = base_c if year - 1 == by else opex_buckets(tenant, year - 1)[0]
        cap = 1.05 * prior
    return min(c, cap) + u




# ---------------------------------------------------------------------------
# Property tax bills and roll (building/property_tax_bills.csv, assessor_roll_values.csv)
# ---------------------------------------------------------------------------
OFFICE, GARAGE = "5101-001-010", "5101-001-011"
PARCELS = (OFFICE, GARAGE)
# BOE inflation factors (R&T 51(a)(1)(C); BOE Letters To Assessors 2024/053 and 2026/002)


def load_bills():
    rows = []
    with open(os.path.join(MAT, "building", "property_tax_bills.csv")) as f:
        for r in csv.DictReader(f):
            r["total_bill"] = float(r["total_bill"])
            r["ad_valorem_tax"] = float(r["ad_valorem_tax"])
            r["rate"] = float(r["ad_valorem_rate"].rstrip("%")) / 100.0
            rows.append(r)
    return rows


def load_roll():
    roll = {}
    with open(os.path.join(MAT, "building", "assessor_roll_values.csv")) as f:
        for r in csv.DictReader(f):
            roll[(r["fiscal_year"], r["apn"])] = int(r["taxable_value_land_and_improvements"])
    return roll


BILLS = load_bills()
ROLL = load_roll()


def fy_label(start_year):
    return f"{start_year}-{str(start_year + 1)[2:]}"


def rate_for(fy):
    return next(b["rate"] for b in BILLS if b["fiscal_year"] == fy and b["bill_type"] == "Secured")


# Changes in ownership that produced levied tax increases, with the date they occurred.
# The September 30, 2024 deed (T7) is the only one reflected in any bill issued to date.
T7_DATE = dt.date(2024, 9, 30)


# Inflation factors (R&T 51(a)(1)(C); BOE LTAs 2021/065, 2024/053, 2026/002)
FACTORS = {"2018-19": 1.02, "2019-20": 1.02, "2020-21": 1.02, "2021-22": 1.01036, "2022-23": 1.02,
           "2023-24": 1.02, "2024-25": 1.02, "2025-26": 1.02, "2026-27": 1.02}
# Garage: purchased March 1, 2017 for $19,600,000 (ownership_history.md); a January-June change is
# first factored on the following January 1 (R&T 75.18), i.e. from the 2018-19 roll.
GARAGE_2017_BYV = 19600000


def garage_factored_byv(fy):
    v = GARAGE_2017_BYV
    for f in ("2018-19", "2019-20", "2020-21", "2021-22", "2022-23", "2023-24", "2024-25", "2025-26"):
        v = round(v * FACTORS[f])
        if f == fy:
            return v
    raise ValueError(fy)


# Market values on lien dates (valuation_report.md)
FMV = {  # (apn, date) -> full cash value
    (OFFICE, dt.date(2025, 1, 1)): 351000000, (GARAGE, dt.date(2025, 1, 1)): 24200000,
    (OFFICE, dt.date(2022, 11, 18)): 298000000, (GARAGE, dt.date(2022, 11, 18)): 18600000,
    (OFFICE, dt.date(2023, 2, 6)): 301000000, (GARAGE, dt.date(2023, 2, 6)): 19000000,
    (OFFICE, dt.date(2023, 4, 17)): 304500000, (GARAGE, dt.date(2023, 4, 17)): 19300000,
    (OFFICE, dt.date(2024, 1, 1)): 316000000, (GARAGE, dt.date(2024, 1, 1)): 21000000,
    (OFFICE, dt.date(2026, 1, 12)): 362000000, (GARAGE, dt.date(2026, 1, 12)): 26100000,
    (OFFICE, dt.date(2026, 3, 3)): 362000000, (GARAGE, dt.date(2026, 3, 3)): 27000000,
    (OFFICE, dt.date(2026, 7, 1)): 362000000, (GARAGE, dt.date(2026, 7, 1)): 28700000,
    (OFFICE, dt.date(2026, 8, 14)): 371500000, (GARAGE, dt.date(2026, 8, 14)): 29400000,
}


def counterfactual_value(apn, fy):
    """Taxable value for `fy` had the T7 change in ownership not occurred, treating pre-change
    enrolled values as correct: lesser of factored base year value and market value on the lien date
    (R&T 51(a)); a decline-in-value parcel is restored to its factored base year value, not grown 2%."""
    lien = dt.date(int(fy[:4]), 1, 1)
    if apn == OFFICE:  # enrolled at its factored 2009 base year value throughout
        fbyv = round(ROLL[(fy_label(int(fy[:4]) - 1), apn)] * FACTORS[fy])
    else:
        fbyv = garage_factored_byv(fy)
    return min(fbyv, FMV[(apn, lien)])


def cio_increase(fy, cio_date):
    """Increase in Taxes for fiscal year `fy` resulting from the change in ownership on `cio_date`:
    Taxes billed minus Taxes that would have been billed without it."""
    inc = 0.0
    for b in BILLS:
        if b["fiscal_year"] != fy:
            continue
        if b["bill_type"] == "Supplemental" and b["event_date"] == cio_date.strftime("%m/%d/%Y"):
            inc += b["total_bill"]  # supplemental bill exists only because of the change
    lien = dt.date(int(fy[:4]), 1, 1)
    if dt.date(int(fy[:4]) - 1, 1, 1) <= cio_date < lien:  # first roll reflecting the change
        for apn in PARCELS:
            sec = next(b for b in BILLS if b["fiscal_year"] == fy and b["apn"] == apn and b["bill_type"] == "Secured")
            inc += sec["ad_valorem_tax"] - money(counterfactual_value(apn, fy) * sec["rate"])
    return inc


def fy_taxes(tenant, fy):
    lease = LEASES[tenant]
    t = sum(b["total_bill"] for b in BILLS if b["fiscal_year"] == fy)
    if lease["refunds"] == "relate" and fy == EIFD_REFUND["fy"]:
        t -= EIFD_REFUND["amount"] - EIFD_REFUND["fee"]
    lo, hi = lease["cio_window"] or (None, None)
    if lo is not None and lo <= T7_DATE <= hi:
        t -= cio_increase(fy, T7_DATE)
    return t


def taxes_for(tenant, year):
    t = 0.5 * fy_taxes(tenant, fy_label(year - 1)) + 0.5 * fy_taxes(tenant, fy_label(year))
    if LEASES[tenant]["refunds"] == "received" and year == EIFD_REFUND["calendar_year_received"]:
        t += -EIFD_REFUND["amount"] + EIFD_REFUND["fee"]
    return t


def tenant_share(tenant, year, opex, tax):
    lease = LEASES[tenant]
    if lease["tax_compare"] == "combined":
        by = lease["base_year"]
        base = opex_for(tenant, by) + taxes_for(tenant, by)
        return lease["prs"][year] * max(0.0, opex + tax - base)
    if lease["tax_compare"] == "separate":
        by = lease["base_year"]
        prs = lease["prs"][year]
        return prs * (max(0.0, opex - opex_for(tenant, by)) + max(0.0, tax - taxes_for(tenant, by)))
    # Copperline: expense stop, original premises and expansion space computed separately
    total = opex + tax
    orig = max(0.0, (25000 / 500000) * total - 21.00 * 25000)
    if year < 2025:
        return orig
    exp = max(0.0, (7500 / 500000) * total - 23.00 * 7500)
    days = (dt.date(2025, 12, 31) - COPPERLINE_EXPANSION_START).days + 1
    return orig + exp * days / 365


REGISTERS = {"brightwater": "brightwater_payment_register.csv",
             "harlow_pike": "harlow_pike_payment_register.csv",
             "copperline": "copperline_payment_register.csv"}


def estimates_paid(tenant, year):
    total = 0.0
    with open(os.path.join(MAT, "tenant_payments", REGISTERS[tenant])) as f:
        for r in csv.DictReader(f):
            if r["charge_type"] == "Escalation estimate" and r["period"].startswith(f"{year}-"):
                total += float(r["amount"])
    return total




# ---------------------------------------------------------------------------
# Objection deadlines (lease s. 24.1 / 24.2; Gov. Code 6700 business days)
# ---------------------------------------------------------------------------
def is_business_day(d):
    return d.weekday() < 5 and d not in CA_HOLIDAYS


def add_business_days(d, n):
    while n:
        d += dt.timedelta(days=1)
        if is_business_day(d):
            n -= 1
    return d


def roll_forward(d):
    while not is_business_day(d):
        d += dt.timedelta(days=1)
    return d


def add_months(d, m):
    y, mo = divmod(d.month - 1 + m, 12)
    return dt.date(d.year + y, mo + 1, d.day)


def objection_deadline(tenant, year):
    method, sent = TRANSMITTALS[(tenant, year)]
    if method == "hand":
        received = sent
    elif method == "overnight":
        received = add_business_days(sent, 1)
    else:
        received = add_business_days(sent, 3)
    kind, n = LEASES[tenant]["objection"]
    raw = received + dt.timedelta(days=n) if kind == "days" else add_months(received, n)
    return roll_forward(raw)


# ---------------------------------------------------------------------------
# Part B: change in ownership analysis (R&T 60-64; Property Tax Rule 462.180)
# ---------------------------------------------------------------------------
# Entity ownership (fractions). Corporations wholly owned by one person are modelled as entities.
SUBSIDIARIES = {  # entity -> sole owner, for wholly owned entities (from ownership_history.md)
    "Northgate Realty Holdings": "Northgate Life",
}
SPOUSES = {frozenset({"Ana Ruiz", "Daniel Ruiz"})}

# Each transfer: kind, entity whose interests move (or deed), parties, amount.
TRANSFERS = [
    ("T1", dt.date(2016, 6, 1), "deed", {"from": {"Ana Ruiz": .5, "Cole": .5}, "to": "HSOP",
                                         "to_owners": {"Ana Ruiz": 50, "Cole": 50}, "parcels": [OFFICE]}),
    ("T2", dt.date(2019, 3, 15), "interest", {"entity": "HSOP", "from": "Ana Ruiz", "to": "Kestrel", "units": 20}),
    ("T3", dt.date(2021, 8, 2), "interest", {"entity": "HSOP", "from": "Kestrel", "to": "Lumen", "units": 20}),
    ("T4", dt.date(2022, 11, 18), "interest", {"entity": "HSOP", "from": "Cole", "to": "Brandt", "units": 25}),
    ("T5", dt.date(2023, 2, 6), "interest", {"entity": "HSOP", "from": "Ana Ruiz", "to": "Daniel Ruiz", "units": 6}),
    ("T6", dt.date(2023, 4, 17), "interest", {"entity": "HSOP", "from": "Ana Ruiz", "to": "Marco Ruiz", "units": 8}),
    ("T7", dt.date(2024, 9, 30), "deed", {"from": {"HSOP": 1.0}, "to": "MTO",
                                          "to_owners": {"Pacific Rim": 450, "Sutter": 300, "Northgate Life": 250},
                                          "parcels": [OFFICE, GARAGE]}),
    ("T8", dt.date(2025, 5, 20), "interest", {"entity": "MTO", "from": "Sutter", "to": "Northgate Life", "units": 200}),
    ("T9", dt.date(2026, 1, 12), "redemption", {"entity": "MTO", "from": "Pacific Rim", "units": 150}),
    ("T10", dt.date(2026, 3, 3), "interest", {"entity": "MTO", "from": "Northgate Life", "to": "Northgate Realty Holdings", "units": 450}),
    ("T11", dt.date(2026, 7, 1), "deed", {"from": {"MTO": 1.0}, "to": "Propco", "to_owners": {"MTO": 1},
                                          "parcels": [OFFICE, GARAGE]}),
    ("T12", dt.date(2026, 8, 14), "parent_stock", {"entity": "Northgate Life", "to": "Halvorsen"}),
]


class World:
    def __init__(self):
        self.units = {"HSOP": {}, "Northgate Life": {}}  # entity -> holder -> units ({} = widely held)
        for sub, parent in SUBSIDIARIES.items():
            self.units[sub] = {parent: 1}
        self.owner = {OFFICE: "Ruiz/Cole TIC", GARAGE: "HSOP"}  # garage bought by HSOP 2017
        self.excluded = {}        # entity -> parcels held under a 62(a)(2) exclusion
        self.original = {}        # entity -> set of original co-owners
        self.cumulative = {}      # entity -> fraction transferred by original co-owners

    def frac(self, entity):
        u = self.units.get(entity, {})
        tot = sum(u.values())
        return {k: v / tot for k, v in u.items() if v} if tot else {}

    def controllers(self, entity, seen=()):
        """Persons with direct or indirect ownership/control of more than 50% of `entity`."""
        out = set()
        for holder, f in self.frac(entity).items():
            if f > 0.5:
                out.add(holder)
                if holder in self.units and holder not in seen:
                    out |= self.controllers(holder, seen + (entity,))
        return out

    def parcels_of(self, entity):
        return sorted(p for p, o in self.owner.items() if o == entity or entity in self.controllers(o))

    def property_controllers(self):
        return {p: self.controllers(o) | {o} for p, o in self.owner.items()}


def proportional(world, transferor, transferee):
    """Rule 462.180(d)(4): transferee wholly owned by transferor (or vice versa)."""
    return world.frac(transferee) == {transferor: 1.0} or world.frac(transferor) == {transferee: 1.0}


def interspousal(a, b):
    return frozenset({a, b}) in SPOUSES


def analyze_transfers():
    w = World()
    result = {}
    events = {}
    for tid, date, kind, d in TRANSFERS:
        reappraised = set()
        before = w.property_controllers()
        counted = 0.0
        excluded_transfer = False
        if kind == "deed":
            tot = sum(d["to_owners"].values())
            new_props = {k: v / tot for k, v in d["to_owners"].items()}
            prop = new_props == d["from"]  # same persons, same proportions (R&T 62(a)(2))
            w.units[d["to"]] = dict(d["to_owners"])
            for p in d["parcels"]:
                w.owner[p] = d["to"]
            if prop:  # R&T 62(a)(2): transferors become original co-owners
                w.excluded[d["to"]] = set(d["parcels"])
                w.original[d["to"]] = set(new_props)
                w.cumulative[d["to"]] = 0.0
            else:
                reappraised |= set(d["parcels"])
        else:
            ent = d["entity"]
            if kind == "interest":
                u = w.units[ent]
                pct = d["units"] / sum(u.values())
                excluded_transfer = proportional(w, d["from"], d["to"]) or interspousal(d["from"], d["to"])
                u[d["from"]] -= d["units"]
                u[d["to"]] = u.get(d["to"], 0) + d["units"]
                if d["from"] in w.original.get(ent, set()) and not excluded_transfer:
                    counted = pct
            elif kind == "redemption":
                w.units[ent][d["from"]] -= d["units"]
            elif kind == "parent_stock":
                w.units[ent] = {d["to"]: 1}
            after = w.property_controllers()
            # R&T 64(c)(1) / Rule 462.180(d)(1): a person newly obtaining direct or indirect control
            if not excluded_transfer:
                for p in PARCELS:
                    if after[p] - before[p] - {w.owner[p]}:
                        reappraised.add(p)
            # R&T 64(d) / Rule 462.180(d)(2): original co-owners' cumulative transfers > 50%
            if counted and ent in w.cumulative:
                w.cumulative[ent] += counted
                if w.cumulative[ent] > 0.5 + 1e-12 and not reappraised:
                    reappraised |= w.excluded.pop(ent, set())
                    w.cumulative.pop(ent)
        result[tid] = sorted(reappraised)
        events[tid] = (date, sorted(reappraised))
    return result, events


# ---------------------------------------------------------------------------
# Supplemental assessments the law requires for unbilled events (R&T 75.11, 75.18, 75.41)
# ---------------------------------------------------------------------------
PRORATION = {8: .92, 9: .83, 10: .75, 11: .67, 12: .58, 1: .50, 2: .42, 3: .33, 4: .25, 5: .17, 6: .08}
SCOPE_CIO = (dt.date(2022, 1, 1), dt.date(2026, 9, 30))
SCOPE_NC = (dt.date(2026, 1, 1), dt.date(2026, 9, 30))
# garage_work_2026.md: new parking level completed April 15, 2026, value $2,600,000 (begun after
# the January 1, 2026 lien date). The fire repair is timely reconstruction substantially equivalent
# to the pre-fire property, so it is not new construction (R&T 70(c)).
NEW_CONSTRUCTION = [(dt.date(2026, 4, 15), GARAGE, 2600000)]
OUT_FYS = ("2022-23", "2023-24", "2025-26", "2026-27")


def supplemental_taxes(transfers):
    """transfers: {tid: (date, [apns])} from the change-in-ownership analysis."""
    events = []
    for tid, (date, apns) in transfers.items():
        if not (SCOPE_CIO[0] <= date <= SCOPE_CIO[1]):
            continue
        if date == T7_DATE:  # already billed (property_tax_bills.csv)
            continue
        for apn in apns:
            events.append((date, apn, "cio", FMV[(apn, date)]))
    for date, apn, val in NEW_CONSTRUCTION:
        if SCOPE_NC[0] <= date <= SCOPE_NC[1]:
            events.append((date, apn, "nc", val))
    events.sort()
    entered = {}  # (apn, fy) -> roll value plus supplemental entries so far (75.11(c) netting)
    out = {apn: {fy: 0.0 for fy in OUT_FYS} for apn in PARCELS}
    for date, apn, kind, val in events:
        presumed = (date.replace(day=1) + dt.timedelta(days=32)).replace(day=1)  # 75.41(b)
        if 1 <= date.month <= 5:
            rolls = [(fy_label(date.year - 1), PRORATION[presumed.month]), (fy_label(date.year), 1.00)]
        elif date.month >= 7:
            rolls = [(fy_label(date.year), PRORATION[presumed.month])]
        else:
            raise ValueError("June events not modelled")
        for fy, factor in rolls:
            cur = entered.setdefault((apn, fy), ROLL[(fy, apn)])
            new = val if kind == "cio" else cur + val
            sv = new - cur
            entered[(apn, fy)] = new
            if fy in out[apn]:
                out[apn][fy] += sv * rate_for(fy) * factor
    return {apn: {fy: money(v) for fy, v in d.items()} for apn, d in out.items()}


def office_value_2024_25(transfers):
    """Taxable value at which the office parcel should have been enrolled for 2024-25."""
    lien = dt.date(2024, 1, 1)
    byv, byv_date = None, None
    for tid, (date, apns) in transfers.items():
        if OFFICE in apns and date < lien:
            byv, byv_date = FMV[(OFFICE, date)], date
    if byv is None:
        return ROLL[("2024-25", OFFICE)]
    v = byv
    # factored on each January 1 after the change (R&T 75.18 for Jan-Jun changes; 110.1(f))
    y = byv_date.year + 1
    while y <= 2024:
        v = round(v * FACTORS[fy_label(y)])
        y += 1
    return min(v, FMV[(OFFICE, lien)])


def compute():
    out = {"tenants": {}}
    for tenant in LEASES:
        t = {}
        for y in YEARS:
            opex = opex_for(tenant, y)
            tax = taxes_for(tenant, y)
            t[str(y)] = {
                "taxes": money(tax),
                "tenant_share": money(tenant_share(tenant, y, opex, tax)),
                "objection_deadline": objection_deadline(tenant, y).isoformat(),
            }
        out["tenants"][tenant] = t
    _, events = analyze_transfers()
    out["office_taxable_value_2024_25"] = money(office_value_2024_25(events))
    out["supplemental_taxes"] = supplemental_taxes(events)
    return out


def debug():
    for tenant in LEASES:
        for y in (LEASES[tenant]["base_year"], 2024, 2025):
            if y is None:
                continue
            print(tenant, y, "opex", round(opex_for(tenant, y), 2), "taxes", round(taxes_for(tenant, y), 2))


def main():
    out = compute()
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as f:
        json.dump(out, f, indent=2)
    print(json.dumps(out, indent=2))
    if os.environ.get("DEBUG"):
        debug()


if __name__ == "__main__":
    main()
