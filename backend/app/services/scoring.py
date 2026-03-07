"""
Scoring engine - snooker rules
CR-001: Ball on tracking, foul calculation
"""

import uuid
from copy import deepcopy
from datetime import datetime

BALL_VALUES = {
    "red": 1,
    "yellow": 2,
    "green": 3,
    "brown": 4,
    "blue": 5,
    "pink": 6,
    "black": 7,
}

FINAL_COLOR_SEQUENCE = ["yellow", "green", "brown", "blue", "pink", "black"]


def get_ball_value(ball: str) -> int:
    return BALL_VALUES.get(ball, 0)


def get_foul_ball_value(ball: str) -> int:
    """Value for foul calculation. Cue ball = 4 (minimum foul)."""
    if ball == "cue_ball":
        return 4
    return BALL_VALUES.get(ball, 0)


def get_ball_on_value(ball_on: str) -> int:
    """Value of ball_on for foul calculation. colour = 4 when unspecified."""
    if ball_on == "red":
        return 1
    if ball_on == "colour":
        return 4
    return BALL_VALUES.get(ball_on, 4)


def calculate_foul_points(ball_on: str, ball_involved: str) -> int:
    """foul_points = max(4, value(ball_on), value(ball_involved)) - CR-001"""
    v_on = get_ball_on_value(ball_on)
    v_involved = get_foul_ball_value(ball_involved)
    return min(7, max(4, v_on, v_involved))


def get_ball_on(reds_remaining: int, last_potted_color: str | None) -> str:
    """Get current ball on from state (CR-001)"""
    if reds_remaining > 0:
        if not last_potted_color or last_potted_color == "red":
            return "red"
        return "colour"
    if not last_potted_color or last_potted_color == "red":
        return "yellow"
    if last_potted_color in FINAL_COLOR_SEQUENCE:
        idx = FINAL_COLOR_SEQUENCE.index(last_potted_color)
        if idx < len(FINAL_COLOR_SEQUENCE) - 1:
            return FINAL_COLOR_SEQUENCE[idx + 1]
    return "black"


def get_next_ball_on(ball: str, reds_remaining: int, last_potted: str) -> str:
    """Update ball_on after a pot (CR-001)"""
    if ball == "red":
        return "colour"
    if reds_remaining > 0:
        return "red"
    if ball in FINAL_COLOR_SEQUENCE:
        idx = FINAL_COLOR_SEQUENCE.index(ball)
        if idx < len(FINAL_COLOR_SEQUENCE) - 1:
            return FINAL_COLOR_SEQUENCE[idx + 1]
    return "black"


def can_pot_ball(
    ball: str,
    reds_remaining: int,
    last_potted_color: str | None,
) -> tuple[bool, str | None]:
    """Returns (valid, error_message)"""
    if ball == "red":
        if reds_remaining <= 0:
            return False, "No reds remaining"
        return True, None

    if reds_remaining > 0:
        if last_potted_color and last_potted_color != "red":
            return False, "Must pot a red next"
        return True, None

    if last_potted_color and last_potted_color in FINAL_COLOR_SEQUENCE:
        expected_idx = FINAL_COLOR_SEQUENCE.index(last_potted_color) + 1
    else:
        expected_idx = 0
    ball_idx = FINAL_COLOR_SEQUENCE.index(ball) if ball in FINAL_COLOR_SEQUENCE else -1
    if ball_idx != expected_idx:
        expected = FINAL_COLOR_SEQUENCE[expected_idx] if expected_idx < len(FINAL_COLOR_SEQUENCE) else "?"
        return False, f"Expected {expected}, got {ball}"

    return True, None


def _update_team_scores(state: dict) -> dict:
    if not state.get("teams"):
        return state
    for team in state["teams"]:
        team["score"] = sum(
            p["score"]
            for p in state["players"]
            if p.get("teamId") == team["id"]
        )
    return state


def pot_ball(state: dict, ball: str) -> tuple[bool, dict | None, str | None]:
    """Returns (success, new_state, error_message)"""
    valid, err = can_pot_ball(
        ball,
        state["redsRemaining"],
        state.get("lastPottedColor"),
    )
    if not valid:
        return False, None, err

    next_state = deepcopy(state)
    points = get_ball_value(ball)
    player = next_state["players"][next_state["currentPlayerIndex"]]

    player["score"] += points
    next_state["currentBreak"] += points

    if ball == "red":
        next_state["redsRemaining"] = max(0, next_state["redsRemaining"] - 1)
    next_state["lastPottedColor"] = ball
    next_state["ballOn"] = get_next_ball_on(ball, next_state["redsRemaining"], ball)

    event = {
        "id": str(uuid.uuid4()),
        "type": "pot",
        "playerId": player["id"],
        "ball": ball,
        "points": points,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "description": f"{player['name']} potted {ball} (+{points})",
    }
    next_state["events"] = next_state["events"] + [event]

    return True, _update_team_scores(next_state), None


def record_foul(state: dict, ball_involved: str) -> dict:
    """Record foul with ball_on and ball_involved (CR-001)"""
    next_state = deepcopy(state)
    idx = next_state["currentPlayerIndex"]
    current = next_state["players"][idx]

    ball_on = next_state.get("ballOn") or get_ball_on(
        next_state["redsRemaining"],
        next_state.get("lastPottedColor"),
    )
    foul_points = calculate_foul_points(ball_on, ball_involved)

    if next_state.get("teams") and len(next_state["teams"]) >= 2:
        current_team_id = current.get("teamId")
        opposing = next((t for t in next_state["teams"] if t["id"] != current_team_id), None)
        if opposing:
            opp_player_id = opposing["playerIds"][0]
            opp_idx = next((i for i, p in enumerate(next_state["players"]) if p["id"] == opp_player_id), idx)
            opp_name = next_state["players"][opp_idx]["name"]
        else:
            opp_idx = (idx + 1) % len(next_state["players"])
            opp_name = next_state["players"][opp_idx]["name"]
    else:
        opp_idx = (idx + 1) % len(next_state["players"])
        opp_name = next_state["players"][opp_idx]["name"]

    next_state["players"][opp_idx]["score"] += foul_points
    next_state["currentBreak"] = 0
    next_state["currentPlayerIndex"] = opp_idx
    next_state["lastPottedColor"] = None
    next_state["ballOn"] = get_ball_on(next_state["redsRemaining"], None)

    ball_on_label = ball_on.upper() if ball_on != "colour" else "COLOUR"
    ball_involved_label = "CUE BALL" if ball_involved == "cue_ball" else ball_involved.upper()

    event = {
        "id": str(uuid.uuid4()),
        "type": "foul",
        "playerId": current["id"],
        "ball": ball_involved,
        "points": foul_points,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "description": f"{current['name']} committed FOUL | Ball on: {ball_on_label} | Ball involved: {ball_involved_label} | +{foul_points} to {opp_name}",
        "ballOn": ball_on,
        "ballInvolved": ball_involved,
    }
    next_state["events"] = next_state["events"] + [event]

    return _update_team_scores(next_state)


def change_turn(state: dict) -> dict:
    next_state = deepcopy(state)
    next_state["currentPlayerIndex"] = (next_state["currentPlayerIndex"] + 1) % len(next_state["players"])
    next_state["currentBreak"] = 0
    next_state["lastPottedColor"] = None
    next_state["ballOn"] = get_ball_on(next_state["redsRemaining"], None)
    return next_state
