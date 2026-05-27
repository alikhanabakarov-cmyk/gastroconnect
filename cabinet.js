// cabinet.js

const userInfo = document.getElementById('userInfo');

const workerCabinet = document.getElementById('workerCabinet');
const restaurantCabinet = document.getElementById('restaurantCabinet');
const supplierCabinet = document.getElementById('supplierCabinet');
const unknownRole = document.getElementById('unknownRole');

const logoutBtn = document.getElementById('logoutBtn');

const saveWorkerProfileBtn = document.getElementById('saveWorkerProfileBtn');
const workerProfileMessage = document.getElementById('workerProfileMessage');

const loadWorkersBtn = document.getElementById('loadWorkersBtn');
const workersList = document.getElementById('workersList');
const workersMessage = document.getElementById('workersMessage');

const loadWorkerInvitesBtn = document.getElementById('loadWorkerInvitesBtn');
const workerInvitesList = document.getElementById('workerInvitesList');
const workerInvitesMessage = document.getElementById('workerInvitesMessage');

let currentUser = null;
let currentProfile = null;

function showOnly(section) {
  if (workerCabinet) workerCabinet.style.display = 'none';
  if (restaurantCabinet) restaurantCabinet.style.display = 'none';
  if (supplierCabinet) supplierCabinet.style.display = 'none';
  if (unknownRole) unknownRole.style.display = 'none';

  if (section) section.style.display = 'block';
}

function value(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function checked(id) {
  const el = document.getElementById(id);
  return el ? el.checked : false;
}

function setValue(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}

function setChecked(id, val) {
  const el = document.getElementById(id);
  if (el) el.checked = Boolean(val);
}

function textToArray(text) {
  return String(text || '')
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

function showArray(arr) {
  if (Array.isArray(arr)) {
    return arr.length ? arr.join(', ') : '-';
  }

  return arr || '-';
}

function showBool(val) {
  return val ? 'да' : 'нет';
}

async function initCabinet() {
  if (!window.supabaseClient) {
    if (userInfo) userInfo.textContent = 'Ошибка: Supabase не подключён.';
    return;
  }

  const { data: sessionData, error: sessionError } = await window.supabaseClient.auth.getSession();

  if (sessionError || !sessionData.session) {
    window.location.href = 'auth.html';
    return;
  }

  currentUser = sessionData.session.user;

  const { data: profile, error: profileError } = await window.supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();

  if (profileError || !profile) {
    if (userInfo) {
      userInfo.textContent = 'Профиль пользователя не найден.';
    }

    showOnly(unknownRole);
    return;
  }

  currentProfile = profile;

  if (userInfo) {
    userInfo.textContent = `Вы вошли как: ${currentUser.email}. Роль: ${profile.role}`;
  }

  if (profile.role === 'worker') {
    showOnly(workerCabinet);
    await loadWorkerProfile();
    await loadWorkerInvites();
    return;
  }

  if (profile.role === 'restaurant') {
    showOnly(restaurantCabinet);
    await loadWorkers();
    return;
  }

  if (profile.role === 'supplier') {
    showOnly(supplierCabinet);
    return;
  }

  showOnly(unknownRole);
}

async function loadWorkerProfile() {
  if (!currentUser) return;

  const { data, error } = await window.supabaseClient
    .from('worker_profiles')
    .select('*')
    .eq('user_id', currentUser.id)
    .maybeSingle();

  if (error) {
    if (workerProfileMessage) {
      workerProfileMessage.textContent = 'Ошибка загрузки профиля: ' + error.message;
    }

    console.error(error);
    return;
  }

  if (!data) return;

  setValue('workerProfessions', showArray(data.professions));
  setValue('workerExperience', data.experience);
  setValue('workerAvailableDays', showArray(data.available_days));
  setValue('workerAvailableTime', data.available_time);
  setValue('workerMinRate', data.min_rate);
  setValue('workerPaymentType', data.payment_type || 'per_shift');
  setChecked('workerCanTravel', data.can_travel);
  setValue('workerTravelCities', showArray(data.travel_cities));
  setValue('workerTravelRadiusKm', data.travel_radius_km);
  setValue('workerAbout', data.about);
}

async function saveWorkerProfile() {
  if (!currentUser) {
    alert('Сначала войдите в аккаунт');
    return;
  }

  if (workerProfileMessage) {
    workerProfileMessage.textContent = 'Сохраняем профиль...';
  }

  const minRateRaw = value('workerMinRate');
  const radiusRaw = value('workerTravelRadiusKm');

  const payload = {
    user_id: currentUser.id,
    professions: textToArray(value('workerProfessions')),
    experience: value('workerExperience') || null,
    available_days: textToArray(value('workerAvailableDays')),
    available_time: value('workerAvailableTime') || null,
    min_rate: minRateRaw ? Number(minRateRaw) : null,
    payment_type: value('workerPaymentType') || 'per_shift',
    can_travel: checked('workerCanTravel'),
    travel_cities: textToArray(value('workerTravelCities')),
    travel_radius_km: radiusRaw ? Number(radiusRaw) : null,
    about: value('workerAbout') || null,
    updated_at: new Date().toISOString()
  };

  const { error } = await window.supabaseClient
    .from('worker_profiles')
    .upsert(payload, {
      onConflict: 'user_id'
    });

  if (error) {
    if (workerProfileMessage) {
      workerProfileMessage.textContent = 'Ошибка сохранения: ' + error.message;
    }

    console.error(error);
    return;
  }

  if (workerProfileMessage) {
    workerProfileMessage.textContent = 'Профиль работника сохранён.';
  }
}

async function loadWorkers() {
  if (!workersList || !workersMessage) return;

  workersMessage.textContent = 'Загружаем работников...';
  workersList.innerHTML = '';

  const { data, error } = await window.supabaseClient
    .from('worker_profiles')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    workersMessage.textContent = 'Ошибка загрузки работников: ' + error.message;
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    workersMessage.textContent = 'Работников пока нет';
    return;
  }

  data.forEach(worker => {
    const card = document.createElement('div');

    card.style.border = '1px solid #ddd';
    card.style.borderRadius = '10px';
    card.style.padding = '14px';
    card.style.background = '#fff';

    card.innerHTML = `
      <strong>Профессии:</strong> ${showArray(worker.professions)}<br>
      <strong>Опыт:</strong> ${worker.experience || '-'}<br>
      <strong>Дни:</strong> ${showArray(worker.available_days)}<br>
      <strong>Время:</strong> ${worker.available_time || '-'}<br>
      <strong>Ставка:</strong> ${worker.min_rate || '-'}<br>
      <strong>Оплата:</strong> ${worker.payment_type || '-'}<br>
      <strong>Готов ехать:</strong> ${showBool(worker.can_travel)}<br>
      <strong>Города:</strong> ${showArray(worker.travel_cities)}<br>
      <strong>Радиус:</strong> ${worker.travel_radius_km || '-'} км<br>
      <strong>О себе:</strong> ${worker.about || '-'}<br>
      <br>
      <button type="button" class="inviteWorkerBtn">Пригласить на смену</button>
      <span class="inviteStatus" style="margin-left: 10px;"></span>
    `;

    const inviteBtn = card.querySelector('.inviteWorkerBtn');
    const inviteStatus = card.querySelector('.inviteStatus');

    inviteBtn.addEventListener('click', async () => {
      inviteBtn.disabled = true;
      inviteStatus.textContent = 'Отправляем...';

      await inviteWorker(worker.user_id, inviteStatus);

      inviteBtn.disabled = false;
    });

    workersList.appendChild(card);
  });

  workersMessage.textContent = 'Найдено работников: ' + data.length;
}

async function inviteWorker(workerId, statusEl) {
  if (!currentUser) {
    alert('Сначала войдите в аккаунт заведения');
    return;
  }

  const { error } = await window.supabaseClient
    .from('shift_invites')
    .insert({
      restaurant_id: currentUser.id,
      worker_id: workerId,
      status: 'pending',
      message: 'Приглашение на смену'
    });

  if (error) {
    const text = 'Ошибка приглашения: ' + error.message;

    if (statusEl) statusEl.textContent = text;
    alert(text);
    console.error(error);
    return;
  }

  if (statusEl) statusEl.textContent = 'Приглашение отправлено';
  alert('Приглашение отправлено');
}

async function loadWorkerInvites() {
  if (!workerInvitesList || !workerInvitesMessage) return;

  if (!currentUser) {
    workerInvitesMessage.textContent = 'Сначала войдите в аккаунт работника';
    return;
  }

  workerInvitesMessage.textContent = 'Загружаем приглашения...';
  workerInvitesList.innerHTML = '';

  const { data: invites, error } = await window.supabaseClient
    .from('shift_invites')
    .select('*')
    .eq('worker_id', currentUser.id)
    .order('created_at', { ascending: false });

  if (error) {
    workerInvitesMessage.textContent = 'Ошибка загрузки приглашений: ' + error.message;
    console.error(error);
    return;
  }

  if (!invites || invites.length === 0) {
    workerInvitesMessage.textContent = 'Приглашений пока нет';
    return;
  }

  invites.forEach(invite => {
    const card = document.createElement('div');

    card.style.border = '1px solid #ddd';
    card.style.borderRadius = '10px';
    card.style.padding = '14px';
    card.style.background = '#fff';

    card.innerHTML = `
      <strong>Приглашение на смену</strong><br>
      <strong>Статус:</strong> ${invite.status}<br>
      <strong>Сообщение:</strong> ${invite.message || '-'}<br>
      <br>
      <button type="button" class="acceptInviteBtn">Принять</button>
      <button type="button" class="declineInviteBtn">Отклонить</button>
    `;

    const acceptBtn = card.querySelector('.acceptInviteBtn');
    const declineBtn = card.querySelector('.declineInviteBtn');

    if (invite.status !== 'pending') {
      acceptBtn.disabled = true;
      declineBtn.disabled = true;
    }

    acceptBtn.addEventListener('click', () => {
      updateInviteStatus(invite.id, 'accepted');
    });

    declineBtn.addEventListener('click', () => {
      updateInviteStatus(invite.id, 'declined');
    });

    workerInvitesList.appendChild(card);
  });

  workerInvitesMessage.textContent = 'Найдено приглашений: ' + invites.length;
}

async function updateInviteStatus(inviteId, status) {
  const { error } = await window.supabaseClient
    .from('shift_invites')
    .update({
      status: status,
      updated_at: new Date().toISOString()
    })
    .eq('id', inviteId);

  if (error) {
    alert('Ошибка обновления приглашения: ' + error.message);
    console.error(error);
    return;
  }

  alert(status === 'accepted' ? 'Приглашение принято' : 'Приглашение отклонено');

  await loadWorkerInvites();
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await window.supabaseClient.auth.signOut();
    window.location.href = 'auth.html';
  });
}

if (saveWorkerProfileBtn) {
  saveWorkerProfileBtn.addEventListener('click', saveWorkerProfile);
}

if (loadWorkersBtn) {
  loadWorkersBtn.addEventListener('click', loadWorkers);
}

if (loadWorkerInvitesBtn) {
  loadWorkerInvitesBtn.addEventListener('click', loadWorkerInvites);
}

window.loadWorkers = loadWorkers;
window.inviteWorker = inviteWorker;
window.loadWorkerInvites = loadWorkerInvites;

initCabinet();
