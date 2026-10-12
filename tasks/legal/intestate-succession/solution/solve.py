#!/usr/bin/env python3
"""Reference solver for the intestate-succession task (Montana; North Dakota situs land).

Rules encoded (Montana Code Annotated 2025 unless noted):
  * 72-2-112 spouse share; 72-2-113 order of heirs incl. (1)(d)(ii) one empty side and (1)(e) closest
    degree of kinship (no stepchildren tier); 72-2-114 120 hours, not applied if the state would
    take; 72-2-115 escheat; 72-2-116 representation WITHOUT pooling; 72-2-117 half blood;
    72-2-118 afterborn heirs; 72-2-124(2) adoption (stepparent exception only) and 72-2-124(3)
    (parent who did not openly treat the child as his or refused support, and that parent's
    kindred, may not inherit from or through the child); 72-2-125 parent barred after termination.
  * 72-2-712 120-hour survival for governing instruments and co-owners with survivorship;
    72-2-814 revocation by divorce (former spouse AND former spouse's relatives); 72-6-212 / 72-6-307
    POD and TOD fall into the estate when no beneficiary survives; 72-2-613 antilapse (stepchild
    covered; "if he survives me" insufficient; residuary clause not an alternative devise);
    72-2-821(5) disclaimer irrevocable on delivery; 72-2-822(2)(c)(iii) disclaimed intestate share
    passes only to the disclaimant's descendants; 72-2-412..415 allowances; 72-3-805 claim bar.
  * North Dakota land: intestate succession governed by situs law (Restatement (Second) of Conflict of
    Laws 236); N.D.C.C. 30.1-04-18(3)-(4) adoption by a relative / after both parents died keeps
    inheritance through the genetic parents; 30.1-10-04 revocation by divorce (same as Montana).

Facts that the documents state in prose or tables are encoded in FACTS below as a lawyer's reading
of the documents (certified death times with their UTC offsets, designations, claim history,
disclaimers, court orders). They carry no legal conclusions; every conclusion is computed below.
"""
from __future__ import annotations

import json
import os
import sys
from datetime import date, datetime, timedelta
from decimal import ROUND_HALF_UP, Decimal
from fractions import Fraction

APP_DIR = os.environ.get("APP_DIR", "/app")
MAT = os.path.join(APP_DIR, "materials")
ESTATES = {"E1": "E1_vance", "E2": "E2_moreau", "E3": "E3_whitfield",
           "E4": "E4_brandt", "E5": "E5_prescott", "E6": "E6_teller"}
H120 = timedelta(hours=120)
MST, MDT, CDT = "-07:00", "-06:00", "-05:00"   # Montana = Mountain Time; St. Paul, MN = Central

# --------------------------------------------------------------------------------------------
# FACTS read from the documents (no conclusions).
# assets: kind in {sole, jtwros, tic, beneficiary, payable_to_estate}
#   beneficiary: designated = ordered takers (primary, then contingent), signed = date of designation,
#   default = what the instrument / plan / statute does if no designated taker survives.
# charges: kind in {expense, claim, tax, homestead, exempt, family}
# barred: 72-2-125 facts (termination order, not reestablished).
# refused_support: 72-2-124(3) facts (court findings: never acknowledged child, refused support).
# --------------------------------------------------------------------------------------------
FACTS = {
    "E1": {
        "death_times": {"V01": "2026-03-05T22:40" + MST,      # Billings, before DST (began Mar 8)
                        "V05": "2026-03-10T23:10" + MDT},     # Billings, after DST
        "births": {"V04": "2026-07-19T04:02" + MDT},
        "in_gestation_at_death": ["V04"],
        "assets": [
            dict(id="A1", kind="sole", value=640000),
            dict(id="A2", kind="sole", value=48300),
            dict(id="A3", kind="jtwros", with_=["V02"], value=95000),
            dict(id="A4", kind="sole", value=642600),
            dict(id="A5", kind="beneficiary", designated=["V02"], signed="2018-01-01", default=[],
                 value=380000),
            dict(id="A6", kind="beneficiary", designated=["V02"], signed="2017-01-01", default=[],
                 value=500000),
            dict(id="A7", kind="beneficiary", designated=[], signed=None,
                 default=["spouse", "children", "parents", "ESTATE"], value=50000),
            dict(id="A8", kind="sole", value=22000),
            dict(id="A9", kind="sole", value=15000),
            dict(id="A10", kind="payable_to_estate", value=3400),
            dict(id="A11", kind="payable_to_estate", value=10600),
        ],
        "charges": [
            dict(id="B1", kind="expense", amount=14800),
            dict(id="B2", kind="expense", amount=31600),
            dict(id="B3", kind="claim", presented=9700, allowed=9700),
            dict(id="B4", kind="claim", presented=46000, amended_to=12300, allowed=None),
            dict(id="B5", kind="claim", presented=18000, allowed=0,
                 disallowance_mailed="2026-06-01", warned=True, proceeding_filed=None),
            dict(id="B6", kind="homestead", claimant="V02", amount=22500),
            dict(id="B7", kind="exempt", claimant="V02", amount=15000),
            dict(id="B8", kind="family", claimant="V02", amount=36000, court_approved=True),
        ],
    },
    "E2": {
        "death_times": {"M01": "2026-03-14T15:05" + MDT, "M04": "2026-06-20T11:30" + MDT},
        # Termination order 10/2/2000; motion to reestablish denied 2004; no further entries.
        "barred": [dict(parent="M03", child="M01")],
        # 1994 paternity judgment over denial; 1999 contempt (never paid, never visited);
        # 2000 order: never acknowledged or held out child, refused support.
        "refused_support": [dict(parent="M03", child="M01")],
        "assets": [
            dict(id="A1", kind="sole", value=385000), dict(id="A2", kind="sole", value=31400),
            dict(id="A3", kind="sole", value=214000), dict(id="A4", kind="sole", value=17500),
            dict(id="A5", kind="payable_to_estate", value=3000),
            dict(id="A6", kind="beneficiary", designated=["M04"], signed="2017-01-01", default=[],
                 value=210000),
            dict(id="A7", kind="beneficiary", designated=["M06"], signed="2025-01-01", default=[],
                 value=75000),
        ],
        "charges": [
            dict(id="B1", kind="expense", amount=9800), dict(id="B2", kind="expense", amount=18900),
            dict(id="B3", kind="claim", presented=7200, allowed=7200),
            dict(id="B4", kind="claim", presented=5600, allowed=0, disallowance_mailed="2026-04-20",
                 warned=True, proceeding_filed="2026-05-29", resolved_amount=3000),
        ],
    },
    "E3": {
        "death_times": {"W01": "2026-05-02T09:00" + MDT},
        "assets": [
            dict(id="A1", kind="sole", value=520000), dict(id="A2", kind="sole", value=399700),
            dict(id="A3", kind="sole", value=18900), dict(id="A4", kind="sole", value=42000),
            dict(id="A5", kind="sole", value=9500),
            dict(id="A6", kind="tic", fraction=Fraction(1, 2), value=170000),
            dict(id="A7", kind="jtwros", with_=["W02"], value=140000),
            dict(id="A8", kind="beneficiary", designated=["W02", "W03"], signed="2010-01-01",
                 default=[], value=200000),
        ],
        "charges": [
            dict(id="B1", kind="expense", amount=13200), dict(id="B2", kind="expense", amount=39650),
            dict(id="B3", kind="claim", presented=6250, allowed=6250),
            dict(id="B4", kind="tax", amount=22000),
        ],
    },
    "E4": {
        "death_times": {"B01": "2026-08-10T23:50" + MDT,   # Kalispell, Montana
                        "B02": "2026-08-16T00:20" + CDT},  # St. Paul, Minnesota
        "assets": [
            dict(id="A1", kind="jtwros", with_=["B02"], value=410000),
            dict(id="A2", kind="jtwros", with_=["B02"], value=48000),
            dict(id="A3", kind="sole", value=487000), dict(id="A4", kind="sole", value=23600),
            dict(id="A5", kind="sole", value=18400), dict(id="A6", kind="sole", value=26000),
            dict(id="A7", kind="beneficiary", designated=["B02", "B05"], signed="2013-01-01",
                 default=[], value=250000),
        ],
        "charges": [
            dict(id="B1", kind="expense", amount=11200), dict(id="B2", kind="expense", amount=33800),
            dict(id="B3", kind="claim", presented=31000, allowed=31000),
            dict(id="B4", kind="homestead", claimant="B02", amount=22500),
            dict(id="B5", kind="exempt", claimant="B02", amount=15000),
            dict(id="B6", kind="family", claimant="B02", amount=27000, court_approved=False),
        ],
    },
    "E5": {
        "death_times": {"P01": "2026-07-03T07:40" + MDT},
        "disclaimers": [dict(who="P05", delivered="2026-08-20")],
        "assets": [
            dict(id="A1", kind="sole", value=480000), dict(id="A2", kind="sole", value=21500),
            dict(id="A3", kind="beneficiary", designated=["P02"], signed="2016-05-09",
                 default=["ESTATE"], value=240000),                       # TOD (72-6-307)
            dict(id="A4", kind="beneficiary", designated=["P02", "P11"], signed="2010-04-02",
                 default=["ESTATE"], value=150000),                       # policy 9.2
            dict(id="A5", kind="sole", value=18500),
            dict(id="A6", kind="beneficiary", designated=["P07"], signed="2024-06-01",
                 default=["ESTATE"], value=30000),
        ],
        "charges": [
            dict(id="B1", kind="expense", amount=12000), dict(id="B2", kind="expense", amount=28000),
            dict(id="B3", kind="claim", presented=12000, allowed=12000),
        ],
    },
    "E6": {
        "death_times": {"T01": "2026-04-11T16:15" + MDT, "T02": "2026-04-14T14:30" + MDT},
        "assets": [
            dict(id="A1", kind="sole", value=265000),
            dict(id="A2", kind="beneficiary", designated=["T02"], signed="2020-01-01",
                 default=["ESTATE"], value=64000),                        # POD; 72-6-212(2)(b)
            dict(id="A3", kind="sole", value=9800),
            dict(id="A4", kind="payable_to_estate", value=12200),
        ],
        "charges": [
            dict(id="B1", kind="expense", amount=9500), dict(id="B2", kind="expense", amount=14500),
            dict(id="B3", kind="claim", presented=3000, allowed=3000),
        ],
    },
}

# Rasmussen chain: wills and disclaimers as written (no conclusions).
RASMUSSEN = {
    "properties": ["montana_ranch", "north_dakota_tract"],
    "situs": {"montana_ranch": "MT", "north_dakota_tract": "ND"},
    "original_owner": "R01",
    "wills": {
        "R01": {"executed": "2012-04-18",
                "devises": [
                    dict(prop="montana_ranch", frac=Fraction(1, 2), takers=["R04"]),
                    dict(prop="montana_ranch", frac=Fraction(1, 2), takers=["R07"],
                         words_of_survivorship=True),
                    dict(prop="north_dakota_tract", frac=Fraction(1), takers=["R04"]),
                ],
                "residue": ["R02", "R04"]},            # Helen; if she does not survive, Mark
        # Helen's will (per her estate's counsel): everything to her church. Never reached when the
        # law is applied correctly; kept so a wrong path is visible as "ESTATE:R02".
        "R02": {"executed": None,
                "devises": [dict(prop="*", frac=Fraction(1), takers=["ESTATE:R02"])],
                "residue": []},
        "R04": {"executed": "2021-03-03",
                "devises": [dict(prop="*", frac=Fraction(1), takers=["R26", "R27"])],
                "residue": []},
    },
    "disclaimers": {"R11": [dict(who="R10", delivered="2025-06-12")]},   # Sara, in Tom's estate
}


def d(s):
    return datetime.fromisoformat(s)


class Estate:
    """Intestate succession from `decedent` under `juris` ("MT" or "ND")."""

    def __init__(self, tree, decedent, facts, juris="MT"):
        self.tree, self.f, self.juris = tree, facts, juris
        self.D = decedent
        self.p = {x["id"]: x for x in tree["persons"]}
        dt = facts.get("death_times", {}).get(decedent)
        self.T = d(dt) if dt else datetime.fromisoformat(self.p[decedent]["died"])
        self.exact_T = bool(dt)
        assert self.p[decedent]["died"] == self.T.date().isoformat()
        self.adoptions = {a["adoptee"]: a for a in tree["adoptions"]}
        self.apply_120h = True
        self.trace = []
        self._build_edges()
        self.precluded = self._precluded_kindred()

    # ---------------- marriages
    def spouses_at(self, a, when):
        out = set()
        for m in self.tree["marriages"]:
            if a in m["spouses"]:
                st = date.fromisoformat(m["married"])
                en = date.fromisoformat(m["ended"]) if m["ended"] else None
                if st <= when and (en is None or when <= en):
                    out |= set(m["spouses"]) - {a}
        return out

    def ever_spouses(self, a):
        return {s for m in self.tree["marriages"] if a in m["spouses"] for s in m["spouses"]} - {a}

    # ---------------- raw genealogy (genetic links, as recorded)
    def _raw_parents(self, c, typ=None):
        return [e["parent"] for e in self.tree["parent_child"]
                if e["child"] == c and (typ is None or e["type"] == typ)]

    def _raw_ancestors(self, x):
        out, st = {}, [(x, 0)]
        while st:
            n, k = st.pop()
            for q in self._raw_parents(n, "genetic"):
                if q not in out or out[q] > k + 1:
                    out[q] = k + 1
                    st.append((q, k + 1))
        return out

    def _desc_raw(self, roots):
        seen, st = set(), list(roots)
        while st:
            n = st.pop()
            for e in self.tree["parent_child"]:
                if e["parent"] == n and e["type"] == "genetic" and e["child"] not in seen:
                    seen.add(e["child"])
                    st.append(e["child"])
        return seen

    def _relative_of(self, x, y):
        """Grandparent of y or descendant of a grandparent of y (genetic links)."""
        gp = {a for a, k in self._raw_ancestors(y).items() if k == 2}
        return x != y and (x in gp or x in self._desc_raw(gp))

    # ---------------- parent-child for succession: edge mode "full" or "up"
    #   full: inheritance in both directions; up: only the child (and its descendants) inherit
    #   from or through the parent.
    def _build_edges(self):
        self.edges = {}
        for e in self.tree["parent_child"]:
            par, c, typ = e["parent"], e["child"], e["type"]
            if typ == "adoptive" or c not in self.adoptions:
                self.edges[(par, c)] = "full"
                continue
            a = self.adoptions[c]
            ads, when = a["adoptive_parents"], date.fromisoformat(a["decree_date"])
            gen = self._raw_parents(c, "genetic")
            other = [g for g in gen if g != par]
            mode = None
            if any(par in self.spouses_at(ad, when) for ad in ads):
                mode = "full"                               # MT 124(2)(a); ND 30.1-04-18(2)(a)
            elif any(o in self.spouses_at(ad, when) for ad in ads for o in other):
                mode = "up"                                 # MT 124(2)(b); ND 30.1-04-18(2)(b)
            elif self.juris == "ND":
                rel = any(self._relative_of(ad, g) for ad in ads for g in gen) or any(
                    self._relative_of(s, g) for ad in ads for s in self.ever_spouses(ad) for g in gen)
                both_dead = all(self.p[g]["died"] and date.fromisoformat(self.p[g]["died"]) < when
                                for g in gen)
                if rel or both_dead:
                    mode = "up"                             # ND 30.1-04-18(3), (4)
            # MT: no relative-adoption or posthumous-adoption exception (72-2-124(2))
            if mode:
                self.edges[(par, c)] = mode

    def kids(self, n):
        return [c for (par, c) in self.edges if par == n]

    def parents_of(self, x):
        return [par for (par, c), m in self.edges.items() if c == x and m == "full"]

    def all_desc(self, n):
        out, st = set(), [n]
        while st:
            k = st.pop()
            for c in self.kids(k):
                if c not in out:
                    out.add(c)
                    st.append(c)
        return out

    # ---------------- 72-2-124(3), 72-2-125
    def _precluded_kindred(self):
        out = set()
        for r in self.f.get("refused_support", []):
            if r["child"] != self.D:
                continue
            q = r["parent"]
            anc = set(self._raw_ancestors(q)) | {q}
            kin = anc | self._desc_raw(anc)
            others = [g for g in self.parents_of(self.D) if g != q]
            oth_kin = set()
            for g in others:
                ga = set(self._raw_ancestors(g)) | {g}
                oth_kin |= ga | self._desc_raw(ga)
            both = (kin & oth_kin) - {self.D}
            assert not any(self.p[x]["died"] is None for x in both), both   # none in our facts
            out |= kin - {self.D}
        return out

    def barred_parent(self, q):
        return any(b["parent"] == q and b["child"] == self.D for b in self.f.get("barred", []))

    # ---------------- survival (72-2-114, 72-2-118, 72-2-712)
    def death_dt(self, x):
        if x in self.f.get("death_times", {}):
            return d(self.f["death_times"][x]), True
        if self.p[x]["died"] is None:
            return None, False
        return datetime.fromisoformat(self.p[x]["died"]), False

    def survives(self, x, force120=False):
        if x == self.D:
            return False
        use120 = force120 or self.apply_120h
        per = self.p[x]
        born = date.fromisoformat(per["born"])
        died, exact = self.death_dt(x)
        if born > self.T.date():
            if x not in self.f.get("in_gestation_at_death", []):
                return False
            if died is None:
                return True
            return died - d(self.f["births"][x]) >= H120
        if died is None:
            return True
        if exact and self.exact_T:
            if died <= self.T:
                return False
            return (not use120) or (died - self.T >= H120)   # offset-aware: real elapsed time
        gap = (died.date() - self.T.date()).days
        if gap <= 0:
            return False
        if gap >= 6 or not use120:
            return True
        raise ValueError(f"exact time of death needed for {x}")

    def disclaimant(self, x):
        # 72-2-821(5): irrevocable once delivered; later attempts to revoke have no effect
        return any(dc["who"] == x for dc in self.f.get("disclaimers", []))

    def counts_alive(self, x):
        if x in self.precluded or not self.survives(x):
            return False
        if self.disclaimant(x):     # 72-2-822(2)(c)(ii)/(iii)
            return bool({y for y in self.all_desc(x) if self.survives(y)})
        return True

    # ---------------- representation
    def rep(self, roots, amount):
        """72-2-116 (Montana): equal shares at the nearest generation with a survivor; each deceased
        member's share is divided in the same manner among that member's own descendants."""
        res = {}

        def kids(n):
            return [c for c in self.kids(n) if c != self.D and c not in self.precluded]

        def has_surv(n, seen=None):
            seen = set() if seen is None else seen
            for c in kids(n):
                if c not in seen:
                    seen.add(c)
                    if self.counts_alive(c) or has_surv(c, seen):
                        return True
            return False

        level = []
        for r in roots:
            level += [c for c in kids(r) if c not in level]
        alive, dead = [], []
        while level:
            alive = [c for c in level if self.counts_alive(c)]
            dead = [c for c in level if not self.counts_alive(c) and has_surv(c)]
            if alive or not dead:
                break
            nxt = []
            for c in dead:
                nxt += [k for k in kids(c) if k not in nxt]
            level = nxt
        if not alive and not dead:
            return res
        share = Fraction(amount) / (len(alive) + len(dead))
        for c in alive:
            part = self.rep([c], share) if self.disclaimant(c) else {c: share}   # 822(2)(c)(iii)
            for k, v in part.items():
                res[k] = res.get(k, 0) + v
        for c in dead:
            for k, v in self.rep([c], share).items():
                res[k] = res.get(k, 0) + v
        return res

    # ---------------- spouse (72-2-112; N.D.C.C. 30.1-04-02 is the same)
    def surviving_spouse(self):
        for m in self.tree["marriages"]:
            if self.D in m["spouses"] and (m["ended_by"] or "") == f"death of {self.D}":
                s = (set(m["spouses"]) - {self.D}).pop()
                if self.survives(s):
                    return s
        return None

    def spouse_share(self, s, net):
        dd = {x for x in self.all_desc(self.D) if self.survives(x)}
        s_all = self.all_desc(s)
        s_surv_not_d = {x for x in s_all if self.survives(x)} - self.all_desc(self.D)
        parent_surv = any(self.survives(q) and not self.barred_parent(q)
                          for q in self.parents_of(self.D))
        if not dd and not parent_surv:
            return net, "112(1)(a)"
        if dd and dd <= s_all and not s_surv_not_d:
            return net, "112(1)(b)"
        if not dd:
            return min(net, 300000 + Fraction(3, 4) * max(0, net - 300000)), "112(2)"
        if dd <= s_all:
            return min(net, 225000 + Fraction(1, 2) * max(0, net - 225000)), "112(3)"
        return min(net, 150000 + Fraction(1, 2) * max(0, net - 150000)), "112(4)"

    # ---------------- 72-2-113 / N.D.C.C. 30.1-04-03
    def rest(self, amount):
        D = self.D
        if any(self.counts_alive(x) for x in self.all_desc(D)):
            return self.rep([D], amount), "(1)(a) descendants"
        parents = [q for q in self.parents_of(D) if q not in self.precluded]
        living = [q for q in parents if self.survives(q) and not self.barred_parent(q)]
        if living:
            return {q: Fraction(amount) / len(living) for q in living}, "(1)(b) parents"
        r = self.rep(parents, amount)
        if r:
            return r, "(1)(c) descendants of parents"
        sides = {}
        for q in parents:
            gps = [g for g in self.parents_of(q) if g not in self.precluded]
            liv = [g for g in gps if self.survives(g)]
            if liv:
                sides[q] = ("gp", liv)
            elif self.rep(gps, 1):
                sides[q] = ("desc", gps)
        if sides:
            portion = Fraction(amount) / len(sides)          # (1)(d)(i) halves / (ii) entire
            res = {}
            for q, (kind, who) in sides.items():
                part = ({g: portion / len(who) for g in who} if kind == "gp"
                        else self.rep(who, portion))
                for k, v in part.items():
                    res[k] = res.get(k, 0) + v
            return res, f"(1)(d) {'both sides' if len(sides) == 2 else 'one side takes all'}"
        if self.juris == "MT":
            return self.next_of_kin(amount)                  # 72-2-113(1)(e), (2)
        raise NotImplementedError("ND deceased-spouse tier not needed")

    def next_of_kin(self, amount):
        anc, st = {self.D: 0}, [self.D]
        while st:
            n = st.pop()
            for q in self.parents_of(n):
                if q not in self.precluded and q not in anc:
                    anc[q] = anc[n] + 1
                    st.append(q)
        best = {}
        for a, up in anc.items():
            if a == self.D:
                continue
            down, st = {a: 0}, [a]
            while st:
                n = st.pop()
                for c in self.kids(n):
                    if c not in down and c != self.D:
                        down[c] = down[n] + 1
                        st.append(c)
            for x, dn in down.items():
                if self.counts_alive(x):
                    key = (up + dn, up)          # degree; then nearer common ancestor (113(2))
                    if x not in best or key < best[x]:
                        best[x] = key
        if not best:
            return None, "no taker"
        top = min(best.values())
        who = sorted(x for x, k in best.items() if k == top)
        return {x: Fraction(amount) / len(who) for x in who}, f"(1)(e) degree {top[0]}"

    # ---------------- intestate shares of `amount` (spouse first)
    def intestate(self, amount):
        res, rest = {}, Fraction(amount)
        s = self.surviving_spouse()
        if s:
            sh, why = self.spouse_share(s, rest)
            res[s] = sh
            rest -= sh
            self.trace.append(f"spouse {s}: {why}")
        if rest:
            r, why = self.rest(rest)
            self.trace.append(f"balance: {why}")
            if r is None:
                return None
            for k, v in r.items():
                res[k] = res.get(k, 0) + v
        return res

    # ---------------- 72-2-814 / N.D.C.C. 30.1-10-04
    def former_spouses(self, signed):
        out = set()
        for m in self.tree["marriages"]:
            if self.D in m["spouses"] and m["ended_by"] == "divorce":
                if signed is None or date.fromisoformat(signed) < date.fromisoformat(m["ended"]):
                    out |= set(m["spouses"]) - {self.D}
        current = {s for m in self.tree["marriages"] if self.D in m["spouses"] and not m["ended"]
                   for s in m["spouses"]}
        return out - current

    def blood_related(self, x, y):
        ax = set(self._raw_ancestors(x)) | {x}
        ay = set(self._raw_ancestors(y)) | {y}
        return bool(ax & ay)

    def revoked_by_divorce(self, who, signed):
        for fs in self.former_spouses(signed):
            if who == fs:
                return True
            related_to_fs = self.blood_related(who, fs)
            adopted_by_d = any(e["parent"] == self.D and e["child"] == who
                               for e in self.tree["parent_child"])
            if related_to_fs and not self.blood_related(who, self.D) and not adopted_by_d:
                return True
        return False

    # ---------------- net intestate estate
    def asset_probate_value(self, a):
        k, v = a["kind"], Fraction(a["value"])
        if k in ("sole", "payable_to_estate"):
            return v
        if k == "tic":
            return v * a["fraction"]
        if k == "jtwros":
            (co,) = a["with_"]
            died, exact = self.death_dt(co)
            if died is not None and (died <= self.T if exact else died.date() < self.T.date()):
                return v                       # co-owner predeceased: decedent was sole owner
            if self.survives(co, force120=True):
                return Fraction(0)
            return v / 2                       # 72-2-712(3)(a)(i)
        if k == "beneficiary":
            for b in a["designated"]:
                if self.revoked_by_divorce(b, a["signed"]):
                    continue                   # 72-2-814(2)(a)(i), (4)
                if self.survives(b, force120=True):   # 72-2-712(2)
                    return Fraction(0)
            spouse = self.surviving_spouse()
            for cls in a["default"]:
                if cls == "spouse" and spouse:
                    return Fraction(0)
                if cls == "children" and any(self.survives(c) for c in self.kids(self.D)):
                    return Fraction(0)
                if cls == "parents" and any(self.survives(q) for q in self.parents_of(self.D)):
                    return Fraction(0)
                if cls == "ESTATE":
                    return v
            raise ValueError("no taker under designation")
        raise ValueError(k)

    def charge_amount(self, c):
        k = c["kind"]
        if k in ("expense", "tax"):
            return Fraction(c["amount"])
        if k == "claim":
            if c.get("amended_to") is not None:
                return Fraction(c["amended_to"])
            allowed = Fraction(c["allowed"])
            if c.get("disallowance_mailed"):
                mailed = date.fromisoformat(c["disallowance_mailed"])
                filed = c.get("proceeding_filed")
                timely = filed and (date.fromisoformat(filed) - mailed).days <= 60
                if c.get("warned") and not timely:
                    return allowed             # 72-3-805(1): disallowed part barred
                if timely:
                    return Fraction(c["resolved_amount"])
            return allowed
        if k in ("homestead", "exempt", "family"):
            s = self.surviving_spouse()        # 72-2-114 / 72-2-712(1); 72-2-414(2)
            return Fraction(c["amount"]) if c["claimant"] == s else Fraction(0)
        raise ValueError(k)

    def net_estate(self):
        return (sum(self.asset_probate_value(a) for a in self.f["assets"])
                - sum(self.charge_amount(c) for c in self.f["charges"]))

    def solve(self):
        self.net = self.net_estate()
        res = self.intestate(self.net)
        if res is None:                                   # 72-2-114 last sentence
            self.apply_120h = False
            self.trace.append("120-hour rule not applied (would escheat)")
            self.net = self.net_estate()
            res = self.intestate(self.net) or {"STATE": self.net}
        return res

    def payee(self, x):
        if x == "STATE":
            return x
        return f"ESTATE:{x}" if self.p[x]["died"] else x


# ------------------------------------------------------------------------------------------
# Rasmussen chain
# ------------------------------------------------------------------------------------------
def testate(tree, testator, will, prop, frac_held, trace):
    """Disposition of `frac_held` of `prop` under the testator's will. Montana law (72-2-613,
    72-2-814); for the Mark will the only issue is revocation by divorce, which N.D.C.C. 30.1-10-04
    decides identically, and Arne's North Dakota devise is to a devisee who survived."""
    e = Estate(tree, testator, {}, "MT")
    out, failed = {}, Fraction(0)
    for dv in will["devises"]:
        if dv["prop"] not in (prop, "*"):
            continue
        part = frac_held * dv["frac"] if dv["prop"] == "*" else dv["frac"]
        taker = None
        for t in dv["takers"]:                       # primary, then expressly alternative takers
            if t not in e.p:                         # an entity outside the family tree
                taker = {t: part}
                break
            if e.revoked_by_divorce(t, will["executed"]):
                trace.append(f"{testator}: devise to {t} revoked by divorce (72-2-814)")
                continue
            if e.survives(t, force120=True):
                taker = {t: part}
                break
            assert prop == "montana_ranch"           # antilapse question arises only for MT land
            # 72-2-613(2): grandparent, descendant of grandparent, or stepchild; survivorship words
            # are not enough (2)(c); residuary clause is not an alternative devise (1)(a).
            spouses = e.ever_spouses(testator)
            stepchild = (any(s in e._raw_parents(t) for s in spouses)
                         and testator not in e._raw_parents(t))
            gp = {a for a, k in e._raw_ancestors(testator).items() if k == 2}
            kin = t in gp or t in e._desc_raw(gp)
            if stepchild or kin:
                sub = e.rep([t], part)               # substitute gift, by representation
                if sub:
                    trace.append(f"{testator}: antilapse substitute gift for {t} -> {sorted(sub)}")
                    taker = sub
                    break
        if taker:
            for k, v in taker.items():
                out[k] = out.get(k, 0) + v
        else:
            failed += part
    if failed and will["residue"]:
        for t in will["residue"]:
            if not e.revoked_by_divorce(t, will["executed"]) and e.survives(t, force120=True):
                out[t] = out.get(t, 0) + failed
                failed = Fraction(0)
                break
    return out, failed


def rasmussen():
    with open(os.path.join(MAT, "rasmussen_property", "family_tree.json")) as f:
        tree = json.load(f)
    p = {x["id"]: x for x in tree["persons"]}
    R = RASMUSSEN
    trace, result = [], {}
    for prop in R["properties"]:
        hold = {R["original_owner"]: Fraction(1)}
        while True:
            dead = [h for h in hold if h in p and p[h]["died"]]
            if not dead:
                break
            h = min(dead, key=lambda x: p[x]["died"])
            share = hold.pop(h)
            new, failed = {}, share
            if h in R["wills"]:
                new, failed = testate(tree, h, R["wills"][h], prop, share, trace)
            if failed:                               # intestacy under the law of the situs
                facts = {"disclaimers": R["disclaimers"].get(h, [])}
                e = Estate(tree, h, facts, R["situs"][prop])
                r = e.intestate(failed)
                assert r, (h, prop)
                trace.append(f"{prop}: {h} intestate ({R['situs'][prop]}) {e.trace} -> "
                             f"{ {k: str(v) for k, v in r.items()} }")
                for k, v in r.items():
                    new[k] = new.get(k, 0) + v
            for k, v in new.items():
                hold[k] = hold.get(k, 0) + v
        assert sum(hold.values()) == 1
        result[prop] = {k: str(v) for k, v in sorted(hold.items()) if v > 0}
    return result, trace


def cents(fr):
    q = Decimal(fr.numerator) / Decimal(fr.denominator)
    return float(q.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def main():
    out = {}
    for key, folder in ESTATES.items():
        with open(os.path.join(MAT, "estates", folder, "family_tree.json")) as f:
            tree = json.load(f)
        e = Estate(tree, tree["decedent"], FACTS[key], "MT")
        res = e.solve()
        dist = {e.payee(x): cents(v) for x, v in res.items() if v > 0}
        assert abs(sum(dist.values()) - cents(e.net)) < 0.02, (key, dist)
        out[key] = {"net_intestate_estate": cents(e.net), "distribution": dict(sorted(dist.items()))}
        if "--verbose" in sys.argv:
            print(key, e.trace)
    out["rasmussen_property"], trace = rasmussen()
    if "--verbose" in sys.argv:
        print("\n".join(trace))
    od = os.path.join(APP_DIR, "output")
    os.makedirs(od, exist_ok=True)
    with open(os.path.join(od, "distribution.json"), "w") as fh:
        json.dump(out, fh, indent=2)
    if "--verbose" in sys.argv:
        print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
