import json
import unittest
from unittest.mock import patch
from update_data import ROOT, normalize

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

if __name__=='__main__':
    unittest.main()
