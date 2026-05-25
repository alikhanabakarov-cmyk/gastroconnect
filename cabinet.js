// cabinet.js

const userInfo = document.getElementById('userInfo');

const workerCabinet = document.getElementById('workerCabinet');
const restaurantCabinet = document.getElementById('restaurantCabinet');
const supplierCabinet = document.getElementById('supplierCabinet');
const unknownRole = document.getElementById('unknownRole');

const logoutBtn = document.getElementById('logoutBtn');

const saveWorkerProfileBtn = document.getElementById('saveWorkerProfileBtn');
const workerProfileMessage = document.getElementById('workerProfileMessage');

let currentUser = null;

function textToArray(value) {
  return value
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

function setInputValue(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.value = value || '';
  }
}

function setCheckboxValue(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.checked = Boolean(value);
  }
}

async function loadCabinet() {
  userInfo.textContent = 'Проверяем вход...';

  const { data: sessionData, error: sessionError } = await window.supabaseClient.auth.getSession();

  if (sessionError) {
    userInfo.textContent = 'Ошибка проверки входа: ' + sessionError.message;
    return;
  }

  const session = sessionData.session;

  if (!session) {
    userInfo.textContent = 'Вы не вошли. Сейчас перенаправим на страницу входа...';
    window.location.href = 'auth.html?v=10';
    return;
  }

  currentUser = session.user;

  const { data: profile, error: profileError } = await window.supabaseClient
    .from('profiles')
    .select('role, name')
    .eq('id', currentUser.id)
    .single();

  if (profileError) {
    userInfo.textContent = 'Вход есть, но профиль не найден: ' + profileError.message;
    unknownRole.style.display = 'block';
    return;
  }

  if (!profile || !profile.role) {
    userInfo.textContent = 'Профиль найден, но роль не указана.';
    unknownRole.style.display = 'block';
    return;
  }

  userInfo.textContent = 'Вы вошли как: ' + currentUser.email + '. Роль: ' + profile.role;

  if (profile.role === 'worker') {
    workerCabinet.style.display = 'block';
    await loadWorkerProfile();
  } else if (profile.role === 'restaurant') {
    restaurantCabinet.style.display = 'block';
  } else if (profile.role === 'supplier') {
    supplierCabinet.style.display = 'block';
  } else {
    unknownRole.style.display = 'block';
  }
}

async function loadWorkerProfile() {
  if (!currentUser) return;

  const { data, error } = await window.supabaseClient
    .from('worker_profiles')
    .select('*')
    .eq('user_id', currentUser.id)
    .maybeSingle();

  if (error) {
    workerProfileMessage.textContent = 'Не удалось загрузить профиль работника: ' + error.message;
    return;
  }

  if (!data) {
    workerProfileMessage.textContent = 'Профиль работника пока не заполнен.';
    return;
  }

  setInputValue('workerProfessions', (data.professions || []).join(', '));
  setInputValue('workerExperience', data.experience);
  setInputValue('workerAvailableDays', (data.available_days || []).join(', '));
  setInputValue('workerAvailableTime', data.available_time);
  setInputValue('workerMinRate', data.min_rate);
  setInputValue('workerPaymentType', data.payment_type);
  setCheckboxValue('workerCanTravel', data.can_travel);
  setInputValue('workerTravelCities', (data.travel_cities || []).join(', '));
  setInputValue('workerTravelRadiusKm', data.travel_radius_km);
  setInputValue('workerAbout', data.about);

  workerProfileMessage.textContent = 'Профиль работника загружен.';
}

async function saveWorkerProfile() {
  if (!currentUser) {
    workerProfileMessage.textContent = 'Сначала нужно войти.';
    return;
  }

  workerProfileMessage.textContent = 'Сохраняем профиль...';

  const workerData = {
    user_id: currentUser.id,
    professions: textToArray(document.getElementById('workerProfessions').value),
    experience: document.getElementById('workerExperience').value.trim(),
    available_days: textToArray(document.getElementById('workerAvailableDays').value),
    available_time: document.getElementById('workerAvailableTime').value.trim(),
    min_rate: document.getElementById('workerMinRate').value
      ? Number(document.getElementById('workerMinRate').value)
      : null,
    payment_type: document.getElementById('workerPaymentType').value || null,
    can_travel: document.getElementById('workerCanTravel').checked,
    travel_cities: textToArray(document.getElementById('workerTravelCities').value),
    travel_radius_km: document.getElementById('workerTravelRadiusKm').value
      ? Number(document.getElementById('workerTravelRadiusKm').value)
      : null,
    about: document.getElementById('workerAbout').value.trim(),
    updated_at: new Date().toISOString()
  };

  const { data: existingProfile, error: checkError } = await window.supabaseClient
    .from('worker_profiles')
    .select('user_id')
    .eq('user_id', currentUser.id)
    .maybeSingle();

  if (checkError) {
    workerProfileMessage.textContent = 'Ошибка проверки профиля: ' + checkError.message;
    return;
  }

  let result;

  if (existingProfile) {
    result = await window.supabaseClient
      .from('worker_profiles')
      .update(workerData)
      .eq('user_id', currentUser.id);
  } else {
    result = await window.supabaseClient
      .from('worker_profiles')
      .insert(workerData);
  }

  if (result.error) {
    workerProfileMessage.textContent = 'Ошибка сохранения: ' + result.error.message;
    return;
  }

  workerProfileMessage.textContent = 'Профиль работника сохранён.';
}

if (saveWorkerProfileBtn) {
  saveWorkerProfileBtn.addEventListener('click', saveWorkerProfile);
}

logoutBtn.addEventListener('click', async () => {
  await window.supabaseClient.auth.signOut();
  window.location.href = 'auth.html?v=10';
});

loadCabinet();
