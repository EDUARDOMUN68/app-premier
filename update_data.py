"""Datos oficiales de FPL, sin credenciales ni dependencias externas."""
import json
import os
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
API = 'https://fantasy.premierleague.com/api/'
TABLE_API = 'https://sdp-prem-prod.premier-league-prod.pulselive.com/api/v5/competitions/8/seasons/2026/standings'

def team_key(name):
    aliases = {'manchester city':'man city','manchester united':'man utd','tottenham hotspur':'spurs',
               'nottingham forest':"nott'm forest",'brighton and hove albion':'brighton',
               'leeds united':'leeds','newcastle united':'newcastle','afc bournemouth':'bournemouth'}
    return aliases.get(name.lower(), name.lower())

def table_baseline(table, data):
    """Solo proyectar directo si los partidos reproducen las estadísticas oficiales."""
    by_name = {team_key(t['name']):t['id'] for t in data['teams']}
    rows = {by_name[team_key(r['name'])]:r for r in table['rows']}
    stats = {key:dict(p=0,w=0,d=0,l=0,gf=0,ga=0) for key in rows}
    baseline = {}
    for f in sorted(data['fixtures'], key=lambda f:f.get('kickoff') or '9999'):
        h,a = f['home'],f['away']
        hs,aws = f.get('homeScore'),f.get('awayScore')
        if f['status'] not in ['finished','provisional'] or not isinstance(hs,int) or not isinstance(aws,int):
            continue
        if stats[h]['p'] >= rows[h]['p'] or stats[a]['p'] >= rows[a]['p']:
            continue
        for key,gf,ga in [(h,hs,aws),(a,aws,hs)]:
            s=stats[key];s['p']+=1;s['gf']+=gf;s['ga']+=ga
            s['w' if gf>ga else 'l' if gf<ga else 'd']+=1
        baseline[str(f['id'])] = [hs,aws]
    if all(all(stats[key][field]==row[field] for field in stats[key]) for key,row in rows.items()):
        return baseline
    return None

def confirm_table_results(data):
    """Confirmar únicamente finales cuyo marcador está conciliado con la tabla oficial."""
    baseline = data.get('table', {}).get('baseline')
    if baseline is None:
        return
    for fixture in data['fixtures']:
        score = baseline.get(str(fixture['id']))
        if fixture['status'] == 'provisional' and score == [fixture['homeScore'], fixture['awayScore']]:
            fixture['status'] = 'finished'
            fixture['resultConfirmedBy'] = TABLE_API


def official_table(data):
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
    table = dict(rows=sorted(rows, key=lambda r:r['position']), source=TABLE_API,
                 updatedAt=datetime.now(timezone.utc).isoformat())
    table['baseline'] = table_baseline(table, data)
    return table

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
    return dict(version='0.4.0', updatedAt=datetime.now(timezone.utc).isoformat(),
                source=API, confirmationSource=confirmation['source'], teams=[dict(id=t['id'], name=t['name'], short=t['short_name']) for t in teams],
                fixtures=matches, currentRound=next((e['id'] for e in bootstrap['events'] if e.get('is_current')), 1))

def update():
    path = ROOT / 'premier.json'
    previous = json.loads(path.read_text(encoding='utf-8')) if path.exists() else None
    result = normalize(fetch('bootstrap-static/'), fetch('fixtures/'), previous)
    try:
        result['table'] = official_table(result)
        confirm_table_results(result)
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
