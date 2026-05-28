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
  if (el) el.value = val ?? '';
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

function showArray(value) {
  if (Array.isArray(value)) {
    return value.length ? value.join(', ') : '-';
  }

  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return String(value);
}

function showBool(value) {
  return value ? 'да' : 'нет';
}

function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function paymentText(value) {
  const map = {
    per_shift: 'За смену',
    per_hour: 'За час',
    per_day: 'За день',
    per_month: 'За месяц'
  };

  return map[value] || value || '-';
}

async function initCabinet() {
  if (!window.supabaseClient) {
    if (userInfo) userInfo.textContent = 'Ошибка: Supabase не подключён.';
    return;
  }

  const { data: sessionData, error: sessionError } =
    await window.supabaseClient.auth.getSession();

  if (sessionError || !sessionData || !sessionData.session) {
    window.location.href = 'auth.html';
    return;
  }

  currentUser = sessionData.session.user;

  const { data: profile, error: profileError } = await window.supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .maybeSingle();

  if (profileError || !profile) {
    if (userInfo) {
      userInfo.textContent = 'Профиль пользователя не найден. Проверьте таблицу profiles.';
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
    .upsert(payload, { onConflict: 'user_id' });

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
    .select(`
      user_id,
      professions,
      experience,
      available_days,
      available_time,
      min_rate,
      payment_type,
      can_travel,
      travel_cities,
      travel_radius_km,
      about,
      updated_at
    `)
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

    const workerId = worker.user_id;

    card.innerHTML = `
      <p><strong>Профессии:</strong> ${escapeHtml(showArray(worker.professions))}</p>
      <p><strong>Опыт:</strong> ${escapeHtml(worker.experience || '-')}</p>
      <p><strong>Дни:</strong> ${escapeHtml(showArray(worker.available_days))}</p>
      <p><strong>Время:</strong> ${escapeHtml(worker.available_time || '-')}</p>
      <p><strong>Ставка:</strong> ${escapeHtml(worker.min_rate || '-')}</p>
      <p><strong>Оплата:</strong> ${escapeHtml(paymentText(worker.payment_type))}</p>
      <p><strong>Готов ехать:</strong> ${escapeHtml(showBool(worker.can_travel))}</p>
      <p><strong>Города:</strong> ${escapeHtml(showArray(worker.travel_cities))}</p>
      <p><strong>Радиус:</strong> ${escapeHtml(worker.travel_radius_km || '-')} км</p>
      <p><strong>О себе:</strong> ${escapeHtml(worker.about || '-')}</p>

      <button type="button" class="inviteWorkerBtn">Пригласить на смену</button>
      <p class="inviteStatus"></p>
    `;

    const inviteBtn = card.querySelector('.inviteWorkerBtn');
    const inviteStatus = card.querySelector('.inviteStatus');

    if (!workerId) {
      inviteBtn.disabled = true;
      inviteStatus.textContent = 'Ошибка: у работника нет user_id';
    } else {
      inviteBtn.addEventListener('click', async () => {
        inviteBtn.disabled = true;
        inviteStatus.textContent = 'Отправляем приглашение...';

        await inviteWorker(workerId, inviteStatus);

        inviteBtn.disabled = false;
      });
    }

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
      message: 'Приглашение на смену',
      updated_at: new Date().toISOString()
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
      <h4>Приглашение на смену</h4>
      <p><strong>Статус:</strong> ${escapeHtml(invite.status || '-')}</p>
      <p><strong>Сообщение:</strong> ${escapeHtml(invite.message || '-')}</p>

      <button type="button" class="acceptInviteBtn">Принять</button>
      <button type="button" class="declineInviteBtn">Отклонить</button>
      <p class="inviteUpdateStatus"></p>
    `;

    const acceptBtn = card.querySelector('.acceptInviteBtn');
    const declineBtn = card.querySelector('.declineInviteBtn');
    const inviteUpdateStatus = card.querySelector('.inviteUpdateStatus');

    if (invite.status !== 'pending') {
      acceptBtn.disabled = true;
      declineBtn.disabled = true;
    }

    acceptBtn.addEventListener('click', async () => {
      acceptBtn.disabled = true;
      declineBtn.disabled = true;
      inviteUpdateStatus.textContent = 'Сохраняем...';

      await updateInviteStatus(invite.id, 'accepted');

      inviteUpdateStatus.textContent = 'Принято';
    });

    declineBtn.addEventListener('click', async () => {
      acceptBtn.disabled = true;
      declineBtn.disabled = true;
      inviteUpdateStatus.textContent = 'Сохраняем...';

      await updateInviteStatus(invite.id, 'declined');

      inviteUpdateStatus.textContent = 'Отклонено';
    });

    workerInvitesList.appendChild(card);
  });

  workerInvitesMessage.textContent = 'Найдено приглашений: ' + invites.length;
}

async function updateInviteStatus(inviteId, status) {
  if (!currentUser) return;

  const { error } = await window.supabaseClient
    .from('shift_invites')
    .update({
      status: status,
      updated_at: new Date().toISOString()
    })
    .eq('id', inviteId)
    .eq('worker_id', currentUser.id);

  if (error) {
    alert('Ошибка обновления приглашения: ' + error.message);
    console.error(error);
    return;
  }

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
