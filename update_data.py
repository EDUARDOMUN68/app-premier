"""Datos oficiales de FPL, sin credenciales ni dependencias externas."""
import json
import os
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
API = 'https://fantasy.premierleague.com/api/'
TABLE_API = 'https://sdp-prem-prod.premier-league-prod.pulselive.com/api/v5/competitions/8/seasons/2026/standings'

def official_table():
    with urllib.request.urlopen(TABLE_API, timeout=30) as response:
        payload = json.load(response)
    entries = payload['tables'][0]['entries']
    if len(entries) != 20 or len({e['team']['id'] for e in entries}) != 20:
        raise ValueError('Clasificación oficial incompleta')
    rows = []
    for entry in entries:
        stats = entry['overall']
        rows.append(dict(name=entry['team']['name'], position=stats['position'], p=stats['played'],
                         w=stats['won'], d=stats['drawn'], l=stats['lost'], gf=stats['goalsFor'],
                         ga=stats['goalsAgainst'], pts=stats['points']))
    return dict(rows=sorted(rows, key=lambda r:r['position']), source=TABLE_API,
                updatedAt=datetime.now(timezone.utc).isoformat())

def fetch(path):
    request = urllib.request.Request(API + path, headers={'User-Agent': 'AppPremier/0.1'})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)

def normalize(bootstrap, fixtures, previous=None):
    teams = bootstrap['teams']
    if len(teams) != 20 or len(fixtures) != 380:
        raise ValueError('Catálogo incompleto: se conserva la copia anterior')
    ids = {t['id'] for t in teams}
    if len({f['id'] for f in fixtures}) != 380:
        raise ValueError('Partidos duplicados')
    old = {f['id']: f for f in (previous or {}).get('fixtures', [])}
    confirmation = json.loads((ROOT / 'confirmed_schedule.json').read_text(encoding='utf-8'))
    verified = {f['id']: f for f in confirmation['fixtures']}
    matches = []
    for f in fixtures:
        if f['team_h'] not in ids or f['team_a'] not in ids:
            raise ValueError('Equipo desconocido')
        kickoff = f.get('kickoff_time')
        if kickoff:
            datetime.fromisoformat(kickoff.replace('Z', '+00:00'))
        status = ('finished' if f.get('finished') else 'provisional' if f.get('finished_provisional')
                  else 'live' if f.get('started') else 'scheduled')
        # No perder la jornada ya registrada si FPL mueve un aplazado de gameweek.
        entry = verified.get(f['id'], {})
        round_number = entry.get('round') or old.get(f['id'], {}).get('round') or f.get('event')
        matches_confirmation = all(entry.get(key) == value for key, value in
                                   [('kickoff', kickoff), ('home', f['team_h']), ('away', f['team_a'])])
        matches.append(dict(id=f['id'], round=round_number, fantasyRound=f.get('event'),
                            home=f['team_h'], away=f['team_a'], kickoff=kickoff,
                            confirmed=bool(kickoff) and f.get('provisional_start_time') is False and matches_confirmation,
                            status=status, minutes=f.get('minutes', 0),
                            homeScore=f.get('team_h_score'), awayScore=f.get('team_a_score')))
    return dict(version='0.2.0', updatedAt=datetime.now(timezone.utc).isoformat(),
                source=API, confirmationSource=confirmation['source'], teams=[dict(id=t['id'], name=t['name'], short=t['short_name']) for t in teams],
                fixtures=matches, currentRound=next((e['id'] for e in bootstrap['events'] if e.get('is_current')), 1))

def update():
    path = ROOT / 'premier.json'
    previous = json.loads(path.read_text(encoding='utf-8')) if path.exists() else None
    result = normalize(fetch('bootstrap-static/'), fetch('fixtures/'), previous)
    try:
        result['table'] = official_table()
    except Exception:
        if previous and previous.get('table'):
            result['table'] = previous['table']
    temporary = path.with_suffix('.json.tmp')
    temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    os.replace(temporary, path)
    return result

if __name__ == '__main__':
    data = update()
    print(f"Actualizados {len(data['fixtures'])} partidos y {len(data['teams'])} equipos")
