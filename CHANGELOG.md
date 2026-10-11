# Historial

## 0.1.0 — 2026-10-11

- Primera versión local con Jornada, Clasificación y Por día.
- Fuente oficial FPL, actualización cada minuto mediante servidor local y horarios de Madrid.
- Verificación adicional de horarios de jornadas 6–9; exclusión de fechas provisionales y pasadas en Por día.
- Clasificación calculada con finales confirmados, avisos de conexión y diseño adaptable.
- Sin publicación remota; ampliación de horarios verificados y jornadas aplazadas pendientes.

### Ajuste visual

- Retirado el eslogan principal y sustituida la marca PL por el león de la Premier League.

- Tema claro con tarjetas blancas, textos oscuros y acentos morados para facilitar la lectura.

## 0.2.0 — 2026-10-11

- Clasificación oficial de la Premier con fecha propia y respaldo identificado.
- Directo ESPN desde el navegador cada minuto para alojamiento estático.
- Workflow de actualización horaria y publicación GitHub Pages con lista explícita de archivos públicos.
- Service worker con red prioritaria; los datos no se sirven desde caché.

## 0.2.1 — 2026-10-11

- Iconos PNG 192 y 512 con margen de seguridad para instalación Android.
- Identidad y ámbito explícitos de APP PREMIER, nombre completo en instalador y nueva caché de interfaz.

## 0.3.0 — 2026-10-11

- Rediseño rojo y blanco con equipos y marcadores destacados, filas inspiradas en Madridista y navegación inferior móvil.
- Clasificación provisional con marcadores en directo, equipos señalados y zonas visuales.
- Base oficial conciliada para evitar duplicados y conservar sanciones; prueba real con Liverpool–Manchester City en juego.

## 0.3.1 — 2026-10-11

- Recursos visuales e iconos versionados para renovar las copias anteriores en móvil.
- Actualización del service worker sin caché HTTP y recarga automática cuando cambia el controlador de una app abierta.
- Se conserva la identidad de instalación; el icono del lanzador Android depende de la actualización de Chrome.

## 0.3.2 — 2026-10-11

- En el descanso se muestra HT, usando STATUS_HALFTIME de ESPN aunque el reloj siga en 45+1. Al reanudar vuelve el minuto.

## 0.3.3 — 2026-10-11

- Clasificación con paleta y símbolos de Madridista: zonas azul/dorado/violeta/rojo claro, insignias verde/amarillo/rojo y casa/avión.
- Minuto o HT, marcador y puntos del encuentro en cada equipo en juego, independientemente de la conciliación de la tabla.
- Plazas 6 y 7 identificadas con asterisco como posibles por copas, no confirmadas.
