import requests
import sys
import json
from datetime import datetime

class MealPlanAPITester:
    def __init__(self, base_url="https://meal-quest-app.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.weight_record_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name}")
            if details:
                print(f"   Details: {details}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return success, response.json()
                except:
                    return success, response.text
            else:
                details = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_data = response.json()
                    details += f" - {error_data}"
                except:
                    details += f" - {response.text[:200]}"
                
                self.log_test(name, False, details)
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Request error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "/", 200)

    def test_register_user(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {
            "name": f"Test User {timestamp}",
            "email": f"test_{timestamp}@example.com",
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "/auth/register",
            200,
            data=user_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_login_user(self):
        """Test user login with existing user"""
        # Try to login with the registered user
        if not self.user_id:
            print("   Skipping login test - no user registered")
            return False
            
        # Get user email from previous registration
        timestamp = datetime.now().strftime('%H%M%S')
        login_data = {
            "email": f"test_{timestamp}@example.com",
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST", 
            "/auth/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            return True
        return False

    def test_get_user_profile(self):
        """Test getting user profile"""
        if not self.token:
            print("   Skipping profile test - no token")
            return False
            
        return self.run_test("Get User Profile", "GET", "/auth/me", 200)

    def test_questionnaire_save(self):
        """Test saving questionnaire"""
        if not self.token:
            print("   Skipping questionnaire test - no token")
            return False

        questionnaire_data = {
            "nombre": "Test User",
            "edad": 30,
            "fecha_nacimiento": "1993-01-01",
            "sexo": "masculino",
            "estatura": 175.0,
            "peso": 75.0,
            "objetivo_principal": "mantener peso",
            "objetivos_secundarios": ["mejorar energia"],
            "trabajo_oficina": True,
            "trabajo_fisico": False,
            "labores_hogar": False,
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
            "desayuno_tipico": "Avena con frutas",
            "comida_tipica": "Pollo con arroz",
            "cena_tipica": "Ensalada",
            "platillo_favorito": "Tacos",
            "frecuencia_restaurantes": "1-2 veces por semana",
            "ticket_promedio": 200.0
        }
        
        return self.run_test(
            "Save Questionnaire",
            "POST",
            "/questionnaire",
            200,
            data=questionnaire_data
        )

    def test_questionnaire_get(self):
        """Test getting questionnaire"""
        if not self.token:
            print("   Skipping get questionnaire test - no token")
            return False
            
        return self.run_test("Get Questionnaire", "GET", "/questionnaire", 200)

    def test_trial_meal_plan(self):
        """Test generating trial meal plan"""
        if not self.token:
            print("   Skipping trial test - no token")
            return False

        print("   Generating trial meal plan (may take 10-15 seconds)...")
        success, response = self.run_test(
            "Generate Trial Meal Plan",
            "POST",
            "/meal-plans/trial",
            200
        )
        
        if success:
            # Validate response structure
            required_fields = ['id', 'user_id', 'plan_type', 'plan_data', 'calories_target']
            missing_fields = [field for field in required_fields if field not in response]
            
            if missing_fields:
                self.log_test("Trial Plan Structure", False, f"Missing fields: {missing_fields}")
                return False
            
            # Check if plan has 4 meals
            if 'plan_data' in response and 'dias' in response['plan_data']:
                dias = response['plan_data']['dias']
                if len(dias) > 0 and 'comidas' in dias[0]:
                    meals = dias[0]['comidas']
                    expected_meals = ['Desayuno', 'Snack', 'Comida', 'Cena']
                    meal_types = [meal.get('tipo', '') for meal in meals]
                    
                    if len(meals) == 4:
                        self.log_test("Trial Plan - 4 Meals", True)
                    else:
                        self.log_test("Trial Plan - 4 Meals", False, f"Found {len(meals)} meals instead of 4")
                        
                    # Check meal types
                    has_required_meals = all(meal_type in str(meal_types) for meal_type in expected_meals)
                    if has_required_meals:
                        self.log_test("Trial Plan - Meal Types", True)
                    else:
                        self.log_test("Trial Plan - Meal Types", False, f"Expected: {expected_meals}, Found: {meal_types}")
        
        return success

    def test_trial_duplicate_prevention(self):
        """Test that trial can only be used once"""
        if not self.token:
            print("   Skipping duplicate trial test - no token")
            return False

        success, response = self.run_test(
            "Prevent Duplicate Trial",
            "POST",
            "/meal-plans/trial",
            400  # Should fail with 400 since trial was already used
        )
        return success

    def test_get_meal_plans(self):
        """Test getting all meal plans"""
        if not self.token:
            print("   Skipping meal plans test - no token")
            return False
            
        return self.run_test("Get All Meal Plans", "GET", "/meal-plans", 200)

    def test_payment_checkout_creation(self):
        """Test creating checkout session"""
        if not self.token:
            print("   Skipping checkout test - no token")
            return False

        checkout_data = {
            "plan_type": "weekly",
            "origin_url": "https://meal-quest-app.preview.emergentagent.com"
        }
        
        success, response = self.run_test(
            "Create Checkout Session",
            "POST",
            "/payments/checkout",
            200,
            data=checkout_data
        )
        
        if success:
            # Validate response structure
            if 'url' in response and 'session_id' in response:
                self.log_test("Checkout Response Structure", True)
                return True
            else:
                self.log_test("Checkout Response Structure", False, "Missing url or session_id")
        return False

    def test_add_weight_record(self):
        """Test adding weight record"""
        if not self.token:
            print("   Skipping weight record test - no token")
            return False

        weight_data = {
            "weight": 75.5,
            "date": "2024-01-15",
            "notes": "Test weight entry"
        }
        
        success, response = self.run_test(
            "Add Weight Record",
            "POST",
            "/progress/weight",
            200,
            data=weight_data
        )
        
        if success:
            # Store the record ID for later deletion
            self.weight_record_id = response.get('id')
            # Validate response structure
            required_fields = ['id', 'user_id', 'weight', 'date']
            missing_fields = [field for field in required_fields if field not in response]
            
            if missing_fields:
                self.log_test("Weight Record Structure", False, f"Missing fields: {missing_fields}")
                return False
            else:
                self.log_test("Weight Record Structure", True)
                return True
        return False

    def test_get_weight_records(self):
        """Test getting all weight records"""
        if not self.token:
            print("   Skipping get weight records test - no token")
            return False
            
        success, response = self.run_test(
            "Get Weight Records",
            "GET",
            "/progress/weight",
            200
        )
        
        if success:
            # Should be a list
            if isinstance(response, list):
                self.log_test("Weight Records List Format", True)
                return True
            else:
                self.log_test("Weight Records List Format", False, f"Expected list, got {type(response)}")
        return False

    def test_get_progress_stats(self):
        """Test getting progress statistics"""
        if not self.token:
            print("   Skipping progress stats test - no token")
            return False
            
        success, response = self.run_test(
            "Get Progress Stats",
            "GET",
            "/progress/stats",
            200
        )
        
        if success:
            # Validate response structure
            expected_fields = ['initial_weight', 'current_weight', 'target_weight', 'weight_change', 'total_records', 'goal']
            missing_fields = [field for field in expected_fields if field not in response]
            
            if missing_fields:
                self.log_test("Progress Stats Structure", False, f"Missing fields: {missing_fields}")
                return False
            else:
                self.log_test("Progress Stats Structure", True)
                return True
        return False

    def test_delete_weight_record(self):
        """Test deleting weight record"""
        if not self.token:
            print("   Skipping delete weight record test - no token")
            return False
            
        if not hasattr(self, 'weight_record_id') or not self.weight_record_id:
            print("   Skipping delete test - no weight record ID")
            return False

        success, response = self.run_test(
            "Delete Weight Record",
            "DELETE",
            f"/progress/weight/{self.weight_record_id}",
            200
        )
        return success

def main():
    print("🧪 Starting Meal Plan API Tests")
    print("=" * 50)
    
    tester = MealPlanAPITester()
    
    # Test sequence
    tests = [
        tester.test_root_endpoint,
        tester.test_register_user,
        tester.test_get_user_profile,
        tester.test_questionnaire_save,
        tester.test_questionnaire_get,
        tester.test_trial_meal_plan,
        tester.test_trial_duplicate_prevention,
        tester.test_get_meal_plans,
        tester.test_payment_checkout_creation,
        tester.test_add_weight_record,
        tester.test_get_weight_records,
        tester.test_get_progress_stats,
        tester.test_delete_weight_record
    ]
    
    for test in tests:
        test()
    
    # Summary
    print("\n" + "=" * 50)
    print(f"📊 RESULTS: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    # Failed tests summary
    failed_tests = [result for result in tester.test_results if not result['success']]
    if failed_tests:
        print("\n❌ FAILED TESTS:")
        for test in failed_tests:
            print(f"  - {test['name']}: {test['details']}")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"\n📈 Success Rate: {success_rate:.1f}%")
    
    return 0 if success_rate >= 80 else 1

if __name__ == "__main__":
    sys.exit(main())