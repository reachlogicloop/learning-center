'use strict';
const app=document.getElementById('app'), cfg=window.PORTAL_SETTINGS;
const db=window.supabase.createClient(cfg.url,cfg.key);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function query(q){const {data,error}=await q;if(error)throw error;return data}
function message(s){const el=document.getElementById('message');if(el)el.textContent=s}
function shell(html){app.innerHTML=html+'<p id="message" class="error" role="status"></p>'}
function login(role='student'){
 const teacher=role==='teacher';
 shell('<div class="panel login"><h2>'+ (teacher?'Teacher login':'Welcome!') +'</h2><form id="login"><label for="secret">Enter your secret words</label><input id="secret" type="password" required autocomplete="current-password" autocapitalize="none" spellcheck="false"><button id="submit" type="submit">'+(teacher?'Sign in':'Start Learning')+'</button></form><button id="switch" class="switch" type="button">'+(teacher?'Back to student login':'Teacher login')+'</button></div>');
 document.getElementById('switch').onclick=()=>login(teacher?'student':'teacher');
 document.getElementById('login').onsubmit=async e=>{
  e.preventDefault(); const btn=document.getElementById('submit'), input=document.getElementById('secret'); btn.disabled=true; message('');
  try{
   const password=input.value;input.value='';
   const response=await fetch(cfg.url+'/functions/v1/portal-login',{method:'POST',headers:{'Content-Type':'application/json','apikey':cfg.key},body:JSON.stringify({role,password})});
   if(!response.ok){const err=new Error('Sign-in failed');err.throttled=response.status===429;throw err}
   const tokens=await response.json();
   const result=await query(db.auth.setSession({access_token:tokens.access_token,refresh_token:tokens.refresh_token}));
   const p=await query(db.from('profiles').select('id,name,role').eq('id',result.user.id).single());
   if(p.role!==role)throw new Error('Incorrect portal role');
   await dashboard(p);
  }catch(err){await db.auth.signOut();login(role);message(err.throttled?'Too many attempts. Please wait five minutes.':'Unable to sign in. Check your secret words or ask your teacher to finish account setup.')}
  finally{btn.disabled=false}
 };
}
function stats(p){if(!p)return 'Not started';const d=p.payload||{},a=(d.attempts||[]).filter(x=>x.stage===5).at(-1),v=(d.attempts||[]).filter(x=>x.stage===1).at(-1);return (d.done?.length===7?'Completed':'In progress')+' · '+Math.floor((d.seconds||0)/60)+' min · Vocabulary '+(v?v.score+'/'+v.total:'—')+' · Assessment '+(a?a.score+'/'+a.total:'—')}
async function dashboard(p){
 const teacher=p.role==='teacher';
 const [modules,units,assignments,progress,students]=await Promise.all([
  query(db.from('modules').select('*').order('id')),query(db.from('units').select('*').order('id')),
  query(db.from('assignments').select('*')),query(db.from('progress').select('*')),
  teacher?query(db.from('profiles').select('id,name').eq('role','student')):Promise.resolve([])
 ]);
 shell('<div class="row"><h2>Welcome, '+esc(p.name)+'</h2><button class="secondary" id="logout">Sign out</button></div>'+(teacher?'<form class="panel" id="add"><label for="module">New module name</label><input id="module" required maxlength="100"><button>Add module</button></form>':'')+'<div id="modules"></div>');
 const act=f=>async e=>{try{await f(e);await dashboard(p)}catch(err){message('Unable to save. Please try again.')}};
 document.getElementById('logout').onclick=async()=>{const {error}=await db.auth.signOut();if(error){message('Unable to sign out. Please try again.');return}login()};
 if(teacher)document.getElementById('add').onsubmit=act(async e=>{e.preventDefault();const name=document.getElementById('module').value.trim();if(name)await query(db.from('modules').insert({name}))});
 const target=document.getElementById('modules');
 for(const m of modules){
  const list=units.filter(u=>u.module_id===m.id&&(teacher||assignments.some(a=>a.unit_id===u.id&&a.student_id===p.id)));
  if(!teacher&&!list.length)continue;
  const box=document.createElement('article');box.innerHTML='<h3>'+esc(m.name)+'</h3>';
  if(teacher){const b=document.createElement('button');b.className='secondary';b.textContent='Rename module';b.onclick=act(async()=>{const name=prompt('Module name',m.name)?.trim();if(name)await query(db.from('modules').update({name}).eq('id',m.id))});box.append(b)}
  for(const u of list){
   const row=document.createElement('div');row.className='row';const title=document.createElement('strong');title.textContent=u.title;row.append(title);
   if(teacher){for(const s of students){const label=document.createElement('label'), check=document.createElement('input');check.type='checkbox';check.checked=assignments.some(a=>a.student_id===s.id&&a.unit_id===u.id);label.append(check,document.createTextNode(' '+s.name));row.append(label);check.onchange=async()=>{const checked=check.checked;check.disabled=true;try{if(checked)await query(db.from('assignments').insert({student_id:s.id,unit_id:u.id}));else await query(db.from('assignments').delete().eq('student_id',s.id).eq('unit_id',u.id));await dashboard(p)}catch(err){check.checked=!checked;check.disabled=false;message('Unable to update assignment.')}};const detail=document.createElement('small');detail.textContent=stats(progress.find(x=>x.student_id===s.id&&x.unit_id===u.id));row.append(detail)}}
   else {const detail=document.createElement('small');detail.textContent=stats(progress.find(x=>x.student_id===p.id&&x.unit_id===u.id))+(u.id==='safety-01'?'':' · Lesson files pending upload');row.append(detail);if(u.id==='safety-01'){const link=document.createElement('a');link.href='lessons/reading/safety/unit01.html';link.textContent='Open lesson';row.append(link)}}
   box.append(row);
  }
  if(!list.length)box.append('No lessons yet.');target.append(box);
 }
 if(!target.children.length)target.textContent='No assigned lessons yet.';
}
(async()=>{try{const {session}=await query(db.auth.getSession());if(!session)return login();const p=await query(db.from('profiles').select('id,name,role').eq('id',session.user.id).single());await dashboard(p)}catch(err){await db.auth.signOut();login();message('Account setup may be incomplete. Please sign in again.')}})();