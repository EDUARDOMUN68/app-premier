'use strict';
const state = {data:null, tab:'day', selected:'', busy:false, published:false};
const $ = id => document.getElementById(id);
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function madridDay(value = new Date()) {return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));}
function dayLabel(day) {return new Intl.DateTimeFormat('es-ES',{timeZone:'Europe/Madrid',weekday:'long',day:'numeric',month:'short'}).format(new Date(day+'T12:00:00Z'));}
function eligibleDays(data, today=madridDay()) {return [...new Set(data.fixtures.filter(f=>f.confirmed && f.kickoff && madridDay(f.kickoff)>=today).map(f=>madridDay(f.kickoff)))].sort();}
function standings(data) {
 const rows = new Map(data.teams.map(t=>[t.id,{...t,p:0,w:0,d:0,l:0,gf:0,ga:0,pts:0}]));
 for(const f of data.fixtures) {
  if(f.status!=='finished'||!Number.isInteger(f.homeScore)||!Number.isInteger(f.awayScore)) continue;
  const h=rows.get(f.home),a=rows.get(f.away);h.p++;a.p++;h.gf+=f.homeScore;h.ga+=f.awayScore;a.gf+=f.awayScore;a.ga+=f.homeScore;
  if(f.homeScore===f.awayScore){h.d++;a.d++;h.pts++;a.pts++;} else {const win=f.homeScore>f.awayScore?h:a,lose=win===h?a:h;win.w++;win.pts+=3;lose.l++;}
 }
 return [...rows.values()].sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf||a.name.localeCompare(b.name));
}
function projectedTable(data) {
 const table=data.table;
 if(!table?.rows?.length)return {rows:standings(data).map((r,i)=>({...r,position:i+1})),mode:'fallback',changed:0};
 const rows=table.rows.map(r=>({...r,basePosition:r.position}));
 if(!table.baseline)return {rows,mode:'official',changed:0,unavailable:true};
 const byKey=new Map(rows.map(r=>[teamKey(r.name),r]));
 const byId=new Map(data.teams.map(t=>[t.id,byKey.get(teamKey(t.name))]));
 let changed=0;
 function apply(f,hs,as,sign){
  for(const [r,gf,ga] of [[byId.get(f.home),hs,as],[byId.get(f.away),as,hs]]){
   r.p+=sign;r.gf+=sign*gf;r.ga+=sign*ga;
   if(gf>ga){r.w+=sign;r.pts+=3*sign;}else if(gf<ga)r.l+=sign;else{r.d+=sign;r.pts+=sign;}
  }
 }
 for(const f of data.fixtures){
  if(!['live','provisional','finished'].includes(f.status)||!Number.isInteger(f.homeScore)||!Number.isInteger(f.awayScore))continue;
  if(!byId.get(f.home)||!byId.get(f.away))continue;
  const old=table.baseline[String(f.id)];
  if(old&&old[0]===f.homeScore&&old[1]===f.awayScore)continue;
  if(old)apply(f,old[0],old[1],-1);
  apply(f,f.homeScore,f.awayScore,1);changed++;
  for(const id of [f.home,f.away]){const r=byId.get(id);r.provisional=true;r.live=f.status==='live';r.score=f.homeScore+'–'+f.awayScore;}
 }
 if(changed)rows.sort((a,b)=>b.pts-a.pts||(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf||a.basePosition-b.basePosition);
 rows.forEach((r,i)=>r.position=i+1);
 return {rows,changed,mode:changed?'provisional':'official'};
}
function matchHTML(f) {
 const teams=new Map(state.data.teams.map(t=>[t.id,t.name]));
 const time=f.confirmed&&f.kickoff?new Intl.DateTimeFormat('es-ES',{timeZone:'Europe/Madrid',hour:'2-digit',minute:'2-digit'}).format(new Date(f.kickoff)):'Por confirmar';
 const scored=['finished','live','provisional'].includes(f.status)&&Number.isInteger(f.homeScore)&&Number.isInteger(f.awayScore);
 const status={finished:'Finalizado',live:'🔴 '+(f.minutes==='HT'?'HT':f.minutes+'′'),provisional:'Final provisional',scheduled:f.confirmed?'Programado':'Fecha pendiente'}[f.status];
 const date=f.confirmed&&f.kickoff?dayLabel(madridDay(f.kickoff)):'Sin fecha confirmada';
 return `<article class="match ${f.status==='live'?'playing':''}"><div class="match-date"><b>${escapeHTML(date)}</b><span>${escapeHTML(time)}</span><small>Jornada ${escapeHTML(f.round??'pendiente')}</small></div><div class="match-teams"><div><small>L</small><b>${escapeHTML(teams.get(f.home))}</b></div><div><small>V</small><b>${escapeHTML(teams.get(f.away))}</b></div></div><div class="match-score"><strong>${scored?f.homeScore+'–'+f.awayScore:escapeHTML(time)}</strong><span class="${f.status==='live'?'live':''}">${escapeHTML(status)}</span></div></article>`;
}
function render() {
 if(!state.data)return;
 document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===state.tab);b.setAttribute('aria-pressed',String(b.dataset.tab===state.tab));});
 $('filter-label').hidden=state.tab==='table';$('day-strip').hidden=state.tab!=='day';
 $('filter-name').textContent=state.tab==='round'?'Jornada':'Fecha';
 $('title').textContent={day:'Por día',round:'Jornada',table:'Clasificación'}[state.tab];
 $('subtitle').textContent={day:'AGENDA CONFIRMADA',round:'TODA LA COMPETICIÓN',table:'LA CARRERA POR LA LIGA'}[state.tab];
 if(state.tab==='table') {
  const view=projectedTable(state.data),official=state.data.table?.rows?.length===20;
  $('explanation').textContent=view.mode==='provisional'?'🔴 Clasificación provisional con los marcadores actuales. Los equipos afectados están señalados. El orden en empates puede variar al aplicar todos los criterios oficiales.':official?'Clasificación oficial · '+new Date(state.data.table.updatedAt).toLocaleString('es-ES',{timeZone:'Europe/Madrid'})+(view.unavailable?' · Conciliación de directo pendiente de verificar.':''):'Clasificación calculada de respaldo';
  $('results').innerHTML=`<div class="table-legend"><span class="champion">🏆 Zona alta</span><span class="drop">Descenso</span><span>🔴 En juego · ★ Provisional</span></div><div class="table-wrap"><table><thead><tr>${['Pos','Equipo','Pts','PJ','G','E','P','GF','GC','DG'].map(x=>'<th scope="col">'+x+'</th>').join('')}</tr></thead><tbody>${view.rows.map(t=>`<tr class="${t.position<=4?'top-zone':t.position>=18?'drop-zone':''} ${t.provisional?'provisional-row':''}"><td>${t.position}</td><td><b>${escapeHTML(t.name)}</b>${t.provisional?'<small class="team-live">'+(t.live?'🔴 En juego':'★ Provisional')+' · '+escapeHTML(t.score)+'</small>':''}</td>${[t.pts,t.p,t.w,t.d,t.l,t.gf,t.ga,t.gf-t.ga].map(x=>'<td>'+escapeHTML(x)+'</td>').join('')}</tr>`).join('')}</tbody></table></div>`;return;
 }
 let matches;
 if(state.tab==='day') {
  const days=eligibleDays(state.data);if(!days.includes(state.selected))state.selected=days[0]||'';
  $('filter').innerHTML=days.map(d=>`<option value="${d}">${escapeHTML(dayLabel(d))}${d===madridDay()?' · Hoy':''}</option>`).join('');
  $('day-strip').innerHTML=days.slice(0,10).map(d=>`<button data-day="${d}" class="${d===state.selected?'active':''}" aria-pressed="${d===state.selected}">${escapeHTML(d===madridDay()?'Hoy':dayLabel(d))}</button>`).join('');
  $('explanation').textContent='Solo días desde hoy con horarios confirmados por la fuente oficial. Las fechas pasadas desaparecen automáticamente.';
  matches=state.data.fixtures.filter(f=>f.confirmed&&f.kickoff&&madridDay(f.kickoff)===state.selected);
 } else {
  const rounds=[...new Set(state.data.fixtures.map(f=>f.round).filter(Boolean))].sort((a,b)=>a-b);
  if(!rounds.includes(Number(state.selected)))state.selected=String(state.data.currentRound);
  $('filter').innerHTML=rounds.map(r=>`<option value="${r}">Jornada ${r}</option>`).join('');
  $('explanation').textContent='Resultados y calendario de la jornada. Los horarios provisionales permanecen pendientes de confirmación.';
  matches=state.data.fixtures.filter(f=>String(f.round)===state.selected);
 }
 $('filter').value=state.selected;
 matches.sort((a,b)=>(a.kickoff||'9999').localeCompare(b.kickoff||'9999'));
 $('results').innerHTML=matches.map(matchHTML).join('')||'<div class="empty">No hay partidos con fecha confirmada en los próximos días.<br>Consulta «Jornada» para ver el calendario pendiente.</div>';
}
function teamKey(name) {
 const aliases={'manchester city':'man city','manchester united':'man utd','tottenham hotspur':'spurs','tottenham':'spurs','nottingham forest':"nott'm forest",'brighton & hove albion':'brighton','brighton and hove albion':'brighton','leeds united':'leeds','newcastle united':'newcastle','afc bournemouth':'bournemouth','ipswich':'ipswich town'};
 const key=String(name).toLowerCase();return aliases[key]||key;
}
function mergeLive(data,events) {
 const teams=new Map(data.teams.map(t=>[teamKey(t.name),t.id]));
 let updated=0;
 for(const event of events){
  const c=event.competitions?.[0];if(!c)continue;
  const h=c.competitors?.find(t=>t.homeAway==='home'),a=c.competitors?.find(t=>t.homeAway==='away');
  if(!h||!a)continue;
  const home=teams.get(teamKey(h.team.displayName)),away=teams.get(teamKey(a.team.displayName));
  if(!home||!away)continue;
  const candidates=data.fixtures.filter(f=>f.home===home&&f.away===away&&f.kickoff&&madridDay(f.kickoff)===madridDay(event.date));
  if(candidates.length!==1)continue;
  const f=candidates[0],status=c.status||event.status,type=status?.type;
  if(!type||!['in','post'].includes(type.state))continue;
  const hs=Number(h.score),as=Number(a.score);
  if(!Number.isInteger(hs)||!Number.isInteger(as)||hs<0||as<0)continue;
  if(f.status==='finished')continue;
  f.homeScore=hs;f.awayScore=as;f.status=type.state==='post'?'provisional':'live';f.minutes=type.name==='STATUS_HALFTIME'?'HT':String(status.displayClock||status.clock||0).replace(/['′]/g,'');updated++;
 }
 return updated;
}
async function refreshLive() {
 const day=madridDay().replaceAll('-','');
 const response=await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard?dates=${day}`,{cache:'no-store',signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error('Directo no disponible');
 const payload=await response.json();if(!Array.isArray(payload.events))throw new Error('Directo inválido');
 mergeLive(state.data,payload.events);
 return new Date().toLocaleTimeString('es-ES',{timeZone:'Europe/Madrid'});
}
async function refresh() {
 if(state.busy)return;state.busy=true;$('refresh').disabled=true;
 try {
  let response=await fetch(state.published?'premier.json':'/api/premier',{cache:'no-store',signal:AbortSignal.timeout(45000)});
  let snapshot=false;
  if(response.status===404){state.published=true;response=await fetch('premier.json',{cache:'no-store',signal:AbortSignal.timeout(15000)});}
  snapshot=state.published;
  if(!response.ok)throw new Error('Fuente no disponible');
  const data=await response.json();if(!Array.isArray(data.fixtures)||data.teams?.length!==20)throw new Error('Datos inválidos');
  state.data=data;
  const stale=Date.now()-new Date(data.updatedAt)>180000;
  let live='';
  try{live=' · Directo ESPN comprobado '+await refreshLive();}catch(error){live=' · Directo no disponible; marcadores guardados';}
  $('connection').textContent=`${snapshot?'Datos oficiales publicados':stale?'Datos antiguos':'Fuente oficial conectada'} · ${new Date(data.updatedAt).toLocaleString('es-ES',{timeZone:'Europe/Madrid'})}${live}`;
  render();
 }catch(error){$('connection').textContent='Sin conexión con la fuente · '+(state.data?'se conserva la última consulta; el directo puede estar desactualizado.':'no hay datos disponibles.');if(!state.data)$('results').innerHTML='<div class="empty">No se pudo cargar el calendario. Pulsa Actualizar para reintentar.</div>';}
 finally{state.busy=false;$('refresh').disabled=false;}
}
if(typeof document!=='undefined') {
 let installPrompt=null;
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;$('install').hidden=false;});
 window.addEventListener('appinstalled',()=>{installPrompt=null;$('install').hidden=true;});
 $('install').addEventListener('click',async()=>{if(!installPrompt)return;await installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$('install').hidden=true;});

 document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{state.tab=b.dataset.tab;state.selected='';render();}));
 $('filter').addEventListener('change',e=>{state.selected=e.target.value;render();});
 $('day-strip').addEventListener('click',e=>{const b=e.target.closest('[data-day]');if(b){state.selected=b.dataset.day;render();}});
 $('refresh').addEventListener('click',refresh);refresh();setInterval(()=>{render();refresh();},60000);
 if('serviceWorker' in navigator) {
  const hadController=Boolean(navigator.serviceWorker.controller);
  let reloading=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
   if(hadController&&!reloading){reloading=true;location.reload();}
  });
  navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(registration=>registration.update()).catch(()=>{});
 }
}
if(typeof module!=='undefined')module.exports={madridDay,eligibleDays,standings,mergeLive,projectedTable};
