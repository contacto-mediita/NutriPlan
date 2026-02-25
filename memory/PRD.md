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

### Dashboard Mejorado
- **Mi Objetivo:** Muestra el objetivo principal del usuario con objetivos secundarios
- **Índice de Masa Corporal (IMC):**
  - Cálculo: peso / (estatura/100)²
  - Categorías con colores:
    - Bajo peso (<18.5): Azul
    - Normal (18.5-25): Verde
    - Sobrepeso (25-30): Amarillo
    - Obesidad (>30): Rojo
- **Tiempo Estimado para cumplir objetivo:**
  - Para bajar de peso: Calcula semanas hasta peso ideal (IMC 22)
  - Para aumentar masa: Calcula semanas hasta +10% del peso actual
  - Fórmula semanal: 0.5 + (días_ejercicio × 0.1) kg/semana
- **Barra de Progreso:** Muestra peso actual → peso meta
- **Widget de Hidratación:** Meta de agua basada en peso y objetivo

### Backend
- Auth: register, login, me endpoints
- Cuestionario: 9 etapas completas (incluyendo aviso legal + WhatsApp)
- Plan Trial: 1 día gratuito con 4 comidas + lista super + guía ejercicios
- **Plan Completo con 3 opciones por comida:**
  - Opción Principal (Recomendado)
  - Alternativa Rápida
  - Alternativa Económica
- Stripe: Checkout sessions con 4 planes
- Seguimiento de Progreso: CRUD registros de peso + estadísticas
- Exportación PDF del plan completo
- **Sistema de Hidratación:**
  - GET /api/hydration/goal - Meta calculada por peso y objetivo
  - POST /api/hydration/log - Registrar vasos de agua
  - GET /api/hydration/today - Obtener registro del día
  - GET /api/hydration/history - Historial de hidratación

### Frontend
- Landing page vibrante (verde/naranja InstaHealthy)
- Auth (registro/login)
- **Cuestionario de 9 etapas:**
  1. Aviso Legal (Términos y Condiciones)
  2. Datos Generales (+ campo WhatsApp)
  3. Objetivos
  4. Actividad y Rutina
  5. Salud
  6. Síntomas
  7. Hábitos
  8. Alimentación
  9. Consumo Fuera
- **Dashboard con:**
  - Objetivo, IMC y Tiempo Estimado
  - Widget de Hidratación interactivo
  - Macros y plan semanal
  - Recordatorios In-App
- **Modal de Plan Completo mejorado:**
  - Menú con selector de 3 opciones por comida
  - Lista del Super con checkboxes de cumplimiento
  - Guía de Ejercicios con checklist y descripción de beneficios
  - Botón Descargar PDF
- Pricing: 4 planes + banner trial gratuito
- Página de Progreso con gráficas
- **Páginas Legales:**
  - Términos y Condiciones
  - Aviso de Privacidad

### Planes de Precios
| Plan | Precio | Duración |
|------|--------|----------|
| 3 Días | $49 MXN | 3 días |
| Semana | $119 MXN | 7 días |
| Quincena | $199 MXN | 15 días |
| Mes | $349 MXN | 30 días |

### Cálculos Implementados

#### IMC (Índice de Masa Corporal)
```javascript
BMI = peso / (estatura/100)²
// Ejemplo: 85kg / (175cm/100)² = 85 / 3.0625 = 27.8
```

#### Meta de Hidratación
```javascript
// Bajar de peso: peso × 40ml
// Aumentar masa: peso × 38ml
// General: peso × 33ml
// Vasos = ml_total / 250
```

#### Tiempo Estimado
```javascript
// Bajar de peso:
pesoIdeal = 22 * (estatura_m²)
cambioSemanal = 0.5 + (diasEjercicio × 0.1)
semanas = (pesoActual - pesoIdeal) / cambioSemanal

// Aumentar masa:
pesoMeta = pesoActual × 1.1
cambioSemanal = 0.25 + (diasEjercicio × 0.05)
semanas = (pesoMeta - pesoActual) / cambioSemanal
```

## User Personas
1. Persona buscando bajar de peso - Plan hipocalórico + más hidratación
2. Persona buscando ganar masa - Plan hipercalórico + hidratación moderada
3. Persona con restricciones - Vegetariano, alergias, múltiples opciones de comida

## Backlog Priorizado

### P0 (Completado)
- [x] Cuestionario 9 etapas con aviso legal
- [x] Generación plan con IA
- [x] Sistema de pagos Stripe
- [x] Auth JWT
- [x] Plan trial gratuito
- [x] Seguimiento de progreso
- [x] Lista del super con checkboxes
- [x] Guía de ejercicios con checklist
- [x] Términos y condiciones
- [x] Aviso de privacidad
- [x] Campo WhatsApp en cuestionario
- [x] Exportación PDF del plan
- [x] Notificaciones/recordatorios In-App
- [x] Widget de hidratación
- [x] 3 opciones por comida en el plan
- [x] Descripción de beneficios de rutinas
- [x] Objetivo, IMC y Tiempo Estimado en Dashboard

### P1 (Siguiente)
- [ ] Login con Facebook (requiere FACEBOOK_APP_ID y FACEBOOK_APP_SECRET)
- [ ] Notificaciones por Email (requiere RESEND_API_KEY)
- [ ] Notificaciones por WhatsApp (requiere credenciales Twilio)
- [ ] Infografía/imágenes de ejercicios elaboradas

### P2 (Futuro)
- [ ] Integración con apps de fitness
- [ ] Recetas con video (IA video generation)
- [ ] Panel de admin
- [ ] Sistema de logros/badges

## Archivos Clave
- `backend/server.py` - API principal (~1200 líneas)
- `frontend/src/pages/Questionnaire.js` - Cuestionario 9 etapas
- `frontend/src/pages/Dashboard.js` - Panel principal con IMC, objetivo, hidratación
- `frontend/src/components/PlanDetailModal.js` - Modal con plan completo, checkboxes, 3 opciones
- `frontend/src/components/HydrationWidget.js` - Widget de hidratación interactivo
- `frontend/src/components/ReminderNotifications.js` - Sistema de recordatorios

## Testing Reports
- `/app/test_reports/iteration_1.json` - Tests iniciales
- `/app/test_reports/iteration_2.json` - Tests de progreso
- `/app/test_reports/iteration_3.json` - Tests PDF y WhatsApp
- `/app/test_reports/iteration_4.json` - Tests hidratación y checkboxes
- `/app/test_reports/iteration_5.json` - Tests IMC, objetivo y tiempo estimado

## Credenciales de Prueba
- **Email:** dashboard_full_test_001@test.com
- **Password:** testpass123
- **Datos:** peso=85kg, estatura=175cm, objetivo='Bajar de peso', dias_ejercicio=4
- **Resultados:** IMC=27.8 (Sobrepeso), Tiempo=20 semanas, Meta=67.4kg
