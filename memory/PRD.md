# PRD - NutriPlan - Planes Alimenticios Personalizados

## Problema Original
Aplicación web para crear planes alimenticios personalizados con membresía/pago. Genera planes mediante cuestionario de 9 etapas con IA.

## Arquitectura
- **Frontend:** React + Tailwind CSS + Shadcn/UI + Framer Motion + Recharts
- **Backend:** FastAPI + MongoDB + emergentintegrations + fpdf2
- **IA:** OpenAI GPT-5.2 (via Emergent LLM Key)
- **Pagos:** Stripe (sk_test_emergent)
- **Auth:** JWT email/contraseña
- **Admin:** Panel de administración con control de usuarios y pagos

## Lo Implementado (Feb 2026)

### Panel de Administración
- **Ruta:** `/admin`
- **Acceso:** Usuarios con email en ADMIN_EMAILS (.env)
- **Funcionalidades:**
  - **Dashboard de Stats:**
    - Total usuarios
    - Suscripciones activas
    - Planes generados
    - Ingresos totales
    - Registros últimos 7 días
    - Tasa de completación de cuestionario
  - **Gestión de Usuarios:**
    - Búsqueda por nombre/email
    - Ver detalle de usuario
    - Cuestionario, planes, pagos, progreso
    - Actualizar suscripción manualmente
  - **Gestión de Pagos:**
    - Lista de transacciones
    - Estado de pagos
    - Usuario asociado
  - **Analytics:**
    - Usuarios por tipo de suscripción
    - Planes por tipo
    - Métricas clave: Conversión, ARPU

### Infografías de Ejercicios (SVG)
- **Ilustraciones paso a paso:**
  - Lagartijas (3 pasos con flechas de movimiento)
  - Sentadillas (3 pasos con indicador de 90°)
  - Plancha (línea de alineación + "Core activado")
  - Fondos en silla
  - Curl de bíceps
  - Remo
- **Tips visuales** para cada ejercicio
- **58 elementos SVG** en la página de ejercicios

### Dashboard Mejorado
- Mi Objetivo con objetivos secundarios
- IMC con Rango Saludable (ajustado por edad)
- Progreso Real actualizado con peso registrado
- Widget de Hidratación interactivo

### Cuestionario (9 Etapas)
1. Aviso Legal
2. Datos Generales (+ WhatsApp)
3. Objetivos
4. Actividad y Rutina
5. **Salud + Lesiones/Restricciones**
6. Síntomas
7. Hábitos
8. Alimentación
9. Consumo Fuera

### Plan Alimenticio con Recetas Detalladas
- 3 opciones por comida (Recomendado, Rápido, Económico)
- Ingredientes exactos
- Preparación paso a paso
- Sustituciones
- Tip NutriPlan
- Recomendaciones adicionales personalizadas

### Guía de Ejercicios
- Ilustraciones SVG paso a paso
- Técnica correcta por ejercicio
- Adaptación por lesiones
- Checklist de completado
- Beneficios listados

### Footer
- "© 2025 NutriPlan. Todos los derechos reservados."

## Planes de Precios
| Plan | Precio | Duración |
|------|--------|----------|
| 3 Días | $49 MXN | 3 días |
| Semana | $119 MXN | 7 días |
| Quincena | $199 MXN | 15 días |
| Mes | $349 MXN | 30 días |

## API Endpoints Admin
```
GET /api/admin/check - Verificar si es admin
GET /api/admin/stats - Estadísticas del dashboard
GET /api/admin/users - Lista de usuarios (paginada)
GET /api/admin/users/{id} - Detalle de usuario
PUT /api/admin/users/{id}/subscription - Actualizar suscripción
GET /api/admin/payments - Lista de pagos
```

## Configuración Admin
```env
ADMIN_EMAILS=admin@nutriplan.com,otro@admin.com
```

## User Personas
1. Usuario buscando bajar de peso
2. Usuario buscando ganar masa
3. Usuario con restricciones/lesiones
4. **Administrador** - Gestiona plataforma

## Backlog Priorizado

### P0 (Completado)
- [x] Cuestionario 9 etapas con lesiones
- [x] Generación plan con IA + 3 opciones + sustituciones
- [x] Sistema de pagos Stripe
- [x] Auth JWT
- [x] Plan trial gratuito
- [x] Seguimiento de progreso con actualización real
- [x] Lista del super con checkboxes
- [x] Guía de ejercicios con infografías SVG
- [x] Widget de hidratación
- [x] Rango de peso saludable
- [x] Footer 2025
- [x] **Panel de Administración**

### P1 (Pendiente - requiere credenciales)
- [ ] Avatar con complexión del usuario (foto → IA)
- [ ] Login con Facebook
- [ ] Notificaciones por Email (Resend)
- [ ] Notificaciones por WhatsApp (Twilio)

### P2 (Futuro)
- [ ] Recetas con video (IA)
- [ ] Integración con apps de fitness

## Archivos Clave
- `backend/server.py` - API principal + endpoints admin (~1600 líneas)
- `frontend/src/pages/AdminPanel.js` - Panel de administración
- `frontend/src/pages/Dashboard.js` - Panel usuario
- `frontend/src/components/ExerciseIllustrations.js` - Infografías SVG
- `frontend/src/components/PlanDetailModal.js` - Plan con sustituciones

## Testing Reports
- `/app/test_reports/iteration_1.json` a `iteration_7.json`
- Último: 100% passed (admin panel, SVGs, footer 2025)

## Credenciales de Prueba
- **Admin:** bmi_test@test.com / Test123456
- **Usuario con plan:** plan_test_20260225153630@test.com / testpass123
