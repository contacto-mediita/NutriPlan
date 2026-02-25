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
    telefono_whatsapp: Optional[str] = None
    edad: int
    fecha_nacimiento: str
    sexo: str
    estatura: float
    peso: float
    foto_usuario: Optional[str] = None  # Base64 or URL of user photo
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
    lesiones_restricciones: List[str] = []  # Injuries or exercise restrictions
    descripcion_lesion: str = ""  # Description of injury if any
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

class WeightRecord(BaseModel):
    id: str
    user_id: str
    weight: float
    date: str
    notes: Optional[str] = None

class WeightRecordCreate(BaseModel):
    weight: float
    date: Optional[str] = None
    notes: Optional[str] = None

class ProgressStats(BaseModel):
    initial_weight: Optional[float] = None
    current_weight: Optional[float] = None
    target_weight: Optional[float] = None
    weight_change: Optional[float] = None
    total_records: int = 0
    goal: Optional[str] = None

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

# ============== PROGRESS TRACKING ==============

@api_router.post("/progress/weight")
async def add_weight_record(data: WeightRecordCreate, current_user: dict = Depends(get_current_user)):
    """Add a new weight record"""
    record_id = str(uuid.uuid4())
    record_date = data.date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    record_doc = {
        "id": record_id,
        "user_id": current_user["id"],
        "weight": data.weight,
        "date": record_date,
        "notes": data.notes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.weight_records.insert_one(record_doc)
    
    return WeightRecord(**record_doc)

@api_router.get("/progress/weight")
async def get_weight_records(current_user: dict = Depends(get_current_user)):
    """Get all weight records for the user, sorted by date"""
    records = await db.weight_records.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("date", 1).to_list(1000)
    return records

@api_router.delete("/progress/weight/{record_id}")
async def delete_weight_record(record_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a weight record"""
    result = await db.weight_records.delete_one({
        "id": record_id,
        "user_id": current_user["id"]
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return {"message": "Registro eliminado"}

@api_router.get("/progress/stats")
async def get_progress_stats(current_user: dict = Depends(get_current_user)):
    """Get progress statistics"""
    # Get weight records
    records = await db.weight_records.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("date", 1).to_list(1000)
    
    # Get questionnaire for initial weight and goal
    questionnaire = await db.questionnaire_responses.find_one(
        {"user_id": current_user["id"]},
        {"_id": 0},
        sort=[("created_at", -1)]
    )
    
    initial_weight = None
    target_weight = None
    goal = None
    
    if questionnaire:
        q_data = questionnaire.get("data", {})
        initial_weight = q_data.get("peso")
        goal = q_data.get("objetivo_principal")
        
        # Calculate target based on goal
        if initial_weight:
            if goal and "bajar" in goal.lower():
                target_weight = initial_weight * 0.9  # 10% less
            elif goal and ("aumentar" in goal.lower() or "masa" in goal.lower()):
                target_weight = initial_weight * 1.05  # 5% more
            else:
                target_weight = initial_weight  # Maintain
    
    current_weight = None
    weight_change = None
    
    if records:
        current_weight = records[-1]["weight"]
        first_weight = records[0]["weight"] if records else initial_weight
        if first_weight:
            weight_change = round(current_weight - first_weight, 2)
    
    return ProgressStats(
        initial_weight=initial_weight,
        current_weight=current_weight,
        target_weight=round(target_weight, 1) if target_weight else None,
        weight_change=weight_change,
        total_records=len(records),
        goal=goal
    )

# ============== HYDRATION TRACKING ==============

class HydrationRecord(BaseModel):
    glasses: int
    date: str

class HydrationGoal(BaseModel):
    daily_glasses: int
    daily_ml: int
    weight_kg: float
    goal: str

@api_router.get("/hydration/goal")
async def get_hydration_goal(current_user: dict = Depends(get_current_user)):
    """Calculate daily water goal based on weight and nutritional objective"""
    questionnaire = await db.questionnaire_responses.find_one(
        {"user_id": current_user["id"]},
        {"_id": 0},
        sort=[("created_at", -1)]
    )
    
    if not questionnaire:
        # Default goal
        return HydrationGoal(daily_glasses=8, daily_ml=2000, weight_kg=70, goal="general")
    
    q_data = questionnaire.get("data", {})
    peso = q_data.get("peso", 70)
    objetivo = q_data.get("objetivo_principal", "").lower()
    
    # Base: 30-35ml per kg of body weight
    base_ml = peso * 33
    
    # Adjust based on goal
    if "bajar" in objetivo:
        # More water for weight loss (helps metabolism and satiety)
        base_ml = peso * 40
    elif "aumentar" in objetivo or "masa" in objetivo:
        # More water for muscle building (hydration for protein synthesis)
        base_ml = peso * 38
    
    # Convert to glasses (250ml per glass)
    daily_glasses = round(base_ml / 250)
    
    return HydrationGoal(
        daily_glasses=daily_glasses,
        daily_ml=round(base_ml),
        weight_kg=peso,
        goal=objetivo or "general"
    )

@api_router.post("/hydration/log")
async def log_hydration(data: HydrationRecord, current_user: dict = Depends(get_current_user)):
    """Log water intake for a specific date"""
    record_date = data.date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Upsert - update if exists, insert if not
    await db.hydration_records.update_one(
        {"user_id": current_user["id"], "date": record_date},
        {"$set": {
            "user_id": current_user["id"],
            "glasses": data.glasses,
            "date": record_date,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    return {"message": "Hydration logged", "glasses": data.glasses, "date": record_date}

@api_router.get("/hydration/today")
async def get_today_hydration(current_user: dict = Depends(get_current_user)):
    """Get today's hydration record"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    record = await db.hydration_records.find_one(
        {"user_id": current_user["id"], "date": today},
        {"_id": 0}
    )
    
    if not record:
        return {"glasses": 0, "date": today}
    
    return {"glasses": record.get("glasses", 0), "date": today}

@api_router.get("/hydration/history")
async def get_hydration_history(days: int = 7, current_user: dict = Depends(get_current_user)):
    """Get hydration history for the last N days"""
    records = await db.hydration_records.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("date", -1).limit(days).to_list(days)
    
    return records

# ============== MEAL PLAN GENERATION ==============

@api_router.post("/meal-plans/trial")
async def generate_trial_plan(current_user: dict = Depends(get_current_user)):
    """Generate a free 1-day trial plan with 4 meals (desayuno, snack, comida, cena)"""
    
    # Check if user already used trial
    existing_trial = await db.meal_plans.find_one(
        {"user_id": current_user["id"], "plan_type": "trial"},
        {"_id": 0}
    )
    
    if existing_trial:
        raise HTTPException(status_code=400, detail="Ya utilizaste tu plan de prueba gratuito")
    
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
    activity_level = 1.2
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
    
    # Generate trial plan with AI
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    
    prompt = f"""Genera un plan alimenticio de UN SOLO DÍA (prueba gratuita) en español para una persona con:

DATOS:
- Nombre: {q_data['nombre']}
- Objetivo: {objetivo}
- Peso: {peso} kg, Estatura: {estatura} cm
- Vegetariano: {'Sí' if q_data.get('vegetariano') else 'No'}
- Alergias: {', '.join(q_data.get('alergias', [])) or 'Ninguna'}

REQUERIMIENTOS:
- Calorías objetivo: {calories_target} kcal/día
- Proteínas: {macros['proteinas']}g
- Carbohidratos: {macros['carbohidratos']}g
- Grasas: {macros['grasas']}g

Genera EXACTAMENTE 4 comidas: Desayuno, Snack, Comida, Cena.
Para cada comida incluye: nombre del platillo, ingredientes principales, calorías aproximadas.

Responde en JSON:
{{
  "dia": "Plan de Prueba",
  "comidas": [
    {{"tipo": "Desayuno", "nombre": "...", "ingredientes": ["..."], "calorias": 000}},
    {{"tipo": "Snack", "nombre": "...", "ingredientes": ["..."], "calorias": 000}},
    {{"tipo": "Comida", "nombre": "...", "ingredientes": ["..."], "calorias": 000}},
    {{"tipo": "Cena", "nombre": "...", "ingredientes": ["..."], "calorias": 000}}
  ],
  "recomendaciones": ["...", "...", "..."]
}}"""
    
    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=f"trial-{current_user['id']}-{uuid.uuid4()}",
            system_message="Eres un nutriólogo experto. Responde solo en JSON válido."
        ).with_model("openai", "gpt-5.2")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        import json
        clean_response = response.strip()
        if clean_response.startswith("```"):
            clean_response = clean_response.split("```")[1]
            if clean_response.startswith("json"):
                clean_response = clean_response[4:]
        clean_response = clean_response.strip()
        
        day_data = json.loads(clean_response)
        plan_data = {"dias": [day_data]}
        recommendations = day_data.get("recomendaciones", [])
        
    except Exception as e:
        logger.error(f"Error generating trial plan: {e}")
        # Fallback plan
        plan_data = {
            "dias": [{
                "dia": "Plan de Prueba",
                "comidas": [
                    {"tipo": "Desayuno", "nombre": "Avena con frutas y nueces", "ingredientes": ["avena", "plátano", "fresas", "nueces", "miel"], "calorias": int(calories_target * 0.25)},
                    {"tipo": "Snack", "nombre": "Yogur griego con granola", "ingredientes": ["yogur griego", "granola", "arándanos"], "calorias": int(calories_target * 0.15)},
                    {"tipo": "Comida", "nombre": "Pollo a la plancha con verduras", "ingredientes": ["pechuga de pollo", "brócoli", "zanahoria", "arroz integral"], "calorias": int(calories_target * 0.35)},
                    {"tipo": "Cena", "nombre": "Ensalada mediterránea con atún", "ingredientes": ["lechuga", "tomate", "pepino", "atún", "aceite de oliva"], "calorias": int(calories_target * 0.25)}
                ]
            }]
        }
        recommendations = [
            "Bebe al menos 2 litros de agua al día",
            "Come despacio y mastica bien los alimentos",
            "Este es solo un plan de prueba, suscríbete para obtener tu plan completo"
        ]
    
    # Add exercise guide and shopping list for trial
    plan_data["lista_super"] = {
        "proteinas": ["pechuga de pollo 200g", "huevos 4 piezas"],
        "lacteos": ["yogur griego 300g", "leche 500ml"],
        "cereales": ["avena 100g"],
        "verduras": ["brócoli 1 pieza", "lechuga 1 pieza", "tomate 2 piezas"],
        "frutas": ["plátano 2 piezas", "frutos rojos 100g"],
        "grasas_semillas": ["aceite de oliva", "nueces 50g"],
        "basicos": ["sal, pimienta, especias"]
    }
    
    plan_data["guia_ejercicios"] = {
        "descripcion": f"Rutina de prueba para {objetivo.lower()}",
        "dias_recomendados": 3,
        "rutina_casa": [
            {
                "dia": "Día 1 - Cuerpo Completo",
                "ejercicios": [
                    {"nombre": "Sentadillas", "series": 3, "repeticiones": "15", "descanso": "45 seg"},
                    {"nombre": "Lagartijas", "series": 3, "repeticiones": "10-12", "descanso": "45 seg"},
                    {"nombre": "Plancha", "series": 3, "repeticiones": "30 seg", "descanso": "30 seg"},
                    {"nombre": "Zancadas", "series": 3, "repeticiones": "10 c/pierna", "descanso": "45 seg"}
                ],
                "duracion": "20-25 min",
                "tips": "Calienta 5 minutos antes de comenzar"
            }
        ],
        "rutina_gimnasio": [
            {
                "dia": "Día 1 - Full Body",
                "ejercicios": [
                    {"nombre": "Sentadilla con barra", "series": 3, "repeticiones": "12", "descanso": "90 seg"},
                    {"nombre": "Press de banca", "series": 3, "repeticiones": "10-12", "descanso": "90 seg"},
                    {"nombre": "Jalón al pecho", "series": 3, "repeticiones": "12", "descanso": "60 seg"},
                    {"nombre": "Press militar", "series": 3, "repeticiones": "10", "descanso": "60 seg"}
                ],
                "duracion": "35-40 min",
                "tips": "Usa peso moderado para dominar la técnica"
            }
        ],
        "cardio_recomendado": "20 minutos de caminata rápida después del entrenamiento"
    }
    
    # Save trial plan
    plan_id = str(uuid.uuid4())
    plan_doc = {
        "id": plan_id,
        "user_id": current_user["id"],
        "plan_type": "trial",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "plan_data": plan_data,
        "recommendations": recommendations,
        "calories_target": calories_target,
        "macros": macros
    }
    await db.meal_plans.insert_one(plan_doc)
    
    return MealPlanResponse(**plan_doc)

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
    
    # Get injury/restriction info
    lesiones = ', '.join(q_data.get('lesiones_restricciones', [])) or 'Ninguna'
    descripcion_lesion = q_data.get('descripcion_lesion', '')
    
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
- Turnos rotativos: {'Sí' if q_data.get('turnos_rotativos') else 'No'}
- Ejercicio: {q_data.get('ejercicio_adicional', 'No especificado')} - {q_data.get('dias_ejercicio', 0)} días/semana

SALUD:
- Padecimientos: {', '.join(q_data.get('padecimientos', [])) or 'Ninguno'}
- Medicamentos controlados: {'Sí' if q_data.get('medicamentos_controlados') else 'No'}
- Lesiones/Restricciones para ejercicio: {lesiones}
- Detalle de lesión: {descripcion_lesion or 'N/A'}
- Síntomas reportados: {', '.join(q_data.get('sintomas', [])) or 'Ninguno'}

HÁBITOS:
- Fuma: {'Sí' if q_data.get('fuma') else 'No'}
- Alcohol: {'Sí' if q_data.get('consume_alcohol') else 'No'} - {q_data.get('frecuencia_alcohol', '')}

PREFERENCIAS ALIMENTICIAS:
- Alergias: {', '.join(q_data.get('alergias', [])) or 'Ninguna'}
- Vegetariano: {'Sí' if q_data.get('vegetariano') else 'No'}
- Alimentos no deseados: {', '.join(q_data.get('alimentos_no_deseados', [])) or 'Ninguno'}
- Platillo favorito: {q_data.get('platillo_favorito', 'No especificado')}
- Frecuencia restaurantes: {q_data.get('frecuencia_restaurantes', 'No especificado')}
- Presupuesto restaurantes: ${q_data.get('ticket_promedio', 0)} promedio

REQUERIMIENTOS CALCULADOS:
- Calorías objetivo: {calories_target} kcal/día
- Proteínas: {macros['proteinas']}g
- Carbohidratos: {macros['carbohidratos']}g
- Grasas: {macros['grasas']}g

Genera un plan alimenticio estructurado con 3 OPCIONES por cada comida y recetas DETALLADAS:

ESTRUCTURA DEL PLAN:
1. Plan para 7 días (Día 1 a Día 7)
2. Para cada día: 4 tiempos de comida: Desayuno, Comida, Snack, Cena
3. Para CADA comida genera 3 OPCIONES:
   - Opción 1: Recomendado (la más nutritiva y balanceada)
   - Opción 2: Rápido (para días con poco tiempo, max 10 min)
   - Opción 3: Económico (ingredientes accesibles y económicos)

FORMATO DE CADA RECETA (MUY IMPORTANTE):
- Nombre creativo y apetitoso
- Lista de ingredientes con cantidades EXACTAS para 1 porción
- Preparación paso a paso detallada (4-6 pasos claros)
- Tiempo de preparación
- SUSTITUCIONES: 2-3 alternativas para ingredientes principales
- TIP NUTRIPLAN: Consejo práctico relacionado con el objetivo del usuario

RECOMENDACIONES ADICIONALES (personaliza según el perfil):
Incluye 8-10 recomendaciones específicas sobre:
- Sueño y descanso
- Manejo de antojos
- Planeación de comidas
- Opciones para comer fuera
- Guía para restaurantes según el presupuesto
- Consideraciones por padecimientos (si los hay)
- Expectativas de progreso realistas
- Hidratación
- Suplementación básica (si aplica)

GUÍA DE EJERCICIOS (adapta según lesiones: {lesiones}):
- Si hay lesiones, EXCLUYE ejercicios que afecten esa zona
- Incluye alternativas seguras
- Cada ejercicio debe tener descripción de técnica correcta

Responde en formato JSON:
{{
  "dias": [
    {{
      "dia": "Día 1",
      "comidas": [
        {{
          "tipo": "Desayuno",
          "opciones": [
            {{
              "nombre": "Overnight Oats Vainilla + Plátano + Chía",
              "etiqueta": "Recomendado",
              "ingredientes": [
                {{"item": "Avena", "cantidad": "1/2 taza (40g)"}},
                {{"item": "Leche descremada o vegetal sin azúcar", "cantidad": "3/4 taza"}},
                {{"item": "Yogurt griego natural", "cantidad": "1/3 taza"}},
                {{"item": "Plátano", "cantidad": "1/2 pieza (en rodajas)"}},
                {{"item": "Chía", "cantidad": "1 cda"}},
                {{"item": "Canela", "cantidad": "1/2 cdita"}},
                {{"item": "Vainilla", "cantidad": "3-4 gotas"}}
              ],
              "preparacion": [
                "En un frasco, mezcla avena, leche, yogurt, chía, canela y vainilla",
                "Agrega el plátano en rodajas por encima",
                "Tapa y refrigera mínimo 4 horas (ideal: toda la noche)",
                "Antes de comer, mezcla y ajusta la textura con un chorrito extra de leche si lo necesitas"
              ],
              "tiempo_prep": "10 min + 4h refrigeración",
              "sustituciones": [
                "Plátano: papaya (1 taza) o pera (1/2 pieza en cubos)",
                "Yogurt griego: kéfir natural (3/4 taza)",
                "Chía: linaza molida (1 cda)"
              ],
              "tip": "Desayuno perfecto para turnos: prepara 2 frascos en 10 minutos y sales con el plan en la bolsa"
            }}
          ]
        }}
      ]
    }}
  ],
  "recomendaciones_adicionales": {{
    "sueno": "Busca 7-8 horas cuando sea posible. Si duermes poco, prioriza cena ligera con proteína",
    "antojos": "Si aparecen a media tarde, revisa que tu comida tenga proteína + carbo medido",
    "planeacion": "Elige 2 días a la semana para adelantar: arroz/quinoa + pollo + verduras (2 porciones)",
    "desayunos_fuera": "Arma 2 opciones base por semana: (1) overnight oats o pudín de chía; (2) sándwich o wrap de pavo",
    "restaurantes": "Regla simple: 1 proteína a la plancha + 1 verdura + 1 carbo medido. Salsas aparte",
    "padecimientos": "Consideración específica según condiciones del usuario",
    "progreso": "Energía más estable en 10-14 días; cambios visibles en 8-12 semanas con constancia",
    "hidratacion": "Mínimo {int(peso * 35 / 1000)}L de agua al día, más si haces ejercicio",
    "guia_restaurantes": "En taquería: 3 tacos de maíz con carne asada/pollo, sin fritura; agrega nopales/cebolla/cilantro; evita refresco"
  }},
  "lista_super": {{
    "proteinas": ["pechuga de pollo 1 kg", "huevos 18 piezas"],
    "lacteos": ["leche 2 L", "yogur griego 1 kg"],
    "cereales": ["avena 500g", "arroz integral 1 kg"],
    "verduras": ["brócoli 2 piezas", "espinaca 1 bolsa"],
    "frutas": ["plátano 7 piezas", "manzana 7 piezas"],
    "grasas_semillas": ["aceite de oliva 500ml", "almendras 200g"],
    "basicos": ["sal, pimienta, especias"]
  }},
  "guia_ejercicios": {{
    "descripcion": "Guía de ejercicios para {objetivo.lower()}",
    "nota_lesiones": "Ejercicios adaptados considerando: {lesiones}",
    "dias_recomendados": 4,
    "rutina_casa": [
      {{
        "dia": "Día 1 - Tren Superior",
        "objetivo_rutina": "Fortalecer pecho, hombros y brazos para mejorar tu postura y fuerza funcional",
        "beneficios": ["Mejora la postura", "Aumenta fuerza en brazos", "Tonifica pecho y hombros"],
        "ejercicios": [
          {{"nombre": "Lagartijas", "series": 3, "repeticiones": "12-15", "descanso": "60 seg", "musculo": "Pecho", "descripcion": "Fortalece pecho y tríceps", "tecnica": "Manos a la altura de hombros, baja controlado hasta que el pecho casi toque el suelo, sube empujando fuerte"}}
        ],
        "duracion": "30 min",
        "tips": "Mantén el core activado durante todos los ejercicios"
      }}
    ],
    "rutina_gimnasio": [
      {{
        "dia": "Día 1 - Pecho y Tríceps",
        "objetivo_rutina": "Desarrollar masa muscular en pecho y tríceps con ejercicios compuestos",
        "beneficios": ["Aumenta masa muscular", "Mejora fuerza de empuje", "Define el pecho"],
        "ejercicios": [
          {{"nombre": "Press de banca", "series": 4, "repeticiones": "10-12", "descanso": "90 seg", "musculo": "Pecho", "descripcion": "Ejercicio principal para desarrollo de pecho", "tecnica": "Agarra la barra un poco más ancho que los hombros, baja hasta tocar el pecho, empuja de forma explosiva"}}
        ],
        "duracion": "45 min",
        "tips": "Calienta con peso ligero antes de cargar"
      }}
    ],
    "cardio_recomendado": "30 minutos de caminata o trote ligero 3 veces por semana"
  }}
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
        # Fallback plan if AI fails - new format with 4 meals
        plan_data = {
            "dias": [
                {
                    "dia": f"Día {i+1}",
                    "comidas": [
                        {
                            "tipo": "Desayuno",
                            "nombre": "Avena proteica con frutas",
                            "ingredientes": [
                                {"item": "avena", "cantidad": "1/2 taza"},
                                {"item": "plátano", "cantidad": "1 pieza"},
                                {"item": "leche", "cantidad": "1 taza"},
                                {"item": "miel", "cantidad": "1 cdita"}
                            ],
                            "preparacion": ["Calienta la leche", "Agrega la avena y cocina 5 min", "Sirve con plátano y miel"],
                            "tip": "Puedes preparar la noche anterior como overnight oats"
                        },
                        {
                            "tipo": "Comida",
                            "nombre": "Pollo a la plancha con verduras",
                            "ingredientes": [
                                {"item": "pechuga de pollo", "cantidad": "150g"},
                                {"item": "brócoli", "cantidad": "1 taza"},
                                {"item": "arroz integral", "cantidad": "1/2 taza"},
                                {"item": "aceite de oliva", "cantidad": "1 cdita"}
                            ],
                            "preparacion": ["Sazona el pollo y cocina a la plancha", "Cuece el arroz", "Saltea el brócoli con aceite"],
                            "tip": "Puedes sustituir el pollo por pescado o tofu"
                        },
                        {
                            "tipo": "Snack",
                            "nombre": "Yogur griego con nueces",
                            "ingredientes": [
                                {"item": "yogur griego natural", "cantidad": "150g"},
                                {"item": "nueces", "cantidad": "10 piezas"},
                                {"item": "frutos rojos", "cantidad": "1/4 taza"}
                            ],
                            "preparacion": ["Sirve el yogur en un bowl", "Agrega las nueces y frutos rojos"],
                            "tip": "El yogur griego tiene más proteína que el regular"
                        },
                        {
                            "tipo": "Cena",
                            "nombre": "Ensalada mediterránea con atún",
                            "ingredientes": [
                                {"item": "atún en agua", "cantidad": "1 lata"},
                                {"item": "lechuga mixta", "cantidad": "2 tazas"},
                                {"item": "tomate", "cantidad": "1 pieza"},
                                {"item": "aceitunas", "cantidad": "5 piezas"},
                                {"item": "aceite de oliva", "cantidad": "1 cda"}
                            ],
                            "preparacion": ["Lava y corta las verduras", "Escurre el atún", "Mezcla todo y adereza con aceite y limón"],
                            "tip": "Cena ligera ideal para no irte a dormir pesado"
                        }
                    ]
                } for i in range(7)
            ],
            "recomendaciones": [
                "Bebe al menos 2 litros de agua al día",
                "Evita alimentos procesados y ultraprocesados",
                "Come despacio y mastica bien cada bocado",
                "No te saltes comidas, mantén horarios regulares",
                "Descansa al menos 7-8 horas cada noche"
            ],
            "lista_super": {
                "proteinas": ["pechuga de pollo 1 kg", "atún en agua 7 latas", "huevos 12 piezas"],
                "lacteos": ["leche 2 L", "yogur griego 1 kg"],
                "cereales": ["avena 500g", "arroz integral 1 kg"],
                "verduras": ["brócoli 2 piezas", "lechuga 2 piezas", "tomate 7 piezas"],
                "frutas": ["plátano 7 piezas", "frutos rojos 500g"],
                "grasas_semillas": ["aceite de oliva 500ml", "nueces 200g", "aceitunas 1 frasco"],
                "basicos": ["sal, pimienta, especias al gusto", "limones 4 piezas", "miel 1 frasco"]
            },
            "guia_ejercicios": {
                "descripcion": f"Guía de ejercicios para {objetivo.lower()}",
                "dias_recomendados": 4,
                "rutina_casa": [
                    {
                        "dia": "Día 1 - Tren Superior",
                        "ejercicios": [
                            {"nombre": "Lagartijas", "series": 3, "repeticiones": "10-15", "descanso": "60 seg"},
                            {"nombre": "Fondos en silla", "series": 3, "repeticiones": "12-15", "descanso": "60 seg"},
                            {"nombre": "Plancha", "series": 3, "repeticiones": "30 seg", "descanso": "45 seg"},
                            {"nombre": "Superman", "series": 3, "repeticiones": "12", "descanso": "45 seg"}
                        ],
                        "duracion": "25-30 min",
                        "tips": "Mantén el core activado durante todos los ejercicios"
                    },
                    {
                        "dia": "Día 2 - Tren Inferior",
                        "ejercicios": [
                            {"nombre": "Sentadillas", "series": 4, "repeticiones": "15-20", "descanso": "60 seg"},
                            {"nombre": "Zancadas", "series": 3, "repeticiones": "12 c/pierna", "descanso": "60 seg"},
                            {"nombre": "Puente de glúteos", "series": 3, "repeticiones": "15", "descanso": "45 seg"},
                            {"nombre": "Elevación de talones", "series": 3, "repeticiones": "20", "descanso": "30 seg"}
                        ],
                        "duracion": "25-30 min",
                        "tips": "Las rodillas no deben sobrepasar la punta de los pies"
                    },
                    {
                        "dia": "Día 3 - Cardio",
                        "ejercicios": [
                            {"nombre": "Jumping jacks", "series": 3, "repeticiones": "30 seg", "descanso": "30 seg"},
                            {"nombre": "Burpees", "series": 3, "repeticiones": "10", "descanso": "60 seg"},
                            {"nombre": "Mountain climbers", "series": 3, "repeticiones": "30 seg", "descanso": "30 seg"},
                            {"nombre": "Rodillas al pecho", "series": 3, "repeticiones": "30 seg", "descanso": "30 seg"}
                        ],
                        "duracion": "20-25 min",
                        "tips": "Mantén un ritmo constante y respira correctamente"
                    },
                    {
                        "dia": "Día 4 - Full Body",
                        "ejercicios": [
                            {"nombre": "Sentadilla + press", "series": 3, "repeticiones": "12", "descanso": "60 seg"},
                            {"nombre": "Plancha lateral", "series": 3, "repeticiones": "20 seg c/lado", "descanso": "45 seg"},
                            {"nombre": "Burpees suaves", "series": 3, "repeticiones": "8", "descanso": "60 seg"},
                            {"nombre": "Bicicleta abdominal", "series": 3, "repeticiones": "20", "descanso": "45 seg"}
                        ],
                        "duracion": "30 min",
                        "tips": "Este día es de recuperación activa, no te exijas de más"
                    }
                ],
                "rutina_gimnasio": [
                    {
                        "dia": "Día 1 - Pecho y Tríceps",
                        "ejercicios": [
                            {"nombre": "Press de banca", "series": 4, "repeticiones": "10-12", "descanso": "90 seg"},
                            {"nombre": "Aperturas con mancuernas", "series": 3, "repeticiones": "12", "descanso": "60 seg"},
                            {"nombre": "Press inclinado", "series": 3, "repeticiones": "10-12", "descanso": "75 seg"},
                            {"nombre": "Extensiones de tríceps", "series": 3, "repeticiones": "12-15", "descanso": "60 seg"},
                            {"nombre": "Fondos en paralelas", "series": 3, "repeticiones": "al fallo", "descanso": "60 seg"}
                        ],
                        "duracion": "45-50 min",
                        "tips": "Calienta bien antes de cargar peso"
                    },
                    {
                        "dia": "Día 2 - Espalda y Bíceps",
                        "ejercicios": [
                            {"nombre": "Jalón al pecho", "series": 4, "repeticiones": "10-12", "descanso": "90 seg"},
                            {"nombre": "Remo con barra", "series": 4, "repeticiones": "10-12", "descanso": "90 seg"},
                            {"nombre": "Remo con mancuerna", "series": 3, "repeticiones": "12 c/lado", "descanso": "60 seg"},
                            {"nombre": "Curl de bíceps", "series": 3, "repeticiones": "12", "descanso": "60 seg"},
                            {"nombre": "Curl martillo", "series": 3, "repeticiones": "12", "descanso": "60 seg"}
                        ],
                        "duracion": "45-50 min",
                        "tips": "Contrae bien la espalda en cada repetición"
                    },
                    {
                        "dia": "Día 3 - Piernas",
                        "ejercicios": [
                            {"nombre": "Sentadilla con barra", "series": 4, "repeticiones": "10-12", "descanso": "120 seg"},
                            {"nombre": "Prensa de piernas", "series": 4, "repeticiones": "12-15", "descanso": "90 seg"},
                            {"nombre": "Extensiones de cuádriceps", "series": 3, "repeticiones": "15", "descanso": "60 seg"},
                            {"nombre": "Curl femoral", "series": 3, "repeticiones": "12-15", "descanso": "60 seg"},
                            {"nombre": "Elevación de talones", "series": 4, "repeticiones": "15-20", "descanso": "45 seg"}
                        ],
                        "duracion": "50-55 min",
                        "tips": "Las piernas son el grupo más grande, dale intensidad"
                    },
                    {
                        "dia": "Día 4 - Hombros y Abdomen",
                        "ejercicios": [
                            {"nombre": "Press militar", "series": 4, "repeticiones": "10-12", "descanso": "90 seg"},
                            {"nombre": "Elevaciones laterales", "series": 3, "repeticiones": "15", "descanso": "60 seg"},
                            {"nombre": "Elevaciones frontales", "series": 3, "repeticiones": "12", "descanso": "60 seg"},
                            {"nombre": "Crunch en polea", "series": 3, "repeticiones": "15-20", "descanso": "45 seg"},
                            {"nombre": "Plancha", "series": 3, "repeticiones": "45 seg", "descanso": "30 seg"}
                        ],
                        "duracion": "40-45 min",
                        "tips": "Usa peso moderado en hombros para evitar lesiones"
                    }
                ],
                "cardio_recomendado": "30 minutos de caminata rápida, trote o bicicleta 2-3 veces por semana, preferiblemente en días de descanso de pesas"
            }
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

# ============== PDF EXPORT ==============

from fastapi.responses import StreamingResponse
from fpdf import FPDF
import io

@api_router.get("/meal-plans/{plan_id}/pdf")
async def export_meal_plan_pdf(plan_id: str, current_user: dict = Depends(get_current_user)):
    """Export meal plan to PDF"""
    plan = await db.meal_plans.find_one(
        {"id": plan_id, "user_id": current_user["id"]},
        {"_id": 0}
    )
    if not plan:
        raise HTTPException(status_code=404, detail="Plan no encontrado")
    
    # Get user info
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    
    # Create PDF
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    
    # Title Page
    pdf.add_page()
    pdf.set_font('Helvetica', 'B', 24)
    pdf.cell(0, 20, 'Plan Alimenticio Personalizado', ln=True, align='C')
    pdf.set_font('Helvetica', '', 14)
    pdf.cell(0, 10, f'Preparado para: {user.get("name", "Usuario")}', ln=True, align='C')
    pdf.cell(0, 10, f'Fecha: {plan.get("created_at", "")[:10]}', ln=True, align='C')
    pdf.ln(10)
    
    # Macros Summary
    pdf.set_font('Helvetica', 'B', 16)
    pdf.cell(0, 10, 'Resumen Nutricional', ln=True)
    pdf.set_font('Helvetica', '', 12)
    pdf.cell(0, 8, f'Calorias objetivo: {plan.get("calories_target", 0)} kcal/dia', ln=True)
    macros = plan.get("macros", {})
    pdf.cell(0, 8, f'Proteinas: {macros.get("proteinas", 0)}g | Carbohidratos: {macros.get("carbohidratos", 0)}g | Grasas: {macros.get("grasas", 0)}g', ln=True)
    pdf.ln(10)
    
    # Menu Section
    plan_data = plan.get("plan_data", {})
    dias = plan_data.get("dias", [])
    
    for dia in dias:
        pdf.add_page()
        pdf.set_font('Helvetica', 'B', 18)
        pdf.set_fill_color(76, 175, 80)
        pdf.set_text_color(255, 255, 255)
        pdf.cell(0, 12, f'  {dia.get("dia", "")}', ln=True, fill=True)
        pdf.set_text_color(0, 0, 0)
        pdf.ln(5)
        
        for comida in dia.get("comidas", []):
            pdf.set_font('Helvetica', 'B', 14)
            pdf.set_fill_color(240, 240, 240)
            pdf.cell(0, 10, f'{comida.get("tipo", "")}: {comida.get("nombre", "")}', ln=True, fill=True)
            
            # Ingredientes
            pdf.set_font('Helvetica', 'B', 11)
            pdf.cell(0, 7, 'Ingredientes:', ln=True)
            pdf.set_font('Helvetica', '', 10)
            ingredientes = comida.get("ingredientes", [])
            for ing in ingredientes:
                if isinstance(ing, dict):
                    ing_text = f'  - {ing.get("item", "")} ({ing.get("cantidad", "")})'
                else:
                    ing_text = f'  - {ing}'
                pdf.cell(0, 6, ing_text, ln=True)
            
            # Preparacion
            preparacion = comida.get("preparacion", [])
            if preparacion:
                pdf.set_font('Helvetica', 'B', 11)
                pdf.cell(0, 7, 'Preparacion:', ln=True)
                pdf.set_font('Helvetica', '', 10)
                for i, paso in enumerate(preparacion, 1):
                    pdf.multi_cell(0, 6, f'  {i}. {paso}')
            
            # Tip
            tip = comida.get("tip", "")
            if tip:
                pdf.set_font('Helvetica', 'I', 10)
                pdf.set_text_color(76, 175, 80)
                pdf.multi_cell(0, 6, f'  Tip: {tip}')
                pdf.set_text_color(0, 0, 0)
            
            pdf.ln(5)
    
    # Shopping List
    lista_super = plan_data.get("lista_super", {})
    if lista_super:
        pdf.add_page()
        pdf.set_font('Helvetica', 'B', 18)
        pdf.set_fill_color(255, 152, 0)
        pdf.set_text_color(255, 255, 255)
        pdf.cell(0, 12, '  Lista del Supermercado', ln=True, fill=True)
        pdf.set_text_color(0, 0, 0)
        pdf.ln(5)
        
        category_labels = {
            "proteinas": "Proteinas",
            "lacteos": "Lacteos",
            "cereales": "Cereales y Granos",
            "verduras": "Verduras",
            "frutas": "Frutas",
            "grasas_semillas": "Grasas y Semillas",
            "basicos": "Basicos"
        }
        
        for category, items in lista_super.items():
            pdf.set_font('Helvetica', 'B', 12)
            pdf.cell(0, 8, category_labels.get(category, category), ln=True)
            pdf.set_font('Helvetica', '', 10)
            for item in (items or []):
                pdf.cell(0, 6, f'  [ ] {item}', ln=True)
            pdf.ln(3)
    
    # Exercise Guide
    guia = plan_data.get("guia_ejercicios", {})
    if guia:
        pdf.add_page()
        pdf.set_font('Helvetica', 'B', 18)
        pdf.set_fill_color(156, 39, 176)
        pdf.set_text_color(255, 255, 255)
        pdf.cell(0, 12, '  Guia de Ejercicios', ln=True, fill=True)
        pdf.set_text_color(0, 0, 0)
        pdf.ln(5)
        
        if guia.get("descripcion"):
            pdf.set_font('Helvetica', '', 12)
            pdf.cell(0, 8, guia["descripcion"], ln=True)
            pdf.cell(0, 8, f'Dias recomendados: {guia.get("dias_recomendados", 4)} por semana', ln=True)
            pdf.ln(5)
        
        # Casa
        pdf.set_font('Helvetica', 'B', 14)
        pdf.cell(0, 10, 'Rutina en Casa', ln=True)
        for rutina in guia.get("rutina_casa", []):
            pdf.set_font('Helvetica', 'B', 12)
            pdf.cell(0, 8, f'{rutina.get("dia", "")} - {rutina.get("duracion", "")}', ln=True)
            pdf.set_font('Helvetica', '', 10)
            for ej in rutina.get("ejercicios", []):
                pdf.cell(0, 6, f'  - {ej["nombre"]}: {ej["series"]}x{ej["repeticiones"]} (descanso: {ej["descanso"]})', ln=True)
            pdf.ln(3)
        
        # Gimnasio
        pdf.set_font('Helvetica', 'B', 14)
        pdf.cell(0, 10, 'Rutina en Gimnasio', ln=True)
        for rutina in guia.get("rutina_gimnasio", []):
            pdf.set_font('Helvetica', 'B', 12)
            pdf.cell(0, 8, f'{rutina.get("dia", "")} - {rutina.get("duracion", "")}', ln=True)
            pdf.set_font('Helvetica', '', 10)
            for ej in rutina.get("ejercicios", []):
                pdf.cell(0, 6, f'  - {ej["nombre"]}: {ej["series"]}x{ej["repeticiones"]} (descanso: {ej["descanso"]})', ln=True)
            pdf.ln(3)
        
        if guia.get("cardio_recomendado"):
            pdf.ln(5)
            pdf.set_font('Helvetica', 'I', 11)
            pdf.multi_cell(0, 7, f'Cardio recomendado: {guia["cardio_recomendado"]}')
    
    # Output PDF
    pdf_buffer = io.BytesIO()
    pdf.output(pdf_buffer)
    pdf_buffer.seek(0)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=plan-alimenticio-{plan_id[:8]}.pdf"}
    )

# ============== STRIPE PAYMENTS ==============

PLAN_PRICES = {
    "3days": 49.00,
    "weekly": 119.00,
    "biweekly": 199.00,
    "monthly": 349.00
}

PLAN_DURATIONS = {
    "3days": 3,
    "weekly": 7,
    "biweekly": 15,
    "monthly": 30
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
        duration_days = PLAN_DURATIONS.get(plan_type, 7)
        expires = datetime.now(timezone.utc) + timedelta(days=duration_days)
        
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
                duration_days = PLAN_DURATIONS.get(plan_type, 7)
                expires = datetime.now(timezone.utc) + timedelta(days=duration_days)
                
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

# ============== ADMIN PANEL ==============

# Admin credentials (in production, these should be in environment variables)
ADMIN_EMAILS = os.environ.get('ADMIN_EMAILS', 'admin@nutriplan.com').split(',')

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    """Verify user is an admin"""
    if current_user["email"] not in ADMIN_EMAILS:
        raise HTTPException(status_code=403, detail="No tienes permisos de administrador")
    return current_user

class AdminStats(BaseModel):
    total_users: int
    active_subscriptions: int
    total_plans_generated: int
    total_revenue: float
    users_by_subscription: Dict[str, int]
    plans_by_type: Dict[str, int]
    recent_signups: int
    questionnaire_completion_rate: float

@api_router.get("/admin/stats")
async def get_admin_stats(admin: dict = Depends(get_admin_user)):
    """Get dashboard statistics for admin"""
    
    # Total users
    total_users = await db.users.count_documents({})
    
    # Active subscriptions
    now = datetime.now(timezone.utc).isoformat()
    active_subs = await db.users.count_documents({
        "subscription_expires": {"$gt": now}
    })
    
    # Total plans generated
    total_plans = await db.meal_plans.count_documents({})
    
    # Calculate revenue from completed payments
    pipeline = [
        {"$match": {"payment_status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    revenue_result = await db.payment_transactions.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # Users by subscription type
    users_by_sub = {}
    for sub_type in ["trial", "3days", "weekly", "biweekly", "monthly"]:
        count = await db.users.count_documents({"subscription_type": sub_type})
        if count > 0:
            users_by_sub[sub_type] = count
    
    # Plans by type
    plans_by_type = {}
    for plan_type in ["trial", "3days", "weekly", "biweekly", "monthly"]:
        count = await db.meal_plans.count_documents({"plan_type": plan_type})
        if count > 0:
            plans_by_type[plan_type] = count
    
    # Recent signups (last 7 days)
    seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    recent_signups = await db.users.count_documents({
        "created_at": {"$gt": seven_days_ago}
    })
    
    # Questionnaire completion rate
    users_with_questionnaire = await db.questionnaire_responses.distinct("user_id")
    completion_rate = (len(users_with_questionnaire) / total_users * 100) if total_users > 0 else 0
    
    return AdminStats(
        total_users=total_users,
        active_subscriptions=active_subs,
        total_plans_generated=total_plans,
        total_revenue=total_revenue,
        users_by_subscription=users_by_sub,
        plans_by_type=plans_by_type,
        recent_signups=recent_signups,
        questionnaire_completion_rate=round(completion_rate, 1)
    )

@api_router.get("/admin/users")
async def get_admin_users(
    skip: int = 0,
    limit: int = 20,
    search: str = "",
    admin: dict = Depends(get_admin_user)
):
    """Get list of users for admin"""
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    
    users = await db.users.find(
        query,
        {"_id": 0, "password_hash": 0, "password": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    total = await db.users.count_documents(query)
    
    # Add questionnaire and plan info
    for user in users:
        user["has_questionnaire"] = await db.questionnaire_responses.count_documents(
            {"user_id": user["id"]}
        ) > 0
        user["plans_count"] = await db.meal_plans.count_documents(
            {"user_id": user["id"]}
        )
    
    return {"users": users, "total": total, "skip": skip, "limit": limit}

@api_router.get("/admin/users/{user_id}")
async def get_admin_user_detail(user_id: str, admin: dict = Depends(get_admin_user)):
    """Get detailed user info for admin"""
    user = await db.users.find_one(
        {"id": user_id},
        {"_id": 0, "password_hash": 0}
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Get questionnaire
    questionnaire = await db.questionnaire_responses.find_one(
        {"user_id": user_id},
        {"_id": 0}
    )
    
    # Get plans
    plans = await db.meal_plans.find(
        {"user_id": user_id},
        {"_id": 0, "plan_data": 0}
    ).sort("created_at", -1).to_list(10)
    
    # Get payments
    payments = await db.payment_transactions.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(10)
    
    # Get progress records
    progress = await db.weight_records.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("date", -1).to_list(30)
    
    return {
        "user": user,
        "questionnaire": questionnaire,
        "plans": plans,
        "payments": payments,
        "progress": progress
    }

@api_router.put("/admin/users/{user_id}/subscription")
async def update_user_subscription(
    user_id: str,
    subscription_type: str,
    days: int,
    admin: dict = Depends(get_admin_user)
):
    """Manually update user subscription (admin)"""
    expires = datetime.now(timezone.utc) + timedelta(days=days)
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "subscription_type": subscription_type,
            "subscription_expires": expires.isoformat(),
            "updated_by_admin": admin["email"],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return {"message": "Suscripción actualizada", "expires": expires.isoformat()}

@api_router.get("/admin/payments")
async def get_admin_payments(
    skip: int = 0,
    limit: int = 20,
    status: str = "",
    admin: dict = Depends(get_admin_user)
):
    """Get list of payments for admin"""
    query = {}
    if status:
        query["payment_status"] = status
    
    payments = await db.payment_transactions.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Add user info
    for payment in payments:
        user = await db.users.find_one(
            {"id": payment.get("user_id")},
            {"_id": 0, "name": 1, "email": 1}
        )
        payment["user"] = user
    
    total = await db.payment_transactions.count_documents(query)
    
    return {"payments": payments, "total": total}

@api_router.get("/admin/check")
async def check_admin_status(current_user: dict = Depends(get_current_user)):
    """Check if current user is admin"""
    is_admin = current_user["email"] in ADMIN_EMAILS
    return {"is_admin": is_admin, "email": current_user["email"]}

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
