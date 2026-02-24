import requests
import sys
import json
from datetime import datetime

class MealPlanAPITester:
    def __init__(self, base_url="https://meal-quest-app.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.session_id = None
        self.questionnaire_id = None
        self.plan_id = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    return success, response_data
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "/", 200)

    def test_register_user(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {
            "name": f"Test User {timestamp}",
            "email": f"test{timestamp}@example.com",
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
            print(f"   ✓ Token obtained: {self.token[:20]}...")
            return True, response
        return False, response

    def test_login_user(self, email, password):
        """Test user login"""
        login_data = {
            "email": email,
            "password": password
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
            print(f"   ✓ Login successful")
            return True, response
        return False, response

    def test_get_current_user(self):
        """Test get current user info"""
        return self.run_test(
            "Get Current User",
            "GET", 
            "/auth/me", 
            200
        )

    def test_submit_questionnaire(self):
        """Test questionnaire submission"""
        questionnaire_data = {
            "nombre": "Usuario Prueba",
            "edad": 30,
            "fecha_nacimiento": "1994-01-01",
            "sexo": "Masculino",
            "estatura": 175.0,
            "peso": 75.0,
            "objetivo_principal": "Control de peso",
            "objetivos_secundarios": ["Mejorar digestión", "Más energía"],
            "trabajo_oficina": True,
            "trabajo_fisico": False,
            "labores_hogar": False,
            "turnos_rotativos": False,
            "ejercicio_adicional": "Gimnasio",
            "dias_ejercicio": 3,
            "padecimientos": ["Ninguno"],
            "medicamentos_controlados": False,
            "sintomas": ["Ninguno"],
            "fuma": False,
            "consume_alcohol": False,
            "frecuencia_alcohol": "",
            "alergias": ["Ninguna"],
            "vegetariano": False,
            "alimentos_no_deseados": ["hígado", "brócoli"],
            "desayuno_tipico": "Avena con frutas",
            "comida_tipica": "Pollo con verduras",
            "cena_tipica": "Ensalada",
            "platillo_favorito": "Tacos",
            "frecuencia_restaurantes": "1-2 veces por semana",
            "ticket_promedio": 200.0
        }
        
        success, response = self.run_test(
            "Submit Questionnaire",
            "POST", 
            "/questionnaire", 
            200, 
            data=questionnaire_data
        )
        
        if success and 'id' in response:
            self.questionnaire_id = response['id']
            print(f"   ✓ Questionnaire saved with ID: {self.questionnaire_id}")
        
        return success, response

    def test_get_questionnaire(self):
        """Test get questionnaire"""
        return self.run_test(
            "Get Questionnaire",
            "GET", 
            "/questionnaire", 
            200
        )

    def test_stripe_checkout(self):
        """Test Stripe checkout session creation"""
        checkout_data = {
            "plan_type": "weekly",
            "origin_url": "https://meal-quest-app.preview.emergentagent.com"
        }
        
        success, response = self.run_test(
            "Create Stripe Checkout",
            "POST", 
            "/payments/checkout", 
            200, 
            data=checkout_data
        )
        
        if success and 'session_id' in response:
            self.session_id = response['session_id']
            print(f"   ✓ Checkout session created: {self.session_id}")
            print(f"   ✓ Checkout URL: {response.get('url', 'N/A')}")
        
        return success, response

    def test_payment_status(self):
        """Test payment status check"""
        if not self.session_id:
            print("⚠️ Skipping payment status test - no session ID")
            return False, {}
            
        return self.run_test(
            "Get Payment Status",
            "GET", 
            f"/payments/status/{self.session_id}", 
            200
        )

    def test_generate_meal_plan_without_subscription(self):
        """Test meal plan generation without subscription (should fail)"""
        return self.run_test(
            "Generate Meal Plan (No Subscription)",
            "POST", 
            "/meal-plans/generate", 
            403  # Should fail without subscription
        )

    def test_get_meal_plans(self):
        """Test get meal plans"""
        return self.run_test(
            "Get Meal Plans",
            "GET", 
            "/meal-plans", 
            200
        )

    def simulate_successful_payment_and_generate_plan(self):
        """Simulate successful payment by updating user subscription directly"""
        print("\n🔧 Simulating successful payment for testing meal plan generation...")
        
        # Try to generate plan which should fail first
        success, response = self.test_generate_meal_plan_without_subscription()
        
        # Note: In a real test environment, we would need to either:
        # 1. Mock the payment webhook
        # 2. Have a test endpoint to simulate successful payment
        # 3. Or manually update the database
        
        print("   ℹ️ Cannot test meal plan generation without actual payment completion")
        print("   ℹ️ This would require Stripe webhook simulation or direct DB update")
        
        return False, {}

def main():
    print("🧪 Starting Meal Plan API Tests...")
    print("=" * 50)
    
    # Initialize tester
    tester = MealPlanAPITester()
    
    # Test API root
    tester.test_root_endpoint()
    
    # Test user registration
    success, user_data = tester.test_register_user()
    if not success:
        print("❌ Registration failed, stopping tests")
        return 1
    
    # Extract email and password for login test
    email = user_data.get('user', {}).get('email')
    
    # Test getting current user info
    tester.test_get_current_user()
    
    # Test questionnaire submission
    success, _ = tester.test_submit_questionnaire()
    if not success:
        print("❌ Questionnaire submission failed")
    
    # Test getting questionnaire
    tester.test_get_questionnaire()
    
    # Test Stripe checkout creation
    success, _ = tester.test_stripe_checkout()
    if success:
        # Test payment status
        tester.test_payment_status()
    
    # Test meal plans endpoint (should be empty initially)
    tester.test_get_meal_plans()
    
    # Test meal plan generation without subscription
    tester.test_generate_meal_plan_without_subscription()
    
    # Try to simulate payment and generate plan
    tester.simulate_successful_payment_and_generate_plan()
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Tests completed: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️ Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())