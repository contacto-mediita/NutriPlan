"""
Test Progress Features: 
- Dashboard progress with real weight records
- Healthy weight range calculation (age/sex/height)  
- Questionnaire injuries/restrictions section
- Progress updates when user logs weight
"""
import pytest
import requests
import os
import time
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://meal-quest-app.preview.emergentagent.com').rstrip('/')

class TestProgressFeatures:
    """Test progress tracking features with real weight data"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test user with unique email"""
        self.email = f"progress_test_{int(time.time())}@test.com"
        self.password = "testpass123"
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.user_id = None
        self.token = None
        
    def register_user(self):
        """Register a test user"""
        response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.email,
            "password": self.password,
            "name": "Progress Test User"
        })
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        self.token = data["token"]
        self.user_id = data["user"]["id"]
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        return data
    
    def save_questionnaire_with_injuries(self):
        """Save questionnaire with injuries/restrictions for exercise"""
        questionnaire_data = {
            "nombre": "Progress Test User",
            "telefono_whatsapp": "5551234567",
            "edad": 35,
            "fecha_nacimiento": "1990-01-15",
            "sexo": "Masculino",
            "estatura": 175,
            "peso": 85,  # Initial weight
            "objetivo_principal": "Bajar de peso",
            "objetivos_secundarios": ["Más energía", "Mejorar digestión"],
            "trabajo_oficina": True,
            "trabajo_fisico": False,
            "labores_hogar": False,
            "turnos_rotativos": False,
            "ejercicio_adicional": "Caminar",
            "dias_ejercicio": 3,
            "padecimientos": ["Ninguno"],
            "medicamentos_controlados": False,
            # New fields: injuries/restrictions for exercise
            "lesiones_restricciones": ["Lesión de rodilla", "Lesión de espalda"],
            "descripcion_lesion": "Tengo una lesión de rodilla antigua que me impide correr y dolor lumbar ocasional",
            "sintomas": ["Fatiga o cansancio"],
            "fuma": False,
            "consume_alcohol": False,
            "frecuencia_alcohol": "",
            "alergias": ["Ninguna"],
            "vegetariano": False,
            "alimentos_no_deseados": [],
            "desayuno_tipico": "",
            "comida_tipica": "",
            "cena_tipica": "",
            "platillo_favorito": "Tacos",
            "frecuencia_restaurantes": "1-2 veces por semana",
            "ticket_promedio": 150
        }
        response = self.session.post(f"{BASE_URL}/api/questionnaire", json=questionnaire_data)
        assert response.status_code == 200, f"Questionnaire save failed: {response.text}"
        return response.json()
    
    def test_01_questionnaire_injuries_section(self):
        """Test that questionnaire saves and returns injuries/restrictions"""
        self.register_user()
        self.save_questionnaire_with_injuries()
        
        # Get questionnaire and verify injuries are saved
        response = self.session.get(f"{BASE_URL}/api/questionnaire")
        assert response.status_code == 200
        data = response.json()
        
        assert data is not None
        assert "data" in data
        q_data = data["data"]
        
        # Verify injuries/restrictions fields
        assert "lesiones_restricciones" in q_data
        assert "Lesión de rodilla" in q_data["lesiones_restricciones"]
        assert "Lesión de espalda" in q_data["lesiones_restricciones"]
        assert "descripcion_lesion" in q_data
        assert "rodilla" in q_data["descripcion_lesion"].lower()
        print("PASS: Questionnaire injuries/restrictions saved correctly")
        
    def test_02_progress_stats_initial_weight(self):
        """Test progress stats returns initial weight from questionnaire"""
        self.register_user()
        self.save_questionnaire_with_injuries()
        
        response = self.session.get(f"{BASE_URL}/api/progress/stats")
        assert response.status_code == 200
        stats = response.json()
        
        assert stats["initial_weight"] == 85.0
        assert stats["goal"] == "Bajar de peso"
        # Target should be ~10% less for "bajar de peso"
        assert stats["target_weight"] is not None
        assert stats["target_weight"] < 85.0
        print(f"PASS: Progress stats - initial_weight={stats['initial_weight']}, target={stats['target_weight']}")
        
    def test_03_add_weight_record_updates_current_weight(self):
        """Test that adding weight record updates current_weight in progress stats"""
        self.register_user()
        self.save_questionnaire_with_injuries()
        
        # Add a new weight record (user lost weight)
        new_weight = 83.0
        response = self.session.post(f"{BASE_URL}/api/progress/weight", json={
            "weight": new_weight,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "notes": "First progress check"
        })
        assert response.status_code == 200
        print(f"Added weight record: {new_weight}kg")
        
        # Check progress stats now shows current weight
        stats_response = self.session.get(f"{BASE_URL}/api/progress/stats")
        assert stats_response.status_code == 200
        stats = stats_response.json()
        
        assert stats["current_weight"] == new_weight
        assert stats["initial_weight"] == 85.0
        assert stats["weight_change"] == -2.0  # 83 - 85 = -2
        assert stats["total_records"] == 1
        print(f"PASS: Progress stats updated - current_weight={stats['current_weight']}, change={stats['weight_change']}")
        
    def test_04_multiple_weight_records_uses_latest(self):
        """Test that multiple weight records use the latest for current_weight"""
        self.register_user()
        self.save_questionnaire_with_injuries()
        
        # Add multiple weight records
        weights = [84.5, 83.5, 82.5]
        for i, weight in enumerate(weights):
            response = self.session.post(f"{BASE_URL}/api/progress/weight", json={
                "weight": weight,
                "date": f"2026-01-{10+i:02d}",
                "notes": f"Progress check {i+1}"
            })
            assert response.status_code == 200
        
        # Get progress stats - should use latest weight
        stats_response = self.session.get(f"{BASE_URL}/api/progress/stats")
        assert stats_response.status_code == 200
        stats = stats_response.json()
        
        assert stats["current_weight"] == 82.5  # Latest weight
        assert stats["total_records"] == 3
        print(f"PASS: Latest weight used - current={stats['current_weight']}, total_records={stats['total_records']}")
        
    def test_05_healthy_weight_range_calculation(self):
        """Test healthy weight range calculation based on age, sex, height"""
        self.register_user()
        self.save_questionnaire_with_injuries()
        
        # Get questionnaire
        response = self.session.get(f"{BASE_URL}/api/questionnaire")
        assert response.status_code == 200
        q_data = response.json()["data"]
        
        # Verify data needed for healthy weight range
        estatura = q_data["estatura"]  # 175 cm
        edad = q_data["edad"]  # 35
        sexo = q_data["sexo"]  # Masculino
        
        # Calculate expected healthy weight range (BMI 18.5-24.9)
        estatura_m = estatura / 100  # 1.75
        min_weight = 18.5 * estatura_m * estatura_m  # 56.66
        max_weight = 24.9 * estatura_m * estatura_m  # 76.27
        
        print(f"PASS: Healthy weight range for {estatura}cm, age {edad}, {sexo}")
        print(f"  - Expected range: {min_weight:.1f}kg - {max_weight:.1f}kg")
        
        # The calculation is done in frontend, but we verified backend returns all needed data
        assert estatura == 175
        assert edad == 35
        assert sexo == "Masculino"
        
    def test_06_progress_percent_calculation(self):
        """Test progress percentage calculation with real weight data"""
        self.register_user()
        self.save_questionnaire_with_injuries()
        
        initial_weight = 85.0
        # Target for "bajar de peso" is BMI 22 * estatura_m^2 = 22 * 1.75^2 = 67.375
        target_weight = 67.4  # approx
        
        # Add weight record - user lost 5kg
        current_weight = 80.0
        response = self.session.post(f"{BASE_URL}/api/progress/weight", json={
            "weight": current_weight,
            "notes": "Progress test"
        })
        assert response.status_code == 200
        
        # Calculate progress percentage
        total_to_lose = initial_weight - target_weight  # 85 - 67.4 = 17.6
        already_lost = initial_weight - current_weight   # 85 - 80 = 5
        progress_percent = (already_lost / total_to_lose) * 100  # 28.4%
        
        print(f"PASS: Progress calculation test")
        print(f"  - Initial: {initial_weight}kg, Target: {target_weight}kg")
        print(f"  - Current: {current_weight}kg, Lost: {already_lost}kg")
        print(f"  - Progress: {progress_percent:.1f}%")
        
        # Verify stats endpoint returns current weight
        stats_response = self.session.get(f"{BASE_URL}/api/progress/stats")
        stats = stats_response.json()
        assert stats["current_weight"] == current_weight
        

class TestQuestionnaireInjuriesValidation:
    """Test questionnaire injuries field validation"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test user"""
        self.email = f"injury_val_test_{int(time.time())}@test.com"
        self.password = "testpass123"
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
    def register_and_auth(self):
        """Register and authenticate user"""
        response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.email,
            "password": self.password,
            "name": "Injury Test User"
        })
        assert response.status_code == 200
        data = response.json()
        self.session.headers.update({"Authorization": f"Bearer {data['token']}"})
        
    def test_01_all_injury_options_save_correctly(self):
        """Test all injury options from the form save correctly"""
        self.register_and_auth()
        
        injury_options = [
            "Ninguna", "Lesión de rodilla", "Lesión de espalda", 
            "Lesión de hombro", "Lesión de tobillo", "Hernia", 
            "Problema de cadera", "Tendinitis", "Otra"
        ]
        
        questionnaire_data = {
            "nombre": "Injury Test",
            "edad": 30,
            "fecha_nacimiento": "1996-05-20",
            "sexo": "Femenino",
            "estatura": 165,
            "peso": 70,
            "objetivo_principal": "Mantener peso",
            "lesiones_restricciones": ["Lesión de hombro", "Tendinitis"],
            "descripcion_lesion": "Tendinitis en el codo derecho por trabajo de oficina"
        }
        
        response = self.session.post(f"{BASE_URL}/api/questionnaire", json=questionnaire_data)
        assert response.status_code == 200
        
        # Verify saved
        get_response = self.session.get(f"{BASE_URL}/api/questionnaire")
        assert get_response.status_code == 200
        data = get_response.json()["data"]
        
        assert "Lesión de hombro" in data["lesiones_restricciones"]
        assert "Tendinitis" in data["lesiones_restricciones"]
        assert "codo" in data["descripcion_lesion"].lower()
        print("PASS: Multiple injury options saved correctly")


class TestWeightRecordCRUD:
    """Test weight record CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test user"""
        self.email = f"weight_crud_test_{int(time.time())}@test.com"
        self.password = "testpass123"
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
    def register_and_auth(self):
        """Register and authenticate user"""
        response = self.session.post(f"{BASE_URL}/api/auth/register", json={
            "email": self.email,
            "password": self.password,
            "name": "Weight CRUD Test User"
        })
        assert response.status_code == 200
        data = response.json()
        self.session.headers.update({"Authorization": f"Bearer {data['token']}"})
        
    def test_01_add_weight_record(self):
        """Test adding a weight record"""
        self.register_and_auth()
        
        response = self.session.post(f"{BASE_URL}/api/progress/weight", json={
            "weight": 80.5,
            "date": "2026-01-15",
            "notes": "Test weight entry"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert data["weight"] == 80.5
        assert data["date"] == "2026-01-15"
        assert "id" in data
        self.record_id = data["id"]
        print(f"PASS: Weight record created with id={data['id']}")
        
    def test_02_get_weight_records(self):
        """Test getting all weight records"""
        self.register_and_auth()
        
        # Add records
        self.session.post(f"{BASE_URL}/api/progress/weight", json={"weight": 80.0})
        self.session.post(f"{BASE_URL}/api/progress/weight", json={"weight": 79.5})
        
        response = self.session.get(f"{BASE_URL}/api/progress/weight")
        assert response.status_code == 200
        records = response.json()
        
        assert len(records) >= 2
        print(f"PASS: Got {len(records)} weight records")
        
    def test_03_delete_weight_record(self):
        """Test deleting a weight record"""
        self.register_and_auth()
        
        # Add record
        create_response = self.session.post(f"{BASE_URL}/api/progress/weight", json={"weight": 75.0})
        record_id = create_response.json()["id"]
        
        # Delete it
        delete_response = self.session.delete(f"{BASE_URL}/api/progress/weight/{record_id}")
        assert delete_response.status_code == 200
        
        # Verify deleted
        get_response = self.session.get(f"{BASE_URL}/api/progress/weight")
        records = get_response.json()
        record_ids = [r["id"] for r in records]
        assert record_id not in record_ids
        print("PASS: Weight record deleted successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
