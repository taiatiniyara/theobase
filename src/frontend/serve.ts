// Minimal static file serving for PWA frontend
// Embedded directly to avoid file-system dependencies in Workers

const FILES: Record<string, { content: string; contentType: string }> = {
  '/app': {
    contentType: 'text/html; charset=utf-8',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <meta name="theme-color" content="#2c5282">
  <meta name="description" content="SDA Church Financial Management">
  <link rel="manifest" href="/manifest.json">
  <link rel="stylesheet" href="/styles.css">
  <title>Theobase</title>
</head>
<body>
  <div id="app">
    <div style="display:flex;justify-content:center;align-items:center;height:100vh;">
      <p style="color:var(--text-light);">Loading...</p>
    </div>
  </div>
  <script src="/app.js"></script>
</body>
</html>`,
  },
  '/manifest.json': {
    contentType: 'application/json',
    content: JSON.stringify({
      name: 'Theobase',
      short_name: 'Theobase',
      description: 'SDA Church Financial Management',
      start_url: '/app',
      display: 'standalone',
      background_color: '#1a365d',
      theme_color: '#2c5282',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    }),
  },
};

export function serveStatic(path: string): Response | null {
  const file = FILES[path];
  if (!file) return null;
  return new Response(file.content, {
    headers: { 'Content-Type': file.contentType },
  });
}

export function serveStyles(): Response {
  const css = `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root { --primary: #2c5282; --primary-dark: #1a365d; --accent: #2b6cb0; --bg: #f7fafc; --card-bg: #ffffff; --text: #2d3748; --text-light: #718096; --danger: #c53030; --success: #2f855a; --warning: #b7791f; --border: #e2e8f0; --radius: 8px; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; -webkit-tap-highlight-color: transparent; }
header { background: var(--primary-dark); color: white; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 10; }
header h1 { font-size: 1.1rem; font-weight: 600; }
header .status-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-right: 4px; }
header .status-dot.online { background: #48bb78; }
header .status-dot.offline { background: #f56565; }
main { padding: 16px; max-width: 600px; margin: 0 auto; }
.card { background: var(--card-bg); border-radius: var(--radius); padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); border: 1px solid var(--border); }
.card h2 { font-size: 1rem; margin-bottom: 12px; color: var(--primary-dark); }
label { display: block; font-size: 0.85rem; margin-bottom: 4px; color: var(--text-light); }
input, select, textarea { width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: var(--radius); font-size: 1rem; font-family: inherit; margin-bottom: 12px; background: white; }
input:focus, select:focus, textarea:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 2px rgba(43,108,176,0.2); }
button { padding: 12px 24px; border: none; border-radius: var(--radius); font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.15s; -webkit-appearance: none; }
.btn-primary { background: var(--primary); color: white; width: 100%; }
.btn-primary:hover { background: var(--primary-dark); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-secondary { background: var(--border); color: var(--text); }
.btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text); }
.btn-sm { padding: 8px 16px; font-size: 0.85rem; }
.row { display: flex; gap: 8px; align-items: center; }
.row > * { flex: 1; }
.badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
.badge-success { background: #c6f6d5; color: var(--success); }
.badge-warning { background: #fefcbf; color: var(--warning); }
.badge-danger { background: #fed7d7; color: var(--danger); }
.toast { position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); padding: 12px 24px; border-radius: var(--radius); color: white; font-weight: 600; z-index: 100; animation: slideUp 0.3s ease-out; white-space: nowrap; }
.toast.success { background: var(--success); }
.toast.error { background: var(--danger); }
@keyframes slideUp { from { opacity: 0; transform: translateX(-50%) translateY(16px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
.tabs { display: flex; gap: 0; margin-bottom: 12px; border-bottom: 2px solid var(--border); }
.tab-btn { padding: 10px 16px; border: none; background: none; font-size: 0.9rem; color: var(--text-light); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; border-radius: 0; }
.tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); }
.hidden { display: none !important; }
@media (max-width: 480px) { main { padding: 12px; } .card { padding: 12px; } }`;
  return new Response(css, { headers: { 'Content-Type': 'text/css; charset=utf-8' } });
}

export function serveAppJs(): Response {
  const js = `(function(){'use strict';const API='';const DB_NAME='theobase';const STORE_TXNS='transactions';const STORE_QUEUE='theobase-sync-queue';const STORE_AUTH='auth';let db=null;let token=null;let online=navigator.onLine;const $=sel=>document.querySelector(sel);const $$=sel=>document.querySelectorAll(sel);function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>{const d=req.result;if(!d.objectStoreNames.contains(STORE_TXNS))d.createObjectStore(STORE_TXNS,{keyPath:'id'});if(!d.objectStoreNames.contains(STORE_QUEUE))d.createObjectStore(STORE_QUEUE,{keyPath:'id',autoIncrement:true});if(!d.objectStoreNames.contains(STORE_AUTH))d.createObjectStore(STORE_AUTH,{keyPath:'key'})};req.onsuccess=()=>{db=req.result;resolve(db)};req.onerror=()=>reject(req.error)})}
function idbPut(storeName,value){return new Promise((resolve,reject)=>{const tx=db.transaction(storeName,'readwrite');const store=tx.objectStore(storeName);const req=store.put(value);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
function idbGetAll(storeName){return new Promise((resolve,reject)=>{const tx=db.transaction(storeName,'readonly');const store=tx.objectStore(storeName);const req=store.getAll();req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
function idbDelete(storeName,key){return new Promise((resolve,reject)=>{const tx=db.transaction(storeName,'readwrite');const store=tx.objectStore(storeName);const req=store.delete(key);req.onsuccess=()=>resolve();req.onerror=()=>reject(req.error)})}
function showToast(msg,type){const existing=$('.toast');if(existing)existing.remove();const el=document.createElement('div');el.className='toast '+type;el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),3000)}
async function api(path,opts={}){const headers={'Content-Type':'application/json',...opts.headers};if(token)headers['Authorization']='Bearer '+token;const res=await fetch(API+path,{...opts,headers});return res}
async function doLogin(email,password){try{const res=await api('/auth/login',{method:'POST',body:JSON.stringify({email,password})});const data=await res.json();if(!res.ok)throw new Error(data.error||'Login failed');token=data.token;await idbPut(STORE_AUTH,{key:'token',value:token});await idbPut(STORE_AUTH,{key:'email',value:email});return true}catch(e){showToast(e.message,'error');return false}}
async function checkAuth(){const stored=await idbGetAll(STORE_AUTH);const t=stored.find(s=>s.key==='token');if(t)token=t.value;return!!token}
async function saveOffline(txn){const id='offline-'+Date.now()+'-'+Math.random().toString(36).slice(2,8);await idbPut(STORE_TXNS,{...txn,id,offline:true,created_at:new Date().toISOString()});await idbPut(STORE_QUEUE,{transaction:txn});if('serviceWorker' in navigator&&'SyncManager' in window){const reg=await navigator.serviceWorker.ready;await reg.sync.register('sync-transactions')}}
async function syncNow(){if(!online)return;const pending=await idbGetAll(STORE_QUEUE);if(pending.length===0)return{synced:0};const txns=pending.map(p=>p.transaction);try{const res=await api('/sync',{method:'POST',body:JSON.stringify({transactions:txns})});const data=await res.json();if(res.ok||res.status===207){for(const p of pending){await idbDelete(STORE_QUEUE,p.id)}if(data.errors&&data.errors.length>0){showToast(data.created+' synced, '+data.errors.length+' failed','warning')}else{showToast(data.created+' transactions synced','success')}return{synced:data.created,errors:data.errors}}}catch(e){showToast('Sync failed - will retry when online','error')}return{synced:0}}
function renderLogin(){const app=$('#app');app.innerHTML='<div class="card" style="margin-top:40px;"><h2 style="text-align:center;font-size:1.3rem;">Theobase</h2><p style="text-align:center;color:var(--text-light);margin-bottom:20px;">SDA Church Financial Management</p><form id="login-form"><label>Email</label><input type="email" id="login-email" required autocomplete="email"><label>Password</label><input type="password" id="login-password" required autocomplete="current-password"><button type="submit" class="btn-primary">Sign In</button></form></div>';$('#login-form').addEventListener('submit',async(e)=>{e.preventDefault();const email=$('#login-email').value;const password=$('#login-password').value;const ok=await doLogin(email,password);if(ok)renderMain()})}
function renderMain(){const app=$('#app');app.innerHTML='<header><h1>Theobase</h1><div style="display:flex;gap:8px;align-items:center;"><span class="status-dot online" id="status-dot"></span><button class="btn-sm btn-outline" id="btn-sync" style="color:white;border-color:rgba(255,255,255,0.3);">Sync</button><button class="btn-sm btn-outline" id="btn-logout" style="color:white;border-color:rgba(255,255,255,0.3);">Logout</button></div></header><main><div class="tabs"><button class="tab-btn active" data-tab="entry">Single Entry</button><button class="tab-btn" data-tab="batch">Batch Entry</button></div><div id="tab-entry"><div class="card"><h2>New Transaction</h2><form id="txn-form"><label>Amount</label><input type="number" id="txn-amount" required min="1" step="0.01" placeholder="0.00"><label>Fund Type</label><select id="txn-type" required><option value="">Select...</option><option value="tithe">Tithe</option><option value="offering">Offering</option><option value="restricted">Restricted</option></select><label>Date</label><input type="date" id="txn-date" required><label>Member ID (optional)</label><input type="text" id="txn-member" placeholder="Leave blank for anonymous"><label>Notes (optional)</label><textarea id="txn-notes" rows="2" placeholder="Any notes..."></textarea><button type="submit" class="btn-primary">Record Transaction</button></form></div></div><div id="tab-batch" class="hidden"><div class="card"><h2>Batch Entry</h2><div id="batch-items"></div><div class="row" style="margin-top:8px;"><button class="btn-outline" id="btn-add-batch">+ Add Row</button><button class="btn-primary" id="btn-submit-batch">Submit All</button></div></div></div></main>';$('#txn-date').value=new Date().toISOString().split('T')[0];$$('.tab-btn').forEach(btn=>{btn.addEventListener('click',()=>{$$('.tab-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');const tab=btn.dataset.tab;$('#tab-entry').classList.toggle('hidden',tab!=='entry');$('#tab-batch').classList.toggle('hidden',tab!=='batch')})});$('#txn-form').addEventListener('submit',async(e)=>{e.preventDefault();const amount=parseFloat($('#txn-amount').value);const fund_type=$('#txn-type').value;const transaction_date=$('#txn-date').value;const member_id=$('#txn-member').value||undefined;const notes=$('#txn-notes').value||undefined;if(!amount||amount<=0){showToast('Enter a valid amount','error');return}if(!fund_type){showToast('Select a fund type','error');return}const txn={amount,fund_type,transaction_date,member_id,notes};if(online){try{const res=await api('/transactions',{method:'POST',body:JSON.stringify(txn)});if(res.ok){showToast('Transaction recorded','success');$('#txn-form').reset();$('#txn-date').value=new Date().toISOString().split('T')[0]}else{const err=await res.json();showToast(err.error||'Failed','error')}}catch(e){await saveOffline(txn);showToast('Saved offline - will sync later','warning');$('#txn-form').reset();$('#txn-date').value=new Date().toISOString().split('T')[0]}}else{await saveOffline(txn);showToast('Saved offline - will sync when online','warning');$('#txn-form').reset();$('#txn-date').value=new Date().toISOString().split('T')[0]}});let batchRows=0;function addBatchRow(){batchRows++;const row=document.createElement('div');row.className='card';row.style.padding='8px';row.innerHTML='<div class="row" style="margin-bottom:4px;"><span style="font-weight:600;color:var(--text-light);">Row '+batchRows+'</span><button class="btn-sm" style="color:var(--danger);" onclick="this.closest(\\'.card\\').remove()">Remove</button></div><div class="row"><input type="number" class="batch-amount" placeholder="Amount" required min="1"><select class="batch-type" required><option value="">Type</option><option value="tithe">Tithe</option><option value="offering">Offering</option><option value="restricted">Restricted</option></select></div><input type="date" class="batch-date" required>';row.querySelector('.batch-date').value=new Date().toISOString().split('T')[0];$('#batch-items').appendChild(row)}addBatchRow();$('#btn-add-batch').addEventListener('click',addBatchRow);$('#btn-submit-batch').addEventListener('click',async()=>{const rows=$$('#batch-items .card');const txns=[];for(const row of rows){const amountEl=row.querySelector('.batch-amount');const typeEl=row.querySelector('.batch-type');const dateEl=row.querySelector('.batch-date');const amount=parseFloat(amountEl.value);const fund_type=typeEl.value;const transaction_date=dateEl.value;if(!amount||amount<=0||!fund_type||!transaction_date){showToast('Fill all rows completely','error');return}txns.push({amount,fund_type,transaction_date})}if(online){try{const res=await api('/transactions/batch',{method:'POST',body:JSON.stringify({transactions:txns})});if(res.ok){const data=await res.json();showToast(data.count+' transactions recorded','success');$('#batch-items').innerHTML='';batchRows=0;addBatchRow()}else{const err=await res.json();showToast(err.error||'Failed','error')}}catch(e){for(const txn of txns)await saveOffline(txn);showToast('Saved offline - will sync later','warning');$('#batch-items').innerHTML='';batchRows=0;addBatchRow()}}else{for(const txn of txns)await saveOffline(txn);showToast(txns.length+' saved offline','warning');$('#batch-items').innerHTML='';batchRows=0;addBatchRow()}});$('#btn-sync').addEventListener('click',async()=>{$('#btn-sync').textContent='Syncing...';$('#btn-sync').disabled=true;await syncNow();await updatePendingCount();$('#btn-sync').textContent='Sync';$('#btn-sync').disabled=false});$('#btn-logout').addEventListener('click',async()=>{token=null;await idbDelete(STORE_AUTH,'token');renderLogin()});updateOnlineStatus();updatePendingCount();window.addEventListener('online',()=>{online=true;updateOnlineStatus();syncNow()});window.addEventListener('offline',()=>{online=false;updateOnlineStatus()})}
function updateOnlineStatus(){const dot=$('#status-dot');if(!dot)return;dot.className='status-dot '+(online?'online':'offline')}
async function updatePendingCount(){const pending=await idbGetAll(STORE_QUEUE);const btn=$('#btn-sync');if(btn&&pending.length>0){btn.textContent='Sync ('+pending.length+')'}}
if('serviceWorker' in navigator){navigator.serviceWorker.addEventListener('message',(event)=>{if(event.data&&event.data.type==='sync-complete'){showToast(event.data.synced+' transactions synced','success');updatePendingCount()}})}
async function init(){await openDB();const authed=await checkAuth();if('serviceWorker' in navigator){try{await navigator.serviceWorker.register('/sw.js')}catch(e){}}
if(authed){renderMain()}else{renderLogin()}}
document.addEventListener('DOMContentLoaded',init)})();`;
  return new Response(js, { headers: { 'Content-Type': 'application/javascript; charset=utf-8' } });
}

export function serveSwJs(): Response {
  const sw = `const CACHE_NAME='theobase-v1';const SYNC_QUEUE='theobase-sync-queue';
self.addEventListener('install',(event)=>{const evt=event;evt.waitUntil(caches.open(CACHE_NAME).then((cache)=>{return cache.addAll(['/app','/app.js','/styles.css','/manifest.json'])},));self.skipWaiting()});
self.addEventListener('activate',(event)=>{const evt=event;evt.waitUntil(caches.keys().then((keys)=>{return Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))},));self.clients.claim()});
self.addEventListener('fetch',(event)=>{const evt=event;if(evt.request.method!=='GET')return;evt.respondWith(caches.match(evt.request).then((cached)=>{const fetchPromise=fetch(evt.request).then((response)=>{if(response&&response.status===200){const clone=response.clone();caches.open(CACHE_NAME).then((cache)=>{cache.put(evt.request,clone)})}return response}).catch(()=>cached);return cached||fetchPromise}))});
self.addEventListener('sync',(event)=>{const evt=event;if(evt.tag==='sync-transactions'){evt.waitUntil(syncPendingTransactions())}});
async function syncPendingTransactions(){const pending=await getPending();if(pending.length===0)return;const token=await getStoredToken();for(const item of pending){try{const res=await fetch('/sync',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({transactions:[item.transaction]})});if(res.ok||res.status===207){await removePending(item.id)}}catch(e){}}
const clients=await self.clients.matchAll();for(const client of clients){client.postMessage({type:'sync-complete',synced:pending.length})}}
function openIDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open('theobase',1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('transactions'))db.createObjectStore('transactions',{keyPath:'id'});if(!db.objectStoreNames.contains(SYNC_QUEUE))db.createObjectStore(SYNC_QUEUE,{keyPath:'id',autoIncrement:true});if(!db.objectStoreNames.contains('auth'))db.createObjectStore('auth',{keyPath:'key'})};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function getPending(){const db=await openIDB();return new Promise((resolve)=>{const tx=db.transaction(SYNC_QUEUE,'readonly');const store=tx.objectStore(SYNC_QUEUE);const req=store.getAll();req.onsuccess=()=>resolve(req.result)})}
async function removePending(id){const db=await openIDB();return new Promise((resolve)=>{const tx=db.transaction(SYNC_QUEUE,'readwrite');const store=tx.objectStore(SYNC_QUEUE);const req=store.delete(id);req.onsuccess=()=>resolve()})}
function getStoredToken(){return new Promise((resolve)=>{openIDB().then(db=>{const tx=db.transaction('auth','readonly');const store=tx.objectStore('auth');const req=store.get('token');req.onsuccess=()=>resolve(req.result?.value||null);req.onerror=()=>resolve(null)})})}`;
  return new Response(sw, { headers: { 'Content-Type': 'application/javascript; charset=utf-8' } });
}
