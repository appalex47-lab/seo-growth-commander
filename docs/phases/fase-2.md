# Fase 2 — Executive Overview y entorno de prueba

## Objetivo
Convertir el mock de Fase 0 en un Executive Overview funcional y añadir un mecanismo explícito para cargar/eliminar el dataset de prueba antes de integrar APIs o archivos reales.

## Alcance ejecutado
- Executive Overview con KPIs.
- Gráfico de tráfico orgánico vs tendencia de mercado.
- Resumen IA simulado.
- Indicadores de estado del dataset.
- Botón **Agregar información de prueba**.
- Botón **Borrar información de prueba**.
- Estado vacío después de borrar.
- Posibilidad de volver a cargar el mock sin recargar la página.
- Responsive y estados de foco de los controles.

## Decisión de diseño del dataset de prueba
Los botones operan sobre el estado de la sesión del frontend. No escriben sobre archivos reales, no usan APIs y no requieren base de datos.

- Agregar: vuelve a cargar `data/data_mock.json` y valida el dataset.
- Borrar: elimina el dataset del estado actual y muestra el estado vacío.
- Recargar la página: vuelve a iniciar con el mock, para que la demo siga siendo reproducible.

Esto permite probar todas las vistas y reglas con datos controlados antes del importador de archivos.

## Por qué hacerlo ahora
El entorno de prueba debe existir antes de integrar fuentes externas. Así se puede verificar:
1. fórmulas;
2. clasificación;
3. filtros;
4. ordenamiento;
5. estados vacíos/error;
6. visualizaciones;
7. interacción;
8. trazabilidad;
antes de introducir variables externas de APIs o archivos.

## Criterios de aceptación
- [x] Executive Overview funciona con el mock.
- [x] KPIs se calculan desde el dataset.
- [x] Gráfico se monta desde los datos mock.
- [x] Existe botón para agregar información de prueba.
- [x] Existe botón para borrar información de prueba.
- [x] Borrar deja la aplicación en un estado vacío comprensible.
- [x] Agregar restaura el dataset sin recargar la página.
- [x] Los controles tienen feedback visual y accesibilidad básica.
- [x] No se utilizan APIs reales.
- [x] No se cargan archivos del usuario.

## Próximo paso recomendado
Antes de conectar APIs, incorporar en una fase posterior un **Test Data Lab** más completo: generar escenarios adicionales (Quick Win, Proteger, Content Gap, Sin stock, anomalías, datos incompletos) y ejecutar un diagnóstico de todas las reglas. Después de ese gate conviene implementar el importador de archivos y, posteriormente, las APIs.
