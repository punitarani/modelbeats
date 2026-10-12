#!/usr/bin/env python3
"""Reference implementation for the frcp-deadlines task (four C.D. Cal. matters).

Encodes the governing time rules -- Fed. R. Civ. P. 4, 6, 12, 15, 26, 33, 34, 36, 54, 56, 58,
59, 60, 81; FRAP 4 and 26; 28 U.S.C. 1446, 1447, 2107; Cal. Code Civ. Proc. 415.30/415.40;
the C.D. Cal. Local Rules and the court's orders -- and applies them to the facts in
environment/app/materials. Writes $APP_DIR/output/docket.json (default APP_DIR=/app).

FLAW=<name> disables one rule (used only to validate the grader):
  no_state_holidays | state_backward | naive_6d | no_inaccessible | appeal_30 |
  no_150_day | untimely_tolls | reopen_from_actual_notice
"""
import datetime as dt
import json
import os

D = dt.date
ONE = dt.timedelta(days=1)
FLAW = os.environ.get("FLAW", "")

# ---------------------------------------------------------------------------
# Calendar (law, not supplied to the agent)
# ---------------------------------------------------------------------------
# Rule 6(a)(6)(A): days set aside by 5 U.S.C. 6103 for observing the federal holidays.
FEDERAL_HOLIDAYS = {
    D(2026, 1, 1), D(2026, 1, 19), D(2026, 2, 16), D(2026, 5, 25), D(2026, 6, 19),
    D(2026, 7, 3), D(2026, 9, 7), D(2026, 10, 12), D(2026, 11, 11), D(2026, 11, 26),
    D(2026, 12, 25),
    D(2027, 1, 1), D(2027, 1, 18), D(2027, 2, 15), D(2027, 5, 31), D(2027, 6, 18),
    D(2027, 7, 5), D(2027, 9, 6), D(2027, 10, 11), D(2027, 11, 11), D(2027, 11, 25),
    D(2027, 12, 24), D(2027, 12, 31),
    D(2028, 1, 17), D(2028, 2, 21), D(2028, 5, 29), D(2028, 6, 19),
}
# Rule 6(a)(6)(C): other days declared holidays by California (Gov. Code 6700) -- forward only.
STATE_HOLIDAYS = {
    D(2026, 2, 17), D(2027, 2, 6), D(2028, 1, 26),        # Lunar New Year
    D(2026, 2, 12), D(2027, 2, 12), D(2028, 2, 12),       # Lincoln Day
    D(2026, 3, 31), D(2027, 3, 31), D(2028, 3, 31),       # Farmworkers Day (formerly Cesar Chavez Day)
    D(2026, 4, 24), D(2027, 4, 24), D(2028, 4, 24),       # Genocide Remembrance Day
    D(2026, 9, 9), D(2027, 9, 9),                         # Admission Day
    D(2026, 9, 25), D(2027, 9, 24),                       # Native American Day (4th Fri Sept)
}
INACCESSIBLE = {D(2027, 3, 17)}  # General Order 27-04 (in the file)

if FLAW == "no_state_holidays":
    STATE_HOLIDAYS = set()
if FLAW == "no_inaccessible":
    INACCESSIBLE = set()


def is_legal_holiday(d, forward):
    if d in FEDERAL_HOLIDAYS:
        return True
    return d in STATE_HOLIDAYS and (forward or FLAW == "state_backward")


def excluded(d, forward):
    return d.weekday() >= 5 or is_legal_holiday(d, forward)


def roll_forward(d):
    while excluded(d, True):
        d += ONE
    return d


def roll_backward(d):
    while excluded(d, False):
        d -= ONE
    return d


def inaccessibility(d):
    """Rule 6(a)(3)(A) / FRAP 26(a)(3)."""
    if d in INACCESSIBLE:
        d += ONE
        while d in INACCESSIBLE or excluded(d, True):
            d += ONE
    return d


def after(trigger, days, add_6d=False):
    """Forward period (Rule 6(a)(1)); Rule 6(d) adds 3 days after the period otherwise expires."""
    if add_6d and FLAW == "naive_6d":
        return inaccessibility(roll_forward(trigger + dt.timedelta(days=days + 3)))
    end = roll_forward(trigger + dt.timedelta(days=days))
    if add_6d:
        end = roll_forward(end + dt.timedelta(days=3))
    return inaccessibility(end)


def before(event, days):
    """Backward period (Rule 6(a)(5)); state holidays do not count (6(a)(6)(C))."""
    return roll_backward(event - dt.timedelta(days=days))


def after_years(trigger, years):
    return inaccessibility(roll_forward(trigger.replace(year=trigger.year + years)))


SIX_D = {"mail", "clerk", "consented_other"}   # Rule 5(b)(2)(C), (D), (F); not (E) since 2016


def six_d(method):
    return method in SIX_D


# ===========================================================================
# Matter A -- Mirador v. Pacific Crest Bank (2:26-cv-00614)
# ===========================================================================
def matter_a():
    o = {}
    complaint_filed = D(2026, 1, 20)
    bank_served = D(2026, 1, 26)
    northbridge_waiver_sent = D(2026, 2, 2)      # to Vancouver: outside any U.S. district
    halvorsen_served = D(2026, 4, 14)            # no waiver returned -> personal service
    us_attorney_served = D(2026, 2, 11)
    mtd1_served = D(2026, 3, 10)                 # CM/ECF
    fac_served = D(2026, 3, 27)                  # CM/ECF
    mtd2_hearing = D(2026, 7, 24)                # continued from 7/10 (L.R. 7-11)
    mtd2_order_entered = D(2026, 8, 3)           # filed 7/31, entered/NEF 8/3
    counterclaim_served = D(2026, 8, 14)
    rfa_to_fedex = D(2026, 8, 7)                 # 5(b)(2)(F)
    rog_emailed = D(2026, 8, 25)                 # 5(b)(2)(E)
    rfp_mailed = D(2026, 9, 11)                  # 5(b)(2)(C)
    rule12c_hearing = D(2026, 10, 16)
    trial = D(2027, 2, 2)                        # Dkt. 35
    expert_cutoff = D(2026, 12, 4)               # Dkt. 35
    judgment = D(2027, 3, 3)
    new_trial_served = D(2027, 3, 29)
    fee_hearing = D(2027, 5, 21)                 # continued from 4/23
    first_notice_filed = D(2027, 4, 9)
    ext_order = D(2027, 8, 9)

    o["a_bank_answer_original"] = after(bank_served, 21)
    o["a_halvorsen_answer"] = after(halvorsen_served, 21)              # 12(a)(1)(A)(i): no waiver
    nb_orig = after(northbridge_waiver_sent, 90)                       # 4(d)(3), 12(a)(1)(A)(ii)
    o["a_northbridge_answer_original"] = nb_orig
    o["a_northbridge_response_to_fac"] = max(nb_orig, after(fac_served, 14))   # 15(a)(3)
    o["a_sba_answer_original"] = after(us_attorney_served, 60)         # 12(a)(2)
    o["a_mirador_amend_as_of_course_vs_bank"] = after(mtd1_served, 21)  # 15(a)(1)(B), per-defendant
    o["a_mirador_opposition_mtd2"] = before(mtd2_hearing, 21)
    o["a_bank_answer_after_mtd2_denial"] = after(mtd2_order_entered, 14)    # 12(a)(4)(A)
    o["a_mirador_answer_to_counterclaim"] = after(counterclaim_served, 21)  # 12(a)(1)(B)
    o["a_bank_rfa_responses"] = after(rfa_to_fedex, 30, six_d("consented_other"))
    o["a_mirador_interrogatory_answers"] = after(rog_emailed, 30, six_d("email"))
    o["a_mirador_rfp_responses"] = after(rfp_mailed, 30, six_d("mail"))
    o["a_mirador_opposition_rule12c"] = before(rule12c_hearing, 21)
    o["a_expert_disclosures_last_day"] = before(trial, 90)             # 26(a)(2)(D)(i)
    o["a_summary_judgment_last_day"] = after(expert_cutoff, 30)        # 56(b)
    o["a_pretrial_disclosures_last_day"] = before(trial, 30)           # 26(a)(3)(B)
    o["a_fee_motion_last_day"] = after(judgment, 14)                   # 54(d)(2)(B)(i)
    r59 = after(judgment, 28)
    o["a_rule59_motion_last_day"] = r59
    o["a_halvorsen_rule59e_last_day"] = r59                            # 6(b)(2): no extension
    o["a_mirador_opposition_new_trial"] = after(new_trial_served, 10)  # L.R. 7-9 carve-out

    motions = [  # (rule, filed, order entered)
        ("54", D(2027, 3, 15), D(2027, 5, 25)),     # fee motion, no 58(e) order
        ("59", D(2027, 3, 29), D(2027, 5, 5)),      # Bank new trial
        ("60", D(2027, 4, 1), D(2027, 5, 14)),      # Northbridge 60(b)(1)
        ("59", D(2027, 4, 14), D(2027, 5, 20)),     # Halvorsen 59(e), "extended" by order
    ]
    tolling = []
    for rule, filed, order in motions:
        timely = filed <= r59 or FLAW == "untimely_tolls"
        if rule in ("59", "60") and timely:
            tolling.append(order)
    trigger = max(tolling)
    days = 30 if FLAW == "appeal_30" else 60                          # SBA is a party
    appeal = after(trigger, days)
    o["a_notice_of_appeal_last_day"] = appeal
    o["a_mirador_amended_notice_last_day"] = appeal                    # 4(a)(4)(B)(ii)
    o["a_bank_cross_appeal_last_day"] = max(after(first_notice_filed, 14), appeal)  # 4(a)(3)
    prescribed = max(appeal, after(first_notice_filed, 14))
    o["a_halvorsen_extension_motion_last_day"] = after(prescribed, 30)            # 4(a)(5)(A)
    o["a_halvorsen_extended_appeal_deadline"] = max(after(prescribed, 30), after(ext_order, 14))
    return o


# ===========================================================================
# Matter B -- Brightwater v. Velasco (removed; 2:26-cv-06231)
# ===========================================================================
def matter_b():
    o = {}
    filed_state = D(2026, 6, 1)
    velasco_mailed_415_40 = D(2026, 6, 5)
    velasco_service = velasco_mailed_415_40 + dt.timedelta(days=10)  # CCP 415.40: 10th day
    velasco_email_copy = D(2026, 6, 3)                              # Murphy Bros: no trigger
    tidewell_received = D(2026, 6, 16)
    tidewell_service = D(2026, 7, 13)                               # CCP 415.30(c): ack executed
    removal_filed = D(2026, 7, 22)

    o["b_velasco_removal_last_day"] = after(velasco_service, 30)              # 1446(b)(1)
    o["b_tidewell_removal_last_day"] = after(tidewell_service, 30)            # 1446(b)(2)(B)
    o["b_remand_procedural_last_day"] = after(removal_filed, 30)              # 1447(c)
    o["b_velasco_answer_last_day"] = max(after(velasco_email_copy, 21),       # 81(c)(2)(A)
                                         after(velasco_service, 21),          # (B)
                                         after(removal_filed, 7))             # (C)
    o["b_tidewell_answer_last_day"] = max(after(tidewell_received, 21),
                                          after(tidewell_service, 21),
                                          after(removal_filed, 7))
    return o


# ===========================================================================
# Matter C -- Delgado v. Ruiz (2:26-cv-00921)
# ===========================================================================
def matter_c():
    o = {}
    ruiz_served = D(2026, 3, 2)
    usao_served = D(2026, 3, 9)
    rule12e_served = D(2026, 4, 3)
    mds_served = D(2026, 5, 28)
    order_docketed = D(2026, 9, 14)          # order w/ reasoning; no separate document

    o["c_ruiz_response_original"] = max(after(ruiz_served, 60), after(usao_served, 60))  # 12(a)(3)
    o["c_delgado_amend_as_of_course_last_day"] = after(rule12e_served, 21)   # 15(a)(1)(B)
    o["c_ruiz_response_after_more_definite_statement"] = after(mds_served, 14)  # 12(a)(4)(B)
    if FLAW == "no_150_day":
        entered = order_docketed
    else:
        entered = order_docketed + dt.timedelta(days=150)                    # 58(c)(2)(B)
    o["c_judgment_entry_date"] = entered
    o["c_delgado_rule59e_last_day"] = after(entered, 28)
    days = 30 if FLAW == "appeal_30" else 60                                 # 4(a)(1)(B)(iv)
    o["c_delgado_notice_of_appeal_last_day"] = after(entered, days)
    o["c_delgado_extension_motion_last_day"] = after(after(entered, days), 30)   # 4(a)(5)(A)(i)
    return o


# ===========================================================================
# Matter D -- Harlan Medical Supply v. Ortiz (2:25-cv-09310)
# ===========================================================================
def matter_d():
    o = {}
    judgment = D(2026, 11, 2)
    pacer_seen = D(2027, 3, 12)
    rule77d_notice_received = D(2027, 3, 31)     # hand delivery by Harlan
    reopen_order = D(2027, 4, 21)

    o["d_ortiz_rule59_last_day"] = after(judgment, 28)                  # no 6(d): runs from entry
    appeal = after(judgment, 30)
    o["d_ortiz_extension_motion_last_day"] = after(appeal, 30)          # 4(a)(5)(A)(i)
    trigger = pacer_seen if FLAW == "reopen_from_actual_notice" else rule77d_notice_received
    o["d_ortiz_reopen_motion_last_day"] = min(after(judgment, 180), after(trigger, 14))  # 4(a)(6)(B)
    o["d_ortiz_reopened_appeal_last_day"] = after(reopen_order, 14)     # 4(a)(6); 2107(c); Bowles
    return o


def compute():
    out = {}
    for f in (matter_a, matter_b, matter_c, matter_d):
        out.update(f())
    return out


def main():
    app = os.environ.get("APP_DIR", "/app")
    res = {k: v.isoformat() for k, v in compute().items()}
    os.makedirs(os.path.join(app, "output"), exist_ok=True)
    with open(os.path.join(app, "output", "docket.json"), "w") as f:
        json.dump({"deadlines": res}, f, indent=2)
    print(json.dumps(res, indent=2))


if __name__ == "__main__":
    main()
