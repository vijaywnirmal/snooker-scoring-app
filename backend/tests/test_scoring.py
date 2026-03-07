"""
Unit tests for the scoring engine.
"""

import pytest

from app.services.scoring import (
    can_pot_ball,
    calculate_foul_points,
    change_turn,
    get_ball_on,
    get_ball_on_value,
    get_foul_ball_value,
    get_next_ball_on,
    pot_ball,
    record_foul,
)


# --- Ball value and foul calculation ---

class TestGetBallValue:
    def test_red(self):
        from app.services.scoring import get_ball_value
        assert get_ball_value("red") == 1

    def test_black(self):
        from app.services.scoring import get_ball_value
        assert get_ball_value("black") == 7

    def test_unknown(self):
        from app.services.scoring import get_ball_value
        assert get_ball_value("unknown") == 0


class TestGetFoulBallValue:
    def test_cue_ball_is_4(self):
        assert get_foul_ball_value("cue_ball") == 4

    def test_object_balls(self):
        assert get_foul_ball_value("red") == 1
        assert get_foul_ball_value("black") == 7


class TestGetBallOnValue:
    def test_red_is_1(self):
        assert get_ball_on_value("red") == 1

    def test_colour_is_4(self):
        assert get_ball_on_value("colour") == 4

    def test_specific_colour(self):
        assert get_ball_on_value("blue") == 5


class TestCalculateFoulPoints:
    def test_red_on_blue(self):
        assert calculate_foul_points("red", "blue") == 5

    def test_red_on_black(self):
        assert calculate_foul_points("red", "black") == 7

    def test_black_on_red(self):
        assert calculate_foul_points("black", "red") == 7

    def test_cue_ball_minimum_4(self):
        assert calculate_foul_points("red", "cue_ball") == 4

    def test_colour_on_cue_ball(self):
        assert calculate_foul_points("colour", "cue_ball") == 4

    def test_minimum_4(self):
        assert calculate_foul_points("red", "red") == 4  # max(4,1,1)=4

    def test_maximum_7(self):
        assert calculate_foul_points("black", "black") == 7


# --- Ball on transitions ---

class TestGetBallOn:
    def test_reds_remaining_starts_red(self):
        assert get_ball_on(15, None) == "red"
        assert get_ball_on(10, "red") == "red"

    def test_reds_remaining_after_colour(self):
        assert get_ball_on(14, "blue") == "colour"

    def test_reds_gone_starts_yellow(self):
        assert get_ball_on(0, None) == "yellow"
        assert get_ball_on(0, "red") == "yellow"

    def test_final_sequence(self):
        assert get_ball_on(0, "yellow") == "green"
        assert get_ball_on(0, "green") == "brown"
        assert get_ball_on(0, "brown") == "blue"
        assert get_ball_on(0, "blue") == "pink"
        assert get_ball_on(0, "pink") == "black"
        assert get_ball_on(0, "black") == "black"


class TestGetNextBallOn:
    def test_red_potted_goes_to_colour(self):
        assert get_next_ball_on("red", 14, "red") == "colour"

    def test_colour_potted_reds_remain_goes_to_red(self):
        assert get_next_ball_on("blue", 10, "blue") == "red"

    def test_colour_sequence_blue_to_pink(self):
        # After potting blue when reds are gone, next is pink
        assert get_next_ball_on("blue", 0, "blue") == "pink"

    def test_yellow_to_green(self):
        assert get_next_ball_on("yellow", 0, "yellow") == "green"

    def test_black_stays_black(self):
        assert get_next_ball_on("black", 0, "black") == "black"


# --- Pot validation ---

class TestCanPotBall:
    def test_red_valid_when_reds_remain(self):
        valid, err = can_pot_ball("red", 15, None)
        assert valid is True
        assert err is None

    def test_red_invalid_when_no_reds(self):
        valid, err = can_pot_ball("red", 0, None)
        assert valid is False
        assert "No reds remaining" in err

    def test_colour_after_red_valid(self):
        valid, err = can_pot_ball("blue", 14, "red")
        assert valid is True

    def test_colour_after_colour_invalid_when_reds_remain(self):
        valid, err = can_pot_ball("blue", 14, "blue")
        assert valid is False
        assert "Must pot a red next" in err

    def test_yellow_first_when_reds_gone_valid(self):
        valid, err = can_pot_ball("yellow", 0, None)
        assert valid is True

    def test_green_when_yellow_expected_invalid(self):
        valid, err = can_pot_ball("green", 0, None)
        assert valid is False
        assert "Expected yellow" in err

    def test_sequence_yellow_green_brown(self):
        valid, _ = can_pot_ball("green", 0, "yellow")
        assert valid is True
        valid, _ = can_pot_ball("brown", 0, "green")
        assert valid is True


# --- pot_ball ---

class TestPotBall:
    def test_pot_red_success(self, two_player_state):
        ok, state, err = pot_ball(two_player_state, "red")
        assert ok is True
        assert err is None
        assert state["players"][0]["score"] == 1
        assert state["currentBreak"] == 1
        assert state["redsRemaining"] == 14
        assert state["ballOn"] == "colour"
        assert state["lastPottedColor"] == "red"
        assert len(state["events"]) == 1
        assert state["events"][0]["type"] == "pot"
        assert state["events"][0]["ball"] == "red"

    def test_pot_red_then_colour(self, two_player_state):
        ok1, s1, _ = pot_ball(two_player_state, "red")
        assert ok1 is True
        ok2, s2, _ = pot_ball(s1, "blue")
        assert ok2 is True
        assert s2["players"][0]["score"] == 6
        assert s2["ballOn"] == "red"
        assert s2["redsRemaining"] == 14

    def test_pot_red_invalid_when_no_reds(self, two_player_state):
        two_player_state["redsRemaining"] = 0
        two_player_state["lastPottedColor"] = "blue"
        two_player_state["ballOn"] = "yellow"
        ok, state, err = pot_ball(two_player_state, "red")
        assert ok is False
        assert state is None
        assert "No reds remaining" in err

    def test_pot_colour_after_colour_invalid(self, two_player_state):
        two_player_state["lastPottedColor"] = "blue"
        two_player_state["ballOn"] = "colour"
        ok, state, err = pot_ball(two_player_state, "pink")
        assert ok is False
        assert "Must pot a red next" in err


# --- record_foul ---

class TestRecordFoul:
    def test_foul_switches_turn(self, two_player_state):
        result = record_foul(two_player_state, "cue_ball")
        assert result["currentPlayerIndex"] == 1
        assert result["players"][1]["score"] == 4
        assert result["currentBreak"] == 0
        assert result["ballOn"] == "red"

    def test_foul_opponent_receives_points(self, two_player_state):
        result = record_foul(two_player_state, "black")
        assert result["players"][1]["score"] == 7

    def test_foul_event_recorded(self, two_player_state):
        result = record_foul(two_player_state, "blue")
        foul_events = [e for e in result["events"] if e["type"] == "foul"]
        assert len(foul_events) == 1
        assert foul_events[0]["ballOn"] == "red"
        assert foul_events[0]["ballInvolved"] == "blue"
        assert foul_events[0]["points"] == 5


# --- change_turn ---

class TestChangeTurn:
    def test_advances_player_index(self, two_player_state):
        result = change_turn(two_player_state)
        assert result["currentPlayerIndex"] == 1

    def test_wraps_to_zero_for_two_players(self, two_player_state):
        two_player_state["currentPlayerIndex"] = 1
        result = change_turn(two_player_state)
        assert result["currentPlayerIndex"] == 0

    def test_resets_break(self, two_player_state):
        two_player_state["currentBreak"] = 50
        result = change_turn(two_player_state)
        assert result["currentBreak"] == 0

    def test_resets_ball_on(self, two_player_state):
        two_player_state["lastPottedColor"] = "blue"
        two_player_state["ballOn"] = "colour"
        result = change_turn(two_player_state)
        assert result["ballOn"] == "red"
        assert result["lastPottedColor"] is None
