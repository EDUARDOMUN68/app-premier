const assert=require('node:assert/strict');
const {madridDay,eligibleDays,standings,mergeLive,projectedTable}=require('./app.js');
assert.equal(madridDay('2026-10-10T22:30:00Z'),'2026-10-11');
assert.equal(madridDay('2026-10-25T23:30:00Z'),'2026-10-26');
const fixtures=[
 {confirmed:true,kickoff:'2026-10-10T14:00:00Z'},
 {confirmed:true,kickoff:'2026-10-11T13:00:00Z'},
 {confirmed:true,kickoff:'2026-10-11T15:30:00Z'},
 {confirmed:false,kickoff:'2026-10-12T19:00:00Z'},
 {confirmed:true,kickoff:'2026-10-14T19:00:00Z'},
 {confirmed:true,kickoff:null}];
assert.deepEqual(eligibleDays({fixtures},'2026-10-11'),['2026-10-11','2026-10-14']);
assert.deepEqual(eligibleDays({fixtures},'2026-10-12'),['2026-10-14']);
const rows=standings({teams:[{id:1,name:'A'},{id:2,name:'B'}],fixtures:[
 {home:1,away:2,status:'finished',homeScore:2,awayScore:0},
 {home:1,away:2,status:'live',homeScore:0,awayScore:5},
 {home:1,away:2,status:'provisional',homeScore:0,awayScore:5}]});
assert.equal(rows[0].pts,3);assert.equal(rows[0].p,1);assert.equal(rows[1].pts,0);
console.log('Correcto: días confirmados, cambio de día en Madrid y clasificación sin resultados provisionales.');
const liveData={teams:[{id:1,name:'Liverpool'},{id:2,name:'Man City'}],fixtures:[{id:10,home:1,away:2,kickoff:'2026-10-11T15:30:00Z',round:6,confirmed:true,status:'scheduled'}]};
const event={date:'2026-10-11T15:30:00Z',competitions:[{status:{displayClock:"45'",type:{state:'in'}},competitors:[{homeAway:'home',team:{displayName:'Liverpool'},score:'1'},{homeAway:'away',team:{displayName:'Manchester City'},score:'0'}]}]};
assert.equal(mergeLive(liveData,[event]),1);
assert.equal(liveData.fixtures[0].status,'live');assert.equal(liveData.fixtures[0].homeScore,1);assert.equal(liveData.fixtures[0].round,6);
liveData.fixtures[0].status='finished';assert.equal(mergeLive(liveData,[event]),0);
event.date='2026-10-12T15:30:00Z';liveData.fixtures[0].status='scheduled';assert.equal(mergeLive(liveData,[event]),0);
console.log('Correcto: directo por equipos/fecha, sin sobrescribir finales oficiales ni cambiar jornada.');
const base={teams:[{id:1,name:'Liverpool'},{id:2,name:'Man City'}],table:{rows:[{name:'Liverpool',position:1,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:-2},{name:'Manchester City',position:2,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0}],baseline:{}},fixtures:[{id:12,home:1,away:2,status:'live',homeScore:1,awayScore:0}]};
let v=projectedTable(base);assert.equal(v.changed,1);assert.equal(v.rows[0].pts,1);assert.equal(v.rows[0].p,1);assert.equal(base.table.rows[0].p,0);
base.table.rows=v.rows;base.table.baseline={'12':[1,0]};v=projectedTable(base);assert.equal(v.changed,0);assert.equal(v.rows[0].p,1);
base.fixtures[0].homeScore=0;base.fixtures[0].awayScore=1;v=projectedTable(base);assert.equal(v.rows[0].name,'Manchester City');assert.equal(v.rows[0].pts,3);assert.equal(v.rows[0].p,1);assert.equal(v.rows[1].pts,-2);
base.table.baseline=null;assert.equal(projectedTable(base).unavailable,true);
console.log('Correcto: tabla provisional sin duplicados, corrección de marcador y sanciones preservadas.');

// El descanso conserva el marcador y muestra HT; segunda parte recupera el minuto.
const breakData={teams:[{id:1,name:'Liverpool'},{id:2,name:'Man City'}],fixtures:[{home:1,away:2,kickoff:'2026-10-11T15:30:00Z',status:'scheduled'}]};
const breakEvent={date:'2026-10-11T15:30:00Z',competitions:[{status:{displayClock:"45'+1'",type:{state:'in',name:'STATUS_HALFTIME'}},competitors:[{homeAway:'home',team:{displayName:'Liverpool'},score:'0'},{homeAway:'away',team:{displayName:'Manchester City'},score:'0'}]}]};
assert.equal(mergeLive(breakData,[breakEvent]),1);assert.equal(breakData.fixtures[0].minutes,'HT');assert.equal(breakData.fixtures[0].homeScore,0);
breakEvent.competitions[0].status={displayClock:"46'",type:{state:'in',name:'STATUS_IN_PROGRESS'}};
mergeLive(breakData,[breakEvent]);assert.equal(breakData.fixtures[0].minutes,'46');
console.log('Correcto: HT en descanso y minuto al reanudar.');
