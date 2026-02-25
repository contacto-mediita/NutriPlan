"""
Test suite for WhatsApp field and PDF export features
Tests new functionality: telefono_whatsapp in questionnaire and PDF export endpoint
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestWhatsAppAndPDFFeatures:
    """Tests for WhatsApp field in questionnaire and PDF export functionality"""
    
    @pytest.fixture(scope="class")
    def test_user(self):
        """Create a test user and return auth credentials"""
        email = f"test_whatsapp_pdf_{int(time.time())}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "testpass123",
            "name": "Test WhatsApp PDF User"
        })
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        return {
            "token": data["token"],
            "user_id": data["user"]["id"],
            "email": email
        }
    
    @pytest.fixture
    def auth_headers(self, test_user):
        """Return authorization headers"""
        return {"Authorization": f"Bearer {test_user['token']}"}
    
    def test_questionnaire_with_whatsapp_field(self, auth_headers):
        """Test that questionnaire accepts and stores telefono_whatsapp field"""
        # Submit questionnaire with WhatsApp field
        questionnaire_data = {
            "nombre": "Usuario WhatsApp Test",
            "telefono_whatsapp": "55 9876 5432",
            "edad": 28,
            "fecha_nacimiento": "1996-05-20",
            "sexo": "Femenino",
            "estatura": 165,
            "peso": 60,
            "objetivo_principal": "Control de peso",
            "objetivos_secundarios": ["Más energía"],
            "trabajo_oficina": True,
            "trabajo_fisico": False,
            "labores_hogar": True,
            "turnos_rotativos": False,
            "ejercicio_adicional": "Yoga",
            "dias_ejercicio": 2,
            "padecimientos": ["Ninguno"],
            "medicamentos_controlados": False,
            "sintomas": ["Ninguno"],
            "fuma": False,
            "consume_alcohol": False,
            "frecuencia_alcohol": "",
            "alergias": ["Ninguna"],
            "vegetariano": False,
            "alimentos_no_deseados": [],
            "desayuno_tipico": "Fruta con yogur",
            "comida_tipica": "Ensalada con pollo",
            "cena_tipica": "Sopa",
            "platillo_favorito": "Pasta",
            "frecuencia_restaurantes": "Casi nunca",
            "ticket_promedio": 100
        }
        
        response = requests.post(
            f"{BASE_URL}/api/questionnaire",
            json=questionnaire_data,
            headers=auth_headers
        )
        assert response.status_code == 200, f"Questionnaire save failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["message"] == "Cuestionario guardado correctamente"
        print(f"✅ Questionnaire saved with id: {data['id']}")
    
    def test_questionnaire_persists_whatsapp(self, auth_headers):
        """Verify WhatsApp field is persisted and retrievable"""
        response = requests.get(
            f"{BASE_URL}/api/questionnaire",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get questionnaire failed: {response.text}"
        data = response.json()
        assert data is not None, "No questionnaire found"
        assert "data" in data, "Questionnaire data field missing"
        assert "telefono_whatsapp" in data["data"], "telefono_whatsapp field missing"
        assert data["data"]["telefono_whatsapp"] == "55 9876 5432", f"WhatsApp value mismatch: {data['data']['telefono_whatsapp']}"
        print(f"✅ WhatsApp field persisted correctly: {data['data']['telefono_whatsapp']}")
    
    def test_trial_plan_generation(self, auth_headers):
        """Generate trial plan (required for PDF test)"""
        response = requests.post(
            f"{BASE_URL}/api/meal-plans/trial",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Trial plan generation failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert data["plan_type"] == "trial"
        print(f"✅ Trial plan generated: {data['id']}")
        return data["id"]
    
    def test_pdf_export_endpoint(self, auth_headers):
        """Test PDF export endpoint returns valid PDF"""
        # First get the plan
        plans_response = requests.get(
            f"{BASE_URL}/api/meal-plans",
            headers=auth_headers
        )
        assert plans_response.status_code == 200, f"Get plans failed: {plans_response.text}"
        plans = plans_response.json()
        assert len(plans) > 0, "No plans found for user"
        
        plan_id = plans[0]["id"]
        
        # Request PDF
        response = requests.get(
            f"{BASE_URL}/api/meal-plans/{plan_id}/pdf",
            headers=auth_headers
        )
        assert response.status_code == 200, f"PDF export failed: {response.text}"
        
        # Verify PDF content
        content = response.content
        assert len(content) > 0, "PDF content is empty"
        assert content[:5] == b"%PDF-", "Response is not a valid PDF file"
        
        # Check content-type header
        assert "application/pdf" in response.headers.get("content-type", ""), "Wrong content type"
        
        # Check content-disposition header
        content_disposition = response.headers.get("content-disposition", "")
        assert "attachment" in content_disposition, "Missing attachment disposition"
        assert f"plan-alimenticio-{plan_id[:8]}.pdf" in content_disposition, "Wrong filename in disposition"
        
        print(f"✅ PDF exported successfully, size: {len(content)} bytes")
    
    def test_pdf_endpoint_unauthorized(self):
        """Test PDF endpoint requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/meal-plans/fake-plan-id/pdf"
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✅ PDF endpoint correctly requires authentication")
    
    def test_pdf_endpoint_not_found(self, auth_headers):
        """Test PDF endpoint returns 404 for non-existent plan"""
        response = requests.get(
            f"{BASE_URL}/api/meal-plans/00000000-0000-0000-0000-000000000000/pdf",
            headers=auth_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✅ PDF endpoint correctly returns 404 for non-existent plan")


class TestQuestionnaireDataModel:
    """Tests to verify QuestionnaireData model includes telefono_whatsapp"""
    
    @pytest.fixture(scope="class")
    def test_user(self):
        """Create a test user"""
        email = f"test_model_{int(time.time())}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "testpass123",
            "name": "Test Model User"
        })
        assert response.status_code == 200
        return {"token": response.json()["token"]}
    
    @pytest.fixture
    def auth_headers(self, test_user):
        return {"Authorization": f"Bearer {test_user['token']}"}
    
    def test_questionnaire_whatsapp_optional(self, auth_headers):
        """Test that telefono_whatsapp is optional"""
        questionnaire_data = {
            "nombre": "Usuario Sin WhatsApp",
            "edad": 25,
            "fecha_nacimiento": "1999-01-01",
            "sexo": "Masculino",
            "estatura": 170,
            "peso": 70,
            "objetivo_principal": "Bajar de peso",
            "objetivos_secundarios": [],
            "padecimientos": ["Ninguno"],
            "sintomas": ["Ninguno"],
            "alergias": ["Ninguna"],
            "frecuencia_restaurantes": "Casi nunca",
            "ticket_promedio": 100
            # Note: telefono_whatsapp is intentionally omitted
        }
        
        response = requests.post(
            f"{BASE_URL}/api/questionnaire",
            json=questionnaire_data,
            headers=auth_headers
        )
        assert response.status_code == 200, f"Questionnaire without WhatsApp failed: {response.text}"
        print("✅ Questionnaire saves without telefono_whatsapp (optional field)")
    
    def test_questionnaire_whatsapp_empty_string(self, auth_headers):
        """Test that empty WhatsApp string is accepted"""
        email = f"test_empty_wa_{int(time.time())}@test.com"
        reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "testpass123",
            "name": "Empty WA User"
        })
        new_headers = {"Authorization": f"Bearer {reg_resp.json()['token']}"}
        
        questionnaire_data = {
            "nombre": "Usuario WhatsApp Vacío",
            "telefono_whatsapp": "",  # Empty string
            "edad": 30,
            "fecha_nacimiento": "1994-01-01",
            "sexo": "Femenino",
            "estatura": 160,
            "peso": 55,
            "objetivo_principal": "Control de peso",
            "frecuencia_restaurantes": "Casi nunca",
            "ticket_promedio": 50
        }
        
        response = requests.post(
            f"{BASE_URL}/api/questionnaire",
            json=questionnaire_data,
            headers=new_headers
        )
        assert response.status_code == 200, f"Questionnaire with empty WhatsApp failed: {response.text}"
        print("✅ Questionnaire saves with empty telefono_whatsapp string")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
