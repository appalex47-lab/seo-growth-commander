# Fase 34 — Métricas de rendimiento y eficiencia de Google Ads

## Objetivo
Ampliar los informes de campañas y productos de Shopping con indicadores derivados, calculados únicamente con los datos reales devueltos por Google Ads.

## Cambios
- Añade CTR = clics / impresiones.
- Añade CPC promedio = gasto / clics.
- Añade CPA = gasto / conversiones.
- Añade ROAS = valor de conversiones / gasto.
- Presenta los indicadores tanto en el resumen agregado como en cada fila.
- Evita divisiones por cero: cuando el denominador es cero, el indicador se muestra como “—”.
- Mantiene la consulta de solo lectura y el periodo global existente.
- Aclara que la moneda MXN de visualización es orientativa; debe confirmarse la moneda de la cuenta antes de comparar importes.

## Interpretación y límites
- ROAS es valor de conversiones atribuido por Google Ads dividido entre gasto, no utilidad neta ni margen.
- Conversiones y valor dependen de la configuración de medición y atribución de la cuenta.
- Los resultados de producto solo aparecen si existen filas de rendimiento de Shopping para el periodo consultado.
- No se modifica ni se simula ningún dato de campaña.

## Validación
La validación local comprueba sintaxis JS, pruebas automatizadas existentes y contenido del ZIP. No sustituye una consulta en vivo: para confirmar métricas reales es necesario ejecutar la aplicación con OAuth y una cuenta Ads autorizada.
