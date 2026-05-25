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
  } else if (profile.role === 'restaurant') {
    showOnly(restaurantCabinet);
  } else if (profile.role === 'supplier') {
    showOnly(supplierCabinet);
  } else {
    showOnly(unknownRole);
  }
}

async function saveWorkerProfile() {
  if (!currentUser) return;

  if (workerProfileMessage) {
    workerProfileMessage.textContent = 'Сохраняем профиль...';
  }

  const payload = {
    user_id: currentUser.id,
    professions: value('workerProfessions')
      .split(',')
      .map(item => item.trim())
      .filter(Boolean),
    experience: value('workerExperience'),
    available_days: value('workerAvailableDays')
      .split(',')
      .map(item => item.trim())
      .filter(Boolean),
    available_time: value('workerAvailableTime'),
    min_rate: Number(value('workerMinRate')) || null,
    payment_type: value('workerPaymentType'),
    can_travel: checked('workerCanTravel'),
    travel_cities: value('workerTravelCities')
      .split(',')
      .map(item => item.trim())
      .filter(Boolean),
    travel_radius_km: Number(value('workerTravelRadiusKm')) || null,
    about: value('workerAbout'),
    updated_at: new Date().toISOString()
  };

  const { error } = await window.supabaseClient
    .from('worker_profiles')
    .upsert(payload, { onConflict: 'user_id' });

  if (error) {
    if (workerProfileMessage) {
      workerProfileMessage.textContent = 'Ошибка сохранения: ' + error.message;
    }
    return;
  }

  if (workerProfileMessage) {
    workerProfileMessage.textContent = 'Профиль работника сохранён.';
  }
}

async function loadWorkers() {
  if (!workersList || !workersMessage) {
    alert('Ошибка: на странице не найдены workersList или workersMessage');
    return;
  }

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
    return;
  }

  if (!data || data.length === 0) {
    workersMessage.textContent = 'Работников пока нет.';
    return;
  }

  workersMessage.textContent = `Найдено работников: ${data.length}`;

  data.forEach(worker => {
    const card = document.createElement('div');
    card.style.border = '1px solid #ddd';
    card.style.borderRadius = '12px';
    card.style.padding = '14px';
    card.style.marginTop = '12px';
    card.style.background = '#fff';

    card.innerHTML = `
      <strong>Профессии:</strong> ${(worker.professions || []).join(', ') || '-'}<br>
      <strong>Опыт:</strong> ${worker.experience || '-'}<br>
      <strong>Дни:</strong> ${(worker.available_days || []).join(', ') || '-'}<br>
      <strong>Время:</strong> ${worker.available_time || '-'}<br>
      <strong>Ставка:</strong> ${worker.min_rate || '-'}<br>
      <strong>Оплата:</strong> ${worker.payment_type || '-'}<br>
      <strong>Готов ехать:</strong> ${worker.can_travel ? 'да' : 'нет'}<br>
      <strong>Города:</strong> ${(worker.travel_cities || []).join(', ') || '-'}<br>
      <strong>Радиус:</strong> ${worker.travel_radius_km || '-'} км<br>
      <strong>О себе:</strong> ${worker.about || '-'}<br>
      <br>
      <button type="button">Пригласить на смену</button>
    `;

    workersList.appendChild(card);
  });
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
} else {
  console.error('Кнопка loadWorkersBtn не найдена в HTML');
}

initCabinet();
