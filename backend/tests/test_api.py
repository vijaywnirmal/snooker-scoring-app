"""
API integration tests.
"""

import pytest
from fastapi.testclient import TestClient


class TestStartGame:
    def test_start_two_player_game(self, client: TestClient):
        r = client.post("/game/start", json={
            "num_players": 2,
            "player_names": ["Alice", "Bob"],
        })
        assert r.status_code == 200
        data = r.json()
        assert "game_id" in data
        assert data["message"] == "Game started"
        state = data["state"]
        assert len(state["players"]) == 2
        assert state["players"][0]["name"] == "Alice"
        assert state["players"][1]["name"] == "Bob"
        assert state["redsRemaining"] == 15
        assert state["ballOn"] == "red"
        assert state["mode"] == "singles"

    def test_start_four_player_game(self, client: TestClient):
        r = client.post("/game/start", json={
            "num_players": 4,
            "player_names": ["A", "B", "C", "D"],
        })
        assert r.status_code == 200
        state = r.json()["state"]
        assert state["mode"] == "doubles"
        assert len(state["teams"]) == 2
        assert len(state["teams"][0]["playerIds"]) == 2

    def test_start_with_first_player_index(self, client: TestClient):
        r = client.post("/game/start", json={
            "num_players": 2,
            "player_names": ["Alice", "Bob"],
            "first_player_index": 1,
        })
        assert r.status_code == 200
        assert r.json()["state"]["currentPlayerIndex"] == 1

    def test_start_mismatched_names_validation_error(self, client: TestClient):
        r = client.post("/game/start", json={
            "num_players": 2,
            "player_names": ["Alice"],
        })
        # FastAPI returns 422 for request validation errors (Pydantic)
        assert r.status_code in (400, 422)


class TestGetState:
    def test_get_state_404(self, client: TestClient):
        r = client.get("/game/state/nonexistent-id")
        assert r.status_code == 404

    def test_get_state_after_start(self, client: TestClient):
        start = client.post("/game/start", json={
            "num_players": 2,
            "player_names": ["Alice", "Bob"],
        })
        game_id = start.json()["game_id"]
        r = client.get(f"/game/state/{game_id}")
        assert r.status_code == 200
        assert r.json()["id"] == game_id


class TestPot:
    def test_pot_red(self, client: TestClient):
        start = client.post("/game/start", json={
            "num_players": 2,
            "player_names": ["Alice", "Bob"],
        })
        game_id = start.json()["game_id"]
        r = client.post(f"/game/{game_id}/pot", json={"ball": "red"})
        assert r.status_code == 200
        state = r.json()
        assert state["players"][0]["score"] == 1
        assert state["redsRemaining"] == 14
        assert state["ballOn"] == "colour"

    def test_pot_invalid_treated_as_foul(self, client: TestClient):
        start = client.post("/game/start", json={
            "num_players": 2,
            "player_names": ["Alice", "Bob"],
        })
        game_id = start.json()["game_id"]
        # Pot red, then colour (blue) - now ball on is red
        client.post(f"/game/{game_id}/pot", json={"ball": "red"})
        client.post(f"/game/{game_id}/pot", json={"ball": "blue"})
        # Try to pot colour again (invalid - must pot red next)
        r = client.post(f"/game/{game_id}/pot", json={"ball": "blue"})
        assert r.status_code == 200
        state = r.json()
        # Foul: opponent gets points, turn switches. Ball on=red(1), ball involved=blue(5) -> 5 pts
        assert state["players"][1]["score"] == 5
        assert state["currentPlayerIndex"] == 1

    def test_pot_404(self, client: TestClient):
        r = client.post("/game/nonexistent/pot", json={"ball": "red"})
        assert r.status_code == 404


class TestFoul:
    def test_record_foul_cue_ball(self, client: TestClient):
        start = client.post("/game/start", json={
            "num_players": 2,
            "player_names": ["Alice", "Bob"],
        })
        game_id = start.json()["game_id"]
        r = client.post(f"/game/{game_id}/foul", json={"ball_involved": "cue_ball"})
        assert r.status_code == 200
        state = r.json()
        assert state["players"][1]["score"] == 4
        assert state["currentPlayerIndex"] == 1

    def test_record_foul_404(self, client: TestClient):
        r = client.post("/game/nonexistent/foul", json={"ball_involved": "cue_ball"})
        assert r.status_code == 404


class TestTurn:
    def test_change_turn(self, client: TestClient):
        start = client.post("/game/start", json={
            "num_players": 2,
            "player_names": ["Alice", "Bob"],
        })
        game_id = start.json()["game_id"]
        r = client.post(f"/game/{game_id}/turn")
        assert r.status_code == 200
        assert r.json()["currentPlayerIndex"] == 1


class TestUndo:
    def test_undo_after_pot(self, client: TestClient):
        start = client.post("/game/start", json={
            "num_players": 2,
            "player_names": ["Alice", "Bob"],
        })
        game_id = start.json()["game_id"]
        client.post(f"/game/{game_id}/pot", json={"ball": "red"})
        r = client.post(f"/game/{game_id}/undo")
        assert r.status_code == 200
        state = r.json()
        assert state["players"][0]["score"] == 0
        assert state["redsRemaining"] == 15

    def test_undo_nothing_400(self, client: TestClient):
        start = client.post("/game/start", json={
            "num_players": 2,
            "player_names": ["Alice", "Bob"],
        })
        game_id = start.json()["game_id"]
        r = client.post(f"/game/{game_id}/undo")
        assert r.status_code == 400
        assert "Nothing to undo" in r.json()["detail"]


class TestReset:
    def test_reset_deletes_game(self, client: TestClient):
        start = client.post("/game/start", json={
            "num_players": 2,
            "player_names": ["Alice", "Bob"],
        })
        game_id = start.json()["game_id"]
        r = client.post(f"/game/{game_id}/reset")
        assert r.status_code == 200
        assert r.json()["message"] == "Game reset"
        get_r = client.get(f"/game/state/{game_id}")
        assert get_r.status_code == 404
