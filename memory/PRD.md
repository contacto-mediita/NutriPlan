# PRD - NutriPlan - Planes Alimenticios Personalizados

## Problema Original
Aplicación web para crear planes alimenticios personalizados con membresía/pago. Genera planes mediante cuestionario de 8 etapas con IA.

## Arquitectura
- **Frontend:** React + Tailwind CSS + Shadcn/UI + Framer Motion + Recharts
- **Backend:** FastAPI + MongoDB + emergentintegrations
- **IA:** OpenAI GPT-5.2 (via Emergent LLM Key)
- **Pagos:** Stripe (sk_test_emergent)
- **Auth:** JWT email/contraseña

## Lo Implementado (Feb 2026)

### Backend
- Auth: register, login, me endpoints
- Cuestionario: 8 etapas completas
- Plan Trial: 1 día gratuito con 4 comidas (Desayuno, Snack, Comida, Cena)
- Plan Completo: Generación con IA de 7+ días
- Stripe: Checkout sessions con 4 planes
- **NUEVO: Seguimiento de Progreso**
  - POST/GET/DELETE /api/progress/weight - CRUD registros de peso
  - GET /api/progress/stats - Estadísticas con cálculo de meta

### Frontend
- Landing page vibrante (verde/naranja InstaHealthy)
- Auth (registro/login)
- Cuestionario de 8 etapas (una pregunta a la vez)
- Dashboard con macros y plan semanal
- Pricing: 4 planes + banner trial gratuito
- Modal de generación trial con resultados
- **NUEVO: Página de Progreso**
  - 4 stats cards: Peso inicial, actual, meta, cambio
  - Barra de progreso hacia meta
  - Gráfica de evolución (Recharts)
  - Historial de registros con eliminación

### Planes de Precios
| Plan | Precio | Duración |
|------|--------|----------|
| 3 Días | $49 MXN | 3 días |
| Semana | $119 MXN | 7 días |
| Quincena | $199 MXN | 15 días |
| Mes | $349 MXN | 30 días |

### Plan de Prueba Gratuito
- 1 día con 4 comidas
- Solo 1 vez por usuario
- Generado con IA (GPT-5.2)

### Sistema de Progreso
- Meta calculada automáticamente:
  - "Bajar de peso": -10% del peso inicial
  - "Aumentar masa": +5% del peso inicial
  - "Control de peso": mantener
- Gráfica de evolución con línea de meta
- Felicitaciones automáticas al alcanzar metas parciales

## User Personas
1. **Persona buscando bajar de peso** - Objetivo principal, plan hipocalórico
2. **Persona buscando ganar masa** - Plan hipercalórico con más proteína
3. **Persona con restricciones** - Vegetariano, alergias, medicamentos

## Backlog Priorizado

### P0 (Completado)
- [x] Cuestionario 8 etapas
- [x] Generación plan con IA
- [x] Sistema de pagos Stripe
- [x] Auth JWT
- [x] Plan trial gratuito
- [x] Seguimiento de progreso con gráficas

### P1 (Siguiente)
- [ ] Login con Facebook (requiere Facebook App ID)
- [ ] Lista de compras generada
- [ ] PDF descargable del plan
- [ ] Notificaciones/recordatorios

### P2 (Futuro)
- [ ] Integración con apps de fitness
- [ ] Recetas detalladas con instrucciones
- [ ] Panel de admin
- [ ] Exportar datos de progreso

## Siguientes Pasos
1. Obtener Facebook App ID para login social
2. Implementar generación de lista de compras
3. Agregar exportación PDF
