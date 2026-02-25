# PRD - NutriPlan - Planes Alimenticios Personalizados

## Problema Original
Aplicación web para crear planes alimenticios personalizados con membresía/pago. Genera planes mediante cuestionario de 9 etapas con IA.

## Arquitectura
- **Frontend:** React + Tailwind CSS + Shadcn/UI + Framer Motion + Recharts
- **Backend:** FastAPI + MongoDB + emergentintegrations + fpdf2
- **IA:** OpenAI GPT-5.2 (via Emergent LLM Key)
- **Pagos:** Stripe (sk_test_emergent)
- **Auth:** JWT email/contraseña
- **Admin:** Panel de administración

## Lo Implementado (Feb 2026)

### Sistema de Metas Personalizables
- **Editar Meta en Mi Progreso:**
  - Click en tarjeta "Meta" → Abre modal de edición
  - Campos: Peso meta (kg), Tipo (Bajar/Mantener/Subir)
  - Muestra "Cambio necesario: X.X kg"
  - Indicador "Meta personalizada" cuando está activa
- **Dashboard con Meta Personalizada:**
  - Recalcula Tiempo Estimado con la nueva meta
  - Muestra "Meta personalizada" cuando is_custom=true
  - Barra de progreso: Inicio → Actual → Meta

### Plan Alimenticio Completo
- **Después de Pago:**
  - Acceso completo al plan de 7 días
  - Descarga de PDF completo
  - Cada día con comidas diferentes
- **3 Opciones por Comida:**
  - ⭐ Recomendado - Más nutritiva
  - ⚡ Rápido - Max 10 min
  - 💰 Económico - Ingredientes accesibles
- **Cada Receta Incluye:**
  - Ingredientes con cantidades exactas
  - Preparación paso a paso (4-6 pasos)
  - **Tiempo de preparación** con ícono de reloj
  - Sustituciones (2-3 alternativas)
  - Tip NutriPlan
  - Recomendaciones adicionales

### Panel de Administración
- **Ruta:** `/admin`
- **Stats:** Usuarios, suscripciones, planes, ingresos
- **Gestión:** Usuarios, pagos, analytics

### Infografías de Ejercicios (SVG)
- Ilustraciones paso a paso
- Tips visuales por ejercicio
- Checklist de completado

### Dashboard
- Objetivo + Objetivos secundarios
- IMC con Rango Saludable
- Progreso Real con peso actual
- Widget de Hidratación

### Cuestionario (9 Etapas)
1. Aviso Legal
2. Datos Generales (+ WhatsApp)
3. Objetivos
4. Actividad y Rutina
5. Salud + Lesiones/Restricciones
6. Síntomas
7. Hábitos
8. Alimentación
9. Consumo Fuera

### Footer
- "© 2025 NutriPlan. Todos los derechos reservados."
- Sin marca "Made with Emergent"

## Planes de Precios
| Plan | Precio | Duración |
|------|--------|----------|
| 3 Días | $49 MXN | 3 días |
| Semana | $119 MXN | 7 días |
| Quincena | $199 MXN | 15 días |
| Mes | $349 MXN | 30 días |

## API Endpoints Nuevos
```
GET /api/progress/goal - Obtener meta (custom o calculada)
PUT /api/progress/goal - Actualizar meta personalizada
```

## Flujo de Usuario
1. Registro → Cuestionario → Plan Trial (1 día)
2. Pago → Plan Completo (7 días, 3 opciones)
3. Mi Progreso → Registrar peso → Cambiar meta
4. Dashboard → Ver progreso hacia meta personalizada

## Backlog Priorizado

### P0 (Completado)
- [x] Cuestionario 9 etapas con lesiones
- [x] Plan con 3 opciones + tiempo de preparación
- [x] Sistema de pagos Stripe
- [x] PDF descargable completo
- [x] Meta de peso editable
- [x] Dashboard con meta personalizada
- [x] Progreso actualizado en tiempo real
- [x] Infografías de ejercicios
- [x] Panel de administración
- [x] Footer 2025 sin Emergent

### P1 (Pendiente - requiere credenciales)
- [ ] Avatar con complexión del usuario
- [ ] Login con Facebook
- [ ] Notificaciones Email/WhatsApp

### P2 (Futuro)
- [ ] Recetas con video (IA)
- [ ] Integración con apps de fitness

## Archivos Clave
- `backend/server.py` - API principal (~1750 líneas)
- `frontend/src/pages/Progress.js` - Edición de meta
- `frontend/src/pages/Dashboard.js` - Meta personalizada
- `frontend/src/components/PlanDetailModal.js` - 3 opciones + tiempo
- `frontend/src/pages/AdminPanel.js` - Panel admin

## Testing Reports
- `/app/test_reports/iteration_1.json` a `iteration_8.json`
- Último: 100% passed

## Credenciales de Prueba
- **Admin:** bmi_test@test.com / Test123456 (meta personalizada: 72kg)
- **Plan user:** plan_test_20260225153630@test.com / testpass123
