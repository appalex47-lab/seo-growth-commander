# Business Rules — Fase 6

## Métricas derivadas
- **Potential Traffic** = Volumen de mercado × CTR esperado.
- **Revenue Gap** = max(0, (Potential Traffic − Clicks GSC) × Conversion Rate × AOV).
- **Organic Search Share** = Impresiones GSC / Volumen de mercado cuando el volumen es > 0.

CTR esperado por defecto: **10%**.

## Clasificación
- Datos incompletos o inválidos → `ANOMALIA`.
- Stock conocido < 5 → `IGNORAR`.
- Posición 4–15 + volumen >= 50,000 + stock suficiente → `QUICK_WIN`.
- Posición 1–3 + volumen >= 50,000 + stock suficiente → `PROTEGER`.
- Volumen >= 50,000 + posición > 20 + stock suficiente → `CONTENT_GAP`.
- Otros casos → `ANOMALIA`.

## Prioridad
`QUICK_WIN=1`, `PROTEGER=2`, `CONTENT_GAP=3`, `ANOMALIA=4`, `IGNORAR=5`.

## Calidad
- `VALID`: todos los inputs necesarios están presentes y son válidos.
- `INCOMPLETE`: falta al menos un input necesario.
- `INVALID`: existe al menos un valor inválido.

Los campos derivados siempre se recalculan al cargar los datos.
