#!/usr/bin/env python3
"""Grader for the intestate-succession task (stdlib only).

Items:
  <E>.net_intestate_estate      net intestate estate within $0.01
  <E>.<payee>                   each expected payee's amount within $0.01
  <E>.no_extra_payees           no payee with a positive amount outside the expected set
  rasmussen.<property>.<holder>          each expected holder's fractional share (within 1e-6)
  rasmussen.<property>.no_extra_holders  no holder with a positive share outside the expected set
reward = passed / total, written to $LOGS_DIR/reward.txt; per-item details to details.json.
"""
import json
import os
import re
from fractions import Fraction

APP_DIR = os.environ.get("APP_DIR", "/app")
TESTS_DIR = os.environ.get("TESTS_DIR", "/tests")
LOGS_DIR = os.environ.get("LOGS_DIR", "/logs/verifier")
TOL = 0.01


def num(v):
    if isinstance(v, bool):
        return None
    if isinstance(v, (int, float)):
        return float(v)
    if isinstance(v, str):
        s = v.strip().replace(",", "").replace("$", "")
        try:
            return float(s)
        except ValueError:
            return None
    return None


def frac(v):
    """Accept "3/16", "0.1875", 0.1875, "1"."""
    if isinstance(v, bool):
        return None
    try:
        if isinstance(v, (int, float)):
            return float(v)
        if isinstance(v, str):
            s = v.strip()
            if "/" in s:
                a, b = s.split("/", 1)
                return float(Fraction(int(a.strip()), int(b.strip())))
            return float(Fraction(s))
    except (ValueError, ZeroDivisionError):
        return None
    return None


def norm_key(k):
    return re.sub(r"\s+", "", str(k)).upper()


def main():
    os.makedirs(LOGS_DIR, exist_ok=True)
    with open(os.path.join(TESTS_DIR, "expected.json")) as f:
        expected = json.load(f)

    items, ritems = [], []
    for est, exp in expected.items():
        if est == "rasmussen_property":
            for prop, holders in exp.items():
                for h, fr in holders.items():
                    ritems.append((f"rasmussen.{prop}.{h}", prop, "holder", (h, fr)))
                ritems.append((f"rasmussen.{prop}.no_extra_holders", prop, "noextra", sorted(holders)))
            continue
        items.append((f"{est}.net_intestate_estate", est, "net", exp["net_intestate_estate"]))
        for payee, amt in exp["distribution"].items():
            items.append((f"{est}.{payee}", est, "payee", (payee, amt)))
        items.append((f"{est}.no_extra_payees", est, "noextra", sorted(exp["distribution"])))

    got = None
    err = None
    try:
        with open(os.path.join(APP_DIR, "output", "distribution.json")) as f:
            got = json.load(f)
        if not isinstance(got, dict):
            raise ValueError("top level is not an object")
    except Exception as e:  # noqa: BLE001
        err = f"missing or unparseable output: {e}"
        got = None

    details, passed = [], 0
    for iid, est, kind, exp in items:
        g, ok = None, False
        if got is not None:
            eobj = got.get(est)
            if isinstance(eobj, dict):
                dist = eobj.get("distribution")
                dist = dist if isinstance(dist, dict) else {}
                ndist = {}
                for k, v in dist.items():
                    n = num(v)
                    if n is not None:
                        ndist[norm_key(k)] = ndist.get(norm_key(k), 0.0) + n
                if kind == "net":
                    g = num(eobj.get("net_intestate_estate"))
                    ok = g is not None and abs(g - exp) <= TOL
                elif kind == "payee":
                    payee, amt = exp
                    g = ndist.get(norm_key(payee))
                    ok = g is not None and abs(g - amt) <= TOL
                    exp = amt
                else:
                    allowed = {norm_key(p) for p in exp}
                    extra = sorted(k for k, v in ndist.items() if v > 0.005 and k not in allowed)
                    g = extra
                    ok = isinstance(eobj.get("distribution"), dict) and not extra
                    exp = []
        passed += ok
        details.append({"id": iid, "expected": exp, "got": g, "pass": bool(ok)})

    rp = got.get("rasmussen_property") if isinstance(got, dict) else None
    for iid, prop, kind, exp in ritems:
        g, ok = None, False
        pobj = rp.get(prop) if isinstance(rp, dict) else None
        if isinstance(pobj, dict):
            nd = {}
            for k, v in pobj.items():
                n = frac(v)
                if n is not None:
                    nd[norm_key(k)] = nd.get(norm_key(k), 0.0) + n
            if kind == "holder":
                h, fr = exp
                want = frac(fr)
                g = nd.get(norm_key(h))
                ok = g is not None and abs(g - want) <= 1e-6
                exp = fr
            else:
                allowed = {norm_key(h) for h in exp}
                g = sorted(k for k, v in nd.items() if v > 1e-9 and k not in allowed)
                ok = not g
                exp = []
        passed += ok
        details.append({"id": iid, "expected": exp, "got": g, "pass": bool(ok)})
    items = items + ritems

    reward = passed / len(items) if got is not None else 0.0
    with open(os.path.join(LOGS_DIR, "reward.txt"), "w") as f:
        f.write(f"{reward:.4f}")
    with open(os.path.join(LOGS_DIR, "details.json"), "w") as f:
        json.dump({"error": err, "passed": passed, "total": len(items), "reward": round(reward, 4),
                   "items": details}, f, indent=2)
    print(f"reward={reward:.4f} ({passed}/{len(items)})" + (f" [{err}]" if err else ""))


if __name__ == "__main__":
    main()
