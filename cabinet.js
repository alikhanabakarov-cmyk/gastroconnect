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

const createSupplyRequestBtn = document.getElementById('createSupplyRequestBtn');
const loadSupplierOffersBtn = document.getElementById('loadSupplierOffersBtn');
const supplyRequestMessageBox = document.getElementById('supplyRequestMessageBox');
const supplierOffersList = document.getElementById('supplierOffersList');
const supplierOffersSearchInput = document.getElementById('supplierOffersSearchInput');

const createSupplierOfferBtn = document.getElementById('createSupplierOfferBtn');
const loadSupplyRequestsBtn = document.getElementById('loadSupplyRequestsBtn');
const supplierOfferMessageBox = document.getElementById('supplierOfferMessageBox');
const supplyRequestsList = document.getElementById('supplyRequestsList');
const supplyRequestsSearchInput = document.getElementById('supplyRequestsSearchInput');

const loadAdminDataBtn = document.getElementById('loadAdminDataBtn');
const adminMessage = document.getElementById('adminMessage');
const adminDataList = document.getElementById('adminDataList');

let currentUser = null;
let currentProfile = null;
let storageMode = 'Supabase';
let lastWorkers = [];
let lastSupplierOffers = [];
let lastSupplyRequests = [];

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
    per_shift: 'За смену',
    per_hour: 'За час',
    per_day: 'За день',
    per_month: 'За месяц'
  };
  return map[nextValue] || nextValue || '-';
}

function statusText(status) {
  const map = {
    pending: 'Ожидает ответа',
    accepted: 'Принято',
    declined: 'Отклонено'
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
    storageMode = 'локальный режим';
    if (messageNode) {
      messageNode.textContent = `${messageNode.textContent ? messageNode.textContent + ' ' : ''}Внимание: Supabase-таблица недоступна, данные сейчас сохранены локально в этом браузере.`;
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
  return {
    id: user.id,
    role: user.user_metadata?.role || 'worker',
    name: user.email,
    city: ''
  };
}

async function initCabinet() {
  if (!window.supabaseClient) {
    setMessage(userInfo, 'Ошибка: Supabase не подключён.');
    showOnly(unknownRole);
    return;
  }

  currentUser = await getSessionUser();
  if (!currentUser) {
    window.location.href = 'auth.html';
    return;
  }

  currentProfile = await loadProfile(currentUser);
  setMessage(userInfo, `Вы вошли как: ${currentUser.email}. Роль: ${currentProfile.role}. Хранилище: ${storageMode}.`);

  if (currentProfile.role === 'worker') {
    showOnly(workerCabinet);
    await loadWorkerProfile();
    await loadInvites();
  } else if (currentProfile.role === 'restaurant') {
    showOnly(restaurantCabinet);
    setMessage(workersMessage, 'Нажмите “Показать работников”, чтобы загрузить анкеты.');
  } else if (currentProfile.role === 'supplier') {
    showOnly(supplierCabinet);
    setMessage(supplierOfferMessageBox, 'Опубликуйте предложение или загрузите запросы заведений.');
  } else if (currentProfile.role === 'admin') {
    showOnly(adminCabinet);
    await loadAdminData();
  } else {
    showOnly(unknownRole);
  }
}

async function loadWorkerProfile() {
  const result = await dbSelect('worker_profiles', { user_id: currentUser.id }, workerProfileMessage);
  if (result.error) {
    setMessage(workerProfileMessage, 'Ошибка загрузки профиля: ' + result.error.message);
    return;
  }
  const data = result.data?.[0];
  if (!data) {
    setMessage(workerProfileMessage, 'Заполните профиль и нажмите “Сохранить”.');
    return;
  }
  setValue('workerProfessions', showArray(data.professions));
  setValue('workerExperience', data.experience || '');
  setValue('workerAvailableDays', showArray(data.available_days));
  setValue('workerAvailableTime', data.available_time || '');
  setValue('workerMinRate', data.min_rate ?? '');
  setValue('workerPaymentType', data.payment_type || 'per_shift');
  setChecked('workerCanTravel', data.can_travel);
  setValue('workerTravelCities', showArray(data.travel_cities));
  setValue('workerTravelRadiusKm', data.travel_radius_km ?? '');
  setValue('workerAbout', data.about || '');
  setMessage(workerProfileMessage, 'Профиль загружен.');
}

async function saveWorkerProfile() {
  const minRate = value('workerMinRate');
  const radius = value('workerTravelRadiusKm');
  const payload = {
    user_id: currentUser.id,
    professions: textToArray(value('workerProfessions')),
    experience: value('workerExperience') || null,
    available_days: textToArray(value('workerAvailableDays')),
    available_time: value('workerAvailableTime') || null,
    min_rate: minRate ? Number(minRate) : null,
    payment_type: value('workerPaymentType') || 'per_shift',
    can_travel: checked('workerCanTravel'),
    travel_cities: textToArray(value('workerTravelCities')),
    travel_radius_km: radius ? Number(radius) : null,
    about: value('workerAbout') || null,
    updated_at: new Date().toISOString()
  };
  setMessage(workerProfileMessage, 'Сохраняем профиль...');
  const result = await dbUpsert('worker_profiles', payload, 'user_id', workerProfileMessage);
  if (result.error) {
    setMessage(workerProfileMessage, 'Ошибка сохранения: ' + result.error.message);
    return;
  }
  setMessage(workerProfileMessage, `Профиль работника сохранён. Хранилище: ${result.local ? 'локально' : 'Supabase'}.`);
}

function matchesSearch(row, search) {
  if (!search) return true;
  return JSON.stringify(row).toLowerCase().includes(search.toLowerCase());
}

async function loadWorkers() {
  workersList.innerHTML = '';
  setMessage(workersMessage, 'Загружаем работников...');
  const result = await dbSelect('worker_profiles', {}, workersMessage);
  if (result.error) {
    setMessage(workersMessage, 'Ошибка загрузки работников: ' + result.error.message);
    return;
  }
  lastWorkers = result.data || [];
  renderWorkers();
}

function renderWorkers() {
  const search = workerSearchInput?.value.trim() || '';
  const rows = lastWorkers.filter(row => matchesSearch(row, search));
  workersList.innerHTML = '';
  rows.forEach(worker => workersList.appendChild(renderWorkerCard(worker)));
  setMessage(workersMessage, rows.length ? `Найдено работников: ${rows.length}` : 'Работники не найдены.');
}

function renderWorkerCard(worker) {
  const card = document.createElement('article');
  card.className = 'data-card';
  card.innerHTML = `
    <h4>${escapeHtml(showArray(worker.professions))}</h4>
    <p><strong>Опыт:</strong> ${escapeHtml(worker.experience || '-')}</p>
    <p><strong>Дни:</strong> ${escapeHtml(showArray(worker.available_days))}</p>
    <p><strong>Время:</strong> ${escapeHtml(worker.available_time || '-')}</p>
    <p><strong>Ставка:</strong> ${escapeHtml(worker.min_rate ?? '-')}</p>
    <p><strong>Оплата:</strong> ${escapeHtml(paymentText(worker.payment_type))}</p>
    <p><strong>Готов ехать:</strong> ${worker.can_travel ? 'да' : 'нет'}</p>
    <p><strong>Города:</strong> ${escapeHtml(showArray(worker.travel_cities))}</p>
    <p><strong>О себе:</strong> ${escapeHtml(worker.about || '-')}</p>
    <div class="card-actions" style="margin-top:14px;">
      <button type="button" class="inviteWorkerBtn">Пригласить на смену</button>
    </div>
    <p class="inviteStatus message"></p>
  `;
  const btn = card.querySelector('.inviteWorkerBtn');
  const status = card.querySelector('.inviteStatus');
  if (!worker.user_id) {
    btn.disabled = true;
    status.textContent = 'У анкеты нет user_id.';
  } else {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      status.textContent = 'Отправляем приглашение...';
      const ok = await inviteWorker(worker.user_id, status);
      if (ok) btn.textContent = 'Приглашение отправлено';
      else btn.disabled = false;
    });
  }
  return card;
}

async function inviteWorker(workerId, statusNode) {
  const payload = {
    restaurant_id: currentUser.id,
    worker_id: workerId,
    status: 'pending',
    message: 'Приглашение на смену',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  const result = await dbInsert('shift_invites', payload, statusNode);
  if (result.error) {
    setMessage(statusNode, 'Ошибка приглашения: ' + result.error.message);
    return false;
  }
  setMessage(statusNode, `Приглашение отправлено. Хранилище: ${result.local ? 'локально' : 'Supabase'}.`);
  return true;
}

async function loadInvites() {
  invitesList.innerHTML = '';
  setMessage(invitesMessage, 'Загружаем приглашения...');
  const result = await dbSelect('shift_invites', { worker_id: currentUser.id }, invitesMessage);
  if (result.error) {
    setMessage(invitesMessage, 'Ошибка загрузки приглашений: ' + result.error.message);
    return;
  }
  const rows = result.data || [];
  rows.forEach(invite => invitesList.appendChild(renderInviteCard(invite)));
  setMessage(invitesMessage, rows.length ? `Найдено приглашений: ${rows.length}` : 'Приглашений пока нет.');
}

function renderInviteCard(invite) {
  const card = document.createElement('article');
  card.className = 'data-card';
  const pending = invite.status === 'pending';
  card.innerHTML = `
    <h4>Приглашение на смену</h4>
    <p><strong>Статус:</strong> <span class="status-pill">${escapeHtml(statusText(invite.status))}</span></p>
    <p><strong>Сообщение:</strong> ${escapeHtml(invite.message || '-')}</p>
    <div class="card-actions" style="margin-top:14px;">
      <button type="button" class="acceptInviteBtn">Принять</button>
      <button type="button" class="declineInviteBtn">Отклонить</button>
    </div>
  `;
  const accept = card.querySelector('.acceptInviteBtn');
  const decline = card.querySelector('.declineInviteBtn');
  accept.disabled = !pending;
  decline.disabled = !pending;
  accept.addEventListener('click', () => updateInviteStatus(invite.id, 'accepted'));
  decline.addEventListener('click', () => updateInviteStatus(invite.id, 'declined'));
  return card;
}

async function updateInviteStatus(inviteId, status) {
  const result = await dbUpdate('shift_invites', { id: inviteId, worker_id: currentUser.id }, {
    status,
    updated_at: new Date().toISOString()
  }, invitesMessage);
  if (result.error) {
    alert('Ошибка обновления приглашения: ' + result.error.message);
    return;
  }
  await loadInvites();
}

async function createSupplyRequest() {
  const title = value('supplyRequestTitle');
  if (!title) {
    setMessage(supplyRequestMessageBox, 'Укажите, что нужно заведению.');
    return;
  }
  const payload = {
    restaurant_id: currentUser.id,
    title,
    category: value('supplyRequestCategory'),
    quantity: value('supplyRequestQuantity'),
    budget: value('supplyRequestBudget'),
    city: value('supplyRequestCity'),
    message: value('supplyRequestMessage'),
    status: 'open',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  const result = await dbInsert('supply_requests', payload, supplyRequestMessageBox);
  if (result.error) {
    setMessage(supplyRequestMessageBox, 'Ошибка публикации запроса: ' + result.error.message);
    return;
  }
  setMessage(supplyRequestMessageBox, `Запрос опубликован. Хранилище: ${result.local ? 'локально' : 'Supabase'}.`);
}

async function loadSupplierOffers() {
  supplierOffersList.innerHTML = '';
  setMessage(supplyRequestMessageBox, 'Загружаем предложения поставщиков...');
  const result = await dbSelect('supplier_offers', {}, supplyRequestMessageBox);
  if (result.error) {
    setMessage(supplyRequestMessageBox, 'Ошибка загрузки предложений: ' + result.error.message);
    return;
  }
  lastSupplierOffers = result.data || [];
  renderSupplierOffers();
}

function renderSupplierOffers() {
  const search = supplierOffersSearchInput?.value.trim() || '';
  const rows = lastSupplierOffers.filter(row => matchesSearch(row, search));
  supplierOffersList.innerHTML = '';
  rows.forEach(offer => supplierOffersList.appendChild(renderSupplierOfferCard(offer)));
  if (!rows.length) setMessage(supplyRequestMessageBox, 'Предложения поставщиков не найдены.');
}

function renderSupplierOfferCard(offer) {
  const card = document.createElement('article');
  card.className = 'data-card';
  const deliveryCities = offer.delivery_cities || offer.city || '-';
  card.innerHTML = `
    <h4>${escapeHtml(offer.title || '-')}</h4>
    <p><strong>Категория:</strong> ${escapeHtml(offer.category || '-')}</p>
    <p><strong>Товар:</strong> ${escapeHtml(offer.product_name || offer.title || '-')}</p>
    <p><strong>Цена:</strong> ${escapeHtml(offer.price ?? '-')} ${escapeHtml(offer.unit || '')}</p>
    <p><strong>Минимальный заказ:</strong> ${escapeHtml(offer.min_order || offer.quantity || '-')}</p>
    <p><strong>Города доставки:</strong> ${escapeHtml(showArray(deliveryCities))}</p>
    <p><strong>Описание:</strong> ${escapeHtml(offer.description || offer.message || '-')}</p>
  `;
  return card;
}

async function createSupplierOffer() {
  const title = value('supplierOfferTitle');
  if (!title) {
    setMessage(supplierOfferMessageBox, 'Укажите товар или услугу.');
    return;
  }
  const payload = {
    supplier_id: currentUser.id,
    title,
    category: value('supplierOfferCategory') || 'Другое',
    product_name: title,
    price: numberOrNull(value('supplierOfferPrice')),
    unit: 'руб.',
    min_order: value('supplierOfferQuantity'),
    delivery_cities: textToArray(value('supplierOfferCity')) || [],
    description: value('supplierOfferMessage'),
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  const result = await dbInsert('supplier_offers', payload, supplierOfferMessageBox);
  if (result.error) {
    setMessage(supplierOfferMessageBox, 'Ошибка публикации предложения: ' + result.error.message);
    return;
  }
  setMessage(supplierOfferMessageBox, `Предложение опубликовано. Хранилище: ${result.local ? 'локально' : 'Supabase'}.`);
}

async function loadSupplyRequests() {
  supplyRequestsList.innerHTML = '';
  setMessage(supplierOfferMessageBox, 'Загружаем запросы заведений...');
  const result = await dbSelect('supply_requests', {}, supplierOfferMessageBox);
  if (result.error) {
    setMessage(supplierOfferMessageBox, 'Ошибка загрузки запросов: ' + result.error.message);
    return;
  }
  lastSupplyRequests = result.data || [];
  renderSupplyRequests();
}

function renderSupplyRequests() {
  const search = supplyRequestsSearchInput?.value.trim() || '';
  const rows = lastSupplyRequests.filter(row => matchesSearch(row, search));
  supplyRequestsList.innerHTML = '';
  rows.forEach(request => supplyRequestsList.appendChild(renderSupplyRequestCard(request)));
  if (!rows.length) setMessage(supplierOfferMessageBox, 'Запросы заведений не найдены.');
}

function renderSupplyRequestCard(request) {
  const card = document.createElement('article');
  card.className = 'data-card';
  card.innerHTML = `
    <h4>${escapeHtml(request.title || '-')}</h4>
    <p><strong>Категория:</strong> ${escapeHtml(request.category || '-')}</p>
    <p><strong>Количество:</strong> ${escapeHtml(request.quantity || '-')}</p>
    <p><strong>Бюджет:</strong> ${escapeHtml(request.budget || '-')}</p>
    <p><strong>Город:</strong> ${escapeHtml(request.city || '-')}</p>
    <p><strong>Комментарий:</strong> ${escapeHtml(request.message || '-')}</p>
  `;
  return card;
}

async function loadAdminData() {
  adminDataList.innerHTML = '';
  setMessage(adminMessage, 'Загружаем данные...');
  const tables = ['worker_profiles', 'shift_invites', 'supply_requests', 'supplier_offers'];
  for (const table of tables) {
    const result = await dbSelect(table, {}, adminMessage);
    const rows = result.data || [];
    const card = document.createElement('article');
    card.className = 'data-card';
    card.innerHTML = `<h4>${escapeHtml(table)}</h4><p>Записей: ${rows.length}</p>`;
    adminDataList.appendChild(card);
  }
  setMessage(adminMessage, 'Данные обновлены.');
}

if (loadWorkersBtn) loadWorkersBtn.addEventListener('click', loadWorkers);
if (workerSearchInput) workerSearchInput.addEventListener('input', renderWorkers);
if (saveWorkerProfileBtn) saveWorkerProfileBtn.addEventListener('click', saveWorkerProfile);
if (loadInvitesBtn) loadInvitesBtn.addEventListener('click', loadInvites);
if (createSupplyRequestBtn) createSupplyRequestBtn.addEventListener('click', createSupplyRequest);
if (loadSupplierOffersBtn) loadSupplierOffersBtn.addEventListener('click', loadSupplierOffers);
if (supplierOffersSearchInput) supplierOffersSearchInput.addEventListener('input', renderSupplierOffers);
if (createSupplierOfferBtn) createSupplierOfferBtn.addEventListener('click', createSupplierOffer);
if (loadSupplyRequestsBtn) loadSupplyRequestsBtn.addEventListener('click', loadSupplyRequests);
if (supplyRequestsSearchInput) supplyRequestsSearchInput.addEventListener('input', renderSupplyRequests);
if (loadAdminDataBtn) loadAdminDataBtn.addEventListener('click', loadAdminData);
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await window.supabaseClient.auth.signOut();
    window.location.href = 'auth.html';
  });
}

window.loadWorkers = loadWorkers;
window.inviteWorker = inviteWorker;
window.loadInvites = loadInvites;
window.updateInviteStatus = updateInviteStatus;

initCabinet();
