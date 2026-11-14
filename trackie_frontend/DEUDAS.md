# Deudas técnicas post-migración

## Daily Logs
- availableToAdd / "Añadir métrica" en DailyLogForm: el backend ya
  devuelve las métricas disponibles, falta el modal selector en el
  form.
- Workouts (WorkoutExecutionInput) en DailyLogForm: falta el editor
  de bloques (calentamiento, intervalos, enfriamiento).
- GET /metrics y gestión del catálogo desde la UI: el backend no
  expone endpoints para crear/editar MetricType. Pendiente de
  implementar en el backend y en el front.
- GoodBadDaysResult / DayClassification / FullStatsResult siguen
  tipados con campos específicos de calorías/pasos (averageCalories,
  averageSteps, calories, steps) porque el contrato nuevo de esos
  endpoints no está definido todavía. Revisar y migrar cuando el
  backend publique el nuevo shape.

## Weight
- weightLog.service.ts envía FormData con campos planos (weight,
  bodyfat, waist, hips) vía `upsert`/`create`/`update`. Verificar
  contra el DTO del backend (src/dtos/weightlog.dto.ts) si acepta campos
  planos o `metrics: Record<string, number>`; si migró, cambiar el
  FormData en una tarea posterior.

## Programas
- Targets custom en ProgramForm: solo se ofrecen las 5 universales
  (calories, protein, steps, water, workout_count). Para añadir
  otras (meditation, etc.) hace falta GET /metrics.
- Creación de workouts asociados al programa desde la UI
  (ProgramRoutine, WorkoutExecution).
- ProgramCard no muestra el `kind` del programa ('cut'|'bulk'|'maintain')
  porque no había hueco previsto en el diseño; el badge se añadirá cuando
  se autorice un ajuste visual.
- getWeeklySummary/getTrends/getMeasurements/getSummary/getStats/getCalendar
  se mantienen sin shape tipado porque el backend no publica contrato
  individual.

## General
- Tests E2E del frontend: no existen. Solo hay tests unitarios del
  backend.
- Documentación de la API en el frontend (swagger / openapi types).

## Notas
- El shape de WeightStats y WeightTrend sigue siendo plano por key
  (weight, bodyfat, waist, hips). No se migró a metrics[] porque el
  backend lo mantiene así.
- Los overviews (CaloriesOverviewScreen, StepsOverviewScreen) siguen
  siendo pantallas separadas. Se podría unificar en una sola
  "MetricsOverviewScreen" que itere sobre las métricas registradas.
- Archivos sueltos en la raíz del repo y en app/: `.CutPhasesLogs.tsx.swp`
  y `app/.CutPhasesLogs.tsx.swp` (swaps de vim de septiembre, con contenido
  antiguo cutphase). No se borran sin confirmación explícita.
