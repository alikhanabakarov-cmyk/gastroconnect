// cabinet.js

const userInfo = document.getElementById('userInfo');

const workerCabinet = document.getElementById('workerCabinet');
const restaurantCabinet = document.getElementById('restaurantCabinet');
const supplierCabinet = document.getElementById('supplierCabinet');
const unknownRole = document.getElementById('unknownRole');

const logoutBtn = document.getElementById('logoutBtn');

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
    window.location.href = 'auth.html';
    return;
  }

  const user = session.user;

  userInfo.textContent = 'Вы вошли как: ' + user.email;

  const { data: profile, error: profileError } = await window.supabaseClient
    .from('profiles')
    .select('role, email')
    .eq('id', user.id)
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

  userInfo.textContent = 'Вы вошли как: ' + profile.email + '. Роль: ' + profile.role;

  if (profile.role === 'worker') {
    workerCabinet.style.display = 'block';
  } else if (profile.role === 'restaurant') {
    restaurantCabinet.style.display = 'block';
  } else if (profile.role === 'supplier') {
    supplierCabinet.style.display = 'block';
  } else {
    unknownRole.style.display = 'block';
  }
}

logoutBtn.addEventListener('click', async () => {
  await window.supabaseClient.auth.signOut();
  window.location.href = 'auth.html';
});

loadCabinet();
