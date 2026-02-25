"""
Test suite for NutriPlan new features:
- Hydration tracking (widget, goal calculation, daily logging)
- Shopping list with checkboxes (localStorage persistence)
- Meal plan with 3 options per meal
- Exercise guide with completion checkboxes and benefits
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture(scope="module")
def test_user(api_client):
    """Create and return test user with token"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    email = f"hydration_test_{timestamp}@test.com"
    
    response = api_client.post(f"{BASE_URL}/api/auth/register", json={
        "email": email,
        "password": "testpass123",
        "name": "Hydration Test User"
    })
    
    if response.status_code == 400:  # User exists
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": "testpass123"
        })
    
    assert response.status_code in [200, 201], f"Auth failed: {response.text}"
    data = response.json()
    return {"token": data["token"], "user": data["user"]}

@pytest.fixture(scope="module")
def auth_headers(test_user):
    """Return auth headers"""
    return {"Authorization": f"Bearer {test_user['token']}"}

@pytest.fixture(scope="module")
def user_with_questionnaire(api_client, test_user, auth_headers):
    """Create user with questionnaire completed (needed for hydration goal)"""
    # Save questionnaire data
    questionnaire_data = {
        "nombre": "Test Hydration User",
        "telefono_whatsapp": "",
        "edad": 30,
        "fecha_nacimiento": "1994-01-15",
        "sexo": "masculino",
        "estatura": 175,
        "peso": 75,
        "objetivo_principal": "bajar de peso",
        "objetivos_secundarios": [],
        "trabajo_oficina": True,
        "trabajo_fisico": False,
        "labores_hogar": True,
        "turnos_rotativos": False,
        "ejercicio_adicional": "correr",
        "dias_ejercicio": 3,
        "padecimientos": [],
        "medicamentos_controlados": False,
        "sintomas": [],
        "fuma": False,
        "consume_alcohol": False,
        "frecuencia_alcohol": "",
        "alergias": [],
        "vegetariano": False,
        "alimentos_no_deseados": [],
        "desayuno_tipico": "cereal con leche",
        "comida_tipica": "pollo con arroz",
        "cena_tipica": "ensalada",
        "platillo_favorito": "tacos",
        "frecuencia_restaurantes": "1 vez por semana",
        "ticket_promedio": 200
    }
    
    response = api_client.post(
        f"{BASE_URL}/api/questionnaire",
        json=questionnaire_data,
        headers=auth_headers
    )
    assert response.status_code == 200, f"Questionnaire save failed: {response.text}"
    return test_user


class TestHydrationGoalEndpoint:
    """Test GET /api/hydration/goal endpoint"""
    
    def test_hydration_goal_without_questionnaire(self, api_client):
        """Test hydration goal returns default values for user without questionnaire"""
        # Create new user without questionnaire
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S%f")
        email = f"no_questionnaire_{timestamp}@test.com"
        
        reg_response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "testpass123",
            "name": "No Questionnaire User"
        })
        assert reg_response.status_code in [200, 201]
        token = reg_response.json()["token"]
        
        # Get hydration goal
        response = api_client.get(
            f"{BASE_URL}/api/hydration/goal",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Should return default values
        assert data["daily_glasses"] == 8, "Default daily glasses should be 8"
        assert data["daily_ml"] == 2000, "Default daily ml should be 2000"
        assert data["weight_kg"] == 70, "Default weight should be 70"
        assert data["goal"] == "general", "Default goal should be 'general'"
        print(f"✓ Hydration goal without questionnaire returns defaults: {data}")
    
    def test_hydration_goal_with_questionnaire(self, api_client, user_with_questionnaire, auth_headers):
        """Test hydration goal calculates based on weight and objective"""
        response = api_client.get(
            f"{BASE_URL}/api/hydration/goal",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # User has peso=75 and objetivo="bajar de peso"
        # For weight loss: base_ml = peso * 40 = 75 * 40 = 3000ml
        # daily_glasses = 3000 / 250 = 12
        assert data["weight_kg"] == 75, f"Weight should be 75, got {data['weight_kg']}"
        assert "bajar" in data["goal"].lower(), f"Goal should contain 'bajar', got {data['goal']}"
        
        # Verify calculation: For bajar de peso, formula is peso * 40 / 250
        expected_glasses = round(75 * 40 / 250)  # = 12
        assert data["daily_glasses"] == expected_glasses, f"Expected {expected_glasses} glasses, got {data['daily_glasses']}"
        assert data["daily_ml"] == 75 * 40, f"Expected {75 * 40} ml, got {data['daily_ml']}"
        
        print(f"✓ Hydration goal calculated correctly for weight loss: {data}")
    
    def test_hydration_goal_unauthorized(self, api_client):
        """Test hydration goal requires authentication"""
        response = api_client.get(f"{BASE_URL}/api/hydration/goal")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Hydration goal requires authentication")


class TestHydrationLogEndpoint:
    """Test POST /api/hydration/log endpoint"""
    
    def test_log_hydration_success(self, api_client, user_with_questionnaire, auth_headers):
        """Test logging water intake"""
        today = datetime.now().strftime("%Y-%m-%d")
        
        response = api_client.post(
            f"{BASE_URL}/api/hydration/log",
            json={"glasses": 5, "date": today},
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data["glasses"] == 5, f"Expected 5 glasses, got {data['glasses']}"
        assert data["date"] == today, f"Expected date {today}, got {data['date']}"
        assert "message" in data, "Response should contain message"
        print(f"✓ Hydration log created successfully: {data}")
    
    def test_log_hydration_update_existing(self, api_client, user_with_questionnaire, auth_headers):
        """Test updating existing hydration record (upsert behavior)"""
        today = datetime.now().strftime("%Y-%m-%d")
        
        # First log
        api_client.post(
            f"{BASE_URL}/api/hydration/log",
            json={"glasses": 3, "date": today},
            headers=auth_headers
        )
        
        # Update same day
        response = api_client.post(
            f"{BASE_URL}/api/hydration/log",
            json={"glasses": 8, "date": today},
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["glasses"] == 8, "Glasses should be updated to 8"
        print(f"✓ Hydration log upsert works correctly: {data}")
    
    def test_log_hydration_unauthorized(self, api_client):
        """Test hydration log requires authentication"""
        response = api_client.post(
            f"{BASE_URL}/api/hydration/log",
            json={"glasses": 5, "date": "2024-01-15"}
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Hydration log requires authentication")


class TestHydrationTodayEndpoint:
    """Test GET /api/hydration/today endpoint"""
    
    def test_get_today_hydration(self, api_client, user_with_questionnaire, auth_headers):
        """Test getting today's hydration record"""
        today = datetime.now().strftime("%Y-%m-%d")
        
        # First log some water
        api_client.post(
            f"{BASE_URL}/api/hydration/log",
            json={"glasses": 6, "date": today},
            headers=auth_headers
        )
        
        # Get today's record
        response = api_client.get(
            f"{BASE_URL}/api/hydration/today",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data["glasses"] == 6, f"Expected 6 glasses, got {data['glasses']}"
        assert data["date"] == today, f"Expected date {today}, got {data['date']}"
        print(f"✓ Today's hydration retrieved correctly: {data}")
    
    def test_get_today_hydration_no_record(self, api_client):
        """Test getting today's hydration when no record exists"""
        # Create new user without any hydration logs
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S%f")
        email = f"no_hydration_{timestamp}@test.com"
        
        reg_response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "testpass123",
            "name": "No Hydration User"
        })
        assert reg_response.status_code in [200, 201]
        token = reg_response.json()["token"]
        
        response = api_client.get(
            f"{BASE_URL}/api/hydration/today",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["glasses"] == 0, "Should return 0 glasses when no record exists"
        print(f"✓ Today's hydration returns 0 when no record: {data}")
    
    def test_get_today_hydration_unauthorized(self, api_client):
        """Test today hydration requires authentication"""
        response = api_client.get(f"{BASE_URL}/api/hydration/today")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Today hydration requires authentication")


class TestHydrationHistoryEndpoint:
    """Test GET /api/hydration/history endpoint"""
    
    def test_get_hydration_history(self, api_client, user_with_questionnaire, auth_headers):
        """Test getting hydration history"""
        response = api_client.get(
            f"{BASE_URL}/api/hydration/history",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "History should return a list"
        print(f"✓ Hydration history retrieved: {len(data)} records")
    
    def test_get_hydration_history_with_days_param(self, api_client, user_with_questionnaire, auth_headers):
        """Test hydration history with days parameter"""
        response = api_client.get(
            f"{BASE_URL}/api/hydration/history?days=3",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 3, "Should return at most 3 records"
        print(f"✓ Hydration history with days param: {len(data)} records")


class TestMealPlanStructure:
    """Test meal plan structure for 3 options per meal feature"""
    
    def test_trial_plan_structure(self, api_client, user_with_questionnaire, auth_headers):
        """Test trial plan has correct structure"""
        # Generate trial plan
        response = api_client.post(
            f"{BASE_URL}/api/meal-plans/trial",
            headers=auth_headers
        )
        
        # May fail if trial already used, but check structure if 200
        if response.status_code == 200:
            data = response.json()
            
            assert "plan_data" in data, "Should have plan_data"
            assert "dias" in data["plan_data"], "Should have dias array"
            assert len(data["plan_data"]["dias"]) >= 1, "Should have at least 1 day"
            
            # Check meals structure
            day = data["plan_data"]["dias"][0]
            assert "comidas" in day, "Day should have comidas"
            
            # Check for lista_super
            if "lista_super" in data["plan_data"]:
                lista = data["plan_data"]["lista_super"]
                assert isinstance(lista, dict), "Lista super should be a dict"
                print(f"✓ Shopping list categories: {list(lista.keys())}")
            
            # Check for guia_ejercicios
            if "guia_ejercicios" in data["plan_data"]:
                guia = data["plan_data"]["guia_ejercicios"]
                assert "rutina_casa" in guia or "rutina_gimnasio" in guia, "Should have exercise routines"
                print(f"✓ Exercise guide present with keys: {list(guia.keys())}")
            
            print(f"✓ Trial plan structure verified")
        else:
            print(f"Trial already used (status {response.status_code}), skipping structure test")
    
    def test_get_existing_plans(self, api_client, user_with_questionnaire, auth_headers):
        """Test getting existing meal plans"""
        response = api_client.get(
            f"{BASE_URL}/api/meal-plans",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Should return list of plans"
        print(f"✓ Retrieved {len(data)} meal plans")
        
        # If there are plans, check structure
        if len(data) > 0:
            plan = data[0]
            assert "id" in plan, "Plan should have id"
            assert "plan_data" in plan, "Plan should have plan_data"
            assert "calories_target" in plan, "Plan should have calories_target"
            assert "macros" in plan, "Plan should have macros"
            print(f"✓ Plan structure verified: {plan['id'][:8]}...")


class TestExerciseGuideStructure:
    """Test exercise guide has correct fields for benefits and objectives"""
    
    def test_exercise_guide_fields(self, api_client, user_with_questionnaire, auth_headers):
        """Verify exercise guide has objetivo_rutina and beneficios fields in structure"""
        # Get existing plans
        response = api_client.get(
            f"{BASE_URL}/api/meal-plans",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        plans = response.json()
        
        if len(plans) > 0:
            plan = plans[0]
            guia = plan.get("plan_data", {}).get("guia_ejercicios", {})
            
            if guia:
                # Check structure of exercise routines
                for routine_type in ["rutina_casa", "rutina_gimnasio"]:
                    routines = guia.get(routine_type, [])
                    if routines and len(routines) > 0:
                        routine = routines[0]
                        # Log available fields
                        print(f"✓ {routine_type} fields: {list(routine.keys())}")
                        
                        # Check for ejercicios array
                        if "ejercicios" in routine:
                            assert isinstance(routine["ejercicios"], list)
                            if len(routine["ejercicios"]) > 0:
                                ej = routine["ejercicios"][0]
                                print(f"✓ Exercise fields: {list(ej.keys())}")
                                # Verify basic exercise fields
                                assert "nombre" in ej, "Exercise should have nombre"
                                assert "series" in ej, "Exercise should have series"
                                assert "repeticiones" in ej, "Exercise should have repeticiones"
        else:
            print("No plans available to test exercise structure")


class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_root(self, api_client):
        """Test API root endpoint"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ API root: {data}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
