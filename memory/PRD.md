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

### Backend
- Auth: register, login, me endpoints
- Cuestionario: 9 etapas completas (incluyendo aviso legal + WhatsApp)
- Plan Trial: 1 día gratuito con 4 comidas + lista super + guía ejercicios
- Plan Completo: Generación con IA de 7+ días con todo incluido
- Stripe: Checkout sessions con 4 planes
- Seguimiento de Progreso: CRUD registros de peso + estadísticas
- **Exportación PDF:** Endpoint `/api/meal-plans/{plan_id}/pdf` genera PDF completo

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
- Dashboard con macros y plan semanal
- **Modal de Plan Completo con 3 tabs + Botón Descargar PDF:**
  - Menú (días expandibles con ingredientes y preparación)
  - Lista del Super (por categorías)
  - Guía de Ejercicios (casa y gimnasio)
- Pricing: 4 planes + banner trial gratuito
- Página de Progreso con gráficas
- **Páginas Legales:**
  - Términos y Condiciones
  - Aviso de Privacidad
- **Sistema de Recordatorios In-App:**
  - Recordatorios configurables (agua, comidas, dormir)
  - Panel de configuración con switches
  - Notificaciones toast

### Planes de Precios
| Plan | Precio | Duración |
|------|--------|----------|
| 3 Días | $49 MXN | 3 días |
| Semana | $119 MXN | 7 días |
| Quincena | $199 MXN | 15 días |
| Mes | $349 MXN | 30 días |

### Estructura del Plan Alimenticio
- **4 comidas por día:** Desayuno, Comida, Snack, Cena
- Ingredientes con cantidades específicas
- Pasos de preparación
- Tips y sustituciones
- **Lista del Super** por categorías:
  - Proteínas, Lácteos, Cereales, Verduras, Frutas, Grasas/Semillas, Básicos
- **Guía de Ejercicios:**
  - Rutina en Casa (4 días)
  - Rutina en Gimnasio (4 días)
  - Cardio recomendado

### Documentos Legales
- **Términos y Condiciones:** Establece que es una guía educativa, no servicio médico
- **Aviso de Privacidad:** Datos no usados para fines comerciales ni compartidos con terceros

## User Personas
1. Persona buscando bajar de peso - Plan hipocalórico
2. Persona buscando ganar masa - Plan hipercalórico
3. Persona con restricciones - Vegetariano, alergias

## Backlog Priorizado

### P0 (Completado)
- [x] Cuestionario 9 etapas con aviso legal
- [x] Generación plan con IA
- [x] Sistema de pagos Stripe
- [x] Auth JWT
- [x] Plan trial gratuito
- [x] Seguimiento de progreso
- [x] Lista del super
- [x] Guía de ejercicios
- [x] Términos y condiciones
- [x] Aviso de privacidad
- [x] Campo WhatsApp en cuestionario
- [x] Exportación PDF del plan
- [x] Notificaciones/recordatorios In-App

### P1 (Siguiente)
- [ ] Login con Facebook (requiere FACEBOOK_APP_ID y FACEBOOK_APP_SECRET)
- [ ] Notificaciones por Email (requiere RESEND_API_KEY)
- [ ] Notificaciones por WhatsApp (requiere credenciales Twilio)

### P2 (Futuro)
- [ ] Integración con apps de fitness
- [ ] Recetas con video (IA video generation)
- [ ] Panel de admin

## Archivos Clave
- `backend/server.py` - API principal (>1100 líneas, considerar refactorización)
- `frontend/src/pages/Questionnaire.js` - Cuestionario 9 etapas
- `frontend/src/pages/Dashboard.js` - Panel principal
- `frontend/src/components/PlanDetailModal.js` - Modal con plan completo + PDF
- `frontend/src/components/ReminderNotifications.js` - Sistema de recordatorios

## Integraciones Pendientes (Requieren API Keys del Usuario)
- **Resend:** Para notificaciones por email
- **Twilio:** Para notificaciones por WhatsApp
- **Facebook:** Para login social
