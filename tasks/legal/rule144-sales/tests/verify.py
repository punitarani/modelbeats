#!/usr/bin/env python3
"""Stdlib-only grader for rule144-sales.

Items: volume_limits.VRNB, volume_limits.KSTM, plus for each position P01..P20 the two fields
max_shares_sellable_now and form_144_required (42 fields). Only the fields listed in
expected.json "graded" (16 items) are scored; the rest must still be present in the deliverable.
reward = passed / total.
"""
import json
import os
from pathlib import Path

APP_DIR = Path(os.environ.get("APP_DIR", "/app"))
TESTS_DIR = Path(os.environ.get("TESTS_DIR", "/tests"))
LOGS_DIR = Path(os.environ.get("LOGS_DIR", "/logs/verifier"))
OUTPUT = APP_DIR / "output" / "rule144_analysis.json"
POSITION_FIELDS = ["max_shares_sellable_now", "form_144_required"]


def norm_bool(v):
    if isinstance(v, bool):
        return v
    if isinstance(v, str) and v.strip().lower() in ("true", "false"):
        return v.strip().lower() == "true"
    return None


def norm_int(v):
    if isinstance(v, bool):
        return None
    if isinstance(v, int):
        return v
    if isinstance(v, float) and v.is_integer():
        return int(v)
    if isinstance(v, str):
        s = v.strip().replace(",", "")
        try:
            f = float(s)
        except ValueError:
            return None
        return int(f) if f.is_integer() else None
    return None


def build_items(expected):
    items = []
    for iss in sorted(expected["volume_limits"]):
        items.append((f"volume_limits.{iss}", "int", expected["volume_limits"][iss], ("volume_limits", iss)))
    for pid in sorted(expected["positions"]):
        for f in POSITION_FIELDS:
            kind = "int" if f == "max_shares_sellable_now" else "bool"
            items.append((f"{pid}.{f}", kind, expected["positions"][pid][f], ("positions", pid, f)))
    graded = expected.get("graded")
    if graded:
        items = [it for it in items if it[0] in set(graded)]
        assert len(items) == len(graded), "unknown id in graded list"
    return items


def lookup(obj, path):
    cur = obj
    for p in path:
        if isinstance(cur, dict) and p in cur:
            cur = cur[p]
        else:
            return None
    return cur


def main():
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    expected = json.loads((TESTS_DIR / "expected.json").read_text())
    items = build_items(expected)
    try:
        got_doc = json.loads(OUTPUT.read_text())
        if not isinstance(got_doc, dict):
            raise ValueError("top-level JSON is not an object")
        err = None
    except Exception as e:  # missing or unparseable output
        got_doc, err = None, f"{type(e).__name__}: {e}"

    details, passed = [], 0
    for item_id, kind, exp, path in items:
        raw = lookup(got_doc, path) if got_doc is not None else None
        got = norm_int(raw) if kind == "int" else norm_bool(raw)
        ok = got is not None and got == exp
        passed += ok
        details.append({"id": item_id, "expected": exp, "got": raw, "pass": bool(ok)})

    reward = passed / len(items) if got_doc is not None else 0.0
    (LOGS_DIR / "reward.txt").write_text(f"{reward:.4f}\n")
    (LOGS_DIR / "details.json").write_text(json.dumps(
        {"reward": reward, "passed": passed if got_doc is not None else 0, "total": len(items),
         "error": err, "items": details}, indent=2) + "\n")
    print(f"reward={reward:.4f} ({passed if got_doc is not None else 0}/{len(items)})")
    if err:
        print("output error:", err)


if __name__ == "__main__":
    main()
