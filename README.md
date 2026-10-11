# APP PREMIER

Versión 0.3.4. Aplicación en español de la Premier League, adaptada a móvil y escritorio.

- **Jornada:** calendario y resultados de las 38 jornadas.
- **Clasificación:** tabla descargada de la fuente oficial de la Premier League, con su fecha de consulta.
- **Por día:** selector de fechas desde hoy, solo con encuentros cuyo horario coincide con una programación revisada oficial verificada. Los días pasados desaparecen en la siguiente actualización (cada minuto).

## Ejecutar

Con Python 3.12 o posterior y acceso a Internet:

```sh
python update_data.py
python server.py
```

Abrir http://127.0.0.1:8012. El servidor consulta la fuente oficial cuando la app está abierta, como máximo una vez cada 60 segundos. La fuente puede tener retrasos; no se garantiza latencia de un minuto desde el estadio. Los finales provisionales se distinguen de los finalizados.

```sh
node test_app.js
python -m unittest -v
```

## Fuentes y límites

Calendario y resultados: [API oficial de Fantasy Premier League](https://fantasy.premierleague.com/api/fixtures/). Equipos: [FPL](https://fantasy.premierleague.com/api/bootstrap-static/).

La bandera de horario provisional de FPL no basta para acreditar la confirmación de toda la temporada. `confirmed_schedule.json` conserva la comprobación adicional del [programa revisado oficial de octubre y comienzo de noviembre](https://www.premierleague.com/en/news/4688862/fixture-amendments-for-premier-league-matches-in-october-and-november), jornadas 6–9, verificado el 11 de octubre de 2026. Cada entrada debe coincidir en equipos y hora UTC; un cambio deja de mostrarse en Por día hasta verificarlo. Ampliar ese fichero requiere contrastar nuevos anuncios oficiales. No se inventan fechas ni se extrapola una ventana de seis semanas.

Las jornadas sin contraste adicional usan la gameweek de FPL y quedan pendientes de contrastar con las jornadas de liga si hay aplazamientos. Se conserva la jornada registrada para evitar moverla al cambiar de gameweek.

## Publicación y directo

GitHub Pages sirve la app y un workflow actualiza las fuentes oficiales cada hora, al minuto 17 (la ejecución puede retrasarse). Mientras está abierta, la app consulta cada 60 segundos los marcadores del día en ESPN, como respaldo de directo. Estos marcadores se identifican como provisionales y no sobrescriben finales oficiales. El aviso muestra cuándo se consultó el directo o si está indisponible.

La clasificación se descarga del mismo endpoint público que utiliza la web oficial de la Premier; conserva el orden y los puntos de la fuente, incluidas las sanciones aplicadas por ella. Si no responde se conserva la última tabla con su propia fecha. Si nunca se obtuvo una tabla oficial, se identifica el cálculo de respaldo.

La aplicación incluye un service worker con red prioritaria para interfaz y sin caché de datos. La instalación y el comportamiento real en un móvil deben verificarse en el dispositivo.

Símbolo de la Premier League obtenido de su [recurso oficial](https://www.premierleague.com/resources/v1.54.15/i/svg-files/elements/pl-logo-dark.svg). La marca pertenece a la Premier League; esta aplicación es independiente.

Instalación Android: manifest con identidad y ámbito propios de esta app, apertura standalone e iconos PNG 192 y 512 con margen de seguridad para Android. Chrome puede tardar en actualizar su información; la instalación real se comprueba en el móvil.

## Clasificación provisional 0.3.0

La tabla oficial incluye una base de partidos que reproduce sus PJ, victorias, empates, derrotas y goles. Solo si esa conciliación es exacta se aplican las diferencias de marcadores a la tabla oficial, conservando sus puntos y posibles sanciones. Así no se duplica un resultado ya incluido. Los equipos afectados se marcan; ante empate el orden provisional por puntos, diferencia de goles y goles a favor puede variar respecto al desempate oficial. Si no se puede conciliar la base, se conserva la clasificación oficial con aviso.
