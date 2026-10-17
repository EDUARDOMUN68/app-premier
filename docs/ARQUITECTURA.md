# Arquitectura

Interfaz HTML/CSS/JavaScript sin compilación. `app.js` filtra fechas en Europe/Madrid y calcula la clasificación. El selector de días se reconstruye cada minuto para retirar fechas pasadas, incluso si la consulta de red falla.

`update_data.py` descarga los dos endpoints oficiales, exige 20 equipos y 380 identificadores de partido únicos y escribe `premier.json` mediante reemplazo atómico. No sobrescribe la copia al fallar. `confirmed_schedule.json` es un recurso funcional de verificación de horarios, necesario en ejecución.

`server.py` sirve solo una lista explícita de recursos públicos. `/api/premier` actualiza con un bloqueo compartido y límite de 60 segundos. Si la fuente falla devuelve 503; el cliente conserva datos anteriores con un aviso. La copia estática solo se usa cuando el endpoint responde 404 y se identifica como tal.

Estados: `scheduled`, `live`, `provisional` y `finished`, derivados de las banderas de FPL. La clasificación utiliza exclusivamente `finished`, sin sanciones. Los datos no representan una tabla oficial descargada. La identidad original de jornadas aplazadas queda pendiente de una fuente completa adicional; las 6–9 están contrastadas.

## Publicación 0.2.0

El workflow publish.yml ejecuta pruebas, consulta FPL y la tabla oficial, guarda el JSON y despliega únicamente siete archivos públicos. Instrucciones, memoria, Python y configuración Git no se empaquetan.

En GitHub Pages el cliente utiliza premier.json y consulta el scoreboard diario de ESPN cada 60 segundos. Conciliación por equipos y fecha Madrid, sin cambiar fechas confirmadas ni jornadas y sin sobrescribir finales oficiales; finales de ESPN siguen provisionales. Cada refresco parte de una copia oficial nueva. Si falla el directo, aparece aviso explícito. La tabla oficial se obtiene del endpoint v5 de la web de Premier para competencia 8 y temporada 2026, conservando posiciones y puntos de origen. Su fecha es independiente de la del calendario.

Service worker app-premier-0.2.0, red prioritaria para interfaz, sin interceptar datos ni fuentes externas.

## Versión 0.3.0

Diseño rojo y blanco con filas de partidos y navegación inferior en móvil. table_baseline concilia las estadísticas oficiales con los encuentros finalizados de FPL y registra marcadores incluidos. projectedTable aplica deltas de marcador sobre esa base, mantiene sanciones y recalcula posiciones provisionalmente. No muta las filas originales; cada consulta parte del JSON. ESPN se consulta en local y en publicación cada minuto. Si la base no cuadra se desactiva proyección y se identifica el límite.

## Versión 0.3.1

HTML referencia CSS, JS, león y manifest por URL versionada; el manifest versiona ambos PNG sin cambiar id/scope. El service worker renueva recursos desde red sin caché HTTP y mantiene respaldo sin conexión. Su actualización omite caché de scripts; controllerchange recarga una sola vez si ya había controlador al abrir la página. La primera instalación no provoca recarga.

0.3.2: mergeLive prioriza STATUS_HALFTIME sobre displayClock; las filas muestran HT sin apóstrofo.

0.3.3: tableBadge encuentra encuentros vivos por ID de equipo, muestra marcador en orden local–visitante y puntos de cada equipo. qualificationZone usa distribución base con 6/7 condicionales explícitos. Referencia: https://www.premierleague.com/en/european-qualification-explained.

0.3.4: visibilitychange visible, focus y pageshow disparan refresh con ventana de 1 segundo. Si busy, resumePending garantiza una consulta posterior. confirm_table_results solo se ejecuta tras official_table correcto; promueve provisional si ID y marcador coinciden con baseline exacta. No confirma por antigüedad ni con tabla de respaldo.

## Detalle 0.4.0

match-detail.js/css adaptados del detalle de Madridista a eng.1. El cliente resuelve el evento por fecha Madrid y ambos equipos en el scoreboard y valida equipos del summary. No escribe datos oficiales ni notificaciones. Modal con pestañas y teclado, aborta al cerrar/cambiar, ignora respuestas tardías y pausa oculto. Publicación y servidor incluyen explícitamente ambos recursos.
