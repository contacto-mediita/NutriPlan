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
- Dashboard con macros y plan semanal
- **Widget de Hidratación:**
  - Vasos visuales interactivos
  - Meta basada en peso y objetivo (30-40ml por kg)
  - Persistencia en base de datos
  - Botones +/- para agregar/quitar vasos
- **Modal de Plan Completo mejorado:**
  - Menú con selector de 3 opciones por comida
  - Lista del Super con checkboxes de cumplimiento
  - Guía de Ejercicios con checklist y descripción de beneficios
  - Botón Descargar PDF
- Pricing: 4 planes + banner trial gratuito
- Página de Progreso con gráficas
- Sistema de Recordatorios In-App
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

### Estructura del Plan Alimenticio (Nuevo Formato)
- **4 comidas por día:** Desayuno, Comida, Snack, Cena
- **3 opciones por comida:**
  - Recomendado: Opción principal más nutritiva
  - Rápido: Para días con poco tiempo
  - Económico: Ingredientes más accesibles
- Cada opción incluye:
  - Nombre del platillo
  - Ingredientes con cantidades
  - Pasos de preparación
  - Tiempo estimado
  - Tips y sustituciones
- **Lista del Super con Checkboxes:**
  - 7 categorías: Proteínas, Lácteos, Cereales, Verduras, Frutas, Grasas/Semillas, Básicos
  - Progreso visual (porcentaje completado)
  - Persistencia en localStorage por plan
- **Guía de Ejercicios Mejorada:**
  - Rutina en Casa (4 días)
  - Rutina en Gimnasio (4 días)
  - Descripción del objetivo de cada rutina
  - Lista de beneficios
  - Checklist de ejercicios completados
  - Iconos visuales por ejercicio
  - Cardio recomendado

### Sistema de Hidratación
- **Cálculo de meta diaria:**
  - Bajar de peso: peso × 40ml (más agua para metabolismo)
  - Aumentar masa: peso × 38ml (hidratación para síntesis proteica)
  - General: peso × 33ml
  - Default sin cuestionario: 8 vasos (2L)
- **Interfaz visual:**
  - Vasos interactivos (click para llenar)
  - Barra de progreso
  - Contador de vasos/ml
  - Info de meta personalizada

### Documentos Legales
- **Términos y Condiciones:** Establece que es una guía educativa, no servicio médico
- **Aviso de Privacidad:** Datos no usados para fines comerciales ni compartidos con terceros

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
- [x] Lista del super
- [x] Guía de ejercicios
- [x] Términos y condiciones
- [x] Aviso de privacidad
- [x] Campo WhatsApp en cuestionario
- [x] Exportación PDF del plan
- [x] Notificaciones/recordatorios In-App
- [x] Widget de hidratación
- [x] Checkboxes en lista del super
- [x] 3 opciones por comida en el plan
- [x] Checklist de ejercicios
- [x] Descripción de beneficios de rutinas

### P1 (Siguiente)
- [ ] Login con Facebook (requiere FACEBOOK_APP_ID y FACEBOOK_APP_SECRET)
- [ ] Notificaciones por Email (requiere RESEND_API_KEY)
- [ ] Notificaciones por WhatsApp (requiere credenciales Twilio)
- [ ] Infografía/imágenes de ejercicios (iconos más elaborados)

### P2 (Futuro)
- [ ] Integración con apps de fitness
- [ ] Recetas con video (IA video generation)
- [ ] Panel de admin

## Archivos Clave
- `backend/server.py` - API principal (~1200 líneas)
- `frontend/src/pages/Questionnaire.js` - Cuestionario 9 etapas
- `frontend/src/pages/Dashboard.js` - Panel principal con widget de hidratación
- `frontend/src/components/PlanDetailModal.js` - Modal con plan completo, checkboxes, 3 opciones
- `frontend/src/components/HydrationWidget.js` - Widget de hidratación interactivo
- `frontend/src/components/ReminderNotifications.js` - Sistema de recordatorios

## Integraciones Pendientes (Requieren API Keys del Usuario)
- **Resend:** Para notificaciones por email
- **Twilio:** Para notificaciones por WhatsApp
- **Facebook:** Para login social

## Testing Reports
- `/app/test_reports/iteration_1.json` - Tests iniciales
- `/app/test_reports/iteration_2.json` - Tests de progreso
- `/app/test_reports/iteration_3.json` - Tests PDF y WhatsApp
- `/app/test_reports/iteration_4.json` - Tests hidratación y checkboxes
