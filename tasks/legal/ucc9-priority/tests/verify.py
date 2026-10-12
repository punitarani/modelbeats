#!/usr/bin/env python3
"""Stdlib-only grader for the ucc9-priority task.

One graded item per pool: every claimant's distribution (omitted claimants count as 0.00) and the
surplus to the debtor must each be within $0.01 of the expected figure.
"""
import json
import os

APP_DIR = os.environ.get("APP_DIR", "/app")
TESTS_DIR = os.environ.get("TESTS_DIR", "/tests")
LOGS_DIR = os.environ.get("LOGS_DIR", "/logs/verifier")
OUTPUT = os.path.join(APP_DIR, "output", "distribution.json")
TOL = 0.01


def num(x):
    if isinstance(x, bool):
        raise ValueError("bool")
    if isinstance(x, (int, float)):
        return float(x)
    if isinstance(x, str):
        return float(x.replace("$", "").replace(",", "").strip())
    raise ValueError(repr(x))


def norm_id(x):
    return str(x).strip().upper()


def amounts_map(d):
    if not isinstance(d, dict):
        raise ValueError("distributions is not an object")
    out = {}
    for k, v in d.items():
        k = norm_id(k)
        out[k] = out.get(k, 0.0) + num(v)
    return out


def grade_pool(exp_pool, got_pool):
    gmap = amounts_map(got_pool.get("distributions", {}))
    emap = exp_pool["distributions"]
    ok = all(abs(gmap.get(w, 0.0) - emap.get(w, 0.0)) <= TOL for w in set(gmap) | set(emap))
    sur = num(got_pool.get("surplus_to_debtor"))
    ok = ok and abs(sur - exp_pool["surplus_to_debtor"]) <= TOL
    return {"distributions": gmap, "surplus_to_debtor": sur}, ok


def main():
    os.makedirs(LOGS_DIR, exist_ok=True)
    with open(os.path.join(TESTS_DIR, "expected.json")) as f:
        expected = json.load(f)
    error = None
    got_pools = None
    try:
        with open(OUTPUT) as f:
            data = json.load(f)
        got_pools = data["pools"]
        if not isinstance(got_pools, dict):
            raise ValueError("pools is not an object")
        got_pools = {norm_id(k): v for k, v in got_pools.items()}
    except Exception as e:  # missing or unparseable output
        error = f"{type(e).__name__}: {e}"
        got_pools = None

    details = []
    passed = 0
    graded = expected.get("graded") or expected["pool_order"]  # only the listed pools are scored
    for pid in graded:
        exp_pool = expected["pools"][pid]
        got_val, ok = None, False
        if got_pools is not None and isinstance(got_pools.get(pid), dict):
            try:
                got_val, ok = grade_pool(exp_pool, got_pools[pid])
            except Exception as e:
                got_val, ok = f"error: {type(e).__name__}: {e}", False
        passed += 1 if ok else 0
        details.append({"id": "pool:" + pid, "expected": exp_pool, "got": got_val, "pass": bool(ok)})

    total = len(graded)
    reward = passed / total if total else 0.0
    with open(os.path.join(LOGS_DIR, "reward.txt"), "w") as f:
        f.write(f"{reward:.4f}")
    with open(os.path.join(LOGS_DIR, "details.json"), "w") as f:
        json.dump({"reward": round(reward, 4), "passed": passed, "total": total, "error": error,
                   "items": details}, f, indent=2)
    print(f"reward={reward:.4f} ({passed}/{total})" + (f" error={error}" if error else ""))


if __name__ == "__main__":
    main()
