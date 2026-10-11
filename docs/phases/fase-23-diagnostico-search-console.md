# Fase 23 — Diagnóstico SEO con datos de Search Console

## Objetivo
Transformar las filas obtenidas por la conexión directa de Fase 22 en una lectura diagnóstica inicial, sin alterar módulos previos ni atribuir causalidad sin evidencia.

## Flujo
- **Hecho:** suma clics e impresiones de las filas devueltas por la consulta actual y calcula CTR agregado como clics / impresiones.
- **Driver:** expone CTR y posición media tal como los devuelve Search Console; los interpreta como métricas descriptivas, no como causas probadas.
- **Señal A:** filas con >=100 impresiones y CTR <2%, ordenadas por impresiones.
- **Señal B:** filas con posición media entre 4 y 20 e >=100 impresiones, ordenadas por impresiones.
- **Señal C:** principales aportadores de clics, ordenados por clics.
- **Hipótesis:** incluye explicaciones posibles y acciones de validación, explícitamente no causales.

## Alcance y limitaciones
- Analiza únicamente las filas que devuelve la consulta actual. La API puede omitir filas, especialmente consultas de bajo volumen; los totales no representan necesariamente el total de la propiedad.
- Los umbrales (100 impresiones, CTR 2%, posiciones 4–20) son reglas de cribado iniciales, no benchmarks universales.
- No se mezclan datos de GA4, ventas, conversiones, Merchant Center ni Ads. No se infieren ingresos ni impacto comercial.
- No se persisten tokens OAuth ni se cambia el flujo de autenticación de Fase 22.
- El panel se renderiza dentro de Integraciones después de una consulta correcta; los demás módulos permanecen sin cambios.

## Criterios de aceptación
1. La consulta de Fase 22 sigue funcionando.
2. Después de una respuesta válida aparece la lectura de rendimiento con hechos, señales e hipótesis.
3. Ceros, arrays vacíos y campos ausentes no producen NaN/errores.
4. El contenido de dimensiones se escapa antes de renderizar HTML.
5. Las señales se ordenan de forma determinística y los textos indican que son heurísticas.
6. Las pruebas existentes y las nuevas pasan.

## Pruebas manuales
- Ejecutar una consulta por Página y comprobar métricas y tres listas.
- Ejecutar Consulta + Página y confirmar que las filas se evalúan por combinación de dimensión.
- Probar un periodo sin filas y confirmar mensajes vacíos claros.
- Confirmar que la vista no presenta las señales como causa probada ni como total completo del sitio.
