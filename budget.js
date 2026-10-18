/* Budget Logistik Stunden: nur für das freigegebene Konto sichtbar. Daten lokal (fwz-budget) und im eigenen Firestore-Dokument fwz_budget/<uid>. */
(function(){var s=document.createElement('style');s.textContent=".bud{--fg:var(--ink);--accent:var(--red);--on-accent:var(--red-ink);--warn:var(--red);--surface2:color-mix(in srgb,var(--surface) 82%,var(--ink));--display:var(--font-display);--body:var(--font-body);font:15px/1.4 var(--font-body);padding-bottom:150px;color:var(--ink)}\n#b-app{max-width:880px;margin:0 auto;display:flex;flex-direction:column;gap:16px}\n.bud h1,.bud h2,.bud h3{font-family:var(--display);font-weight:600;margin:0;text-wrap:balance}\n.bud h1{font-size:28px;letter-spacing:.01em}\n.bud h2{font-size:13px;text-transform:uppercase;letter-spacing:.09em;color:var(--muted);font-weight:600}\n.bud .num{font-family:var(--display);font-variant-numeric:tabular-nums;font-weight:600}\n.bud .muted{color:var(--muted)}\n.bud button,.bud input,.bud select,.bud textarea{font:inherit;color:inherit}\n.bud :focus-visible{outline:2px solid var(--accent);outline-offset:2px}\n.bud .btn{background:var(--surface2);border:1px solid var(--line);border-radius:8px;padding:9px 14px;min-height:42px;cursor:pointer;font-weight:500}\n.bud .btn:hover{border-color:var(--muted)}\n.bud .btn.primary{background:var(--accent);border-color:var(--accent);color:var(--on-accent);font-weight:600}\n.bud .btn.danger{color:var(--bad)}\n.bud .btn.sm{min-height:34px;padding:5px 10px;font-size:13px}\n.bud .row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}\n.bud .panel{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:12px;min-width:0}\n.bud header.bhead{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap}\n.bud header.bhead .sub{color:var(--muted);font-size:13px}\n.bud .kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}\n.bud .kpi{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:12px 14px;min-width:0}\n.bud .kpi .l{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}\n.bud .kpi .v{font-size:30px;line-height:1.1;margin-top:2px}\n.bud .kpi .s{font-size:13px;color:var(--muted)}\n.bud .acc{display:flex;flex-direction:column;gap:6px;padding:12px 0;border-top:1px solid var(--line)}\n.bud .acc:first-of-type{border-top:0;padding-top:0}\n.bud .acc .h{display:flex;justify-content:space-between;gap:12px;align-items:baseline}\n.bud .acc .name{font-weight:600;min-width:0}\n.bud .bar{height:10px;background:var(--surface2);border-radius:5px;overflow:hidden}\n.bud .bar>i{display:block;height:100%;border-radius:5px;background:var(--ok)}\n.bud .bar>i.warn{background:var(--warn)}\n.bud .bar>i.bad{background:var(--bad)}\n.bud .acc .m{display:flex;gap:6px 16px;flex-wrap:wrap;font-size:13px;color:var(--muted)}\n.bud .acc .m b{color:var(--fg);font-weight:600}\n.bud .pill{white-space:nowrap;flex:none;display:inline-block;border-radius:99px;padding:1px 9px;font-size:12px;font-weight:600;border:1px solid currentColor}\n.bud .pill.ok{color:var(--ok)}\n.bud .pill.warn{color:var(--warn)}\n.bud .pill.bad{color:var(--bad)}\n.bud .months{display:grid;grid-template-columns:repeat(12,1fr);gap:4px;align-items:end;height:130px}\n.bud .months .c{display:flex;flex-direction:column;justify-content:flex-end;align-items:center;height:100%;gap:3px;min-width:0}\n.bud .months .c i{display:block;width:100%;background:var(--accent);border-radius:3px 3px 0 0;min-height:2px}\n.bud .months .c.cur i{outline:2px solid var(--fg);outline-offset:1px}\n.bud .months .c span{font-size:11px;color:var(--muted)}\n.bud .months .c em{font-style:normal;font-size:11px;font-variant-numeric:tabular-nums}\n.bud .issue{display:flex;gap:10px;justify-content:space-between;align-items:center;padding:8px 0;border-top:1px solid var(--line);font-size:14px}\n.bud .issue:first-of-type{border-top:0}\n.bud .filters{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}\n.bud input,.bud select,.bud textarea{background:var(--surface2);border:1px solid var(--line);border-radius:8px;padding:9px 10px;min-height:42px;width:100%;min-width:0}\n.bud textarea{resize:vertical;min-height:110px}\n.bud label{font-size:12px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);display:flex;flex-direction:column;gap:4px}\n.bud .rep{border-top:1px solid var(--line);padding:12px 0;display:flex;flex-direction:column;gap:6px}\n.bud .rep:first-of-type{border-top:0}\n.bud .rep .t{display:flex;justify-content:space-between;gap:10px;align-items:baseline;flex-wrap:wrap}\n.bud .rep .who{font-weight:600}\n.bud .rep .txt{white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px;color:var(--fg);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;cursor:pointer}\n.bud .rep .txt.open{display:block}\n.bud .chip{display:inline-block;border-radius:6px;background:var(--surface2);border:1px solid var(--line);padding:1px 8px;font-size:12px;color:var(--muted)}\n.bud .rep .acts{display:flex;gap:6px;flex-wrap:wrap}\n.bud table{border-collapse:collapse;width:100%}\n.bud th,.bud td{text-align:left;padding:8px 6px;border-top:1px solid var(--line);font-variant-numeric:tabular-nums}\n.bud th{font-size:12px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);border-top:0;font-weight:600}\n.bud td.r,.bud th.r{text-align:right}\n.bud .scroll{overflow-x:auto}\n.bud .mini{height:6px;background:var(--surface2);border-radius:3px;min-width:60px}\n.bud .mini i{display:block;height:100%;background:var(--accent);border-radius:3px}\n.bud nav.tabs{position:fixed;left:0;right:0;bottom:0;background:var(--surface);border-top:1px solid var(--line);display:grid;grid-template-columns:repeat(4,1fr);\n  padding:0 max(0px,env(safe-area-inset-left,0px)) env(safe-area-inset-bottom,0px) max(0px,env(safe-area-inset-right,0px));z-index:20}\n.bud nav.tabs button{background:none;border:0;padding:14px 4px;min-height:52px;color:var(--muted);font-weight:600;font-size:14px;cursor:pointer;border-top:3px solid transparent}\n.bud nav.tabs button[aria-current=\"true\"]{color:var(--accent);border-top-color:var(--accent)}\n.bud .fabs{position:fixed;right:max(16px,env(safe-area-inset-right,0px));bottom:calc(64px + env(safe-area-inset-bottom,0px));z-index:21;display:flex;gap:10px}\n.bud .fab{box-shadow:0 6px 18px rgba(0,0,0,.35);min-height:50px;padding:0 20px;border-radius:26px;font-size:16px}\n.bud .scrim{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:40;display:flex;align-items:flex-end;justify-content:center}\n.bud .sheet{background:var(--surface);border:1px solid var(--line);border-radius:14px 14px 0 0;width:100%;max-width:560px;max-height:94%;overflow-y:auto;padding:16px 16px calc(16px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:12px}\n@media(min-width:620px){.bud .scrim{align-items:center}.bud .sheet{border-radius:14px}}\n.bud .grid3{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:8px}\n.bud .pchips{display:flex;flex-wrap:wrap;gap:6px}\n.bud .pchips button{background:var(--surface2);border:1px solid var(--line);border-radius:99px;padding:6px 12px;min-height:36px;cursor:pointer;font-size:14px}\n.bud .pchips button[aria-pressed=\"true\"]{background:var(--accent);border-color:var(--accent);color:var(--on-accent);font-weight:600}\n.bud .sugg{display:flex;flex-direction:column;gap:6px}\n.bud .sugg button{text-align:left;background:none;border:1px dashed var(--line);border-radius:8px;padding:6px 10px;color:var(--muted);cursor:pointer;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n.bud .sum{font-size:14px;color:var(--muted)}\n.bud .sum b{color:var(--fg)}\n.bud .toast{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(130px + env(safe-area-inset-bottom,0px));background:var(--fg);color:var(--bg);padding:10px 16px;border-radius:8px;z-index:60;font-weight:500;max-width:90%}\n.bud .edit-acc{display:grid;grid-template-columns:1fr 110px auto;gap:8px;align-items:end}\n@media(max-width:480px){.bud .edit-acc{grid-template-columns:1fr 100px}.bud .edit-acc .btn{grid-column:1/-1}}\n@media(prefers-reduced-motion:no-preference){.bud .bar>i{transition:width .4s}}";document.head.appendChild(s)})();
(function(){
'use strict';
var KEY='fwz-budget', PKEY='fwz-budget-prefs';
var MONTHS=['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
var DEFAULT_ACCOUNTS=[
 ['Einsatzbereitschaft Material | Geräte | Infrastruktur',8500],
 ['Einsatzbereitschaft Inventar',1400],
 ['Einsatzbereitschaft Fahrzeuge',2700],
 ['Einsatzbereitschaft Persönliche Ausrüstung',2000],
 ['Einsatzbereitschaft Atemschutz',2000],
 ['Fahrzeugreinigung Hauptübung',2200],
 ['Fahrzeugreinigung "durchs Jahr"',500]];
var mem={};

function lsGet(k){try{return localStorage.getItem(k)}catch(e){return mem[k]||null}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){mem[k]=v}}

var BS=load(), prefs=loadPrefs(), ui={tab:prefs.tab||'home',filter:{q:'',acc:'',person:'',month:''},pending:null,confirm:null,open:{}};
function load(){
  try{var s=JSON.parse(lsGet(KEY)||'null'); if(s&&s.entries){s.budgets=s.budgets||{};s.budgets[s.year]=s.accounts;return s}}catch(e){}
  var st={rate:26,year:2026,accounts:DEFAULT_ACCOUNTS.map(function(a){return {name:a[0],budget:a[1]}}),persons:[],entries:[]};
  return st;
}
function loadPrefs(){try{return JSON.parse(lsGet(PKEY)||'{}')||{}}catch(e){return {}}}
var syncT=null,syncMsg='';
function cloudOk(){try{return !!(FWZ&&FWZ.user)}catch(e){return false}}
function errMsg(e){return /permission|insufficient/i.test((e&&(e.code||e.message))||'')?'Cloud-Fehler: Firestore-Regeln für fwz_budget fehlen':'Cloud-Fehler: '+((e&&(e.code||e.message))||'unbekannt')}
function showSync(){var el=document.getElementById('b-sync');if(el)el.textContent=syncMsg}
function cloudPush(){if(!cloudOk())return Promise.resolve();return FWZ.pushBudget(BS).then(function(){syncMsg='Cloud: gespeichert '+new Date().toLocaleTimeString('de-CH',{hour:'2-digit',minute:'2-digit'})},function(e){syncMsg=errMsg(e)}).then(showSync)}
function schedulePush(){clearTimeout(syncT);if(!cloudOk())return;syncT=setTimeout(cloudPush,1200)}
function syncDown(){
  if(!cloudOk()){syncMsg='Nur auf diesem Gerät gespeichert (nicht angemeldet)';showSync();return}
  syncMsg='Cloud: prüfe …';showSync();
  FWZ.pullBudget().then(function(c){
    var cd=null;try{cd=c&&c.data?JSON.parse(c.data):null}catch(e){}
    if(cd&&cd.entries&&(cd.updatedAt||0)>(BS.updatedAt||0)){BS=cd;BS.budgets=BS.budgets||{};BS.budgets[BS.year]=BS.accounts;lsSet(KEY,JSON.stringify(BS));syncMsg='Cloud: Daten geladen';render();showSync()}
    else if(BS.entries.length||BS.updatedAt)return cloudPush();
    else{syncMsg='Cloud: verbunden, noch keine Daten';showSync()}
  }).catch(function(e){syncMsg=errMsg(e);showSync()});
}
function save(){BS.budgets=BS.budgets||{};BS.budgets[BS.year]=BS.accounts;BS.updatedAt=Date.now();lsSet(KEY,JSON.stringify(BS));schedulePush()}
function savePrefs(){lsSet(PKEY,JSON.stringify(prefs))}

/* ---------- Helfer ---------- */
function $(s,r){return (r||document).querySelector(s)}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function today(){return iso(new Date())}
function fmtDate(s){if(!s)return '–';var p=s.split('-');var d=new Date(+p[0],+p[1]-1,+p[2]);return ['So','Mo','Di','Mi','Do','Fr','Sa'][d.getDay()]+' '+p[2]+'.'+p[1]+'.'+p[0]}
function toMin(t){if(!t)return null;var p=t.split(':');return (+p[0])*60+(+p[1])}
function hoursOf(e){var a=toMin(e.start),b=toMin(e.end);if(a==null||b==null)return 0;var d=b-a;if(d<0)d+=1440;return d/60}
function amount(e){return hoursOf(e)*(e.rate==null?BS.rate:e.rate)}
function nf(n,d){return Number(n).toLocaleString('de-CH',{minimumFractionDigits:d,maximumFractionDigits:d})}
function chf(n){return 'CHF '+nf(n,2)}
function hh(n){return nf(n,2)+' h'}
function toast(m){var t=$('#b-toast');t.textContent=m;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(function(){t.hidden=true},2600)}
function baseYear(){var m=0;BS.entries.forEach(function(e){if(e.date){var y=+e.date.slice(0,4);if(!m||y<m)m=y}});return m||BS.year}
function yearOf(e){return e.date?+e.date.slice(0,4):baseYear()}
function yearEntries(){return BS.entries.filter(function(e){return yearOf(e)===BS.year})}
function defDate(){return new Date().getFullYear()===BS.year?today():BS.year+'-01-01'}
function years(){var s={},cy=new Date().getFullYear();s[cy]=1;s[BS.year]=1;Object.keys(BS.budgets||{}).forEach(function(k){s[k]=1});BS.entries.forEach(function(e){s[yearOf(e)]=1});
  var a=Object.keys(s).map(Number).sort();a.push(a[a.length-1]+1);return a}
function setYear(y){BS.budgets=BS.budgets||{};BS.budgets[BS.year]=BS.accounts;
  if(!BS.budgets[y])BS.budgets[y]=BS.accounts.map(function(a){return {name:a.name,budget:a.budget,forecast:a.forecast}});
  BS.accounts=BS.budgets[y];BS.year=y;ui.filter={q:'',acc:'',person:'',month:''};save();render();window.scrollTo(0,0)}
function yearSel(){return '<select id="y-sel" aria-label="Jahr" style="width:auto;min-height:36px;padding:4px 10px;font-weight:600">'+years().map(function(y){return '<option'+(y===BS.year?' selected':'')+'>'+y+'</option>'}).join('')+'</select>'}
function sortedEntries(){return BS.entries.slice().sort(function(a,b){return (b.date+b.start).localeCompare(a.date+a.start)})}

/* ---------- Auswertung ---------- */
function accountStats(){
  var by={};yearEntries().forEach(function(e){var k=e.account;by[k]=by[k]||{c:0,h:0,a:0};by[k].c++;by[k].h+=hoursOf(e);by[k].a+=amount(e)});
  var rows=BS.accounts.map(function(a,ix){var s=by[a.name]||{c:0,h:0,a:0};delete by[a.name];
    var diff=a.budget-s.a;return {name:a.name,budget:a.budget,spent:s.a,hours:s.h,diff:diff,pct:a.budget?s.a/a.budget:0,left:diff/BS.rate,count:s.c,fc:a.forecast===undefined?ix<4:!!a.forecast}});
  Object.keys(by).forEach(function(k){rows.push({name:k+' (nicht im Budget)',budget:0,spent:by[k].a,hours:by[k].h,diff:-by[k].a,pct:0,left:-by[k].a/BS.rate,count:by[k].c,orphan:true})});
  return rows;
}
function weeksLeft(){var end=new Date(BS.year,11,31),n=new Date();n=new Date(n.getFullYear(),n.getMonth(),n.getDate());return Math.max(0,Math.floor((end-n)/604800000))}
function issues(){
  var out=[],seen={},t=today();
  yearEntries().forEach(function(e){
    var p=[];
    if(!e.date)p.push('Datum fehlt');
    else{ if(+e.date.slice(0,4)!==BS.year)p.push('Datum nicht in '+BS.year); if(e.date>t)p.push('Datum liegt in der Zukunft')}
    if(!e.start||!e.end||toMin(e.start)===toMin(e.end))p.push('Zeit unklar');
    else if(hoursOf(e)>10)p.push('mehr als 10 Stunden');
    if(!e.person)p.push('Person fehlt');
    if(!BS.accounts.some(function(a){return a.name===e.account}))p.push('Konto unbekannt');
    var k=[e.date,e.start,e.end,e.person,e.account].join('|');
    if(seen[k])p.push('doppelt erfasst');seen[k]=1;
    if(p.length)out.push({e:e,p:p});
  });
  return out;
}

/* ---------- Ansichten ---------- */
var TABS=[['home','Übersicht'],['list','Rapporte'],['people','Personal'],['set','Einstellungen']];
function render(){
  var nav='';TABS.forEach(function(t){nav+='<button type="button" data-tab="'+t[0]+'"'+(ui.tab===t[0]?' aria-current="true"':'')+'>'+t[1]+'</button>'});
  $('#b-tabs').innerHTML=nav;
  var v={home:viewHome,list:viewList,people:viewPeople,set:viewSettings}[ui.tab]();
  var a=document.activeElement, id=a&&a.id, pos=a&&a.selectionStart;
  $('#b-app').innerHTML=v;
  if(id){var n=document.getElementById(id);if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(e){}}}
}
function viewHome(){
  var rows=accountStats(),B=0,S=0,H=0;rows.forEach(function(r){B+=r.budget;S+=r.spent;H+=r.hours});
  var left=B-S,leftH=0,fcH=0,fcN=0;rows.forEach(function(r){if(r.fc){leftH+=r.left;fcH+=r.hours;fcN++}});var wk=weeksLeft();
  var perWeek=wk>0?leftH/wk:0;
  var h='<header class="bhead"><h1>Budget Logistik Stunden</h1>'+yearSel()+'<span class="sub">Sold '+chf(BS.rate).replace('CHF ','CHF ')+' pro Stunde'+(BS.year===new Date().getFullYear()?' · noch '+wk+' Wochen bis 31.12.':'')+'</span></header>';
  var is=issues();
  if(is.length){
    h+='<section class="panel"><h2>Zu prüfen ('+is.length+')</h2><div>';
    is.slice(0,6).forEach(function(i){h+='<div class="issue"><span><b>'+esc(fmtDate(i.e.date))+'</b> · '+esc(i.e.person||'?')+'<br><span class="muted">'+esc(i.p.join(', '))+'</span></span><button class="btn sm" type="button" data-edit="'+i.e.id+'">Öffnen</button></div>'});
    if(is.length>6)h+='<div class="muted" style="padding-top:8px">… und '+(is.length-6)+' weitere. Im Reiter Rapporte findest du alle.</div>';
    h+='</div></section>';
  }
  h+='<section class="panel"><h2>Übersicht nach Konto</h2><div>';
  rows.forEach(function(r){
    var p=Math.round(r.pct*100),cls=r.pct>1?'bad':(r.pct>=.8?'warn':'ok'),lab=r.pct>1?'überschritten':(r.pct>=.8?'knapp':'im Rahmen');
    h+='<div class="acc"><div class="h"><span class="name">'+esc(r.name)+'</span><span class="pill '+cls+'">'+(r.orphan?'prüfen':lab)+'</span></div>'+
      '<div class="bar" role="img" aria-label="'+p+' Prozent verbraucht"><i class="'+(cls==='ok'?'':cls)+'" style="width:'+Math.min(100,r.pct*100)+'%"></i></div>'+
      '<div class="m"><span>Budget <b>'+nf(r.budget,0)+'</b></span><span>Ausgaben <b>'+nf(r.spent,0)+'</b></span><span>Differenz <b>'+nf(r.diff,0)+'</b></span><span><b>'+nf(r.pct*100,0)+' %</b></span><span>noch <b>'+nf(r.left,1)+' h</b></span></div></div>';
  });
  h+='</div></section>';
  var mh=new Array(12).fill(0);yearEntries().forEach(function(e){if(e.date&&+e.date.slice(0,4)===BS.year)mh[+e.date.slice(5,7)-1]+=hoursOf(e)});
  var mx=Math.max.apply(null,mh.concat([1])),cur=new Date().getFullYear()===BS.year?new Date().getMonth():-1;
  h+='<section class="panel"><h2>Stunden pro Monat</h2><div class="months">';
  mh.forEach(function(v,i){h+='<div class="c'+(i===cur?' cur':'')+'"><em>'+(v?nf(v,0):'')+'</em><i style="height:'+(v/mx*100*.72)+'%"></i><span>'+MONTHS[i]+'</span></div>'});
  h+='</div></section>';
  return h;
}
function kpi(l,v,s){return '<div class="kpi"><div class="l">'+l+'</div><div class="v num">'+v+'</div><div class="s">'+s+'</div></div>'}

function filtered(){
  var f=ui.filter,q=f.q.trim().toLowerCase();
  return sortedEntries().filter(function(e){
    if(yearOf(e)!==BS.year)return false;
    if(f.acc&&e.account!==f.acc)return false;
    if(f.person&&e.person!==f.person)return false;
    if(f.month&&(e.date||'').slice(0,7)!==f.month)return false;
    if(q&&(e.text+' '+e.person+' '+e.account).toLowerCase().indexOf(q)<0)return false;
    return true});
}
function opt(list,sel,first){return '<option value="">'+first+'</option>'+list.map(function(x){return '<option'+(x===sel?' selected':'')+' value="'+esc(x)+'">'+esc(x)+'</option>'}).join('')}
function viewList(){
  var f=ui.filter,list=filtered(),tH=0,tA=0;list.forEach(function(e){tH+=hoursOf(e);tA+=amount(e)});
  var months={};yearEntries().forEach(function(e){if(e.date)months[e.date.slice(0,7)]=1});
  var ml=Object.keys(months).sort().reverse();
  var h='<header class="bhead"><h1>Rapporte</h1>'+yearSel()+'<span class="sub">'+list.length+' von '+yearEntries().length+' · '+hh(tH)+' · '+chf(tA)+'</span></header>';
  h+='<section class="panel"><div class="filters">'+
    '<label>Suche<input id="f-q" type="search" value="'+esc(f.q)+'" placeholder="Text, Person …"></label>'+
    '<label>Konto<select id="f-acc">'+opt(BS.accounts.map(function(a){return a.name}),f.acc,'Alle Konten')+'</select></label>'+
    '<label>Person<select id="f-person">'+opt(allPersons(),f.person,'Alle Personen')+'</select></label>'+
    '<label>Monat<select id="f-month"><option value="">Alle Monate</option>'+ml.map(function(m){return '<option'+(m===f.month?' selected':'')+' value="'+m+'">'+MONTHS[+m.slice(5)-1]+' '+m.slice(0,4)+'</option>'}).join('')+'</select></label></div></section>';
  h+='<section class="panel">';
  if(!yearEntries().length)h+='<p class="muted" style="margin:0">Noch keine Rapporte in '+BS.year+'. Tippe auf «+ Rapport» oder importiere deine Excel-Datei unter Einstellungen.</p>';
  else if(!list.length)h+='<p class="muted" style="margin:0">Keine Rapporte für diese Auswahl.</p>';
  list.slice(0,150).forEach(function(e){
    h+='<article class="rep"><div class="t"><span><span class="who">'+esc(e.person||'?')+'</span> <span class="muted">· '+esc(fmtDate(e.date))+' · '+esc(e.start)+'–'+esc(e.end)+'</span></span><span class="num">'+nf(hoursOf(e),2)+' h · '+nf(amount(e),0)+'.–</span></div>'+
      '<div><span class="chip">'+esc(e.account)+'</span></div>'+
      '<div class="txt'+(ui.open[e.id]?' open':'')+'" data-toggle="'+e.id+'">'+esc(e.text)+'</div>'+
      '<div class="acts"><button class="btn sm" type="button" data-edit="'+e.id+'">Bearbeiten</button><button class="btn sm" type="button" data-dup="'+e.id+'">Kopieren</button>'+
      (ui.confirm===e.id?'<button class="btn sm danger" type="button" data-del="'+e.id+'">Wirklich löschen</button><button class="btn sm" type="button" data-cancel="1">Abbrechen</button>':'<button class="btn sm danger" type="button" data-askdel="'+e.id+'">Löschen</button>')+'</div></article>';
  });
  if(list.length>150)h+='<p class="muted" style="margin:0">Die neuesten 150 werden angezeigt. Mit den Filtern grenzt du ein.</p>';
  return h+'</section>';
}
function allPersons(){
  var s={};BS.persons.forEach(function(p){s[p]=1});BS.entries.forEach(function(e){if(e.person)s[e.person]=1});
  return Object.keys(s).sort(function(a,b){return a.localeCompare(b,'de')});
}
function viewPeople(){
  var by={};yearEntries().forEach(function(e){var k=e.person||'?';by[k]=by[k]||{c:0,h:0,a:0};by[k].c++;by[k].h+=hoursOf(e);by[k].a+=amount(e)});
  var ps=allPersons();if(by['?'])ps.push('?');
  var rows=ps.map(function(p){var s=by[p]||{c:0,h:0,a:0};return {p:p,c:s.c,h:s.h,a:s.a}}).sort(function(a,b){return b.h-a.h});
  var mx=Math.max.apply(null,rows.map(function(r){return r.h}).concat([1])),tH=0,tA=0;rows.forEach(function(r){tH+=r.h;tA+=r.a});
  var h='<header class="bhead"><h1>Personal</h1>'+yearSel()+'<span class="sub">'+hh(tH)+' · '+chf(tA)+'</span></header><section class="panel"><div class="scroll"><table><thead><tr><th>Name</th><th class="r">Rapporte</th><th class="r">Stunden</th><th class="r">CHF</th><th></th></tr></thead><tbody>';
  rows.forEach(function(r){h+='<tr><td>'+esc(r.p==='?'?'(ohne Person)':r.p)+'</td><td class="r">'+r.c+'</td><td class="r">'+nf(r.h,2)+'</td><td class="r">'+nf(r.a,0)+'</td><td style="width:20%"><div class="mini"><i style="width:'+(r.h/mx*100)+'%"></i></div></td></tr>'});
  h+='<tr><td><b>Gesamt</b></td><td class="r"><b>'+yearEntries().length+'</b></td><td class="r"><b>'+nf(tH,2)+'</b></td><td class="r"><b>'+nf(tA,0)+'</b></td><td></td></tr>';
  return h+'</tbody></table></div></section>';
}
function viewSettings(){
  var h='<header class="bhead"><h1>Einstellungen</h1></header>';
  h+='<section class="panel"><h2>Grundlagen</h2><div class="row"><label style="width:140px">Stundensold CHF<input id="s-rate" type="number" inputmode="decimal" step="0.5" min="0" value="'+BS.rate+'"></label></div><span class="muted">Der Sold gilt für neue Rapporte. Importierte und bestehende behalten ihren Sold.</span></section>';
  h+='<section class="panel"><h2>Konten und Budget '+BS.year+'</h2>';
  BS.accounts.forEach(function(a,i){h+='<div class="edit-acc"><label>Konto<input data-acc-name="'+i+'" id="an'+i+'" value="'+esc(a.name)+'"></label><label>Budget CHF<input data-acc-bud="'+i+'" id="ab'+i+'" type="number" inputmode="decimal" value="'+a.budget+'"></label><button class="btn sm danger" type="button" data-rmacc="'+i+'">Entfernen</button><label style="grid-column:1/-1;flex-direction:row;align-items:center;gap:8px;text-transform:none;letter-spacing:0;font-size:14px"><input type="checkbox" style="width:20px;min-height:20px" data-acc-fc="'+i+'"'+((a.forecast===undefined?i<4:a.forecast)?' checked':'')+'> Zählt für «Stunden übrig» und «Pro Woche»</label></div>'});
  h+='<div><button class="btn" type="button" id="add-acc">+ Konto hinzufügen</button></div><span class="muted">Das Budget gilt für das gewählte Jahr. Ein neues Jahr übernimmt die Konten des Vorjahrs. Wird ein Konto umbenannt, werden die Rapporte dieses Jahres mit umbenannt.</span></section>';
  h+='<section class="panel"><h2>Personen</h2><div class="pchips">'+allPersons().map(function(p){var used=BS.entries.some(function(e){return e.person===p});return '<button type="button" '+(used?'disabled title="Hat Rapporte"':'data-rmperson="'+esc(p)+'" title="Entfernen"')+'>'+esc(p)+(used?'':' ×')+'</button>'}).join('')+'</div>'+
    '<div class="row"><input id="new-person" placeholder="Nachname Vorname" style="flex:1;min-width:180px"><button class="btn" type="button" id="add-person">Hinzufügen</button></div></section>';
  h+='<section class="panel"><h2>Synchronisation</h2><span id="b-sync">'+esc(syncMsg)+'</span><div><button class="btn" type="button" id="b-resync">Jetzt abgleichen</button></div><span class="muted">Die Rapporte werden in deinem Konto der Feuerwehr Zuchwil App gespeichert, auf allen Geräten gleich.</span></section>';
  h+='<section class="panel"><h2>Excel und Sicherung</h2><div class="row"><button class="btn" type="button" id="b-import">Excel importieren</button><button class="btn" type="button" id="b-export">Als Excel exportieren</button><button class="btn" type="button" id="b-json">Sicherung (JSON)</button><button class="btn" type="button" id="b-restore">Sicherung laden</button></div>';
  if(ui.pending){var p=ui.pending;h+='<div class="panel" style="background:var(--surface2)"><b>Gefunden: '+p.entries.length+' Rapporte, '+p.accounts.length+' Konten, '+p.persons.length+' Personen</b><div class="row"><button class="btn primary" type="button" data-imp="replace">Alles ersetzen</button><button class="btn" type="button" data-imp="merge">Nur neue Rapporte ergänzen</button><button class="btn" type="button" data-imp="cancel">Abbrechen</button></div></div>'}
  h+='<span class="muted">Die Daten liegen nur in diesem Browser. Exportiere regelmässig, vor allem bevor du das Gerät wechselst oder Browserdaten löschst.</span></section>';
  h+='<section class="panel"><h2>Zurücksetzen</h2>'+(ui.confirm==='all'?'<div class="row"><button class="btn danger" type="button" id="wipe-yes">Ja, alle Rapporte löschen</button><button class="btn" type="button" data-cancel="1">Abbrechen</button></div>':'<div><button class="btn danger" type="button" id="wipe">Alle Rapporte löschen</button></div>')+'</section>';
  return h;
}

/* ---------- Erfassen-Blatt ---------- */
var form=null;
function openForm(e,mode){
  var d=e||{};
  form={mode:mode||'new',id:mode==='edit'?d.id:null,date:d.date||defDate(),start:d.start||'17:00',end:d.end||'19:00',
    account:d.account||prefs.account||BS.accounts[0]&&BS.accounts[0].name||'',text:d.text||'',rate:d.rate,
    persons:d.person?[d.person]:(prefs.person?[prefs.person]:[])};
  renderForm();
}
function ntext(t){return String(t||'').toLowerCase().replace(/[^a-z0-9äöüéèà]+/g,' ').trim()}
function dupInfo(f){
  if(!f||!f.date||!f.persons||!f.persons.length)return [];
  var a=toMin(f.start),b=toMin(f.end);if(a==null||b==null)return [];if(b<=a)b+=1440;
  var nt=ntext(f.text),out=[];
  BS.entries.forEach(function(e){
    if(e.id===f.id||e.date!==f.date||f.persons.indexOf(e.person)<0)return;
    var c=toMin(e.start),d=toMin(e.end);if(c==null||d==null)return;if(d<=c)d+=1440;
    var overlap=a<d&&c<b,same=nt.length>8&&ntext(e.text)===nt;
    if(overlap||same)out.push(e);
  });
  return out;
}
function recentTexts(acc){
  var seen={},out=[];
  sortedEntries().forEach(function(e){if(e.account===acc&&e.text&&!seen[e.text]&&out.length<4){seen[e.text]=1;out.push(e.text)}});
  return out;
}
function renderForm(){
  if(!form){$('#b-modal').innerHTML='';return}
  var f=form,ps=allPersons(),tmp={start:f.start,end:f.end},hrs=hoursOf(tmp),n=Math.max(1,f.persons.length),rate=f.rate==null?BS.rate:f.rate;
  var h='<div class="scrim" id="scrim"><form class="sheet" id="eform" autocomplete="off"><div class="row" style="justify-content:space-between"><h1>'+(f.mode==='edit'?'Rapport bearbeiten':'Neuer Rapport')+'</h1><button class="btn sm" type="button" id="f-close">Schliessen</button></div>'+
   (f.scan?'<div class="panel" style="background:var(--surface2);gap:4px"><b>Aus Foto erkannt, Eintrag '+f.i+' von '+f.n+'</b><span class="muted">Bitte alles kontrollieren. Handschrift wird nicht immer richtig gelesen.</span>'+(f.notes&&f.notes.length?'<span style="color:var(--warn)">'+esc(f.notes.join(' · '))+'</span>':'')+'</div>':'')+
   '<div class="grid3"><label>Datum<input id="e-date" type="date" value="'+f.date+'" required></label><label>Start<input id="e-start" type="time" step="900" value="'+f.start+'" required></label><label>Ende<input id="e-end" type="time" step="900" value="'+f.end+'" required></label></div>'+
   '<div class="sum">Dauer <b>'+nf(hrs,2)+' h</b>'+(f.persons.length>1?' pro Person · gesamt <b>'+nf(hrs*n,2)+' h</b>':'')+' · <b>'+chf(hrs*n*rate)+'</b></div>'+
   '<label>Konto<select id="e-acc">'+BS.accounts.map(function(a){return '<option'+(a.name===f.account?' selected':'')+' value="'+esc(a.name)+'">'+esc(a.name)+'</option>'}).join('')+'</select></label>'+
   '<div><div class="muted" style="font-size:12px;text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px">Erfasst durch'+(f.mode==='edit'?'':' (mehrere möglich)')+'</div><div class="pchips">'+ps.map(function(p){return '<button type="button" data-pp="'+esc(p)+'" aria-pressed="'+(f.persons.indexOf(p)>=0)+'">'+esc(p)+'</button>'}).join('')+'</div>'+(ps.length?'':'<span class="muted">Noch keine Personen. Lege sie unter Einstellungen an.</span>')+'</div>'+
   '<label>Ausgeführte Arbeit<textarea id="e-text" placeholder="Was wurde gemacht?">'+esc(f.text)+'</textarea></label>';
  var rt=recentTexts(f.account);
  if(rt.length&&!f.text)h+='<div class="sugg"><span class="muted" style="font-size:12px">Letzte Einträge in diesem Konto, zum Übernehmen antippen:</span>'+rt.map(function(t,i){return '<button type="button" data-sugg="'+i+'">'+esc(t.replace(/\s+/g,' '))+'</button>'}).join('')+'</div>';
  var dups=dupInfo(f);
  if(dups.length){
    var dp={};dups.forEach(function(e){dp[e.person]=1});var fresh=f.persons.filter(function(p){return !dp[p]});
    h+='<div class="panel" style="border-color:var(--warn);gap:8px"><b style="color:var(--warn)">Bereits erfasst</b>'+dups.map(function(e){return '<span>'+esc(e.person)+' · '+esc(fmtDate(e.date))+' · '+esc(e.start)+'–'+esc(e.end)+'<br><span class="muted">'+esc((e.text||'').replace(/\s+/g,' ').slice(0,80))+'</span></span>'}).join('')+
      '<div class="row">'+(fresh.length?'<button class="btn sm" type="button" id="dup-new">Nur '+fresh.length+' neue speichern</button>':'')+'<button class="btn sm" type="button" id="dup-force">Trotzdem speichern</button>'+'</div></div>';
  }
  h+='<div class="row"><button class="btn primary" type="submit" style="flex:1">'+(f.mode==='edit'?'Änderung speichern':'Speichern')+'</button>'+(f.mode==='edit'?'':'<button class="btn" type="button" id="f-more">Speichern + weiterer</button>')+'</div></form></div>';
  $('#b-modal').innerHTML=h;
  form._sugg=rt;
}
function saveForm(more){
  var f=form;f.text=$('#e-text').value.trim();
  if(!f.persons.length){toast('Bitte mindestens eine Person wählen');return}
  if(!f.date||!f.start||!f.end){toast('Datum und Zeit fehlen');return}
  if(toMin(f.start)===toMin(f.end)){toast('Start und Ende sind gleich');return}
  if(dupInfo(f).length&&!f.force){toast('Bereits erfasst, bitte Hinweis beachten');return}
  if(f.mode==='edit'){
    var e=BS.entries.filter(function(x){return x.id===f.id})[0];
    if(e){e.date=f.date;e.start=f.start;e.end=f.end;e.account=f.account;e.person=f.persons[0];e.text=f.text}
  }else{
    f.persons.forEach(function(p){BS.entries.push({id:uid(),date:f.date,start:f.start,end:f.end,text:f.text,account:f.account,person:p,rate:BS.rate})});
  }
  prefs.person=f.persons[0];prefs.account=f.account;savePrefs();save();
  toast(f.mode==='edit'?'Gespeichert':(f.persons.length>1?f.persons.length+' Rapporte gespeichert':'Rapport gespeichert'));
  if(more&&f.mode!=='edit'){form.text='';form.scan=false;renderForm()}else{form=null;renderForm()}
  render();
}

/* ---------- Excel ---------- */
function serialToIso(n){var d=new Date(Math.round((n-25569)*86400000));return d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0')}
function fracToTime(f){var m=Math.round((f%1)*1440);m=((m%1440)+1440)%1440;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')}
function parseWorkbook(buf){
  var wb=XLSX.read(buf,{type:'array'}),out={entries:[],accounts:[],persons:[]};
  function sheet(rx){var n=wb.SheetNames.filter(function(s){return rx.test(s)})[0];return n?XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,raw:true,defval:null}):null}
  var rap=sheet(/rapport/i),bud=sheet(/^budget/i),per=sheet(/stunden.*personal|personal.*stunden/i);
  if(!rap)throw new Error('Blatt mit den Arbeitsrapporten nicht gefunden');
  rap.slice(2).forEach(function(r){
    var d=r[0];if(d==null||(typeof d==='string'&&!d.trim()))return;
    var date=null;
    if(typeof d==='number')date=serialToIso(d);
    else{var m=String(d).match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);if(m)date=m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0')}
    var s=typeof r[1]==='number'?fracToTime(r[1]):'',e=typeof r[2]==='number'?fracToTime(r[2]):'';
    if(!date&&!r[3])return;
    out.entries.push({id:uid(),date:date||'',start:s,end:e,text:String(r[3]||'').trim(),account:String(r[4]||'').trim(),person:String(r[5]||'').trim(),rate:typeof r[8]==='number'?r[8]:BS.rate});
  });
  if(bud){var on=false;for(var i=0;i<bud.length;i++){var a=bud[i][0];if(typeof a==='string'&&/^konto/i.test(a)){on=true;continue}if(on){if(typeof a!=='string'||/^gesamt/i.test(a))break;if(typeof bud[i][1]==='number')out.accounts.push({name:a.trim(),budget:bud[i][1]})}}}
  if(per){var on2=false;per.forEach(function(r){var a=r[0];if(typeof a!=='string'||!a.trim())return;if(/^personal$/i.test(a.trim())){on2=true;return}if(on2)out.persons.push(a.trim())})}
  out.entries.forEach(function(e){if(e.person&&out.persons.indexOf(e.person)<0)out.persons.push(e.person)});
  return out;
}
function entryKey(e){return [e.date,e.start,e.end,e.person,e.account,e.text].join('|')}
function applyImport(mode){
  var p=ui.pending;if(!p)return;
  if(mode==='replace'){
    BS.entries=p.entries;BS.budgets={};if(p.accounts.length)BS.accounts=p.accounts;BS.persons=p.persons;
    var yrs={};p.entries.forEach(function(e){if(e.date)yrs[e.date.slice(0,4)]=(yrs[e.date.slice(0,4)]||0)+1});
    var best=Object.keys(yrs).sort(function(a,b){return yrs[b]-yrs[a]})[0];if(best)BS.year=+best;
    toast(p.entries.length+' Rapporte importiert');
  }else{
    var have={};BS.entries.forEach(function(e){have[entryKey(e)]=1});var n=0;
    p.entries.forEach(function(e){if(!have[entryKey(e)]){BS.entries.push(e);n++}});
    p.persons.forEach(function(x){if(BS.persons.indexOf(x)<0)BS.persons.push(x)});
    p.accounts.forEach(function(a){if(!BS.accounts.some(function(b){return b.name===a.name}))BS.accounts.push(a)});
    toast(n+' neue Rapporte ergänzt');
  }
  ui.pending=null;save();render();
}
function serial(iso){var p=iso.split('-');return Date.UTC(+p[0],+p[1]-1,+p[2])/86400000+25569}
function exportExcel(){
  var R='Arbeisrapporte_Rechnungen',es=yearEntries().sort(function(a,b){return (a.date+a.start).localeCompare(b.date+b.start)});
  var rap=[['Arbeitsrapporte'],['Datum','Arbeitszeit Start','Arbeitszeit Ende','ausgeführte Arbeit','Konto','Erfasst durch','Betrag','Arbeisstunden','Stunden Sold','Nur für Rechnen']];
  es.forEach(function(e,i){var r=i+3,h=hoursOf(e),rate=e.rate==null?BS.rate:e.rate,s=(toMin(e.start)||0)/1440,t=(toMin(e.end)||0)/1440;
    rap.push([{t:'n',v:e.date?serial(e.date):0,z:'dd.mm.yyyy'},{t:'n',v:s,z:'hh:mm'},{t:'n',v:t,z:'hh:mm'},e.text,e.account,e.person,
      {t:'n',v:h*rate,f:'I'+r+'*H'+r,z:'0.00'},{t:'n',v:h,f:'J'+r+'*24',z:'0.00'},rate,{t:'n',v:h/24,f:'C'+r+'-B'+r+'+IF(C'+r+'<B'+r+',1,0)',z:'hh:mm'}])});
  var wr=XLSX.utils.aoa_to_sheet(rap);wr['!cols']=[{wch:11},{wch:9},{wch:9},{wch:60},{wch:44},{wch:22},{wch:9},{wch:12},{wch:11},{wch:12}];
  var bu=[['Budgetkontrolle Logistik '+BS.year+' (Stunden)']];while(bu.length<12)bu.push([]);
  bu.push(['Übersicht nach Kategorie']);bu.push(['Konto (1501.3001.13)','Budget','Ausgaben','Differenz','%','Stunden noch übrig']);
  var st=accountStats().filter(function(r){return !r.orphan});
  st.forEach(function(r,i){var n=14+i;bu.push([r.name,r.budget,{t:'n',v:r.spent,f:'SUMIF('+R+'!$E$3:$E$1001,A'+n+','+R+'!$G$3:$G$1001)',z:'0.00'},{t:'n',v:r.diff,f:'B'+n+'-C'+n},{t:'n',v:r.pct,f:'IF(B'+n+'=0,0,C'+n+'/B'+n+')',z:'0%'},{t:'n',v:r.left,f:'D'+n+'/'+BS.rate,z:'0.0'}])});
  var last=13+st.length,tb=0,ts=0;st.forEach(function(r){tb+=r.budget;ts+=r.spent});
  bu.push([]);bu.push(['Gesamt',{t:'n',v:tb,f:'SUM(B14:B'+last+')'},{t:'n',v:ts,f:'SUM(C14:C'+last+')'},{t:'n',v:tb-ts,f:'B'+(last+2)+'-C'+(last+2)},{t:'n',v:tb?ts/tb:0,f:'C'+(last+2)+'/B'+(last+2),z:'0%'}]);
  var wbu=XLSX.utils.aoa_to_sheet(bu);wbu['!cols']=[{wch:50},{wch:10},{wch:10},{wch:10},{wch:7},{wch:18}];
  var pe=[[],[],[],['Personal','Stunden']];allPersons().forEach(function(p,i){var n=5+i,h=0;es.forEach(function(e){if(e.person===p)h+=hoursOf(e)});pe.push([p,{t:'n',v:h,f:'SUMIF('+R+'!$F$3:$F$1001,A'+n+','+R+'!$H$3:$H$1001)',z:'0.00'}])});
  var wp=XLSX.utils.aoa_to_sheet(pe);wp['!cols']=[{wch:26},{wch:10}];
  var wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,wbu,'Budget');XLSX.utils.book_append_sheet(wb,wr,R);XLSX.utils.book_append_sheet(wb,wp,'Arbeitsstunden Personal');
  var data=XLSX.write(wb,{bookType:'xlsx',type:'array'});
  saveFile('Budget_Feuerwehr_Logistik_'+BS.year+'_Stunden.xlsx',new Blob([data],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
}
function saveFile(name,blob){var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},4000);toast('Datei bereit: '+name)}
function needX(){if(window.XLSX)return Promise.resolve();return new Promise(function(ok,no){var s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';s.onload=ok;s.onerror=no;document.head.appendChild(s)})}

function bindAll(root){
/* ---------- Ereignisse ---------- */
root.addEventListener('click',function(ev){
  var t=ev.target.closest('button,[data-toggle],[data-edit]');if(!t)return;
  var d=t.dataset,id=t.id;
  if(d.tab){ui.tab=d.tab;prefs.tab=d.tab;savePrefs();ui.confirm=null;render();window.scrollTo(0,0);return}
  if(id==='b-fab'){openForm(null);return}
  if(id==='dup-new'){syncForm();var dp={};dupInfo(form).forEach(function(e){dp[e.person]=1});form.persons=form.persons.filter(function(p){return !dp[p]});saveForm(false);return}
  if(id==='dup-force'){syncForm();form.force=true;saveForm(false);return}
  if(d.edit){var e=BS.entries.filter(function(x){return x.id===d.edit})[0];if(e)openForm(e,'edit');return}
  if(d.dup){var e2=BS.entries.filter(function(x){return x.id===d.dup})[0];if(e2)openForm({date:defDate(),start:e2.start,end:e2.end,account:e2.account,text:e2.text,person:e2.person},'new');return}
  if(d.toggle){ui.open[d.toggle]=!ui.open[d.toggle];render();return}
  if(d.askdel){ui.confirm=d.askdel;render();return}
  if(d.del){BS.entries=BS.entries.filter(function(x){return x.id!==d.del});ui.confirm=null;save();render();toast('Rapport gelöscht');return}
  if(d.cancel){ui.confirm=null;render();return}
  if(id==='f-close'){form=null;renderForm();return}
  if(id==='f-more'){saveForm(true);return}
  if(d.pp){var i=form.persons.indexOf(d.pp);if(form.mode==='edit')form.persons=[d.pp];else if(i>=0)form.persons.splice(i,1);else form.persons.push(d.pp);syncForm();renderForm();return}
  if(d.sugg!=null){form.text=form._sugg[+d.sugg];syncForm();renderForm();return}
  if(id==='add-acc'){BS.accounts.push({name:'Neues Konto',budget:0});save();render();return}
  if(d.rmacc!=null){var a=BS.accounts[+d.rmacc];if(yearEntries().some(function(x){return x.account===a.name}))toast('Konto hat Rapporte und kann nicht entfernt werden');else{BS.accounts.splice(+d.rmacc,1);save();render()}return}
  if(d.rmperson){BS.persons=BS.persons.filter(function(p){return p!==d.rmperson});save();render();return}
  if(id==='add-person'){var v=$('#new-person').value.trim();if(v&&allPersons().indexOf(v)<0){BS.persons.push(v);save();render()}return}
  if(id==='b-resync'){syncDown();return}
  if(id==='b-import'){$('#file-excel').click();return}
  if(id==='b-export'){needX().then(exportExcel,function(){toast('Excel-Modul konnte nicht geladen werden (offline?)')});return}
  if(id==='b-json'){saveFile('Sicherung_Logistik_'+today()+'.json',new Blob([JSON.stringify(BS)],{type:'application/json'}));return}
  if(id==='b-restore'){$('#file-json').click();return}
  if(d.imp){if(d.imp==='cancel'){ui.pending=null;render()}else applyImport(d.imp);return}
  if(id==='wipe'){ui.confirm='all';render();return}
  if(id==='wipe-yes'){BS.entries=[];ui.confirm=null;save();render();toast('Alle Rapporte gelöscht');return}
});
function syncForm(){if(!form)return;var g=function(i){var n=document.getElementById(i);return n?n.value:null};
  if(g('e-date'))form.date=g('e-date');if(g('e-start'))form.start=g('e-start');if(g('e-end'))form.end=g('e-end');if(g('e-acc'))form.account=g('e-acc');if(document.getElementById('e-text'))form.text=g('e-text')}
root.addEventListener('change',function(ev){
  var t=ev.target,id=t.id;
  if(form&&id&&id.indexOf('e-')===0&&id!=='e-text'){syncForm();renderForm();return}
  if(id==='y-sel'){setYear(+t.value);return}
  if(id==='f-acc'){ui.filter.acc=t.value;render()}else if(id==='f-person'){ui.filter.person=t.value;render()}else if(id==='f-month'){ui.filter.month=t.value;render()}
  else if(id==='s-rate'){var r=parseFloat(t.value);if(r>0){BS.rate=r;save();render()}}
  else if(id==='s-year'){var y=parseInt(t.value,10);if(y>2000){BS.year=y;save();render()}}
  else if(t.dataset.accFc!=null){BS.accounts[+t.dataset.accFc].forecast=t.checked;save();render()}
  else if(t.dataset.accBud!=null){BS.accounts[+t.dataset.accBud].budget=parseFloat(t.value)||0;save()}
  else if(t.dataset.accName!=null){var i=+t.dataset.accName,old=BS.accounts[i].name,nw=t.value.trim();if(nw&&nw!==old){yearEntries().forEach(function(e){if(e.account===old)e.account=nw});BS.accounts[i].name=nw;save()}}
  else if(id==='file-excel'){var f=t.files[0];if(!f)return;needX().then(function(){return f.arrayBuffer()}).then(function(b){try{ui.pending=parseWorkbook(b);render()}catch(e){toast('Import fehlgeschlagen: '+e.message)}},function(){toast('Excel-Modul konnte nicht geladen werden (offline?)')});t.value=''}
  else if(id==='file-json'){var f2=t.files[0];if(!f2)return;f2.text().then(function(s){try{var o=JSON.parse(s);if(!o.entries||!o.accounts)throw new Error('Datei passt nicht');BS=o;BS.budgets=BS.budgets||{};save();render();toast('Sicherung geladen')}catch(e){toast('Laden fehlgeschlagen: '+e.message)}});t.value=''}
});
root.addEventListener('input',function(ev){
  var id=ev.target.id;
  if(id==='f-q'){ui.filter.q=ev.target.value;render()}
  else if(form&&(id==='e-text')){form.text=ev.target.value}
});
root.addEventListener('submit',function(ev){if(ev.target.id==='eform'){ev.preventDefault();syncForm();saveForm(false)}});
root.addEventListener('mousedown',function(ev){if(ev.target.id==='scrim'){form=null;renderForm()}});
}

window.budgetView=function(){
  var app=document.getElementById('app'),back=document.getElementById('back'),top=document.querySelector('.top');
  state.mod=null;state.from=null;state.view='bud';back.hidden=false;top.hidden=false;document.body.classList.remove('startpage');
  app.innerHTML='<div class="bud" id="bud-root"><div id="b-app"></div><nav class="tabs" id="b-tabs"></nav><div class="fabs"><button class="btn primary fab" id="b-fab" type="button">+ Rapport</button></div><div id="b-modal"></div><div id="b-toast" class="toast" hidden></div><input type="file" id="file-excel" accept=".xlsx,.xlsm,.xls" hidden><input type="file" id="file-json" accept=".json" hidden></div>';
  bindAll(document.getElementById('bud-root'));
  render();syncDown();window.scrollTo(0,0);
};
})();
