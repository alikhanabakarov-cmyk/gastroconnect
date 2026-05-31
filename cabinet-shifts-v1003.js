function shiftDateText(row) {
  const date = row.date_from || row.date_to || '-';
  const time = [row.time_from, row.time_to].filter(Boolean).join('вЂ“');
  return time ? `${date}, ${time}` : date;
}

async function createShiftPost() {
  const title = value('shiftTitle');
  const profession = value('shiftProfession');
  if (!title || !profession) {
    setMessage(shiftPostMessage, 'РЈРєР°Р¶РёС‚Рµ РЅР°Р·РІР°РЅРёРµ СЃРјРµРЅС‹ Рё РїСЂРѕС„РµСЃСЃРёСЋ.');
    return;
  }
  const payload = {
    restaurant_id: currentUser.id,
    title,
    profession,
    city: value('shiftCity') || currentProfile.city || null,
    district: value('shiftDistrict') || null,
    address: value('shiftAddress') || null,
    date_from: value('shiftDateFrom') || null,
    date_to: value('shiftDateFrom') || null,
    time_from: value('shiftTimeFrom') || null,
    time_to: value('shiftTimeTo') || null,
    rate: numberOrNull(value('shiftRate')),
    payment_type: 'per_shift',
    travel_bonus: false,
    accepts_other_city: true,
    requirements: value('shiftRequirements') || null,
    status: 'open',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  setMessage(shiftPostMessage, 'РџСѓР±Р»РёРєСѓРµРј СЃРјРµРЅСѓ...');
  const result = await dbInsert('shift_posts', payload, shiftPostMessage);
  if (result.error) {
    setMessage(shiftPostMessage, 'РћС€РёР±РєР° РїСѓР±Р»РёРєР°С†РёРё СЃРјРµРЅС‹: ' + result.error.message);
    return;
  }
  setMessage(shiftPostMessage, `РЎРјРµРЅР° РѕРїСѓР±Р»РёРєРѕРІР°РЅР°. РҐСЂР°РЅРёР»РёС‰Рµ: ${result.local ? 'Р»РѕРєР°Р»СЊРЅРѕ' : 'Supabase'}.`);
  await loadRestaurantShiftPosts();
}

async function loadShiftPosts() {
  if (!shiftPostsList) return;
  shiftPostsList.innerHTML = '';
  setMessage(shiftPostsMessage, 'Р—Р°РіСЂСѓР¶Р°РµРј СЃРјРµРЅС‹...');
  const result = await dbSelect('shift_posts', {}, shiftPostsMessage);
  if (result.error) {
    setMessage(shiftPostsMessage, 'РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё СЃРјРµРЅ: ' + result.error.message);
    return;
  }
  lastShiftPosts = (result.data || []).filter(row => (row.status || 'open') === 'open');
  renderShiftPosts();
}

function renderShiftPosts() {
  if (!shiftPostsList) return;
  const search = shiftSearchInput?.value.trim() || '';
  const rows = lastShiftPosts.filter(row => matchesSearch(row, search));
  shiftPostsList.innerHTML = '';
  rows.forEach(post => shiftPostsList.appendChild(renderShiftPostCard(post, true)));
  setMessage(shiftPostsMessage, rows.length ? `РќР°Р№РґРµРЅРѕ СЃРјРµРЅ: ${rows.length}` : 'РћС‚РєСЂС‹С‚С‹С… СЃРјРµРЅ РїРѕРєР° РЅРµС‚.');
}

function renderShiftPostCard(post, canApply = false) {
  const card = document.createElement('article');
  card.className = 'data-card';
  card.innerHTML = `
    <h4>${escapeHtml(post.title || post.profession || 'РЎРјРµРЅР°')}</h4>
    <p><strong>РџСЂРѕС„РµСЃСЃРёСЏ:</strong> ${escapeHtml(post.profession || '-')}</p>
    <p><strong>Р“РѕСЂРѕРґ:</strong> ${escapeHtml([post.city, post.district].filter(Boolean).join(', ') || '-')}</p>
    <p><strong>РљРѕРіРґР°:</strong> ${escapeHtml(shiftDateText(post))}</p>
    <p><strong>РЎС‚Р°РІРєР°:</strong> ${escapeHtml(post.rate ?? '-')} в‚Ѕ</p>
    <p><strong>РўСЂРµР±РѕРІР°РЅРёСЏ:</strong> ${escapeHtml(post.requirements || '-')}</p>
    <p><strong>РЎС‚Р°С‚СѓСЃ:</strong> <span class="status-pill">${escapeHtml(post.status || 'open')}</span></p>
    ${canApply ? '<div class="card-actions" style="margin-top:14px;"><button type="button" class="applyShiftBtn">РћС‚РєР»РёРєРЅСѓС‚СЊСЃСЏ</button></div><p class="applyStatus message"></p>' : ''}
  `;
  if (canApply) {
    const btn = card.querySelector('.applyShiftBtn');
    const status = card.querySelector('.applyStatus');
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      status.textContent = 'РћС‚РїСЂР°РІР»СЏРµРј РѕС‚РєР»РёРє...';
      const ok = await applyToShift(post, status);
      if (ok) btn.textContent = 'РћС‚РєР»РёРє РѕС‚РїСЂР°РІР»РµРЅ';
      else btn.disabled = false;
    });
  }
  return card;
}

async function applyToShift(post, statusNode) {
  const result = await dbInsert('shift_applications', {
    shift_id: post.id,
    worker_id: currentUser.id,
    restaurant_id: post.restaurant_id,
    message: 'Р“РѕС‚РѕРІ РІС‹Р№С‚Рё РЅР° СЃРјРµРЅСѓ',
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, statusNode);
  if (result.error) {
    setMessage(statusNode, 'РћС€РёР±РєР° РѕС‚РєР»РёРєР°: ' + result.error.message);
    return false;
  }
  setMessage(statusNode, `РћС‚РєР»РёРє РѕС‚РїСЂР°РІР»РµРЅ. РҐСЂР°РЅРёР»РёС‰Рµ: ${result.local ? 'Р»РѕРєР°Р»СЊРЅРѕ' : 'Supabase'}.`);
  return true;
}

async function loadRestaurantShiftPosts() {
  if (!restaurantShiftPostsList) return;
  restaurantShiftPostsList.innerHTML = '';
  setMessage(shiftPostMessage, 'Р—Р°РіСЂСѓР¶Р°РµРј РІР°С€Рё СЃРјРµРЅС‹...');
  const result = await dbSelect('shift_posts', { restaurant_id: currentUser.id }, shiftPostMessage);
  if (result.error) {
    setMessage(shiftPostMessage, 'РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё СЃРјРµРЅ: ' + result.error.message);
    return;
  }
  lastRestaurantShiftPosts = result.data || [];
  lastRestaurantShiftPosts.forEach(post => restaurantShiftPostsList.appendChild(renderShiftPostCard(post, false)));
  setMessage(shiftPostMessage, lastRestaurantShiftPosts.length ? `Р’Р°С€РёС… СЃРјРµРЅ: ${lastRestaurantShiftPosts.length}` : 'Р’С‹ РµС‰С‘ РЅРµ РїСѓР±Р»РёРєРѕРІР°Р»Рё СЃРјРµРЅС‹.');
}

async function loadShiftApplications() {
  if (!shiftApplicationsList) return;
  shiftApplicationsList.innerHTML = '';
  setMessage(shiftPostMessage, 'Р—Р°РіСЂСѓР¶Р°РµРј РѕС‚РєР»РёРєРё...');
  const result = await dbSelect('shift_applications', { restaurant_id: currentUser.id }, shiftPostMessage);
  if (result.error) {
    setMessage(shiftPostMessage, 'РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё РѕС‚РєР»РёРєРѕРІ: ' + result.error.message);
    return;
  }
  const rows = result.data || [];
  rows.forEach(application => {
    const card = document.createElement('article');
    card.className = 'data-card';
    const pending = application.status === 'pending';
    card.innerHTML = `
      <h4>РћС‚РєР»РёРє РЅР° СЃРјРµРЅСѓ</h4>
      <p><strong>Р Р°Р±РѕС‚РЅРёРє:</strong> ${escapeHtml(application.worker_id || '-')}</p>
      <p><strong>РЎРјРµРЅР°:</strong> ${escapeHtml(application.shift_id || '-')}</p>
      <p><strong>РЎРѕРѕР±С‰РµРЅРёРµ:</strong> ${escapeHtml(application.message || '-')}</p>
      <p><strong>РЎС‚Р°С‚СѓСЃ:</strong> <span class="status-pill">${escapeHtml(statusText(application.status))}</span></p>
      <div class="card-actions" style="margin-top:14px;">
        <button type="button" class="acceptApplicationBtn">РџСЂРёРЅСЏС‚СЊ</button>
        <button type="button" class="declineApplicationBtn">РћС‚РєР»РѕРЅРёС‚СЊ</button>
      </div>
      <p class="applicationStatus message"></p>
    `;
    const accept = card.querySelector('.acceptApplicationBtn');
    const decline = card.querySelector('.declineApplicationBtn');
    const status = card.querySelector('.applicationStatus');
    accept.disabled = !pending;
    decline.disabled = !pending;
    accept.addEventListener('click', () => updateShiftApplication(application.id, 'accepted', status));
    decline.addEventListener('click', () => updateShiftApplication(application.id, 'declined', status));
    shiftApplicationsList.appendChild(card);
  });
  setMessage(shiftPostMessage, rows.length ? `РћС‚РєР»РёРєРѕРІ: ${rows.length}` : 'РћС‚РєР»РёРєРѕРІ РїРѕРєР° РЅРµС‚.');
}

async function updateShiftApplication(applicationId, status, statusNode) {
  const result = await dbUpdate('shift_applications', { id: applicationId, restaurant_id: currentUser.id }, {
    status,
    updated_at: new Date().toISOString()
  }, statusNode);
  if (result.error) {
    setMessage(statusNode, 'РћС€РёР±РєР° РѕР±РЅРѕРІР»РµРЅРёСЏ РѕС‚РєР»РёРєР°: ' + result.error.message);
    return;
  }
  setMessage(statusNode, `РћС‚РєР»РёРє РѕР±РЅРѕРІР»С‘РЅ: ${statusText(status)}.`);
  await loadShiftApplications();
}

