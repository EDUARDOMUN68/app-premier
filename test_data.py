import json
import unittest
from unittest.mock import patch
from update_data import ROOT, normalize, table_baseline, confirm_table_results

class DataTests(unittest.TestCase):
    def setUp(self):
        self.data = json.loads((ROOT / 'premier.json').read_text(encoding='utf-8'))
        self.bootstrap = {'teams':[{'id':t['id'],'name':t['name'],'short_name':t['short']} for t in self.data['teams']], 'events':[]}
        self.fixtures = [{'id':f['id'],'event':f['round'],'team_h':f['home'],'team_a':f['away'],
                          'kickoff_time':f['kickoff'],'provisional_start_time':False} for f in self.data['fixtures']]

    def test_incomplete_catalog_rejected(self):
        with self.assertRaises(ValueError):
            normalize(self.bootstrap, self.fixtures[:-1])

    def test_confirmation_requires_matching_official_timestamp(self):
        data = normalize(self.bootstrap, self.fixtures)
        verified = next(f for f in data['fixtures'] if f['confirmed'])
        source = next(f for f in self.fixtures if f['id']==verified['id'])
        source['kickoff_time']='2026-10-12T21:00:00Z'
        revised = normalize(self.bootstrap, self.fixtures)
        self.assertFalse(next(f for f in revised['fixtures'] if f['id']==verified['id'])['confirmed'])

    def test_calendar_default_is_not_confirmation(self):
        data = normalize(self.bootstrap, self.fixtures)
        self.assertFalse(next(f for f in data['fixtures'] if f['round']==38)['confirmed'])

    def test_original_round_survives_fantasy_reassignment(self):
        self.fixtures[0]['event']=20
        data = normalize(self.bootstrap, self.fixtures, self.data)
        self.assertEqual(data['fixtures'][0]['round'],self.data['fixtures'][0]['round'])
        self.assertEqual(data['fixtures'][0]['fantasyRound'],20)

    def test_table_baseline_requires_exact_statistics(self):
        data = {'teams':[{'id':1,'name':'Liverpool'},{'id':2,'name':'Man City'}],
                'fixtures':[{'id':12,'home':1,'away':2,'kickoff':'2026-10-11T15:30:00Z',
                             'status':'provisional','homeScore':1,'awayScore':0}]}
        table = {'rows':[dict(name='Liverpool',p=1,w=1,d=0,l=0,gf=1,ga=0,pts=1),
                         dict(name='Manchester City',p=1,w=0,d=0,l=1,gf=0,ga=1,pts=0)]}
        self.assertEqual(table_baseline(table,data),{'12':[1,0]})
        table['rows'][0]['gf']=2
        self.assertIsNone(table_baseline(table,data))

    def test_final_confirmed_only_with_matching_official_baseline(self):
        fixture = dict(id=1,status='provisional',homeScore=2,awayScore=1)
        data = dict(fixtures=[fixture],table=dict(baseline={'1':[2,1]}))
        confirm_table_results(data)
        self.assertEqual(fixture['status'],'finished')
        for status,baseline in [('live',{'1':[2,1]}),('provisional',None),('provisional',{'1':[1,1]}),('provisional',{})]:
            fixture['status']=status;data['table']['baseline']=baseline
            confirm_table_results(data)
            self.assertEqual(fixture['status'],status)

if __name__=='__main__':
    unittest.main()
