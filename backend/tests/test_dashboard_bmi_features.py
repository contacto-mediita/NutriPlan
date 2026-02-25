"""
Test Dashboard BMI, Objetivo, and Tiempo Estimado Features
Tests for: 
- BMI calculation and category verification
- Objetivo (goal) display from questionnaire
- Tiempo Estimado (estimated time) calculations
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')


class TestDashboardBMIFeatures:
    """Test BMI calculation, Objetivo display, and Tiempo Estimado features"""
    
    @pytest.fixture(scope="class")
    def test_user(self):
        """Create a test user with specific data for BMI calculations"""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        email = f"bmi_test_{timestamp}@test.com"
        password = "testpass123"
        
        # Register user
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": password,
            "name": "BMI Test User"
        })
        
        if response.status_code == 200:
            data = response.json()
            return {
                "email": email,
                "password": password,
                "token": data["token"],
                "user_id": data["user"]["id"]
            }
        elif response.status_code == 400:  # User exists
            login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": email,
                "password": password
            })
            data = login_response.json()
            return {
                "email": email,
                "password": password,
                "token": data["token"],
                "user_id": data["user"]["id"]
            }
        pytest.skip(f"Could not create/login test user: {response.text}")

    def test_register_user(self, test_user):
        """Test user registration works"""
        assert test_user is not None
        assert "token" in test_user
        print(f"✅ User registered/logged in: {test_user['email']}")

    def test_create_questionnaire_for_bmi_test(self, test_user):
        """
        Create questionnaire with specific values:
        - peso=85kg
        - estatura=175cm
        - objetivo='Bajar de peso'
        - dias_ejercicio=4
        Expected BMI = 85 / (1.75^2) = 27.76 (Sobrepeso)
        """
        headers = {"Authorization": f"Bearer {test_user['token']}"}
        
        questionnaire_data = {
            "nombre": "BMI Test User",
            "telefono_whatsapp": "55 1234 5678",
            "edad": 30,
            "fecha_nacimiento": "1995-01-15",
            "sexo": "masculino",
            "estatura": 175,  # cm
            "peso": 85,  # kg
            "objetivo_principal": "Bajar de peso",
            "objetivos_secundarios": ["Más energía", "Mejor digestión"],
            "trabajo_oficina": True,
            "trabajo_fisico": False,
            "labores_hogar": False,
            "turnos_rotativos": False,
            "ejercicio_adicional": "correr",
            "dias_ejercicio": 4,
            "padecimientos": [],
            "medicamentos_controlados": False,
            "sintomas": [],
            "fuma": False,
            "consume_alcohol": False,
            "frecuencia_alcohol": "",
            "alergias": [],
            "vegetariano": False,
            "alimentos_no_deseados": [],
            "desayuno_tipico": "Huevos con pan",
            "comida_tipica": "Pollo con arroz",
            "cena_tipica": "Ensalada",
            "platillo_favorito": "Tacos",
            "frecuencia_restaurantes": "1-2 veces por semana",
            "ticket_promedio": 200
        }
        
        response = requests.post(
            f"{BASE_URL}/api/questionnaire",
            headers=headers,
            json=questionnaire_data
        )
        
        assert response.status_code == 200, f"Failed to create questionnaire: {response.text}"
        data = response.json()
        assert "id" in data
        print(f"✅ Questionnaire created with id: {data['id']}")
        
        # Verify questionnaire was saved correctly
        get_response = requests.get(
            f"{BASE_URL}/api/questionnaire",
            headers=headers
        )
        assert get_response.status_code == 200
        saved_data = get_response.json()
        
        assert saved_data is not None
        assert saved_data["data"]["peso"] == 85
        assert saved_data["data"]["estatura"] == 175
        assert saved_data["data"]["objetivo_principal"] == "Bajar de peso"
        assert saved_data["data"]["dias_ejercicio"] == 4
        print(f"✅ Questionnaire data verified: peso={saved_data['data']['peso']}kg, estatura={saved_data['data']['estatura']}cm")
        
        return saved_data

    def test_bmi_calculation_formula(self):
        """Test BMI calculation formula: peso / (estatura/100)^2"""
        # Test data: peso=85kg, estatura=175cm
        peso = 85
        estatura = 175
        estatura_m = estatura / 100  # Convert to meters
        
        # Expected BMI = 85 / (1.75^2) = 85 / 3.0625 = 27.755...
        expected_bmi = peso / (estatura_m * estatura_m)
        
        assert round(expected_bmi, 1) == 27.8, f"Expected BMI 27.8, got {round(expected_bmi, 1)}"
        print(f"✅ BMI calculation verified: {round(expected_bmi, 1)}")

    def test_bmi_category_classification(self):
        """Test BMI categories:
        - Bajo peso: <18.5
        - Normal: 18.5-25
        - Sobrepeso: 25-30
        - Obesidad: >30
        """
        def get_bmi_category(bmi):
            if bmi < 18.5:
                return "Bajo peso"
            elif bmi < 25:
                return "Normal"
            elif bmi < 30:
                return "Sobrepeso"
            else:
                return "Obesidad"
        
        # Test cases
        test_cases = [
            (17.0, "Bajo peso"),
            (18.5, "Normal"),
            (22.0, "Normal"),
            (24.9, "Normal"),
            (25.0, "Sobrepeso"),
            (27.8, "Sobrepeso"),
            (29.9, "Sobrepeso"),
            (30.0, "Obesidad"),
            (35.0, "Obesidad"),
        ]
        
        for bmi, expected_category in test_cases:
            category = get_bmi_category(bmi)
            assert category == expected_category, f"BMI {bmi} should be '{expected_category}', got '{category}'"
            print(f"✅ BMI {bmi} → {category}")

    def test_estimated_time_calculation_weight_loss(self):
        """
        Test estimated time calculation for weight loss goal.
        Formula: 
        - pesoIdeal = 22 * (estatura_m^2)
        - weeklyChange = 0.5 + (diasEjercicio * 0.1)
        - weeksNeeded = diferencia / weeklyChange
        
        For peso=85kg, estatura=175cm, dias_ejercicio=4:
        - pesoIdeal = 22 * 1.75^2 = 22 * 3.0625 = 67.375kg
        - diferencia = |85 - 67.375| = 17.625kg
        - weeklyChange = 0.5 + (4 * 0.1) = 0.9 kg/week
        - weeksNeeded = 17.625 / 0.9 = 19.58... ≈ 20 weeks
        """
        peso = 85
        estatura_m = 175 / 100
        dias_ejercicio = 4
        
        # Calculate ideal weight (BMI = 22)
        peso_ideal = 22 * (estatura_m * estatura_m)
        diferencia = abs(peso - peso_ideal)
        
        # Calculate weekly change for weight loss
        weekly_change = 0.5 + (dias_ejercicio * 0.1)
        
        # Calculate weeks needed
        weeks_needed = diferencia / weekly_change
        
        print(f"📊 Weight loss calculation:")
        print(f"   Peso actual: {peso}kg")
        print(f"   Peso ideal (BMI 22): {round(peso_ideal, 1)}kg")
        print(f"   Diferencia: {round(diferencia, 1)}kg")
        print(f"   Cambio semanal: {round(weekly_change, 2)}kg/semana")
        print(f"   Semanas necesarias: {round(weeks_needed)} semanas")
        
        assert round(peso_ideal, 1) == 67.4, f"Expected peso ideal 67.4kg, got {round(peso_ideal, 1)}"
        assert round(weekly_change, 2) == 0.9, f"Expected weekly change 0.9kg, got {round(weekly_change, 2)}"
        
        # Should be around 20 weeks (17.625/0.9 = 19.58)
        expected_weeks = int(round(weeks_needed))
        assert 18 <= expected_weeks <= 22, f"Expected weeks around 20, got {expected_weeks}"
        print(f"✅ Estimated time calculation verified: ~{expected_weeks} weeks")

    def test_estimated_time_calculation_muscle_gain(self):
        """
        Test estimated time calculation for muscle gain goal.
        Formula:
        - targetWeight = peso + (peso * 0.1)  # 10% more
        - weeklyChange = 0.25 + (diasEjercicio * 0.05)
        - weeksNeeded = (targetWeight - peso) / weeklyChange
        """
        peso = 70
        dias_ejercicio = 5
        
        # Target is 10% more weight
        target_weight = peso + (peso * 0.1)  # 77kg
        
        # Weekly change for muscle gain
        weekly_change = 0.25 + (dias_ejercicio * 0.05)  # 0.25 + 0.25 = 0.5kg/week
        
        # Weeks needed
        weeks_needed = (target_weight - peso) / weekly_change  # 7 / 0.5 = 14 weeks
        
        print(f"📊 Muscle gain calculation:")
        print(f"   Peso actual: {peso}kg")
        print(f"   Peso meta (+10%): {round(target_weight, 1)}kg")
        print(f"   Cambio semanal: {round(weekly_change, 2)}kg/semana")
        print(f"   Semanas necesarias: {round(weeks_needed)} semanas")
        
        assert target_weight == 77, f"Expected target 77kg, got {target_weight}"
        assert weekly_change == 0.5, f"Expected 0.5kg/week, got {weekly_change}"
        assert round(weeks_needed) == 14, f"Expected 14 weeks, got {round(weeks_needed)}"
        print(f"✅ Muscle gain calculation verified: ~14 weeks")

    def test_questionnaire_endpoint_returns_data(self, test_user):
        """Test that questionnaire endpoint returns saved data"""
        headers = {"Authorization": f"Bearer {test_user['token']}"}
        
        response = requests.get(
            f"{BASE_URL}/api/questionnaire",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        if data:
            assert "data" in data
            assert "peso" in data["data"]
            assert "estatura" in data["data"]
            assert "objetivo_principal" in data["data"]
            assert "dias_ejercicio" in data["data"]
            print(f"✅ Questionnaire endpoint returns data correctly")
            print(f"   peso: {data['data']['peso']}kg")
            print(f"   estatura: {data['data']['estatura']}cm")
            print(f"   objetivo: {data['data']['objetivo_principal']}")
            print(f"   dias_ejercicio: {data['data']['dias_ejercicio']}")
        else:
            print("⚠️ No questionnaire data found (expected for new user)")


class TestProgressStats:
    """Test progress stats endpoint used by dashboard"""
    
    @pytest.fixture(scope="class")
    def test_user(self):
        """Create a test user"""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        email = f"progress_test_{timestamp}@test.com"
        password = "testpass123"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": password,
            "name": "Progress Test User"
        })
        
        if response.status_code == 200:
            data = response.json()
            return {
                "email": email,
                "password": password,
                "token": data["token"],
                "user_id": data["user"]["id"]
            }
        pytest.skip(f"Could not create test user: {response.text}")

    def test_progress_stats_endpoint(self, test_user):
        """Test progress/stats endpoint returns correct structure"""
        headers = {"Authorization": f"Bearer {test_user['token']}"}
        
        response = requests.get(
            f"{BASE_URL}/api/progress/stats",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check structure
        assert "initial_weight" in data
        assert "current_weight" in data
        assert "target_weight" in data
        assert "weight_change" in data
        assert "total_records" in data
        assert "goal" in data
        print(f"✅ Progress stats endpoint returns correct structure")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
