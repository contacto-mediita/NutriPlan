from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'default-secret-key')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="Plan Alimenticio Personalizado API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    subscription_type: Optional[str] = None
    subscription_expires: Optional[str] = None

class QuestionnaireData(BaseModel):
    # Etapa 1 - Datos Generales
    nombre: str
    edad: int
    fecha_nacimiento: str
    sexo: str
    estatura: float
    peso: float
    # Etapa 2 - Objetivos
    objetivo_principal: str
    objetivos_secundarios: List[str] = []
    # Etapa 3 - Actividad
    trabajo_oficina: bool = False
    trabajo_fisico: bool = False
    labores_hogar: bool = False
    turnos_rotativos: bool = False
    ejercicio_adicional: str = ""
    dias_ejercicio: int = 0
    # Etapa 4 - Salud
    padecimientos: List[str] = []
    medicamentos_controlados: bool = False
    # Etapa 5 - Síntomas
    sintomas: List[str] = []
    # Etapa 6 - Hábitos
    fuma: bool = False
    consume_alcohol: bool = False
    frecuencia_alcohol: str = ""
    # Etapa 7 - Alimentación
    alergias: List[str] = []
    vegetariano: bool = False
    alimentos_no_deseados: List[str] = []
    desayuno_tipico: str = ""
    comida_tipica: str = ""
    cena_tipica: str = ""
    platillo_favorito: str = ""
    # Etapa 8 - Consumo fuera
    frecuencia_restaurantes: str = ""
    ticket_promedio: float = 0

class MealPlanResponse(BaseModel):
    id: str
    user_id: str
    plan_type: str
    created_at: str
    plan_data: Dict[str, Any]
    recommendations: List[str]
    calories_target: int
    macros: Dict[str, float]

class CheckoutRequest(BaseModel):
    plan_type: str  # 'weekly' or 'monthly'
    origin_url: str

class CheckoutStatusRequest(BaseModel):
    session_id: str

# ============== AUTH HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

# ============== AUTH ENDPOINTS ==============

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password": hash_password(user_data.password),
        "subscription_type": None,
        "subscription_expires": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user_data.email)
    return {"token": token, "user": {"id": user_id, "email": user_data.email, "name": user_data.name}}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    token = create_token(user["id"], user["email"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "subscription_type": user.get("subscription_type"),
            "subscription_expires": user.get("subscription_expires")
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "name": current_user["name"],
        "subscription_type": current_user.get("subscription_type"),
        "subscription_expires": current_user.get("subscription_expires")
    }

# ============== QUESTIONNAIRE ENDPOINTS ==============

@api_router.post("/questionnaire")
async def save_questionnaire(data: QuestionnaireData, current_user: dict = Depends(get_current_user)):
    questionnaire_id = str(uuid.uuid4())
    doc = {
        "id": questionnaire_id,
        "user_id": current_user["id"],
        "data": data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.questionnaire_responses.insert_one(doc)
    return {"id": questionnaire_id, "message": "Cuestionario guardado correctamente"}

@api_router.get("/questionnaire")
async def get_questionnaire(current_user: dict = Depends(get_current_user)):
    doc = await db.questionnaire_responses.find_one(
        {"user_id": current_user["id"]},
        {"_id": 0},
        sort=[("created_at", -1)]
    )
    if not doc:
        return None
    return doc

# ============== MEAL PLAN GENERATION ==============

@api_router.post("/meal-plans/generate")
async def generate_meal_plan(current_user: dict = Depends(get_current_user)):
    # Check subscription
    subscription_type = current_user.get("subscription_type")
    subscription_expires = current_user.get("subscription_expires")
    
    if not subscription_type:
        raise HTTPException(status_code=403, detail="Necesitas una suscripción activa para generar planes")
    
    if subscription_expires:
        expires_date = datetime.fromisoformat(subscription_expires)
        if expires_date < datetime.now(timezone.utc):
            raise HTTPException(status_code=403, detail="Tu suscripción ha expirado")
    
    # Get questionnaire data
    questionnaire = await db.questionnaire_responses.find_one(
        {"user_id": current_user["id"]},
        {"_id": 0},
        sort=[("created_at", -1)]
    )
    
    if not questionnaire:
        raise HTTPException(status_code=400, detail="Primero debes completar el cuestionario")
    
    q_data = questionnaire["data"]
    
    # Calculate BMR using Mifflin-St Jeor
    peso = q_data["peso"]
    estatura = q_data["estatura"]
    edad = q_data["edad"]
    sexo = q_data["sexo"]
    
    if sexo.lower() == "masculino":
        bmr = 10 * peso + 6.25 * estatura - 5 * edad + 5
    else:
        bmr = 10 * peso + 6.25 * estatura - 5 * edad - 161
    
    # Activity multiplier
    activity_level = 1.2  # Sedentary default
    if q_data.get("trabajo_fisico"):
        activity_level = 1.55
    if q_data.get("dias_ejercicio", 0) >= 3:
        activity_level = max(activity_level, 1.55)
    if q_data.get("dias_ejercicio", 0) >= 5:
        activity_level = 1.725
    
    tdee = bmr * activity_level
    
    # Adjust for goal
    objetivo = q_data["objetivo_principal"]
    if "bajar" in objetivo.lower():
        calories_target = int(tdee * 0.8)
    elif "aumentar" in objetivo.lower() or "masa" in objetivo.lower():
        calories_target = int(tdee * 1.15)
    else:
        calories_target = int(tdee)
    
    # Calculate macros
    protein_ratio = 0.30 if "masa" in objetivo.lower() else 0.25
    fat_ratio = 0.25
    carb_ratio = 1 - protein_ratio - fat_ratio
    
    macros = {
        "proteinas": round((calories_target * protein_ratio) / 4, 1),
        "carbohidratos": round((calories_target * carb_ratio) / 4, 1),
        "grasas": round((calories_target * fat_ratio) / 9, 1)
    }
    
    # Generate plan with AI
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    
    prompt = f"""Genera un plan alimenticio semanal personalizado en español para una persona con las siguientes características:

DATOS PERSONALES:
- Nombre: {q_data['nombre']}
- Edad: {edad} años
- Sexo: {sexo}
- Peso: {peso} kg
- Estatura: {estatura} cm

OBJETIVO: {objetivo}
Objetivos secundarios: {', '.join(q_data.get('objetivos_secundarios', [])) or 'Ninguno'}

ACTIVIDAD:
- Trabajo oficina: {'Sí' if q_data.get('trabajo_oficina') else 'No'}
- Trabajo físico: {'Sí' if q_data.get('trabajo_fisico') else 'No'}
- Ejercicio: {q_data.get('ejercicio_adicional', 'No especificado')} - {q_data.get('dias_ejercicio', 0)} días/semana

SALUD:
- Padecimientos: {', '.join(q_data.get('padecimientos', [])) or 'Ninguno'}
- Medicamentos controlados: {'Sí' if q_data.get('medicamentos_controlados') else 'No'}
- Síntomas reportados: {', '.join(q_data.get('sintomas', [])) or 'Ninguno'}

HÁBITOS:
- Fuma: {'Sí' if q_data.get('fuma') else 'No'}
- Alcohol: {'Sí' if q_data.get('consume_alcohol') else 'No'} - {q_data.get('frecuencia_alcohol', '')}

PREFERENCIAS ALIMENTICIAS:
- Alergias: {', '.join(q_data.get('alergias', [])) or 'Ninguna'}
- Vegetariano: {'Sí' if q_data.get('vegetariano') else 'No'}
- Alimentos no deseados: {', '.join(q_data.get('alimentos_no_deseados', [])) or 'Ninguno'}
- Platillo favorito: {q_data.get('platillo_favorito', 'No especificado')}
- Presupuesto restaurantes: ${q_data.get('ticket_promedio', 0)} promedio

REQUERIMIENTOS CALCULADOS:
- Calorías objetivo: {calories_target} kcal/día
- Proteínas: {macros['proteinas']}g
- Carbohidratos: {macros['carbohidratos']}g
- Grasas: {macros['grasas']}g

Genera un plan alimenticio estructurado con:
1. Plan para 7 días (lunes a domingo)
2. Para cada día incluye: desayuno, snack mañana, comida, snack tarde, cena
3. Para cada comida incluye: nombre del platillo, ingredientes principales, calorías aproximadas
4. Incluye 5 recomendaciones personalizadas basadas en sus objetivos y condiciones

Responde en formato JSON con esta estructura:
{{
  "dias": [
    {{
      "dia": "Lunes",
      "comidas": [
        {{"tipo": "Desayuno", "nombre": "...", "ingredientes": ["..."], "calorias": 000}},
        {{"tipo": "Snack AM", "nombre": "...", "ingredientes": ["..."], "calorias": 000}},
        {{"tipo": "Comida", "nombre": "...", "ingredientes": ["..."], "calorias": 000}},
        {{"tipo": "Snack PM", "nombre": "...", "ingredientes": ["..."], "calorias": 000}},
        {{"tipo": "Cena", "nombre": "...", "ingredientes": ["..."], "calorias": 000}}
      ]
    }}
  ],
  "recomendaciones": ["...", "...", "...", "...", "..."]
}}"""
    
    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=f"meal-plan-{current_user['id']}-{uuid.uuid4()}",
            system_message="Eres un nutriólogo experto que crea planes alimenticios personalizados. Siempre respondes en JSON válido."
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse JSON from response
        import json
        # Clean response if it has markdown code blocks
        clean_response = response.strip()
        if clean_response.startswith("```"):
            clean_response = clean_response.split("```")[1]
            if clean_response.startswith("json"):
                clean_response = clean_response[4:]
        clean_response = clean_response.strip()
        
        plan_data = json.loads(clean_response)
        recommendations = plan_data.get("recomendaciones", [])
        
    except Exception as e:
        logger.error(f"Error generating meal plan: {e}")
        # Fallback plan if AI fails
        plan_data = {
            "dias": [
                {
                    "dia": day,
                    "comidas": [
                        {"tipo": "Desayuno", "nombre": "Avena con frutas", "ingredientes": ["avena", "plátano", "fresas"], "calorias": int(calories_target * 0.25)},
                        {"tipo": "Snack AM", "nombre": "Yogur natural", "ingredientes": ["yogur griego", "miel"], "calorias": int(calories_target * 0.10)},
                        {"tipo": "Comida", "nombre": "Pollo con verduras", "ingredientes": ["pechuga de pollo", "brócoli", "arroz integral"], "calorias": int(calories_target * 0.35)},
                        {"tipo": "Snack PM", "nombre": "Frutos secos", "ingredientes": ["almendras", "nueces"], "calorias": int(calories_target * 0.10)},
                        {"tipo": "Cena", "nombre": "Ensalada con proteína", "ingredientes": ["lechuga", "tomate", "atún"], "calorias": int(calories_target * 0.20)}
                    ]
                } for day in ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
            ],
            "recomendaciones": [
                "Bebe al menos 2 litros de agua al día",
                "Evita alimentos procesados",
                "Come despacio y mastica bien",
                "No te saltes comidas",
                "Descansa al menos 7 horas"
            ]
        }
        recommendations = plan_data["recomendaciones"]
    
    # Save plan to database
    plan_id = str(uuid.uuid4())
    plan_doc = {
        "id": plan_id,
        "user_id": current_user["id"],
        "plan_type": subscription_type,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "plan_data": plan_data,
        "recommendations": recommendations,
        "calories_target": calories_target,
        "macros": macros
    }
    await db.meal_plans.insert_one(plan_doc)
    
    return MealPlanResponse(**plan_doc)

@api_router.get("/meal-plans")
async def get_meal_plans(current_user: dict = Depends(get_current_user)):
    plans = await db.meal_plans.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return plans

@api_router.get("/meal-plans/{plan_id}")
async def get_meal_plan(plan_id: str, current_user: dict = Depends(get_current_user)):
    plan = await db.meal_plans.find_one(
        {"id": plan_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    return plan

# ============== STRIPE PAYMENTS ==============

PLAN_PRICES = {
    "weekly": 199.00,
    "monthly": 499.00
}

@api_router.post("/payments/checkout")
async def create_checkout(request: CheckoutRequest, http_request: Request, current_user: dict = Depends(get_current_user)):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
    
    if request.plan_type not in PLAN_PRICES:
        raise HTTPException(status_code=400, detail="Tipo de plan inválido")
    
    amount = PLAN_PRICES[request.plan_type]
    api_key = os.environ.get('STRIPE_API_KEY')
    
    host_url = str(http_request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    success_url = f"{request.origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{request.origin_url}/precios"
    
    checkout_request = CheckoutSessionRequest(
        amount=amount,
        currency="mxn",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": current_user["id"],
            "plan_type": request.plan_type,
            "user_email": current_user["email"]
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    transaction_id = str(uuid.uuid4())
    transaction_doc = {
        "id": transaction_id,
        "session_id": session.session_id,
        "user_id": current_user["id"],
        "amount": amount,
        "currency": "mxn",
        "plan_type": request.plan_type,
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(transaction_doc)
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, current_user: dict = Depends(get_current_user)):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    api_key = os.environ.get('STRIPE_API_KEY')
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url="")
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction in database
    transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    
    if transaction and status.payment_status == "paid" and transaction["payment_status"] != "paid":
        # Update transaction status
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Update user subscription
        plan_type = transaction["plan_type"]
        if plan_type == "weekly":
            expires = datetime.now(timezone.utc) + timedelta(days=7)
        else:
            expires = datetime.now(timezone.utc) + timedelta(days=30)
        
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": {
                "subscription_type": plan_type,
                "subscription_expires": expires.isoformat()
            }}
        )
    
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    api_key = os.environ.get('STRIPE_API_KEY')
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url="")
    
    body = await request.body()
    signature = request.headers.get("Stripe-Signature", "")
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            session_id = webhook_response.session_id
            metadata = webhook_response.metadata
            
            # Update transaction
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
            
            # Update user subscription
            user_id = metadata.get("user_id")
            plan_type = metadata.get("plan_type")
            
            if user_id and plan_type:
                if plan_type == "weekly":
                    expires = datetime.now(timezone.utc) + timedelta(days=7)
                else:
                    expires = datetime.now(timezone.utc) + timedelta(days=30)
                
                await db.users.update_one(
                    {"id": user_id},
                    {"$set": {
                        "subscription_type": plan_type,
                        "subscription_expires": expires.isoformat()
                    }}
                )
        
        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"received": True}

# ============== ROOT ==============

@api_router.get("/")
async def root():
    return {"message": "Plan Alimenticio Personalizado API", "version": "1.0.0"}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
