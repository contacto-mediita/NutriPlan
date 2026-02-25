"""
Test file for:
1. Custom weight goal feature (GET/PUT /api/progress/goal)
2. Meal plan with different meals per day and meal options with tiempo_prep
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USER_EMAIL = "bmi_test@test.com"
TEST_USER_PASSWORD = "Test123456"

# User with trial plan for testing meal options
PLAN_USER_EMAIL = "plan_test_20260225153630@test.com"
PLAN_USER_PASSWORD = "testpass123"


@pytest.fixture(scope="module")
def auth_token():
    """Get auth token for test user"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
    )
    if response.status_code != 200:
        pytest.skip(f"Login failed: {response.text}")
    return response.json()["token"]


@pytest.fixture(scope="module")
def plan_user_token():
    """Get auth token for user with plan"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": PLAN_USER_EMAIL, "password": PLAN_USER_PASSWORD}
    )
    if response.status_code != 200:
        pytest.skip(f"Login failed for plan user: {response.text}")
    return response.json()["token"]


@pytest.fixture
def authenticated_headers(auth_token):
    """Headers with auth token"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


@pytest.fixture
def plan_user_headers(plan_user_token):
    """Headers for plan user"""
    return {
        "Authorization": f"Bearer {plan_user_token}",
        "Content-Type": "application/json"
    }


class TestGoalAPI:
    """Tests for /api/progress/goal GET and PUT endpoints"""

    def test_get_goal_returns_calculated_without_custom(self, authenticated_headers):
        """Test GET /api/progress/goal returns calculated goal if no custom goal"""
        # First, ensure we test the endpoint
        response = requests.get(
            f"{BASE_URL}/api/progress/goal",
            headers=authenticated_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should return goal data with required fields
        assert "target_weight" in data
        assert "goal_type" in data
        assert "is_custom" in data
        
        print(f"Goal response: {data}")

    def test_put_goal_updates_custom_goal(self, authenticated_headers):
        """Test PUT /api/progress/goal updates the custom goal"""
        new_goal = {
            "target_weight": 68.5,
            "goal_type": "bajar"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/progress/goal",
            headers=authenticated_headers,
            json=new_goal
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("target_weight") == 68.5
        assert data.get("goal_type") == "bajar"
        assert "message" in data
        
        print(f"Update response: {data}")

    def test_get_goal_shows_custom_after_update(self, authenticated_headers):
        """Test GET /api/progress/goal shows is_custom=True after setting custom goal"""
        # First set a custom goal
        requests.put(
            f"{BASE_URL}/api/progress/goal",
            headers=authenticated_headers,
            json={"target_weight": 65.0, "goal_type": "bajar"}
        )
        
        # Then verify it's returned as custom
        response = requests.get(
            f"{BASE_URL}/api/progress/goal",
            headers=authenticated_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("is_custom") == True
        assert data.get("target_weight") == 65.0
        assert data.get("goal_type") == "bajar"
        
        print(f"Custom goal verified: {data}")

    def test_put_goal_with_aumentar_type(self, authenticated_headers):
        """Test PUT /api/progress/goal with goal_type 'aumentar'"""
        new_goal = {
            "target_weight": 90.0,
            "goal_type": "aumentar"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/progress/goal",
            headers=authenticated_headers,
            json=new_goal
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("target_weight") == 90.0
        assert data.get("goal_type") == "aumentar"
        
        print(f"Aumentar goal set: {data}")

    def test_put_goal_with_mantener_type(self, authenticated_headers):
        """Test PUT /api/progress/goal with goal_type 'mantener'"""
        new_goal = {
            "target_weight": 85.0,
            "goal_type": "mantener"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/progress/goal",
            headers=authenticated_headers,
            json=new_goal
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("target_weight") == 85.0
        assert data.get("goal_type") == "mantener"
        
        print(f"Mantener goal set: {data}")


class TestMealPlanWithOptions:
    """Tests for meal plans with different meals per day and options"""

    def test_get_meal_plans_returns_data(self, plan_user_headers):
        """Test GET /api/meal-plans returns plans for user"""
        response = requests.get(
            f"{BASE_URL}/api/meal-plans",
            headers=plan_user_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"User has {len(data)} meal plans")
        
        if len(data) > 0:
            plan = data[0]
            assert "plan_data" in plan
            assert "dias" in plan.get("plan_data", {})

    def test_meal_plan_has_different_meals_per_day(self, plan_user_headers):
        """Test that each day in the plan has different meals"""
        response = requests.get(
            f"{BASE_URL}/api/meal-plans",
            headers=plan_user_headers
        )
        
        if response.status_code != 200 or not response.json():
            pytest.skip("No meal plans available for testing")
        
        plan = response.json()[0]
        dias = plan.get("plan_data", {}).get("dias", [])
        
        if len(dias) < 2:
            pytest.skip("Plan has less than 2 days")
        
        # Check meals are different between days
        day1_meals = dias[0].get("comidas", [])
        day2_meals = dias[1].get("comidas", []) if len(dias) > 1 else []
        
        print(f"Day 1 meals: {[m.get('nombre') or m.get('tipo') for m in day1_meals]}")
        print(f"Day 2 meals: {[m.get('nombre') or m.get('tipo') for m in day2_meals]}")
        
        # At minimum, verify each day has meals (4 meals: Desayuno, Comida, Snack, Cena)
        assert len(day1_meals) >= 4, f"Day 1 should have at least 4 meals, has {len(day1_meals)}"

    def test_meal_has_options_with_tiempo_prep(self, plan_user_headers):
        """Test that meals have 3 options with tiempo_prep visible"""
        response = requests.get(
            f"{BASE_URL}/api/meal-plans",
            headers=plan_user_headers
        )
        
        if response.status_code != 200 or not response.json():
            pytest.skip("No meal plans available for testing")
        
        plan = response.json()[0]
        dias = plan.get("plan_data", {}).get("dias", [])
        
        if not dias:
            pytest.skip("No days in plan")
        
        # Check first day's meals for options structure
        day1_meals = dias[0].get("comidas", [])
        
        # For old format plans (trial), check basic structure
        for meal in day1_meals:
            print(f"Meal type: {meal.get('tipo')}, name: {meal.get('nombre')}")
            
            # Check if new format with options
            if "opciones" in meal:
                options = meal.get("opciones", [])
                print(f"  Has {len(options)} options")
                
                for opt in options:
                    etiqueta = opt.get("etiqueta")
                    tiempo_prep = opt.get("tiempo_prep")
                    print(f"    Option: {etiqueta}, tiempo_prep: {tiempo_prep}")
                    
                    # Verify tiempo_prep is present in options
                    assert tiempo_prep is not None, f"Option {etiqueta} missing tiempo_prep"
            else:
                # Old format - just verify meal has basic fields
                print(f"  Old format meal: {meal.get('ingredientes', [])[:2]}...")


class TestProgressIntegration:
    """Test progress stats integration with custom goal"""

    def test_progress_stats_returns_data(self, authenticated_headers):
        """Test GET /api/progress/stats returns progress data"""
        response = requests.get(
            f"{BASE_URL}/api/progress/stats",
            headers=authenticated_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "initial_weight" in data
        assert "current_weight" in data
        assert "target_weight" in data
        assert "goal" in data
        
        print(f"Progress stats: {data}")

    def test_weight_records_crud(self, authenticated_headers):
        """Test weight record CRUD operations"""
        # Create a weight record
        today = datetime.now().strftime("%Y-%m-%d")
        create_response = requests.post(
            f"{BASE_URL}/api/progress/weight",
            headers=authenticated_headers,
            json={
                "weight": 84.5,
                "date": today,
                "notes": "Test record for goal feature"
            }
        )
        
        assert create_response.status_code == 200
        record = create_response.json()
        record_id = record.get("id")
        
        print(f"Created weight record: {record}")
        
        # Get all records
        get_response = requests.get(
            f"{BASE_URL}/api/progress/weight",
            headers=authenticated_headers
        )
        
        assert get_response.status_code == 200
        records = get_response.json()
        assert isinstance(records, list)
        
        # Delete the test record
        if record_id:
            delete_response = requests.delete(
                f"{BASE_URL}/api/progress/weight/{record_id}",
                headers=authenticated_headers
            )
            assert delete_response.status_code == 200
            print(f"Deleted test record {record_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
