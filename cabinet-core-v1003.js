// cabinet.js

const userInfo = document.getElementById('userInfo');
const workerCabinet = document.getElementById('workerCabinet');
const restaurantCabinet = document.getElementById('restaurantCabinet');
const supplierCabinet = document.getElementById('supplierCabinet');
const adminCabinet = document.getElementById('adminCabinet');
const unknownRole = document.getElementById('unknownRole');
const logoutBtn = document.getElementById('logoutBtn');

const saveWorkerProfileBtn = document.getElementById('saveWorkerProfileBtn');
const workerProfileMessage = document.getElementById('workerProfileMessage');
const loadWorkersBtn = document.getElementById('loadWorkersBtn');
const workersList = document.getElementById('workersList');
const workersMessage = document.getElementById('workersMessage');
const workerSearchInput = document.getElementById('workerSearchInput');

const loadInvitesBtn = document.getElementById('loadInvitesBtn');
const invitesList = document.getElementById('invitesList');
const invitesMessage = document.getElementById('invitesMessage');

const loadShiftPostsBtn = document.getElementById('loadShiftPostsBtn');
const shiftPostsList = document.getElementById('shiftPostsList');
const shiftPostsMessage = document.getElementById('shiftPostsMessage');
const shiftSearchInput = document.getElementById('shiftSearchInput');

const createShiftPostBtn = document.getElementById('createShiftPostBtn');
const loadRestaurantShiftPostsBtn = document.getElementById('loadRestaurantShiftPostsBtn');
const loadShiftApplicationsBtn = document.getElementById('loadShiftApplicationsBtn');
const shiftPostMessage = document.getElementById('shiftPostMessage');
const restaurantShiftPostsList = document.getElementById('restaurantShiftPostsList');
const shiftApplicationsList = document.getElementById('shiftApplicationsList');
const saveRestaurantProfileBtn = document.getElementById('saveRestaurantProfileBtn');
const restaurantProfileMessage = document.getElementById('restaurantProfileMessage');

const createSupplyRequestBtn = document.getElementById('createSupplyRequestBtn');
const loadSupplierOffersBtn = document.getElementById('loadSupplierOffersBtn');
const supplyRequestMessageBox = document.getElementById('supplyRequestMessageBox');
const supplierOffersList = document.getElementById('supplierOffersList');
const supplierOffersSearchInput = document.getElementById('supplierOffersSearchInput');
const loadSupplyResponsesBtn = document.getElementById('loadSupplyResponsesBtn');
const supplyResponsesMessage = document.getElementById('supplyResponsesMessage');
const supplyResponsesList = document.getElementById('supplyResponsesList');

const createSupplierOfferBtn = document.getElementById('createSupplierOfferBtn');
const loadSupplyRequestsBtn = document.getElementById('loadSupplyRequestsBtn');
const supplierOfferMessageBox = document.getElementById('supplierOfferMessageBox');
const supplyRequestsList = document.getElementById('supplyRequestsList');
const supplyRequestsSearchInput = document.getElementById('supplyRequestsSearchInput');
const loadSupplierInquiriesBtn = document.getElementById('loadSupplierInquiriesBtn');
const supplierInquiriesMessage = document.getElementById('supplierInquiriesMessage');
const supplierInquiriesList = document.getElementById('supplierInquiriesList');
const saveSupplierProfileBtn = document.getElementById('saveSupplierProfileBtn');
const supplierProfileMessage = document.getElementById('supplierProfileMessage');

const loadAdminDataBtn = document.getElementById('loadAdminDataBtn');
const adminMessage = document.getElementById('adminMessage');
const adminDataList = document.getElementById('adminDataList');

let currentUser = null;
let currentProfile = null;
let storageMode = 'Supabase';
let lastWorkers = [];
let lastSupplierOffers = [];
let lastSupplyRequests = [];
let lastSupplyResponses = [];
let lastShiftPosts = [];
let lastRestaurantShiftPosts = [];

function showOnly(section) {
  [workerCabinet, restaurantCabinet, supplierCabinet, adminCabinet, unknownRole].forEach(item => {
    if (item) item.style.display = 'none';
  });
  if (section) section.style.display = 'block';
}

function el(id) {
  return document.getElementById(id);
}

function value(id) {
  const node = el(id);
  return node ? node.value.trim() : '';
}

function numberOrNull(nextValue) {
  const cleaned = String(nextValue || '').replace(',', '.').replace(/[^\d.]/g, '');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function checked(id) {
  const node = el(id);
  return node ? Boolean(node.checked) : false;
}

function setValue(id, nextValue) {
  const node = el(id);
  if (node) node.value = nextValue ?? '';
}

function setChecked(id, nextValue) {
  const node = el(id);
  if (node) node.checked = Boolean(nextValue);
}

function setMessage(node, text) {
  if (node) node.textContent = text;
}

function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function textToArray(text) {
  return String(text || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

function showArray(nextValue) {
  if (Array.isArray(nextValue)) return nextValue.length ? nextValue.join(', ') : '-';
  if (nextValue === null || nextValue === undefined || nextValue === '') return '-';
  return String(nextValue);
}

function paymentText(nextValue) {
  const map = {
    per_shift: 'Р—Р° СЃРјРµРЅСѓ',
    per_hour: 'Р—Р° С‡Р°СЃ',
    per_day: 'Р—Р° РґРµРЅСЊ',
    per_month: 'Р—Р° РјРµСЃСЏС†'
  };
  return map[nextValue] || nextValue || '-';
}

function statusText(status) {
  const map = {
    pending: 'РћР¶РёРґР°РµС‚ РѕС‚РІРµС‚Р°',
    accepted: 'РџСЂРёРЅСЏС‚Рѕ',
    declined: 'РћС‚РєР»РѕРЅРµРЅРѕ',
    new: 'РќРѕРІР°СЏ',
    sent: 'РћС‚РїСЂР°РІР»РµРЅРѕ',
    done: 'Р—Р°РІРµСЂС€РµРЅРѕ',
    cancelled: 'РћС‚РјРµРЅРµРЅРѕ',
    open: 'РћС‚РєСЂС‹С‚Р°',
    active: 'РђРєС‚РёРІРЅРѕ'
  };
  return map[status] || status || '-';
}

function isDbUnavailable(error) {
  const text = String(error?.message || '').toLowerCase();
  return error?.code === '42P01' ||
    error?.code === '42703' ||
    text.includes('not found') ||
    text.includes('schema cache') ||
    text.includes('could not find') ||
    text.includes('relation') ||
    text.includes('404');
}

function localKey(table) {
  return `gc_${table}`;
}

function readLocal(table) {
  try {
    return JSON.parse(localStorage.getItem(localKey(table)) || '[]');
  } catch {
    return [];
  }
}

function writeLocal(table, rows) {
  localStorage.setItem(localKey(table), JSON.stringify(rows));
}

function localInsert(table, payload) {
  const row = {
    id: payload.id || crypto.randomUUID(),
    created_at: payload.created_at || new Date().toISOString(),
    updated_at: payload.updated_at || new Date().toISOString(),
    ...payload
  };
  const rows = readLocal(table);
  rows.unshift(row);
  writeLocal(table, rows);
  return { data: [row], error: null, local: true };
}

function localUpsert(table, payload, conflictKey) {
  const rows = readLocal(table);
  const index = rows.findIndex(row => row[conflictKey] === payload[conflictKey]);
  const row = {
    id: payload.id || rows[index]?.id || crypto.randomUUID(),
    created_at: rows[index]?.created_at || payload.created_at || new Date().toISOString(),
    updated_at: payload.updated_at || new Date().toISOString(),
    ...rows[index],
    ...payload
  };
  if (index >= 0) rows[index] = row;
  else rows.unshift(row);
  writeLocal(table, rows);
  return { data: [row], error: null, local: true };
}

function localUpdate(table, filters, patch) {
  const rows = readLocal(table);
  let changed = 0;
  const nextRows = rows.map(row => {
    const match = Object.entries(filters).every(([key, nextValue]) => row[key] === nextValue);
    if (!match) return row;
    changed += 1;
    return { ...row, ...patch, updated_at: new Date().toISOString() };
  });
  writeLocal(table, nextRows);
  return { data: nextRows.filter(row => Object.entries(filters).every(([key, nextValue]) => row[key] === nextValue)), error: null, count: changed, local: true };
}

function localSelect(table, filters = {}) {
  let rows = readLocal(table);
  rows = rows.filter(row => Object.entries(filters).every(([key, nextValue]) => row[key] === nextValue));
  rows.sort((a, b) => new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0));
  return { data: rows, error: null, local: true };
}

function noteLocalMode(result, messageNode) {
  if (result?.local) {
    storageMode = 'Р»РѕРєР°Р»СЊРЅС‹Р№ СЂРµР¶РёРј';
    if (messageNode) {
      messageNode.textContent = `${messageNode.textContent ? messageNode.textContent + ' ' : ''}Р’РЅРёРјР°РЅРёРµ: Supabase-С‚Р°Р±Р»РёС†Р° РЅРµРґРѕСЃС‚СѓРїРЅР°, РґР°РЅРЅС‹Рµ СЃРµР№С‡Р°СЃ СЃРѕС…СЂР°РЅРµРЅС‹ Р»РѕРєР°Р»СЊРЅРѕ РІ СЌС‚РѕРј Р±СЂР°СѓР·РµСЂРµ.`;
    }
  }
}

async function dbSelect(table, filters = {}, messageNode = null) {
  if (!window.supabaseClient) return localSelect(table, filters);
  try {
    let query = window.supabaseClient.from(table).select('*');
    Object.entries(filters).forEach(([key, nextValue]) => {
      query = query.eq(key, nextValue);
    });
    const result = await query.order('created_at', { ascending: false });
    if (!result.error) return result;
    if (!isDbUnavailable(result.error)) return result;
  } catch (error) {
    if (!isDbUnavailable(error)) return { data: null, error };
  }
  const local = localSelect(table, filters);
  noteLocalMode(local, messageNode);
  return local;
}

async function dbInsert(table, payload, messageNode = null) {
  if (!window.supabaseClient) return localInsert(table, payload);
  try {
    const result = await window.supabaseClient.from(table).insert(payload).select('*');
    if (!result.error) return result;
    if (!isDbUnavailable(result.error)) return result;
  } catch (error) {
    if (!isDbUnavailable(error)) return { data: null, error };
  }
  const local = localInsert(table, payload);
  noteLocalMode(local, messageNode);
  return local;
}

async function dbUpsert(table, payload, conflictKey, messageNode = null) {
  if (!window.supabaseClient) return localUpsert(table, payload, conflictKey);
  try {
    const result = await window.supabaseClient.from(table).upsert(payload, { onConflict: conflictKey }).select('*');
    if (!result.error) return result;
    if (!isDbUnavailable(result.error)) return result;
  } catch (error) {
    if (!isDbUnavailable(error)) return { data: null, error };
  }
  const local = localUpsert(table, payload, conflictKey);
  noteLocalMode(local, messageNode);
  return local;
}

async function dbUpdate(table, filters, patch, messageNode = null) {
  if (!window.supabaseClient) return localUpdate(table, filters, patch);
  try {
    let query = window.supabaseClient.from(table).update(patch);
    Object.entries(filters).forEach(([key, nextValue]) => {
      query = query.eq(key, nextValue);
    });
    const result = await query.select('*');
    if (!result.error) return result;
    if (!isDbUnavailable(result.error)) return result;
  } catch (error) {
    if (!isDbUnavailable(error)) return { data: null, error };
  }
  const local = localUpdate(table, filters, patch);
  noteLocalMode(local, messageNode);
  return local;
}

async function getSessionUser() {
  const { data, error } = await window.supabaseClient.auth.getSession();
  if (error || !data?.session?.user) return null;
  return data.session.user;
}

async function loadProfile(user) {
  const result = await dbSelect('profiles', { id: user.id });
  if (result.data?.[0]) return result.data[0];
  const fallbackProfile = {
    id: user.id,
    role: user.user_metadata?.role || 'worker',
    name: user.email,
    city: '',
    status: 'active',
    is_verified: false,
    updated_at: new Date().toISOString()
  };
  const created = await dbUpsert('profiles', fallbackProfile, 'id');
  return created.data?.[0] || fallbackProfile;
}

async function initCabinet() {
  if (!window.supabaseClient) {
    setMessage(userInfo, 'РћС€РёР±РєР°: Supabase РЅРµ РїРѕРґРєР»СЋС‡С‘РЅ.');
    showOnly(unknownRole);
    return;
  }

  currentUser = await getSessionUser();
  if (!currentUser) {
    window.location.href = 'auth.html';
    return;
  }

  currentProfile = await loadProfile(currentUser);
  setMessage(userInfo, `Р’С‹ РІРѕС€Р»Рё РєР°Рє: ${currentUser.email}. Р РѕР»СЊ: ${currentProfile.role}. РҐСЂР°РЅРёР»РёС‰Рµ: ${storageMode}.`);

  if (currentProfile.role === 'worker') {
    showOnly(workerCabinet);
    await loadWorkerProfile();
    await loadInvites();
    await loadShiftPosts();
  } else if (currentProfile.role === 'restaurant') {
    showOnly(restaurantCabinet);
    await loadRestaurantProfile();
    setMessage(workersMessage, 'РќР°Р¶РјРёС‚Рµ вЂњРџРѕРєР°Р·Р°С‚СЊ СЂР°Р±РѕС‚РЅРёРєРѕРІвЂќ, С‡С‚РѕР±С‹ Р·Р°РіСЂСѓР·РёС‚СЊ Р°РЅРєРµС‚С‹.');
    setMessage(shiftPostMessage, 'РЎРѕР·РґР°Р№С‚Рµ СЃРјРµРЅСѓ РёР»Рё Р·Р°РіСЂСѓР·РёС‚Рµ РІР°С€Рё Р°РєС‚РёРІРЅС‹Рµ Р·Р°СЏРІРєРё.');
  } else if (currentProfile.role === 'supplier') {
    showOnly(supplierCabinet);
    await loadSupplierProfile();
    setMessage(supplierOfferMessageBox, 'РћРїСѓР±Р»РёРєСѓР№С‚Рµ РїСЂРµРґР»РѕР¶РµРЅРёРµ РёР»Рё Р·Р°РіСЂСѓР·РёС‚Рµ Р·Р°РїСЂРѕСЃС‹ Р·Р°РІРµРґРµРЅРёР№.');
    await loadSupplierInquiries();
  } else if (currentProfile.role === 'admin') {
    showOnly(adminCabinet);
    await loadAdminData();
  } else {
    showOnly(unknownRole);
  }
}
