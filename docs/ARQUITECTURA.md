# Arquitectura

Interfaz HTML/CSS/JavaScript sin compilación. `app.js` filtra fechas en Europe/Madrid y calcula la clasificación. El selector de días se reconstruye cada minuto para retirar fechas pasadas, incluso si la consulta de red falla.

`update_data.py` descarga los dos endpoints oficiales, exige 20 equipos y 380 identificadores de partido únicos y escribe `premier.json` mediante reemplazo atómico. No sobrescribe la copia al fallar. `confirmed_schedule.json` es un recurso funcional de verificación de horarios, necesario en ejecución.

`server.py` sirve solo una lista explícita de recursos públicos. `/api/premier` actualiza con un bloqueo compartido y límite de 60 segundos. Si la fuente falla devuelve 503; el cliente conserva datos anteriores con un aviso. La copia estática solo se usa cuando el endpoint responde 404 y se identifica como tal.

Estados: `scheduled`, `live`, `provisional` y `finished`, derivados de las banderas de FPL. La clasificación utiliza exclusivamente `finished`, sin sanciones. Los datos no representan una tabla oficial descargada. La identidad original de jornadas aplazadas queda pendiente de una fuente completa adicional; las 6–9 están contrastadas.

## Publicación 0.2.0

El workflow publish.yml ejecuta pruebas, consulta FPL y la tabla oficial, guarda el JSON y despliega únicamente siete archivos públicos. Instrucciones, memoria, Python y configuración Git no se empaquetan.

En GitHub Pages el cliente utiliza premier.json y consulta el scoreboard diario de ESPN cada 60 segundos. Conciliación por equipos y fecha Madrid, sin cambiar fechas confirmadas ni jornadas y sin sobrescribir finales oficiales; finales de ESPN siguen provisionales. Cada refresco parte de una copia oficial nueva. Si falla el directo, aparece aviso explícito. La tabla oficial se obtiene del endpoint v5 de la web de Premier para competencia 8 y temporada 2026, conservando posiciones y puntos de origen. Su fecha es independiente de la del calendario.

Service worker app-premier-0.2.0, red prioritaria para interfaz, sin interceptar datos ni fuentes externas.
