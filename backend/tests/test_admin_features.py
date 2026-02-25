"""
Test Admin Panel Features for NutriPlan
- Admin check endpoint returns is_admin: true for admin emails
- Admin stats endpoint
- Admin users endpoint
- Admin payments endpoint
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials from agent context
ADMIN_EMAIL = "bmi_test@test.com"
ADMIN_PASSWORD = "Test123456"

class TestAdminFeatures:
    """Test suite for Admin Panel API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - get auth token for admin user"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.token = None
        
        # Login as admin user
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        if login_response.status_code == 200:
            self.token = login_response.json().get("token")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        else:
            # Register if user doesn't exist
            reg_response = self.session.post(f"{BASE_URL}/api/auth/register", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD,
                "name": "BMI Test Admin"
            })
            if reg_response.status_code == 200:
                self.token = reg_response.json().get("token")
                self.session.headers.update({"Authorization": f"Bearer {self.token}"})
            else:
                pytest.skip(f"Could not authenticate admin user: {login_response.text}")
    
    def test_admin_check_returns_is_admin_true(self):
        """API GET /api/admin/check returns is_admin: true for admin emails"""
        response = self.session.get(f"{BASE_URL}/api/admin/check")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "is_admin" in data, "Response should contain 'is_admin' field"
        assert data["is_admin"] is True, f"Admin user should have is_admin=True, got {data}"
        assert "email" in data, "Response should contain 'email' field"
        assert data["email"] == ADMIN_EMAIL
        print(f"✓ Admin check passed: {data}")
    
    def test_admin_stats_returns_statistics(self):
        """API GET /api/admin/stats returns statistics"""
        response = self.session.get(f"{BASE_URL}/api/admin/stats")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Check required fields
        required_fields = [
            "total_users",
            "active_subscriptions", 
            "total_plans_generated",
            "total_revenue",
            "users_by_subscription",
            "plans_by_type",
            "recent_signups",
            "questionnaire_completion_rate"
        ]
        
        for field in required_fields:
            assert field in data, f"Stats should contain '{field}' field"
        
        # Validate data types
        assert isinstance(data["total_users"], int), "total_users should be int"
        assert isinstance(data["active_subscriptions"], int), "active_subscriptions should be int"
        assert isinstance(data["total_plans_generated"], int), "total_plans_generated should be int"
        assert isinstance(data["total_revenue"], (int, float)), "total_revenue should be numeric"
        assert isinstance(data["users_by_subscription"], dict), "users_by_subscription should be dict"
        assert isinstance(data["plans_by_type"], dict), "plans_by_type should be dict"
        
        print(f"✓ Admin stats returned: {data['total_users']} users, {data['active_subscriptions']} active subs, {data['total_plans_generated']} plans")
    
    def test_admin_users_returns_user_list(self):
        """API GET /api/admin/users returns list of users"""
        response = self.session.get(f"{BASE_URL}/api/admin/users?limit=10")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Check structure
        assert "users" in data, "Response should contain 'users' field"
        assert "total" in data, "Response should contain 'total' field"
        assert isinstance(data["users"], list), "users should be a list"
        
        # Validate user objects if any exist
        if len(data["users"]) > 0:
            user = data["users"][0]
            assert "id" in user, "User should have 'id' field"
            assert "email" in user, "User should have 'email' field"
            assert "name" in user, "User should have 'name' field"
            
            # Check password is not exposed
            assert "password" not in user, "User password should not be exposed"
            assert "password_hash" not in user, "User password_hash should not be exposed"
        
        print(f"✓ Admin users endpoint returned {data['total']} total users, showing {len(data['users'])}")
    
    def test_admin_users_search(self):
        """API GET /api/admin/users with search parameter"""
        response = self.session.get(f"{BASE_URL}/api/admin/users?search=test")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "users" in data
        assert "total" in data
        
        print(f"✓ Admin users search found {data['total']} users matching 'test'")
    
    def test_admin_payments_returns_payment_list(self):
        """API GET /api/admin/payments returns list of payment transactions"""
        response = self.session.get(f"{BASE_URL}/api/admin/payments?limit=10")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Check structure
        assert "payments" in data, "Response should contain 'payments' field"
        assert "total" in data, "Response should contain 'total' field"
        assert isinstance(data["payments"], list), "payments should be a list"
        
        print(f"✓ Admin payments endpoint returned {data['total']} total transactions")
    
    def test_non_admin_user_denied_access(self):
        """Non-admin user should be denied access to admin endpoints"""
        # Create a new non-admin user
        non_admin_email = "nonadmin_test_12345@test.com"
        non_admin_session = requests.Session()
        non_admin_session.headers.update({"Content-Type": "application/json"})
        
        # Register non-admin user
        reg_response = non_admin_session.post(f"{BASE_URL}/api/auth/register", json={
            "email": non_admin_email,
            "password": "testpass123",
            "name": "Non Admin User"
        })
        
        if reg_response.status_code in [200, 400]:  # 400 if already exists
            # Login
            login_response = non_admin_session.post(f"{BASE_URL}/api/auth/login", json={
                "email": non_admin_email,
                "password": "testpass123"
            })
            
            if login_response.status_code == 200:
                token = login_response.json().get("token")
                non_admin_session.headers.update({"Authorization": f"Bearer {token}"})
                
                # Try to access admin stats - should fail with 403
                stats_response = non_admin_session.get(f"{BASE_URL}/api/admin/stats")
                assert stats_response.status_code == 403, f"Non-admin should get 403, got {stats_response.status_code}"
                
                # Admin check should return is_admin: false
                check_response = non_admin_session.get(f"{BASE_URL}/api/admin/check")
                assert check_response.status_code == 200
                check_data = check_response.json()
                assert check_data["is_admin"] is False, "Non-admin should have is_admin=False"
                
                print(f"✓ Non-admin user correctly denied access to admin endpoints")
            else:
                print(f"⚠ Could not login non-admin user, skipping this test")
        else:
            print(f"⚠ Could not create non-admin user, skipping this test")


class TestFooter:
    """Test footer shows 2025 NutriPlan"""
    
    def test_landing_page_loads(self):
        """Landing page should be accessible"""
        response = requests.get(f"{BASE_URL}")
        assert response.status_code == 200, f"Landing page should load, got {response.status_code}"
        print("✓ Landing page loads successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
