#!/usr/bin/env python3
"""Grader for cam-reconciliation. Stdlib only.

Reads $APP_DIR/output/cam_audit.json (default /app), compares with $TESTS_DIR/expected.json
(default /tests), writes $LOGS_DIR/reward.txt and $LOGS_DIR/details.json (default /logs/verifier).
reward = items passed / items total. Money tolerance $1.00; dates exact.
"""
import json
import os
import re

APP = os.environ.get("APP_DIR", "/app")
TESTS = os.environ.get("TESTS_DIR", "/tests")
LOGS = os.environ.get("LOGS_DIR", "/logs/verifier")
TOL = 1.00

TENANTS = ("brightwater", "harlow_pike", "copperline")
YEARS = ("2024", "2025")
YEAR_FIELDS = ("taxes", "tenant_share", "objection_deadline")
PARCELS = ("5101-001-010", "5101-001-011")
FISCAL_YEARS = ("2022-23", "2023-24", "2025-26", "2026-27")


def write(reward, details):
    os.makedirs(LOGS, exist_ok=True)
    with open(os.path.join(LOGS, "reward.txt"), "w") as f:
        f.write(f"{reward:.4f}\n")
    with open(os.path.join(LOGS, "details.json"), "w") as f:
        json.dump(details, f, indent=2, default=str)


def to_number(v):
    if isinstance(v, bool) or v is None:
        return None
    if isinstance(v, (int, float)):
        return float(v)
    if isinstance(v, str):
        s = v.strip().replace(",", "").replace("$", "")
        neg = s.startswith("(") and s.endswith(")")
        s = s.strip("()")
        try:
            x = float(s)
        except ValueError:
            return None
        return -x if neg else x
    return None


def norm_date(v):
    if not isinstance(v, str):
        return None
    s = v.strip()
    m = re.fullmatch(r"(\d{4})-(\d{1,2})-(\d{1,2})", s)
    if not m:
        return None
    return f"{int(m.group(1)):04d}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"


def get(d, *path):
    for k in path:
        if not isinstance(d, dict) or k not in d:
            return None
        d = d[k]
    return d


def items(expected):
    out = []
    for t in TENANTS:
        for y in YEARS:
            for f in YEAR_FIELDS:
                kind = "date" if f == "objection_deadline" else "money"
                out.append((f"{t}.{y}.{f}", ("tenants", t, y, f), kind))
    out.append(("office_taxable_value_2024_25", ("office_taxable_value_2024_25",), "money"))
    for apn in PARCELS:
        for fy in FISCAL_YEARS:
            out.append((f"supplemental_taxes.{apn}.{fy}", ("supplemental_taxes", apn, fy), "money"))
    graded = expected.get("graded")
    if graded:
        out = [it for it in out if it[0] in set(graded)]
    return out


def main():
    with open(os.path.join(TESTS, "expected.json")) as f:
        expected = json.load(f)
    its = items(expected)
    details = {"items": []}
    try:
        with open(os.path.join(APP, "output", "cam_audit.json")) as f:
            got_all = json.load(f)
        if not isinstance(got_all, dict):
            raise ValueError("top-level JSON is not an object")
    except Exception as e:  # missing or unparseable output
        details["error"] = f"could not read output: {e}"
        for iid, path, kind in its:
            details["items"].append({"id": iid, "expected": get(expected, *path), "got": None, "pass": False})
        write(0.0, details)
        return

    passed = 0
    for iid, path, kind in its:
        exp = get(expected, *path)
        got = get(got_all, *path)
        ok = False
        if kind == "money":
            g = to_number(got)
            ok = g is not None and abs(g - float(exp)) <= TOL + 1e-9
        elif kind == "date":
            ok = norm_date(got) is not None and norm_date(got) == exp
        elif kind == "set":
            if isinstance(got, list) and all(isinstance(x, str) for x in got):
                ok = sorted({x.strip().lower() for x in got}) == sorted(exp) and len(got) == len(set(got))
        passed += ok
        details["items"].append({"id": iid, "expected": exp, "got": got, "pass": bool(ok)})
    reward = passed / len(its)
    details["passed"] = passed
    details["total"] = len(its)
    write(reward, details)
    print(f"cam-reconciliation: {passed}/{len(its)} items passed, reward {reward:.4f}")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:  # never exit without writing a reward
        write(0.0, {"error": f"grader exception: {e}"})
        raise
