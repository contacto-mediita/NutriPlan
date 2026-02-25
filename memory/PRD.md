# PRD - NutriPlan - Planes Alimenticios Personalizados

## Problema Original
Aplicación web para crear planes alimenticios personalizados con membresía/pago. Genera planes mediante cuestionario de 9 etapas con IA.

## Arquitectura
- **Frontend:** React + Tailwind CSS + Shadcn/UI + Framer Motion + Recharts
- **Backend:** FastAPI + MongoDB + emergentintegrations + fpdf2
- **IA:** OpenAI GPT-5.2 (via Emergent LLM Key)
- **Pagos:** Stripe (sk_test_emergent)
- **Auth:** JWT email/contraseña

## Lo Implementado (Feb 2026)

### Dashboard Completo
- **Mi Objetivo:** Muestra objetivo principal y secundarios
- **IMC con Rango Saludable:**
  - Cálculo: peso / (estatura/100)²
  - Categorías con colores: Bajo peso, Normal, Sobrepeso, Obesidad
  - Rango saludable basado en edad, sexo y estatura (BMI 18.5-24.9, ajustado por edad)
- **Tiempo Estimado con Progreso Real:**
  - Semanas hasta meta calculadas dinámicamente
  - Barra de progreso que se actualiza con peso registrado
  - Muestra: Inicio → Actual → Meta con porcentaje
- **Widget de Hidratación:** Meta de agua basada en peso y objetivo

### Cuestionario Mejorado (9 Etapas)
1. Aviso Legal
2. Datos Generales (+ WhatsApp + foto opcional)
3. Objetivos
4. Actividad y Rutina
5. **Salud (+ Lesiones/Restricciones para Ejercicio)**
   - 9 opciones: Ninguna, Rodilla, Espalda, Hombro, Tobillo, Hernia, Cadera, Tendinitis, Otra
   - Campo de descripción detallada
6. Síntomas
7. Hábitos
8. Alimentación
9. Consumo Fuera

### Plan Alimenticio con Recetas Detalladas
- **3 opciones por comida:**
  - Recomendado (más nutritiva)
  - Rápido (max 10 min)
  - Económico (ingredientes accesibles)
- **Cada receta incluye:**
  - Ingredientes con cantidades exactas
  - Preparación paso a paso (4-6 pasos)
  - Tiempo de preparación
  - **Sustituciones** (2-3 alternativas)
  - **Tip NutriPlan** personalizado
- **Recomendaciones Adicionales:**
  - Sueño y descanso
  - Manejo de antojos
  - Planeación de comidas
  - Guía para restaurantes
  - Consideraciones por padecimientos
  - Progreso esperado
  - Hidratación

### Guía de Ejercicios Mejorada
- **Ilustraciones SVG** para cada ejercicio
- **Técnica correcta** en cada ejercicio
- **Adaptación por lesiones** - Excluye ejercicios problemáticos
- **Checklist de completado** con progreso
- **Beneficios** listados por rutina
- Rutina en Casa y Gimnasio

### Planes de Precios
| Plan | Precio | Duración |
|------|--------|----------|
| 3 Días | $49 MXN | 3 días |
| Semana | $119 MXN | 7 días |
| Quincena | $199 MXN | 15 días |
| Mes | $349 MXN | 30 días |

### Cálculos Implementados

#### IMC y Rango Saludable
```javascript
BMI = peso / (estatura/100)²
// Rango saludable ajustado por edad:
// <50 años: BMI 18.5-24.9
// 50-65 años: BMI 19-26
// >65 años: BMI 20-27
```

#### Progreso Real
```javascript
// Para bajar de peso:
totalToLose = pesoInicial - pesoIdeal
alreadyLost = pesoInicial - pesoActual
progressPercent = (alreadyLost / totalToLose) * 100
```

## User Personas
1. Persona buscando bajar de peso - Plan hipocalórico + hidratación alta
2. Persona buscando ganar masa - Plan hipercalórico
3. Persona con restricciones - Vegetariano, alergias, lesiones

## Backlog Priorizado

### P0 (Completado)
- [x] Cuestionario 9 etapas con aviso legal
- [x] Generación plan con IA con 3 opciones
- [x] Recetas detalladas con sustituciones
- [x] Sistema de pagos Stripe
- [x] Auth JWT
- [x] Plan trial gratuito
- [x] Seguimiento de progreso
- [x] Lista del super con checkboxes
- [x] Guía de ejercicios con checklist e ilustraciones
- [x] Términos y condiciones
- [x] Aviso de privacidad
- [x] Campo WhatsApp en cuestionario
- [x] Exportación PDF del plan
- [x] Notificaciones/recordatorios In-App
- [x] Widget de hidratación
- [x] Objetivo, IMC y Tiempo Estimado en Dashboard
- [x] Rango de peso saludable
- [x] Progreso actualizado con peso real
- [x] Lesiones/Restricciones en cuestionario
- [x] Infografía SVG de ejercicios
- [x] Recomendaciones adicionales personalizadas

### P1 (Pendiente - requiere credenciales)
- [ ] Avatar con complexión del usuario (foto → IA)
- [ ] Login con Facebook
- [ ] Notificaciones por Email (Resend)
- [ ] Notificaciones por WhatsApp (Twilio)

### P2 (Futuro)
- [ ] Recetas con video (IA)
- [ ] Panel de admin
- [ ] Integración con apps de fitness

## Archivos Clave
- `backend/server.py` - API principal (~1300 líneas)
- `frontend/src/pages/Dashboard.js` - Panel con IMC, progreso, hidratación
- `frontend/src/pages/Questionnaire.js` - Cuestionario 9 etapas + lesiones
- `frontend/src/components/PlanDetailModal.js` - Plan con sustituciones
- `frontend/src/components/ExerciseIllustrations.js` - SVG ilustraciones
- `frontend/src/components/HydrationWidget.js` - Widget de agua

## Testing Reports
- `/app/test_reports/iteration_1.json` a `iteration_6.json`

## Credenciales de Prueba
- **dashboard_full_test_001@test.com** / testpass123
  - peso=85kg, estatura=175cm, objetivo=Bajar de peso
  - Peso actual registrado: 83kg (11% progreso)
- **plan_test_20260225153630@test.com** / testpass123
  - Usuario con plan trial y guía de ejercicios
