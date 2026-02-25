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

Genera un plan alimenticio estructurado siguiendo el formato INSTAHEALTHY:

ESTRUCTURA:
1. Plan para 7 días (Día 1 a Día 7)
2. Para cada día incluye exactamente 4 comidas: Desayuno, Comida, Snack, Cena
3. Para cada comida incluye:
   - Nombre del platillo creativo y apetitoso
   - Lista de ingredientes con cantidades específicas (para 1 porción)
   - Preparación paso a paso (3-5 pasos claros)
   - Tip o sustitución útil
4. NO incluir Snack AM ni Snack PM, solo un Snack entre comida y cena
5. Incluye 5 recomendaciones personalizadas
6. Genera una lista del super organizada por categorías

Responde en formato JSON:
{{
  "dias": [
    {{
      "dia": "Día 1",
      "comidas": [
        {{
          "tipo": "Desayuno",
          "nombre": "Nombre apetitoso del platillo",
          "ingredientes": [
            {{"item": "ingrediente", "cantidad": "1/2 taza"}},
            {{"item": "ingrediente2", "cantidad": "1 pieza"}}
          ],
          "preparacion": ["Paso 1...", "Paso 2...", "Paso 3..."],
          "tip": "Tip o sustitución útil"
        }},
        {{
          "tipo": "Comida",
          "nombre": "...",
          "ingredientes": [...],
          "preparacion": [...],
          "tip": "..."
        }},
        {{
          "tipo": "Snack",
          "nombre": "...",
          "ingredientes": [...],
          "preparacion": [...],
          "tip": "..."
        }},
        {{
          "tipo": "Cena",
          "nombre": "...",
          "ingredientes": [...],
          "preparacion": [...],
          "tip": "..."
        }}
      ]
    }}
  ],
  "recomendaciones": ["Recomendación 1 personalizada", "...", "...", "...", "..."],
  "lista_super": {{
    "proteinas": ["pechuga de pollo 1 kg", "huevos 18 piezas", "..."],
    "lacteos": ["leche 2 L", "yogur griego 1 kg", "..."],
    "cereales": ["avena 500g", "arroz integral 1 kg", "..."],
    "verduras": ["brócoli 2 piezas", "espinaca 1 bolsa", "..."],
    "frutas": ["plátano 7 piezas", "manzana 7 piezas", "..."],
    "grasas_semillas": ["aceite de oliva 500ml", "almendras 200g", "..."],
    "basicos": ["sal, pimienta, especias al gusto"]
  }},
  "guia_ejercicios": {{
    "descripcion": "Guía de ejercicios para complementar tu plan alimenticio",
    "dias_recomendados": 4,
    "rutina_casa": [
      {{
        "dia": "Día 1 - Tren Superior",
        "ejercicios": [
          {{"nombre": "Lagartijas", "series": 3, "repeticiones": "12-15", "descanso": "60 seg"}},
          {{"nombre": "...", "series": 3, "repeticiones": "...", "descanso": "..."}}
        ],
        "duracion": "30 min",
        "tips": "Tip para este día"
      }}
    ],
    "rutina_gimnasio": [
      {{
        "dia": "Día 1 - Pecho y Tríceps",
        "ejercicios": [
          {{"nombre": "Press de banca", "series": 4, "repeticiones": "10-12", "descanso": "90 seg"}},
          {{"nombre": "...", "series": 3, "repeticiones": "...", "descanso": "..."}}
        ],
        "duracion": "45 min",
        "tips": "Tip para este día"
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
