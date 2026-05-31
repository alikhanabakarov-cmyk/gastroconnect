
async function loadWorkerProfile() {
  const result = await dbSelect('worker_profiles', { user_id: currentUser.id }, workerProfileMessage);
  if (result.error) {
    setMessage(workerProfileMessage, 'РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё РїСЂРѕС„РёР»СЏ: ' + result.error.message);
    return;
  }
  const data = result.data?.[0];
  if (!data) {
    setMessage(workerProfileMessage, 'Р—Р°РїРѕР»РЅРёС‚Рµ РїСЂРѕС„РёР»СЊ Рё РЅР°Р¶РјРёС‚Рµ вЂњРЎРѕС…СЂР°РЅРёС‚СЊвЂќ.');
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
  setMessage(workerProfileMessage, 'РџСЂРѕС„РёР»СЊ Р·Р°РіСЂСѓР¶РµРЅ.');
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
  setMessage(workerProfileMessage, 'РЎРѕС…СЂР°РЅСЏРµРј РїСЂРѕС„РёР»СЊ...');
  const result = await dbUpsert('worker_profiles', payload, 'user_id', workerProfileMessage);
  if (result.error) {
    setMessage(workerProfileMessage, 'РћС€РёР±РєР° СЃРѕС…СЂР°РЅРµРЅРёСЏ: ' + result.error.message);
    return;
  }
  setMessage(workerProfileMessage, `РџСЂРѕС„РёР»СЊ СЂР°Р±РѕС‚РЅРёРєР° СЃРѕС…СЂР°РЅС‘РЅ. РҐСЂР°РЅРёР»РёС‰Рµ: ${result.local ? 'Р»РѕРєР°Р»СЊРЅРѕ' : 'Supabase'}.`);
}

async function loadRestaurantProfile() {
  const result = await dbSelect('restaurant_profiles', { user_id: currentUser.id }, restaurantProfileMessage);
  if (result.error) {
    setMessage(restaurantProfileMessage, 'РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё РїСЂРѕС„РёР»СЏ Р·Р°РІРµРґРµРЅРёСЏ: ' + result.error.message);
    return;
  }
  const data = result.data?.[0];
  if (!data) {
    setMessage(restaurantProfileMessage, 'Р—Р°РїРѕР»РЅРёС‚Рµ РїСЂРѕС„РёР»СЊ Р·Р°РІРµРґРµРЅРёСЏ, С‡С‚РѕР±С‹ СЂР°Р±РѕС‚РЅРёРєРё Рё РїРѕСЃС‚Р°РІС‰РёРєРё РїРѕРЅРёРјР°Р»Рё, СЃ РєРµРј СЂР°Р±РѕС‚Р°СЋС‚.');
    return;
  }
  setValue('restaurantBusinessName', data.business_name || '');
  setValue('restaurantBusinessType', data.business_type || '');
  setValue('restaurantContactPerson', data.contact_person || '');
  setValue('restaurantCity', data.city || '');
  setValue('restaurantAddress', data.address || '');
  setValue('restaurantAbout', data.about || '');
  setMessage(restaurantProfileMessage, 'РџСЂРѕС„РёР»СЊ Р·Р°РІРµРґРµРЅРёСЏ Р·Р°РіСЂСѓР¶РµРЅ.');
}

async function saveRestaurantProfile() {
  const businessName = value('restaurantBusinessName');
  const city = value('restaurantCity');
  const payload = {
    user_id: currentUser.id,
    business_name: businessName || currentUser.email,
    business_type: value('restaurantBusinessType') || null,
    contact_person: value('restaurantContactPerson') || null,
    city: city || null,
    address: value('restaurantAddress') || null,
    about: value('restaurantAbout') || null,
    updated_at: new Date().toISOString()
  };
  setMessage(restaurantProfileMessage, 'РЎРѕС…СЂР°РЅСЏРµРј РїСЂРѕС„РёР»СЊ Р·Р°РІРµРґРµРЅРёСЏ...');
  const result = await dbUpsert('restaurant_profiles', payload, 'user_id', restaurantProfileMessage);
  if (result.error) {
    setMessage(restaurantProfileMessage, 'РћС€РёР±РєР° СЃРѕС…СЂР°РЅРµРЅРёСЏ РїСЂРѕС„РёР»СЏ Р·Р°РІРµРґРµРЅРёСЏ: ' + result.error.message);
    return;
  }
  const profilePatch = {
    name: payload.business_name,
    city: payload.city || '',
    updated_at: new Date().toISOString()
  };
  await dbUpdate('profiles', { id: currentUser.id }, profilePatch);
  currentProfile = { ...currentProfile, ...profilePatch };
  setMessage(restaurantProfileMessage, `РџСЂРѕС„РёР»СЊ Р·Р°РІРµРґРµРЅРёСЏ СЃРѕС…СЂР°РЅС‘РЅ. РҐСЂР°РЅРёР»РёС‰Рµ: ${result.local ? 'Р»РѕРєР°Р»СЊРЅРѕ' : 'Supabase'}.`);
}

async function loadSupplierProfile() {
  const result = await dbSelect('supplier_profiles', { user_id: currentUser.id }, supplierProfileMessage);
  if (result.error) {
    setMessage(supplierProfileMessage, 'РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё РїСЂРѕС„РёР»СЏ РїРѕСЃС‚Р°РІС‰РёРєР°: ' + result.error.message);
    return;
  }
  const data = result.data?.[0];
  if (!data) {
    setMessage(supplierProfileMessage, 'Р—Р°РїРѕР»РЅРёС‚Рµ РїСЂРѕС„РёР»СЊ РїРѕСЃС‚Р°РІС‰РёРєР°, С‡С‚РѕР±С‹ Р·Р°РІРµРґРµРЅРёСЏ РїРѕРЅРёРјР°Р»Рё РєР°С‚РµРіРѕСЂРёСЋ, РіРѕСЂРѕРґ Рё СѓСЃР»РѕРІРёСЏ РґРѕСЃС‚Р°РІРєРё.');
    return;
  }
  setValue('supplierCompanyName', data.company_name || '');
  setValue('supplierProfileCategory', data.category || '');
  setValue('supplierContactPerson', data.contact_person || '');
  setValue('supplierProfileCity', data.city || '');
  setValue('supplierDeliveryCities', showArray(data.delivery_cities));
  setValue('supplierProfileAbout', data.about || '');
  setMessage(supplierProfileMessage, 'РџСЂРѕС„РёР»СЊ РїРѕСЃС‚Р°РІС‰РёРєР° Р·Р°РіСЂСѓР¶РµРЅ.');
}

async function saveSupplierProfile() {
  const companyName = value('supplierCompanyName');
  const city = value('supplierProfileCity');
  const payload = {
    user_id: currentUser.id,
    company_name: companyName || currentUser.email,
    contact_person: value('supplierContactPerson') || null,
    city: city || null,
    delivery_cities: textToArray(value('supplierDeliveryCities')),
    category: value('supplierProfileCategory') || null,
    about: value('supplierProfileAbout') || null,
    updated_at: new Date().toISOString()
  };
  setMessage(supplierProfileMessage, 'РЎРѕС…СЂР°РЅСЏРµРј РїСЂРѕС„РёР»СЊ РїРѕСЃС‚Р°РІС‰РёРєР°...');
  const result = await dbUpsert('supplier_profiles', payload, 'user_id', supplierProfileMessage);
  if (result.error) {
    setMessage(supplierProfileMessage, 'РћС€РёР±РєР° СЃРѕС…СЂР°РЅРµРЅРёСЏ РїСЂРѕС„РёР»СЏ РїРѕСЃС‚Р°РІС‰РёРєР°: ' + result.error.message);
    return;
  }
  const profilePatch = {
    name: payload.company_name,
    city: payload.city || '',
    updated_at: new Date().toISOString()
  };
  await dbUpdate('profiles', { id: currentUser.id }, profilePatch);
  currentProfile = { ...currentProfile, ...profilePatch };
  setMessage(supplierProfileMessage, `РџСЂРѕС„РёР»СЊ РїРѕСЃС‚Р°РІС‰РёРєР° СЃРѕС…СЂР°РЅС‘РЅ. РҐСЂР°РЅРёР»РёС‰Рµ: ${result.local ? 'Р»РѕРєР°Р»СЊРЅРѕ' : 'Supabase'}.`);
}

function matchesSearch(row, search) {
  if (!search) return true;
  return JSON.stringify(row).toLowerCase().includes(search.toLowerCase());
}

async function loadWorkers() {
  workersList.innerHTML = '';
  setMessage(workersMessage, 'Р—Р°РіСЂСѓР¶Р°РµРј СЂР°Р±РѕС‚РЅРёРєРѕРІ...');
  const result = await dbSelect('worker_profiles', {}, workersMessage);
  if (result.error) {
    setMessage(workersMessage, 'РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё СЂР°Р±РѕС‚РЅРёРєРѕРІ: ' + result.error.message);
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
  setMessage(workersMessage, rows.length ? `РќР°Р№РґРµРЅРѕ СЂР°Р±РѕС‚РЅРёРєРѕРІ: ${rows.length}` : 'Р Р°Р±РѕС‚РЅРёРєРё РЅРµ РЅР°Р№РґРµРЅС‹.');
}

function renderWorkerCard(worker) {
  const card = document.createElement('article');
  card.className = 'data-card';
  card.innerHTML = `
    <h4>${escapeHtml(showArray(worker.professions))}</h4>
    <p><strong>РћРїС‹С‚:</strong> ${escapeHtml(worker.experience || '-')}</p>
    <p><strong>Р”РЅРё:</strong> ${escapeHtml(showArray(worker.available_days))}</p>
    <p><strong>Р’СЂРµРјСЏ:</strong> ${escapeHtml(worker.available_time || '-')}</p>
    <p><strong>РЎС‚Р°РІРєР°:</strong> ${escapeHtml(worker.min_rate ?? '-')}</p>
    <p><strong>РћРїР»Р°С‚Р°:</strong> ${escapeHtml(paymentText(worker.payment_type))}</p>
    <p><strong>Р“РѕС‚РѕРІ РµС…Р°С‚СЊ:</strong> ${worker.can_travel ? 'РґР°' : 'РЅРµС‚'}</p>
    <p><strong>Р“РѕСЂРѕРґР°:</strong> ${escapeHtml(showArray(worker.travel_cities))}</p>
    <p><strong>Рћ СЃРµР±Рµ:</strong> ${escapeHtml(worker.about || '-')}</p>
    <div class="card-actions" style="margin-top:14px;">
      <button type="button" class="inviteWorkerBtn">РџСЂРёРіР»Р°СЃРёС‚СЊ РЅР° СЃРјРµРЅСѓ</button>
    </div>
    <p class="inviteStatus message"></p>
  `;
  const btn = card.querySelector('.inviteWorkerBtn');
  const status = card.querySelector('.inviteStatus');
  if (!worker.user_id) {
    btn.disabled = true;
    status.textContent = 'РЈ Р°РЅРєРµС‚С‹ РЅРµС‚ user_id.';
  } else {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      status.textContent = 'РћС‚РїСЂР°РІР»СЏРµРј РїСЂРёРіР»Р°С€РµРЅРёРµ...';
      const ok = await inviteWorker(worker.user_id, status);
      if (ok) btn.textContent = 'РџСЂРёРіР»Р°С€РµРЅРёРµ РѕС‚РїСЂР°РІР»РµРЅРѕ';
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
    message: 'РџСЂРёРіР»Р°С€РµРЅРёРµ РЅР° СЃРјРµРЅСѓ',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  const result = await dbInsert('shift_invites', payload, statusNode);
  if (result.error) {
    setMessage(statusNode, 'РћС€РёР±РєР° РїСЂРёРіР»Р°С€РµРЅРёСЏ: ' + result.error.message);
    return false;
  }
  setMessage(statusNode, `РџСЂРёРіР»Р°С€РµРЅРёРµ РѕС‚РїСЂР°РІР»РµРЅРѕ. РҐСЂР°РЅРёР»РёС‰Рµ: ${result.local ? 'Р»РѕРєР°Р»СЊРЅРѕ' : 'Supabase'}.`);
  return true;
}

async function loadInvites() {
  invitesList.innerHTML = '';
  setMessage(invitesMessage, 'Р—Р°РіСЂСѓР¶Р°РµРј РїСЂРёРіР»Р°С€РµРЅРёСЏ...');
  const result = await dbSelect('shift_invites', { worker_id: currentUser.id }, invitesMessage);
  if (result.error) {
    setMessage(invitesMessage, 'РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё РїСЂРёРіР»Р°С€РµРЅРёР№: ' + result.error.message);
    return;
  }
  const rows = result.data || [];
  rows.forEach(invite => invitesList.appendChild(renderInviteCard(invite)));
  setMessage(invitesMessage, rows.length ? `РќР°Р№РґРµРЅРѕ РїСЂРёРіР»Р°С€РµРЅРёР№: ${rows.length}` : 'РџСЂРёРіР»Р°С€РµРЅРёР№ РїРѕРєР° РЅРµС‚.');
}

function renderInviteCard(invite) {
  const card = document.createElement('article');
  card.className = 'data-card';
  const pending = invite.status === 'pending';
  card.innerHTML = `
    <h4>РџСЂРёРіР»Р°С€РµРЅРёРµ РЅР° СЃРјРµРЅСѓ</h4>
    <p><strong>РЎС‚Р°С‚СѓСЃ:</strong> <span class="status-pill">${escapeHtml(statusText(invite.status))}</span></p>
    <p><strong>РЎРѕРѕР±С‰РµРЅРёРµ:</strong> ${escapeHtml(invite.message || '-')}</p>
    <div class="card-actions" style="margin-top:14px;">
      <button type="button" class="acceptInviteBtn">РџСЂРёРЅСЏС‚СЊ</button>
      <button type="button" class="declineInviteBtn">РћС‚РєР»РѕРЅРёС‚СЊ</button>
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
    alert('РћС€РёР±РєР° РѕР±РЅРѕРІР»РµРЅРёСЏ РїСЂРёРіР»Р°С€РµРЅРёСЏ: ' + result.error.message);
    return;
  }
  await loadInvites();
}

