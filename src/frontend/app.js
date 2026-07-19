// Theobase PWA - Offline-first church financial management
(function () {
  'use strict';

  const API = '';
  const DB_NAME = 'theobase';
  const STORE_TXNS = 'transactions';
  const STORE_QUEUE = 'theobase-sync-queue';
  const STORE_AUTH = 'auth';

  let db = null;
  let token = null;
  let online = navigator.onLine;

  // DOM refs
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // IndexedDB
  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const d = req.result;
        if (!d.objectStoreNames.contains(STORE_TXNS)) d.createObjectStore(STORE_TXNS, { keyPath: 'id' });
        if (!d.objectStoreNames.contains(STORE_QUEUE)) d.createObjectStore(STORE_QUEUE, { keyPath: 'id', autoIncrement: true });
        if (!d.objectStoreNames.contains(STORE_AUTH)) d.createObjectStore(STORE_AUTH, { keyPath: 'key' });
      };
      req.onsuccess = () => { db = req.result; resolve(db); };
      req.onerror = () => reject(req.error);
    });
  }

  function idbPut(storeName, value) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(value);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function idbGetAll(storeName) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function idbDelete(storeName, key) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // Toast notification
  function showToast(msg, type) {
    const existing = $('.toast');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  // API helpers
  async function api(path, opts = {}) {
    const headers = { 'Content-Type': 'application/json', ...opts.headers };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(API + path, { ...opts, headers });
    return res;
  }

  // Login
  async function doLogin(email, password) {
    try {
      const res = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      token = data.token;
      await idbPut(STORE_AUTH, { key: 'token', value: token });
      await idbPut(STORE_AUTH, { key: 'email', value: email });
      return true;
    } catch (e) {
      showToast(e.message, 'error');
      return false;
    }
  }

  // Check auth
  async function checkAuth() {
    const stored = await idbGetAll(STORE_AUTH);
    const t = stored.find(s => s.key === 'token');
    if (t) token = t.value;
    return !!token;
  }

  // Save transaction offline
  async function saveOffline(txn) {
    const id = 'offline-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    await idbPut(STORE_TXNS, { ...txn, id, offline: true, created_at: new Date().toISOString() });
    await idbPut(STORE_QUEUE, { transaction: txn });
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register('sync-transactions');
    }
  }

  // Sync pending
  async function syncNow() {
    if (!online) return;
    const pending = await idbGetAll(STORE_QUEUE);
    if (pending.length === 0) return { synced: 0 };

    const txns = pending.map(p => p.transaction);
    try {
      const res = await api('/sync', {
        method: 'POST',
        body: JSON.stringify({ transactions: txns })
      });
      const data = await res.json();

      if (res.ok || res.status === 207) {
        for (const p of pending) {
          await idbDelete(STORE_QUEUE, p.id);
        }
        if (data.errors && data.errors.length > 0) {
          showToast(`${data.created} synced, ${data.errors.length} failed`, 'warning');
        } else {
          showToast(`${data.created} transactions synced`, 'success');
        }
        return { synced: data.created, errors: data.errors };
      }
    } catch (e) {
      showToast('Sync failed - will retry when online', 'error');
    }
    return { synced: 0 };
  }

  // Render UI
  function renderLogin() {
    const app = $('#app');
    app.innerHTML = `
      <div class="card" style="margin-top: 40px;">
        <h2 style="text-align:center;font-size:1.3rem;">Theobase</h2>
        <p style="text-align:center;color:var(--text-light);margin-bottom:20px;">SDA Church Financial Management</p>
        <form id="login-form">
          <label>Email</label>
          <input type="email" id="login-email" required autocomplete="email">
          <label>Password</label>
          <input type="password" id="login-password" required autocomplete="current-password">
          <button type="submit" class="btn-primary">Sign In</button>
        </form>
      </div>
    `;

    $('#login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = $('#login-email').value;
      const password = $('#login-password').value;
      const ok = await doLogin(email, password);
      if (ok) renderMain();
    });
  }

  function renderMain() {
    const app = $('#app');
    app.innerHTML = `
      <header>
        <h1>Theobase</h1>
        <div style="display:flex;gap:8px;align-items:center;">
          <span class="status-dot online" id="status-dot"></span>
          <button class="btn-sm btn-outline" id="btn-sync" style="color:white;border-color:rgba(255,255,255,0.3);">Sync</button>
          <button class="btn-sm btn-outline" id="btn-logout" style="color:white;border-color:rgba(255,255,255,0.3);">Logout</button>
        </div>
      </header>
      <main>
        <div class="tabs">
          <button class="tab-btn active" data-tab="entry">Single Entry</button>
          <button class="tab-btn" data-tab="batch">Batch Entry</button>
        </div>

        <div id="tab-entry">
          <div class="card">
            <h2>New Transaction</h2>
            <form id="txn-form">
              <label>Amount</label>
              <input type="number" id="txn-amount" required min="1" step="0.01" placeholder="0.00">
              <label>Fund Type</label>
              <select id="txn-type" required>
                <option value="">Select...</option>
                <option value="tithe">Tithe</option>
                <option value="offering">Offering</option>
                <option value="restricted">Restricted</option>
              </select>
              <label>Date</label>
              <input type="date" id="txn-date" required>
              <label>Member ID (optional)</label>
              <input type="text" id="txn-member" placeholder="Leave blank for anonymous">
              <label>Notes (optional)</label>
              <textarea id="txn-notes" rows="2" placeholder="Any notes..."></textarea>
              <button type="submit" class="btn-primary">Record Transaction</button>
            </form>
          </div>
        </div>

        <div id="tab-batch" class="hidden">
          <div class="card">
            <h2>Batch Entry</h2>
            <div id="batch-items"></div>
            <div class="row" style="margin-top:8px;">
              <button class="btn-outline" id="btn-add-batch">+ Add Row</button>
              <button class="btn-primary" id="btn-submit-batch">Submit All</button>
            </div>
          </div>
        </div>
      </main>
    `;

    // Set today's date
    $('#txn-date').value = new Date().toISOString().split('T')[0];

    // Tab switching
    $$('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tab = btn.dataset.tab;
        $('#tab-entry').classList.toggle('hidden', tab !== 'entry');
        $('#tab-batch').classList.toggle('hidden', tab !== 'batch');
      });
    });

    // Single entry
    $('#txn-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const amount = parseFloat($('#txn-amount').value);
      const fund_type = $('#txn-type').value;
      const transaction_date = $('#txn-date').value;
      const member_id = $('#txn-member').value || undefined;
      const notes = $('#txn-notes').value || undefined;

      if (!amount || amount <= 0) { showToast('Enter a valid amount', 'error'); return; }
      if (!fund_type) { showToast('Select a fund type', 'error'); return; }

      const txn = { amount, fund_type, transaction_date, member_id, notes };

      if (online) {
        try {
          const res = await api('/transactions', {
            method: 'POST',
            body: JSON.stringify(txn)
          });
          if (res.ok) {
            showToast('Transaction recorded', 'success');
            $('#txn-form').reset();
            $('#txn-date').value = new Date().toISOString().split('T')[0];
          } else {
            const err = await res.json();
            showToast(err.error || 'Failed', 'error');
          }
        } catch (e) {
          await saveOffline(txn);
          showToast('Saved offline - will sync later', 'warning');
          $('#txn-form').reset();
          $('#txn-date').value = new Date().toISOString().split('T')[0];
        }
      } else {
        await saveOffline(txn);
        showToast('Saved offline - will sync when online', 'warning');
        $('#txn-form').reset();
        $('#txn-date').value = new Date().toISOString().split('T')[0];
      }
    });

    // Batch entry
    let batchRows = 0;
    function addBatchRow() {
      batchRows++;
      const row = document.createElement('div');
      row.className = 'card';
      row.style.padding = '8px';
      row.innerHTML = `
        <div class="row" style="margin-bottom:4px;">
          <span style="font-weight:600;color:var(--text-light);">Row ${batchRows}</span>
          <button class="btn-sm" style="color:var(--danger);" onclick="this.closest('.card').remove()">Remove</button>
        </div>
        <div class="row">
          <input type="number" class="batch-amount" placeholder="Amount" required min="1">
          <select class="batch-type" required>
            <option value="">Type</option>
            <option value="tithe">Tithe</option>
            <option value="offering">Offering</option>
            <option value="restricted">Restricted</option>
          </select>
        </div>
        <input type="date" class="batch-date" required>
      `;
      row.querySelector('.batch-date').value = new Date().toISOString().split('T')[0];
      $('#batch-items').appendChild(row);
    }
    addBatchRow();

    $('#btn-add-batch').addEventListener('click', addBatchRow);

    $('#btn-submit-batch').addEventListener('click', async () => {
      const rows = $$('#batch-items .card');
      const txns = [];
      for (const row of rows) {
        const amountEl = row.querySelector('.batch-amount');
        const typeEl = row.querySelector('.batch-type');
        const dateEl = row.querySelector('.batch-date');
        const amount = parseFloat(amountEl.value);
        const fund_type = typeEl.value;
        const transaction_date = dateEl.value;
        if (!amount || amount <= 0 || !fund_type || !transaction_date) {
          showToast('Fill all rows completely', 'error');
          return;
        }
        txns.push({ amount, fund_type, transaction_date });
      }

      if (online) {
        try {
          const res = await api('/transactions/batch', {
            method: 'POST',
            body: JSON.stringify({ transactions: txns })
          });
          if (res.ok) {
            const data = await res.json();
            showToast(`${data.count} transactions recorded`, 'success');
            $('#batch-items').innerHTML = '';
            batchRows = 0;
            addBatchRow();
          } else {
            const err = await res.json();
            showToast(err.error || 'Failed', 'error');
          }
        } catch (e) {
          for (const txn of txns) await saveOffline(txn);
          showToast('Saved offline - will sync later', 'warning');
          $('#batch-items').innerHTML = '';
          batchRows = 0;
          addBatchRow();
        }
      } else {
        for (const txn of txns) await saveOffline(txn);
        showToast(`${txns.length} saved offline`, 'warning');
        $('#batch-items').innerHTML = '';
        batchRows = 0;
        addBatchRow();
      }
    });

    // Sync button
    $('#btn-sync').addEventListener('click', async () => {
      $('#btn-sync').textContent = 'Syncing...';
      $('#btn-sync').disabled = true;
      await syncNow();
      await updatePendingCount();
      $('#btn-sync').textContent = 'Sync';
      $('#btn-sync').disabled = false;
    });

    // Logout
    $('#btn-logout').addEventListener('click', async () => {
      token = null;
      await idbDelete(STORE_AUTH, 'token');
      renderLogin();
    });

    // Update online status
    updateOnlineStatus();
    updatePendingCount();
    window.addEventListener('online', () => { online = true; updateOnlineStatus(); syncNow(); });
    window.addEventListener('offline', () => { online = false; updateOnlineStatus(); });
  }

  function updateOnlineStatus() {
    const dot = $('#status-dot');
    if (!dot) return;
    dot.className = 'status-dot ' + (online ? 'online' : 'offline');
  }

  async function updatePendingCount() {
    const pending = await idbGetAll(STORE_QUEUE);
    const btn = $('#btn-sync');
    if (btn && pending.length > 0) {
      btn.textContent = `Sync (${pending.length})`;
    }
  }

  // SW messages
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'sync-complete') {
        showToast(`${event.data.synced} transactions synced`, 'success');
        updatePendingCount();
      }
    });
  }

  // Init
  async function init() {
    await openDB();
    const authed = await checkAuth();

    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch (e) { /* SW registration can fail in dev */ }
    }

    if (authed) {
      renderMain();
    } else {
      renderLogin();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
