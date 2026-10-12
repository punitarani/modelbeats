#!/usr/bin/env python3
"""Grader for legal-liquidation-waterfall. Stdlib only."""
import json
import math
import os

APP = os.environ.get("APP_DIR", "/app")
TESTS = os.environ.get("TESTS_DIR", "/tests")
LOGS = os.environ.get("LOGS_DIR", "/logs/verifier")
TOL = 1.00

ITEMS = [
    # Graded items: (id, path inside scenarios). Tags and rationale in AUDIT.md.
    ("S1.compensation_payments.okafor.net", ("S1", "compensation_payments", "okafor", "net")),
    ("S2.compensation_payments.okafor.net", ("S2", "compensation_payments", "okafor", "net")),
    ("S3.compensation_payments.okafor.net", ("S3", "compensation_payments", "okafor", "net")),
    ("S4.compensation_payments.okafor.net", ("S4", "compensation_payments", "okafor", "net")),
    ("S1.compensation_payments.raman.net", ("S1", "compensation_payments", "raman", "net")),
    ("S2.compensation_payments.raman.net", ("S2", "compensation_payments", "raman", "net")),
    ("S3.compensation_payments.raman.net", ("S3", "compensation_payments", "raman", "net")),
    ("S4.compensation_payments.raman.net", ("S4", "compensation_payments", "raman", "net")),
    ("S1.compensation_payments.lindqvist.net", ("S1", "compensation_payments", "lindqvist", "net")),
    ("S2.compensation_payments.lindqvist.net", ("S2", "compensation_payments", "lindqvist", "net")),
    ("S1.compensation_payments.diallo.net", ("S1", "compensation_payments", "diallo", "net")),
    ("S2.compensation_payments.diallo.net", ("S2", "compensation_payments", "diallo", "net")),
    ("S3.compensation_payments.diallo.net", ("S3", "compensation_payments", "diallo", "net")),
    ("S4.compensation_payments.diallo.net", ("S4", "compensation_payments", "diallo", "net")),
    ("S1.compensation_payments.tanaka.net", ("S1", "compensation_payments", "tanaka", "net")),
    ("S2.compensation_payments.tanaka.net", ("S2", "compensation_payments", "tanaka", "net")),
    ("S3.compensation_payments.tanaka.net", ("S3", "compensation_payments", "tanaka", "net")),
    ("S4.compensation_payments.tanaka.net", ("S4", "compensation_payments", "tanaka", "net")),
    ("S1.compensation_payments.tanaka.section_4999_excise", ("S1", "compensation_payments", "tanaka", "section_4999_excise")),
    ("S2.compensation_payments.tanaka.section_4999_excise", ("S2", "compensation_payments", "tanaka", "section_4999_excise")),
    ("S3.compensation_payments.tanaka.section_4999_excise", ("S3", "compensation_payments", "tanaka", "section_4999_excise")),
    ("S4.compensation_payments.tanaka.section_4999_excise", ("S4", "compensation_payments", "tanaka", "section_4999_excise")),
    ("S4.compensation_payments.choi.net", ("S4", "compensation_payments", "choi", "net")),
    ("S1.okafor_transaction_bonus", ("S1", "okafor_transaction_bonus")),
    ("S3.okafor_transaction_bonus", ("S3", "okafor_transaction_bonus")),
    ("S4.okafor_transaction_bonus", ("S4", "okafor_transaction_bonus")),
    ("S3.class_totals.series_b", ("S3", "class_totals", "series_b")),
    ("S3.holders.calloway", ("S3", "holders", "calloway")),
    ("S2.holders.northgate", ("S2", "holders", "northgate")),
    ("S3.class_totals.common", ("S3", "class_totals", "common")),
    ("S3.holders.okafor_trust", ("S3", "holders", "okafor_trust")),
    ("S3.holders.ortiz", ("S3", "holders", "ortiz")),
    ("S3.holders.other_common", ("S3", "holders", "other_common")),
    ("S2.holders.brandt", ("S2", "holders", "brandt")),
]


def to_num(v):
    if isinstance(v, bool) or v is None:
        return None
    if isinstance(v, (int, float)):
        x = float(v)
    elif isinstance(v, str):
        s = v.strip().replace(",", "").replace("$", "")
        try:
            x = float(s)
        except ValueError:
            return None
    else:
        return None
    return x if math.isfinite(x) else None


def get(d, *path):
    for p in path:
        if not isinstance(d, dict) or p not in d:
            return None
        d = d[p]
    return d


def write(reward, details):
    os.makedirs(LOGS, exist_ok=True)
    with open(os.path.join(LOGS, "reward.txt"), "w") as f:
        f.write(f"{reward:.4f}\n")
    with open(os.path.join(LOGS, "details.json"), "w") as f:
        json.dump(details, f, indent=2)


def main():
    with open(os.path.join(TESTS, "expected.json")) as f:
        expected = json.load(f)
    out_path = os.path.join(APP, "output", "allocation.json")
    try:
        with open(out_path) as f:
            got = json.load(f)
        if not isinstance(got, dict):
            raise ValueError("top level is not an object")
    except Exception as e:  # missing or unparseable => 0
        write(0.0, {"error": f"could not read {out_path}: {e}", "items": []})
        print(f"reward 0.0000 ({e})")
        return
    graded = set(expected.get("graded") or [i for i, _ in ITEMS])
    items = [(i, p) for i, p in ITEMS if i in graded]
    rows, passed = [], 0
    for item_id, path in items:
        exp = get(expected, "scenarios", *path)
        g = get(got, "scenarios", *path)
        gn = to_num(g)
        ok = gn is not None and abs(gn - exp) <= TOL
        passed += ok
        rows.append({"id": item_id, "expected": exp, "got": g, "pass": bool(ok)})
    reward = passed / len(items)
    write(reward, {"passed": passed, "total": len(items), "items": rows})
    print(f"reward {reward:.4f} ({passed}/{len(items)})")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        write(0.0, {"error": f"grader exception: {e}", "items": []})
        print(f"reward 0.0000 (grader exception: {e})")
