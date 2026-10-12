#!/usr/bin/env python3
"""Reference solver for the ucc9-priority task.

Facts are encoded as data (transcribed from the case file). UCC Article 9 rules are encoded as
functions: attachment (9-203(b), (d)-(e) new debtors), perfection by filing and control,
duration and lapse of financing statements (9-510(c), 9-515), effectiveness of a filing after
transfer or against a new debtor (9-507(a), 9-508), lien creditors (9-317(a)(2), (e)), buyers
(1-201(b)(9), 9-317(b), 9-320(a)), the general priority rule (9-322(a), (b)(1)), purchase-money
status and priority (9-103(b)(2), (e), (f); 9-324(a)-(c), (g)), transferred collateral (9-325),
new-debtor subordination (9-326), deposit accounts (9-327), chattel paper (9-330), application of
disposition proceeds (9-615(a), (d)), and the Protocol's net-proceeds and waterfall mechanics.

Set SOLVER_BUGS (comma-separated) to switch off individual rules for grader sensitivity tests.
"""
import json
import os
import sys
from datetime import date
from decimal import Decimal as D, ROUND_HALF_UP

BUGS = set(filter(None, os.environ.get("SOLVER_BUGS", "").split(",")))

C = D("0.01")


def q(x):
    return D(x).quantize(C, rounding=ROUND_HALF_UP)


def add_years(d, n):
    try:
        return d.replace(year=d.year + n)
    except ValueError:  # Feb 29
        return d.replace(year=d.year + n, day=28)


def add_months(d, n):
    m = d.month - 1 + n
    y = d.year + m // 12
    m = m % 12 + 1
    day = min(d.day, [31, 29 if y % 4 == 0 else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1])
    return date(y, m, day)


FAR = date(9999, 12, 31)
SALE_DATE = date(2026, 9, 22)
MACHINE_A_DISPOSITION = date(2026, 9, 15)

# Ashby Valve Works, Inc. merged into Kestrel effective 2025-12-01; Kestrel became bound as new
# debtor under Pinecrest's security agreement with Ashby (9-203(d)(2)).
NEW_DEBTOR_BOUND = date(2025, 12, 1)
FOUR_MONTHS_AFTER = add_months(NEW_DEBTOR_BOUND, 4)  # 2026-04-01

# --------------------------------------------------------------------------------------------
# Facts: financing statements. 'covers' = collateral tags indicated. 'debtor' = name on record.
# --------------------------------------------------------------------------------------------
FILINGS = [
    dict(id="IRONWOOD-2020", sp="IRONWOOD", debtor="KESTREL", filed=date(2020, 9, 1),
         conts=[date(2025, 2, 14)], covers={"equipment", "deposit_account"}),
    dict(id="NB-2021", sp="NORTHBRIDGE", debtor="KESTREL", filed=date(2021, 5, 3),
         conts=[date(2026, 4, 27)],
         covers={"equipment", "inventory", "account", "deposit_account", "chattel_paper"}),
    dict(id="CALDER-2021", sp="CALDER", debtor="KESTREL", filed=date(2021, 5, 10),
         conts=[date(2026, 1, 20)], covers={"calder_goods"}),
    dict(id="TRISTATE-2025a", sp="TRISTATE", debtor="KESTREL", filed=date(2025, 6, 19), conts=[],
         covers={"equipment"}),
    dict(id="TRISTATE-2025b", sp="TRISTATE", debtor="KESTREL", filed=date(2025, 9, 5), conts=[],
         covers={"machine_b"}),
    dict(id="IRONWOOD-2025", sp="IRONWOOD", debtor="KESTREL", filed=date(2025, 10, 20), conts=[],
         covers={"equipment", "deposit_account"}),
    dict(id="SUMMIT-2025", sp="SUMMIT", debtor="KESTREL", filed=date(2025, 10, 28), conts=[],
         covers={"account"}),
    dict(id="BRENNAN-2026", sp="BRENNAN", debtor="KESTREL", filed=date(2026, 2, 6), conts=[],
         covers={"machine_c"}),
    # filed against Ashby Valve Works, Inc. (the original debtor); seriously misleading as to Kestrel
    dict(id="PINECREST-2022", sp="PINECREST", debtor="ASHBY", filed=date(2022, 8, 15), conts=[],
         covers={"equipment"}),
]


def fs_effective_periods(fs):
    """9-515(a),(c)-(e) and 9-510(c): five-year life; a continuation counts only if filed within
    six months before lapse; lapse ends effectiveness (a new initial FS is a separate record)."""
    start = fs["filed"]
    lapse = add_years(start, 5)
    for c in sorted(fs["conts"]):
        window_open = add_months(lapse, -6)
        timely = window_open <= c < lapse
        if "continuation_any_time" in BUGS and c < lapse:
            timely = True
        if timely:
            lapse = add_years(lapse, 5)
    return [(start, lapse)]  # effective on [start, lapse)


def fs_covers(fs, asset):
    return bool(fs["covers"] & asset["tags"])


# --------------------------------------------------------------------------------------------
# Facts: the assets in each pool.
# --------------------------------------------------------------------------------------------
CP_MERIDIAN = dict(who="MERIDIAN", date=date(2026, 6, 12), new_value=True, possession=True,
                   good_faith=True, ordinary_course=True, knowledge_of_violation=False)

ASSETS = {
    "EQ-A": dict(kind="equipment", tags={"equipment"}, rights=date(2025, 5, 28),
                 received=date(2025, 6, 2), origin="KESTREL",
                 pm=[dict(who="TRISTATE", sa="TRISTATE-A", role="lender")],
                 pm_agreement_prohibits_bank_lien=True,
                 liens=[("DELMAR", date(2025, 6, 10))]),
    "EQ-B": dict(kind="equipment", tags={"equipment", "machine_b"}, rights=date(2025, 7, 30),
                 received=date(2025, 8, 4), origin="KESTREL",
                 pm=[dict(who="TRISTATE", sa="TRISTATE-B", role="lender")],
                 pm_agreement_prohibits_bank_lien=False, liens=[]),
    "EQ-C": dict(kind="equipment", tags={"equipment", "machine_c"}, rights=date(2026, 1, 15),
                 received=date(2026, 1, 22), origin="KESTREL",
                 pm=[dict(who="BRENNAN", sa="BRENNAN-RIC", role="seller"),
                     dict(who="NORTHBRIDGE", sa="NB-LSA", role="lender")],
                 pm_agreement_prohibits_bank_lien=False, liens=[]),
    "EQ-ASHBY": dict(kind="equipment", tags={"equipment"}, rights=NEW_DEBTOR_BOUND, origin="ASHBY",
                     liens=[],
                     prior_owner_si=dict(who="PINECREST", created_by="ASHBY", sa_date=date(2022, 8, 10),
                                         attached=date(2022, 8, 10))),
    "EQ-GEN": dict(kind="equipment", tags={"equipment"}, rights=date(2019, 1, 1), origin="KESTREL",
                   liens=[("DELMAR", date(2025, 6, 10))]),
    "EQ-HAAS": dict(kind="equipment", tags={"equipment"}, rights=date(2026, 2, 17),
                    received=date(2026, 2, 24), origin="KESTREL",
                    liens=[("QUARRY", date(2026, 6, 18))]),
    "EQ-HURCO": dict(kind="equipment", tags={"equipment"}, rights=date(2026, 5, 12),
                     received=date(2026, 5, 19), origin="KESTREL",
                     liens=[("QUARRY", date(2026, 6, 18))]),
    "INV-ORRIN": dict(kind="inventory", tags={"inventory"}, rights=date(2026, 7, 27),
                      received=date(2026, 7, 27), liens=[],
                      reclamation=dict(who="ORRIN", received=date(2026, 7, 27), demand=date(2026, 8, 4))),
    "INV-CONSIGNED": dict(kind="inventory", tags={"inventory"}, rights=date(2025, 1, 15),
                          received=date(2025, 1, 15), liens=[],
                          consignor=dict(who="WESTFIELD", filed=False)),
    "CP-LEGENDED": dict(kind="chattel_paper", tags={"chattel_paper"}, rights=date(2025, 3, 18), liens=[],
                        cp_purchaser=CP_MERIDIAN, legend_to="NORTHBRIDGE"),
    "INV-CALDER-1": dict(kind="inventory", tags={"inventory", "calder_goods"},
                         rights=date(2026, 3, 2), received=date(2026, 3, 2), liens=[]),
    "INV-CALDER-2": dict(kind="inventory", tags={"inventory", "calder_goods"},
                         rights=date(2026, 7, 15), received=date(2026, 7, 15), liens=[]),
    # accounts that are proceeds of Calder goods received 2026-03-02
    "AR-CALDER": dict(kind="account", tags={"account"}, rights=date(2026, 3, 9), liens=[],
                      proceeds_of=dict(tags={"inventory", "calder_goods"}, rights=date(2026, 3, 2),
                                       received=date(2026, 3, 2), kind="inventory")),
    "AR-PELLSTON": dict(kind="account", tags={"account"}, rights=date(2025, 9, 26), liens=[],
                        transferee="SUMMIT", transfer_date=date(2025, 11, 3)),
    "DA-NORTHBRIDGE": dict(kind="deposit_account", tags={"deposit_account"}, bank="NORTHBRIDGE",
                           rights=date(2016, 1, 1), liens=[]),
    "DA-COBALT": dict(kind="deposit_account", tags={"deposit_account"}, bank="COBALT",
                      rights=date(2018, 1, 1), liens=[]),
    "LOT-GANTRY": dict(kind="inventory", tags={"inventory"}, rights=date(2026, 1, 1), liens=[],
                       goods_buyer=dict(who="GANTRY", date=date(2026, 7, 29), good_faith=True,
                                        knowledge_of_violation=False, ordinary_course=True,
                                        seller_in_business=True, satisfaction_of_debt=True, bulk=False,
                                        possession_or_right_to_recover=True, received_delivery=False)),
}

# --------------------------------------------------------------------------------------------
# Facts: security agreements (what each one describes), value, and purchase-money amounts.
# --------------------------------------------------------------------------------------------


def nb_excluded(asset):
    """Northbridge LSA 'Excluded Assets' clause (a), as amended by Amendment No. 2 (2023)."""
    if asset["kind"] != "equipment" or not asset.get("pm"):
        return False
    if not any(p["who"] != "NORTHBRIDGE" for p in asset["pm"]):
        return False
    if "original_excluded_assets" in BUGS:
        return True  # pre-amendment text: all PM-financed equipment excluded
    return bool(asset.get("pm_agreement_prohibits_bank_lien"))


def pm_sa(asset, sa_id):
    return any(p["sa"] == sa_id for p in asset.get("pm", []))


SECURITY_AGREEMENTS = [
    dict(sp="IRONWOOD", id="IRONWOOD-LSA", date=date(2020, 9, 1), value=date(2020, 9, 1),
         describes=lambda a: a["kind"] in ("equipment", "deposit_account")),
    dict(sp="NORTHBRIDGE", id="NB-LSA", date=date(2021, 5, 17), value=date(2021, 5, 17),
         describes=lambda a: a["kind"] in ("equipment", "inventory", "account", "deposit_account",
                                           "chattel_paper")
         and not nb_excluded(a)),
    dict(sp="CALDER", id="CALDER-CSA", date=date(2021, 5, 10), value=None,  # value on each credit sale
         describes=lambda a: "calder_goods" in a["tags"]
         or "calder_goods" in a.get("proceeds_of", {}).get("tags", set())),
    dict(sp="TRISTATE", id="TRISTATE-A", date=date(2025, 5, 28), value=date(2025, 5, 28),
         describes=lambda a: pm_sa(a, "TRISTATE-A")),
    dict(sp="TRISTATE", id="TRISTATE-B", date=date(2025, 7, 30), value=date(2025, 7, 30),
         describes=lambda a: pm_sa(a, "TRISTATE-B")),
    dict(sp="BRENNAN", id="BRENNAN-RIC", date=date(2026, 1, 15), value=date(2026, 1, 15),
         describes=lambda a: pm_sa(a, "BRENNAN-RIC")),
    # Summit's purchase agreement transfers only the Schedule A accounts (sale = security interest)
    dict(sp="SUMMIT", id="SUMMIT-FA", date=date(2025, 11, 3), value=date(2025, 11, 3),
         describes=lambda a: a.get("transferee") == "SUMMIT"),
    # Pinecrest/Ashby agreement binding Kestrel as new debtor (9-203(d)(2), (e)(1)): reaches the
    # new debtor's existing and after-acquired equipment. Ashby-origin equipment is handled as
    # transferred collateral (prior_owner_si), to which 9-508 does not apply (9-508(c)).
    dict(sp="PINECREST", id="PINECREST-NEWDEBTOR", date=NEW_DEBTOR_BOUND, value=date(2022, 8, 10),
         describes=lambda a: a["kind"] == "equipment" and a.get("origin") == "KESTREL"
         and "no_new_debtor_existing" not in BUGS),
]

# Deposit account control (9-104): Ironwood DACAs; depositary bank control is automatic.
CONTROL_AGREEMENTS = {("IRONWOOD", "DA-NORTHBRIDGE"): date(2020, 9, 15),
                      ("IRONWOOD", "DA-COBALT"): date(2020, 9, 15)}

# Subordination agreements (9-339): none in this file.
SUBORDINATIONS = []

# Calder purchase-money notifications (authenticated, compliant content): (recipient, received)
PM_NOTIFICATIONS = {"CALDER": [("NORTHBRIDGE", date(2021, 5, 20)), ("IRONWOOD", date(2021, 5, 21)),
                               ("NORTHBRIDGE", date(2026, 7, 23))]}

# Calder secures the price of all Calder goods (cross-collateral); in inventory, 9-103(b)(2)
# makes that whole obligation purchase-money.
CALDER_PM_OBLIGATIONS = {"batch1": D("286400.00"), "batch2": D("173900.00")}

# Tristate (Exhibits T-2, T-9): the Loan B security agreement secures Loan B (purchase-money,
# incurred 2025-07-30) and the Working Capital Note (not purchase-money, incurred 2025-03-03).
# Payments on account TEF-2507 carried no designation as between the two; no agreed method.
TRISTATE_B = dict(loan_b=D("430000.00"), loan_b_incurred=date(2025, 7, 30),
                  wc=D("150000.00"), wc_incurred=date(2025, 3, 3),
                  payments=[D("15687.50")] * 12)


def tristate_pm_portion():
    """9-103(e)(3): absent an agreed method or obligor designation, payments go (A) to unsecured
    obligations (none), then (B) to obligations secured by PMSIs in the order incurred, so all
    undesignated payments reduce Loan B. 9-103(f)(1): PMSI status survives cross-collateralization."""
    if "dual_status_lost" in BUGS:
        return D(0)
    b, wc = TRISTATE_B["loan_b"], TRISTATE_B["wc"]
    for p in TRISTATE_B["payments"]:
        if "ledger_application" in BUGS:  # Tristate's own ledger: oldest obligation (WC) first
            x = min(p, wc)
            wc -= x
            b -= p - x
        else:
            x = min(p, b)
            b -= x
            wc -= p - x
    return b


def pm_cap(who, pool_id):
    """Purchase-money portion of an SP's secured obligation in a pool's collateral (None = all)."""
    if pool_id == "EQ-B" and who == "TRISTATE":
        return tristate_pm_portion()
    if pool_id == "EQ-C" and who == "NORTHBRIDGE":
        return D("150000.00")  # Capex Advance (Amendment No. 4); no principal repaid
    return None


def calder_pm_priority_amount():
    if "no_cross_collateral" in BUGS:
        return CALDER_PM_OBLIGATIONS["batch1"]
    return sum(CALDER_PM_OBLIGATIONS.values())


# --------------------------------------------------------------------------------------------
# Rule engine
# --------------------------------------------------------------------------------------------


class Interest:
    def __init__(self, who, kind, **kw):
        self.who = who
        self.kind = kind  # 'SI', 'LIEN', 'OWNER_GOODS', 'RECLAIM'
        self.pm = False
        self.cap = None
        self.transferee = False
        self.via_9508 = False
        self.created_by = None
        self.__dict__.update(kw)

    def __repr__(self):
        return f"{self.kind}:{self.who}{'(PM)' if self.pm else ''}"


def attachment_date(sa, asset):
    dates = [sa["date"], asset["rights"]]
    if sa["value"]:
        dates.append(sa["value"])
    return max(dates)


def covering_filings(si, asset):
    """FSs of the SP that are effective as to this collateral and this SI. For proceeds,
    9-322(b)(1)/9-315(d)(1): an FS covering the original collateral is the operative filing."""
    out = []
    for fs in FILINGS:
        if fs["sp"] != si.who:
            continue
        if not (fs_covers(fs, asset) or (asset.get("proceeds_of") and fs_covers(fs, asset["proceeds_of"]))):
            continue
        if fs["debtor"] != "KESTREL":
            if si.created_by == fs["debtor"]:
                pass  # 9-507(a): remains effective as to collateral transferred by that debtor
            elif si.via_9508:
                # 9-508(a), (b): seriously misleading name; effective only for collateral the new
                # debtor acquired before, or within four months after, becoming bound
                if asset["rights"] > FOUR_MONTHS_AFTER and "no_4month" not in BUGS:
                    continue
            else:
                continue
        out.append(fs)
    return out


def filing_periods(si, asset):
    periods = []
    for fs in covering_filings(si, asset):
        periods += fs_effective_periods(fs)
    return periods


def control_start(si, asset):
    if asset["kind"] != "deposit_account":
        return None
    if asset.get("bank") == si.who:
        return si.attached  # 9-104(a)(1)
    c = CONTROL_AGREEMENTS.get((si.who, si.pool))
    if c:
        return max(c, si.attached)
    return None


def perfection_periods(si, asset):
    """Intervals [a, b) during which the SI is actually perfected."""
    out = []
    if getattr(si, "possession_from", None):
        out.append((si.possession_from, FAR))  # 9-313(a)
    if asset["kind"] == "deposit_account":
        cs = control_start(si, asset)
        if cs:
            out.append((cs, FAR))
        return out  # 9-312(b)(1): filing ineffective for deposit accounts
    for (a, b) in filing_periods(si, asset):
        s = max(a, si.attached)
        if s < b:
            out.append((s, b))
    return out


def in_periods(t, periods):
    return any(a <= t < b for a, b in periods)


def perfected_at(si, asset, t):
    return in_periods(t, perfection_periods(si, asset))


def priority_date_9322(si, asset, t_eval):
    """9-322(a)(1): earlier of first filing or perfection, if no later gap with neither."""
    if not perfected_at(si, asset, t_eval):
        return None
    if asset["kind"] == "deposit_account":
        intervals = perfection_periods(si, asset)
    else:
        intervals = filing_periods(si, asset) + perfection_periods(si, asset)
    if "lapse_ignored" in BUGS:
        return min(a for a, b in intervals)
    merged = []
    for a, b in sorted(intervals):
        if merged and a <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], b)
        else:
            merged.append([a, b])
    for a, b in merged:
        if a <= t_eval < b:
            return a
    return None


def first_filing_date(si, asset):
    fl = covering_filings(si, asset)
    return min(f["filed"] for f in fl) if fl else None


def pmsi_9324a_qualifies(si, asset):
    """9-324(a): PMSI in goods other than inventory, perfected when the debtor receives possession
    or within 20 days thereafter."""
    if not (si.kind == "SI" and si.pm and asset["kind"] == "equipment"):
        return False
    if si.cap is not None and si.cap <= 0:
        return False
    rec = asset["received"]
    for d in range(0, 21):
        t = date.fromordinal(rec.toordinal() + d)
        if perfected_at(si, asset, t):
            return True
    return False


def pmsi_9324b_qualifies(si, other, asset):
    if not (si.pm and si.who == "CALDER" and "calder_goods" in asset["tags"] and asset["kind"] == "inventory"):
        return False
    rec = asset["received"]
    if not perfected_at(si, asset, rec):
        return False
    pm_filing = first_filing_date(si, asset)
    other_filing = first_filing_date(other, asset)
    notification_required = other_filing is not None and other_filing < pm_filing
    if not notification_required:
        return True
    window_start = add_years(rec, -5)
    return any(r == other.who and window_start <= when <= rec for r, when in PM_NOTIFICATIONS["CALDER"])


def compare_si_si(x, y, asset, t_eval):
    """Return the senior of two security interests in the same asset."""
    if x.who == y.who:  # two parts of one SP's interest: the purchase-money part first
        return x if x.pm and not y.pm else y if y.pm and not x.pm else x
    # 9-325: SI created by a prior owner, perfected when the debtor acquired the collateral and
    # continuously thereafter, is senior to an SI created by the debtor whose priority would rest
    # solely on 9-322(a)/9-324.
    for a, b in ((x, y), (y, x)):
        if a.created_by and not b.created_by and "no_9325" not in BUGS:
            if perfected_at(a, asset, asset["rights"]) and perfected_at(a, asset, t_eval):
                return a
    # 9-330: purchaser of chattel paper
    if asset["kind"] == "chattel_paper":
        for a, b in ((x, y), (y, x)):
            cp = getattr(a, "cp", None)
            if cp and not getattr(b, "cp", None):
                legend_other = asset["legend_to"] not in ("NONE", a.who)
                if "no_9330_legend" in BUGS:
                    legend_other = False
                base = cp["new_value"] and cp["possession"] and cp["good_faith"] and cp["ordinary_course"]
                if base and not legend_other and not cp["knowledge_of_violation"]:
                    return a
    if "consignor_owner" in BUGS:
        if getattr(x, "consignor", False):
            return x
        if getattr(y, "consignor", False):
            return y
    for sub in SUBORDINATIONS:
        if sub["applies"](asset):
            if x.who == sub["subordinating"] and y.who == sub["beneficiary"]:
                return y
            if y.who == sub["subordinating"] and x.who == sub["beneficiary"]:
                return x
    if asset["kind"] == "deposit_account":
        cx, cy = control_start(x, asset), control_start(y, asset)
        if cx and not cy:
            return x  # 9-327(1)
        if cy and not cx:
            return y
        if cx and cy:
            if "no_9327_3" not in BUGS:
                if asset.get("bank") == x.who:
                    return x  # 9-327(3)
                if asset.get("bank") == y.who:
                    return y
            return x if cx < cy else y  # 9-327(2)
    # 9-326(a): new debtor's SI perfected solely by an FS effective only because of 9-508 is
    # subordinate to an SI perfected other than by such an FS (regardless of filing order).
    if "no_9326" not in BUGS:
        px, py = perfected_at(x, asset, t_eval), perfected_at(y, asset, t_eval)
        if x.via_9508 and px and py and not y.via_9508:
            return y
        if y.via_9508 and py and px and not x.via_9508:
            return x
    if asset["kind"] == "equipment":
        qx, qy = pmsi_9324a_qualifies(x, asset), pmsi_9324a_qualifies(y, asset)
        if qx and qy:
            # 9-324(g)(1): price-securing (seller) PMSI beats enabling-loan PMSI; else 9-322(a)
            if "no_9324g" not in BUGS:
                if x.role == "seller" and y.role != "seller":
                    return x
                if y.role == "seller" and x.role != "seller":
                    return y
        elif qx:
            return x
        elif qy:
            return y
    if asset["kind"] == "inventory" or ("pmsi_proceeds" in BUGS and asset.get("proceeds_of")):
        a2, xx, yy = asset, x, y
        if asset["kind"] != "inventory":  # sensitivity toggle only: test PMSI on original goods
            a2 = dict(asset["proceeds_of"])
            xx = Interest(x.who, "SI", attached=max(x.sa_date, a2["rights"]), sa_date=x.sa_date,
                          sa_id=x.sa_id, pool=x.pool, pm=x.pm, role=x.role)
            yy = Interest(y.who, "SI", attached=max(y.sa_date, a2["rights"]), sa_date=y.sa_date,
                          sa_id=y.sa_id, pool=y.pool, pm=y.pm, role=y.role)
        bx = pmsi_9324b_qualifies(xx, yy, a2)
        by = pmsi_9324b_qualifies(yy, xx, a2)
        if bx and not by:
            return x
        if by and not bx:
            return y
    dx, dy = priority_date_9322(x, asset, t_eval), priority_date_9322(y, asset, t_eval)
    if "attach_date_priority" in BUGS:
        dx = max(dx, x.attached) if dx else None
        dy = max(dy, y.attached) if dy else None
    if dx and dy:
        if dx != dy:
            return x if dx < dy else y
        return x if x.attached <= y.attached else y
    if dx:
        return x
    if dy:
        return y
    return x if x.attached <= y.attached else y


def compare_si_lien(si, lien, asset):
    """9-317(a)(2) and (e). Lapse is not retroactive as against a lien creditor. 9-326 governs only
    conflicts between security interests, not a security interest against a lien creditor."""
    t = lien.date
    if "9326_vs_lien" in BUGS and si.via_9508:
        return lien
    if "lapse_retro_lc" in BUGS:
        pdt = priority_date_9322(si, asset, SALE_DATE)
        if pdt and pdt <= t:
            return si
    else:
        if perfected_at(si, asset, t):
            return si  # 9-317(a)(2)(A)
        if si.sa_date <= t and asset["kind"] != "deposit_account" and in_periods(t, filing_periods(si, asset)):
            return si  # 9-317(a)(2)(B)
    # 9-317(e): PMSI filed before or within 20 days after delivery beats an intervening lien
    if si.pm and asset["kind"] == "equipment" and "no_9317e" not in BUGS:
        fl = [f["filed"] for f in covering_filings(si, asset)]
        if fl:
            fdate = min(fl)
            within = (fdate - asset["received"]).days <= 20
            if within and si.attached <= t < fdate:
                return si
    return lien


def is_bioc(b):
    if "bioc_any_buyer" in BUGS:
        return True
    return (b["good_faith"] and not b["knowledge_of_violation"] and b["ordinary_course"]
            and b["seller_in_business"] and b["possession_or_right_to_recover"]
            and not b["satisfaction_of_debt"] and not b["bulk"])


def interests_in(pool_id):
    asset = ASSETS[pool_id]
    out = []
    for sa in SECURITY_AGREEMENTS:
        if not sa["describes"](asset):
            continue
        att = attachment_date(sa, asset)
        base = dict(attached=att, sa_date=sa["date"], sa_id=sa["id"], pool=pool_id,
                    transferee=(asset.get("transferee") == sa["sp"]),
                    via_9508=(sa["id"] == "PINECREST-NEWDEBTOR"), role=None)
        pm = [p for p in asset.get("pm", []) if p["who"] == sa["sp"] and p["sa"] == sa["id"]]
        if sa["sp"] == "CALDER" and asset["kind"] == "inventory":
            if "no_cross_collateral" in BUGS and pool_id == "INV-CALDER-1":
                out.append(Interest("CALDER", "SI", pm=True, cap=CALDER_PM_OBLIGATIONS["batch1"], **base))
                out.append(Interest("CALDER", "SI", pm=False, **base))
            else:
                out.append(Interest("CALDER", "SI", pm=True, **base))
            continue
        if pm:
            base["role"] = pm[0]["role"]
            cap = pm_cap(sa["sp"], pool_id)
            if cap is None:
                out.append(Interest(sa["sp"], "SI", pm=True, **base))
            else:
                out.append(Interest(sa["sp"], "SI", pm=True, cap=cap, **base))
                out.append(Interest(sa["sp"], "SI", pm=False, **base))
            continue
        out.append(Interest(sa["sp"], "SI", **base))
    po = asset.get("prior_owner_si")
    if po:
        out.append(Interest(po["who"], "SI", attached=po["attached"], sa_date=po["sa_date"], sa_id="PRIOR",
                            pool=pool_id, created_by=po["created_by"], role=None))
    cpp = asset.get("cp_purchaser")
    if cpp:
        out.append(Interest(cpp["who"], "SI", attached=cpp["date"], sa_date=cpp["date"], sa_id="CP-SALE",
                            pool=pool_id, transferee=True, cp=cpp, possession_from=cpp["date"], role=None))
    cons = asset.get("consignor")
    if cons:
        # 9-319(a)/9-103(d): consignor's interest is a purchase-money SI in inventory, perfected
        # only by filing; consignee's creditors take as if consignee owned the goods.
        out.append(Interest(cons["who"], "SI", attached=asset["received"], sa_date=asset["received"],
                            sa_id="CONSIGN", pool=pool_id, transferee=True, consignor=True, role=None))
    rc = asset.get("reclamation")
    if rc:
        out.append(Interest(rc["who"], "RECLAIM", date=rc["demand"], transferee=True))
    for who, when in asset.get("liens", []):
        out.append(Interest(who, "LIEN", date=when))
    b = asset.get("goods_buyer")
    if b:
        owner = Interest(b["who"], "OWNER_GOODS", date=b["date"], transferee=True)
        if is_bioc(b):
            out = [i for i in out if i.kind != "SI"]  # 9-320(a)
        out.append(owner)
    return asset, out


def senior(x, y, asset, t_eval):
    if x.kind == "SI" and y.kind == "SI":
        return compare_si_si(x, y, asset, t_eval)
    if x.kind == "SI" and y.kind == "LIEN":
        return compare_si_lien(x, y, asset)
    if y.kind == "SI" and x.kind == "LIEN":
        return compare_si_lien(y, x, asset)
    if x.kind == "LIEN" and y.kind == "LIEN":
        return x if x.date <= y.date else y
    if {x.kind, y.kind} == {"SI", "RECLAIM"}:
        # 2-702(3): reclamation is subject to the rights of a good-faith purchaser, which includes
        # a secured party whose after-acquired-property interest has attached.
        si = x if x.kind == "SI" else y
        rc = y if si is x else x
        return rc if "reclaim_first" in BUGS else si
    if {x.kind, y.kind} == {"SI", "OWNER_GOODS"}:
        si = x if x.kind == "SI" else y
        ow = y if si is x else x
        b = asset["goods_buyer"]
        if b["received_delivery"] and not perfected_at(si, asset, ow.date):
            return ow  # 9-317(b)
        return si
    raise ValueError((x, y))


def rank(pool_id, t_eval):
    asset, ints = interests_in(pool_id)
    n = len(ints)
    beats = {i: set() for i in range(n)}
    for i in range(n):
        for j in range(i + 1, n):
            s = senior(ints[i], ints[j], asset, t_eval)
            if s is ints[i]:
                beats[i].add(j)
            else:
                beats[j].add(i)
    order = sorted(range(n), key=lambda i: -len(beats[i]))
    for a in range(n):
        for b in range(a + 1, n):
            if order[a] in beats[order[b]] and not BUGS:
                raise RuntimeError(f"circular priority in {pool_id}: {ints}")
    return asset, [ints[i] for i in order]


# --------------------------------------------------------------------------------------------
# Money
# --------------------------------------------------------------------------------------------
ALLOWED = {"NORTHBRIDGE": D("2500000.00"), "IRONWOOD": D("1265000.00"), "TRISTATE": D("391750.00"),
           "CALDER": D("460300.00"), "DELMAR": D("96500.00"), "BRENNAN": D("95000.00"),
           "PINECREST": D("491750.00"), "QUARRY": D("182000.00")}

POOLS = [  # (id, type, gross, direct costs) in Distribution Sequence (Schedule 1)
    ("EQ-C", "sale", D("236000.00"), D("2400.00")),
    ("EQ-B", "sale", D("590000.00"), D("4150.00")),
    ("EQ-ASHBY", "sale", D("410000.00"), D("3200.00")),
    ("INV-CALDER-1", "sale", D("640000.00"), D("1600.00")),
    ("CP-LEGENDED", "remitted", D("118900.00"), D("0")),
    ("AR-PELLSTON", "remitted", D("221300.00"), D("0")),
    ("LOT-GANTRY", "sale", D("122800.00"), D("0")),
    ("DA-NORTHBRIDGE", "deposit", D("743215.48"), D("0")),
    ("EQ-GEN", "sale", D("1452000.00"), D("9420.00")),
    ("DA-COBALT", "deposit", D("1508420.17"), D("0")),
    ("INV-CALDER-2", "sale", D("210500.00"), D("780.00")),
    ("AR-CALDER", "agent_collections", D("345800.00"), D("0")),
    ("INV-ORRIN", "sale", D("61500.00"), D("0")),
    ("INV-CONSIGNED", "sale", D("96000.00"), D("0")),
    ("EQ-HURCO", "sale", D("126250.00"), D("1200.00")),
    ("EQ-HAAS", "sale", D("147500.00"), D("1600.00")),
]


def deductions(ptype, gross, direct):
    if "agent_report_fees" in BUGS:
        return direct + q(gross * D("0.04"))
    if ptype == "sale":
        return direct + q(gross * D("0.04"))
    if ptype == "agent_collections":
        return q(gross * D("0.02"))
    return D("0")


# Machine A (9-615)
MACHINE_A = dict(
    price=D("612000.00"),
    expenses=[("auctioneer commission", D("30600.00"), "disposition"),
              ("rigging/transport", D("6800.00"), "retaking"),
              ("storage", D("3450.00"), "holding"),
              ("legal fees", D("14750.00"), "attorney")],
    sa_provides_attorney_fees=False,
    obligation=D("468300.00"),
    # authenticated demands received before distribution completed (Exhibit T-8)
    demands={"NORTHBRIDGE": True, "DELMAR": True, "PINECREST": True, "IRONWOOD": False},  # Ironwood: phone
)


def apply_machine_a(claims):
    asset, ranked = rank("EQ-A", MACHINE_A_DISPOSITION)
    exp = D(0)
    for _, amt, cat in MACHINE_A["expenses"]:
        if cat == "attorney" and not (MACHINE_A["sa_provides_attorney_fees"] or "attorney_fees" in BUGS):
            continue
        exp += amt
    rem = MACHINE_A["price"] - exp
    dist = {}
    who = [i.who for i in ranked]
    fi = who.index("TRISTATE")
    pay = min(rem, MACHINE_A["obligation"])
    dist["TRISTATE"] = pay
    rem -= pay
    for i in ranked[fi + 1:]:
        if i.who == "TRISTATE":
            continue
        demanded = MACHINE_A["demands"].get(i.who, False) or "demand_any" in BUGS
        if not demanded:
            dist.setdefault(i.who, D(0))
            continue
        p = min(rem, claims[i.who])
        dist[i.who] = dist.get(i.who, D(0)) + p
        claims[i.who] -= p
        rem -= p
    for k in MACHINE_A["demands"]:
        dist.setdefault(k, D(0))
    return dict(priority=[str(i) for i in ranked], expenses_deducted=exp, distributions=dist,
                surplus_to_debtor=rem)


def apply_pool(pid, ptype, gross, direct, claims):
    asset, ranked = rank(pid, SALE_DATE)
    ded = deductions(ptype, gross, direct)
    rem = gross - ded
    dist = {}
    stop = False
    for i in ranked:
        dist.setdefault(i.who, D(0))
        if stop:
            continue
        if i.transferee:
            dist[i.who] += rem  # Protocol 5.4(b): Non-Lien Interest takes all remaining
            rem = D(0)
            stop = True
            continue
        cap = claims[i.who]
        if i.cap is not None:
            cap = min(cap, i.cap)
        p = max(D(0), min(rem, cap))
        dist[i.who] += p
        claims[i.who] -= p
        rem -= p
    return dict(priority=[str(i) for i in ranked], expenses_deducted=ded, distributions=dist,
                surplus_to_debtor=rem)


def solve():
    claims = dict(ALLOWED)
    out = {"EQ-A": apply_machine_a(claims)}  # Protocol 5.5: Machine A receipts come first
    for pid, ptype, gross, direct in POOLS:
        out[pid] = apply_pool(pid, ptype, gross, direct, claims)
    return out


def to_json(res):
    pools = {}
    for pid, r in res.items():
        pools[pid] = dict(distributions={k: float(q(v)) for k, v in r["distributions"].items()},
                          surplus_to_debtor=float(q(r["surplus_to_debtor"])))
    return {"pools": pools}


if __name__ == "__main__":
    data = to_json(solve())
    if len(sys.argv) > 1:
        path = sys.argv[1]
    else:
        outdir = os.path.join(os.environ.get("APP_DIR", "/app"), "output")
        os.makedirs(outdir, exist_ok=True)
        path = os.path.join(outdir, "distribution.json")
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    if os.environ.get("SOLVER_DEBUG"):
        for pid, r in solve().items():
            print(pid, r["priority"], {k: str(q(v)) for k, v in r["distributions"].items() if v},
                  "surplus", q(r["surplus_to_debtor"]))
