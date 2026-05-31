async function createSupplyRequest() {
  const title = value('supplyRequestTitle');
  if (!title) {
    setMessage(supplyRequestMessageBox, 'РЈРєР°Р¶РёС‚Рµ, С‡С‚Рѕ РЅСѓР¶РЅРѕ Р·Р°РІРµРґРµРЅРёСЋ.');
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
    if (!isDbUnavailable(result.error)) {
      setMessage(supplyRequestMessageBox, 'РћС€РёР±РєР° РїСѓР±Р»РёРєР°С†РёРё Р·Р°РїСЂРѕСЃР°: ' + result.error.message);
      return;
    }
    const local = localInsert('supply_requests', payload);
    setMessage(supplyRequestMessageBox, 'Р—Р°РїСЂРѕСЃ СЃРѕС…СЂР°РЅС‘РЅ Р»РѕРєР°Р»СЊРЅРѕ. Р”Р»СЏ РѕР±С‰РµР№ Р»РµРЅС‚С‹ РїРѕСЃС‚Р°РІС‰РёРєРѕРІ РЅСѓР¶РЅРѕ РїСЂРёРјРµРЅРёС‚СЊ SQL-РјРёРіСЂР°С†РёСЋ supply_requests РІ Supabase.');
    noteLocalMode(local, supplyRequestMessageBox);
    return;
  }
  setMessage(supplyRequestMessageBox, `Р—Р°РїСЂРѕСЃ РѕРїСѓР±Р»РёРєРѕРІР°РЅ. РҐСЂР°РЅРёР»РёС‰Рµ: ${result.local ? 'Р»РѕРєР°Р»СЊРЅРѕ' : 'Supabase'}.`);
}

async function loadSupplierOffers() {
  supplierOffersList.innerHTML = '';
  setMessage(supplyRequestMessageBox, 'Р—Р°РіСЂСѓР¶Р°РµРј РїСЂРµРґР»РѕР¶РµРЅРёСЏ РїРѕСЃС‚Р°РІС‰РёРєРѕРІ...');
  const result = await dbSelect('supplier_offers', {}, supplyRequestMessageBox);
  if (result.error) {
    setMessage(supplyRequestMessageBox, 'РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё РїСЂРµРґР»РѕР¶РµРЅРёР№: ' + result.error.message);
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
  if (!rows.length) setMessage(supplyRequestMessageBox, 'РџСЂРµРґР»РѕР¶РµРЅРёСЏ РїРѕСЃС‚Р°РІС‰РёРєРѕРІ РЅРµ РЅР°Р№РґРµРЅС‹.');
}

function renderSupplierOfferCard(offer) {
  const card = document.createElement('article');
  card.className = 'data-card';
  const deliveryCities = offer.delivery_cities || offer.city || '-';
  const canRequest = currentProfile?.role === 'restaurant' && offer.id && offer.supplier_id;
  card.innerHTML = `
    <h4>${escapeHtml(offer.title || '-')}</h4>
    <p><strong>РљР°С‚РµРіРѕСЂРёСЏ:</strong> ${escapeHtml(offer.category || '-')}</p>
    <p><strong>РўРѕРІР°СЂ:</strong> ${escapeHtml(offer.product_name || offer.title || '-')}</p>
    <p><strong>Р¦РµРЅР°:</strong> ${escapeHtml(offer.price ?? '-')} ${escapeHtml(offer.unit || '')}</p>
    <p><strong>РњРёРЅРёРјР°Р»СЊРЅС‹Р№ Р·Р°РєР°Р·:</strong> ${escapeHtml(offer.min_order || offer.quantity || '-')}</p>
    <p><strong>Р“РѕСЂРѕРґР° РґРѕСЃС‚Р°РІРєРё:</strong> ${escapeHtml(showArray(deliveryCities))}</p>
    <p><strong>РћРїРёСЃР°РЅРёРµ:</strong> ${escapeHtml(offer.description || offer.message || '-')}</p>
    ${canRequest ? '<div class="card-actions" style="margin-top:14px;"><button type="button" class="requestSupplierBtn">РћС‚РїСЂР°РІРёС‚СЊ Р·Р°РїСЂРѕСЃ</button></div><p class="supplierRequestStatus message"></p>' : ''}
  `;
  if (canRequest) {
    const btn = card.querySelector('.requestSupplierBtn');
    const status = card.querySelector('.supplierRequestStatus');
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      status.textContent = 'РћС‚РїСЂР°РІР»СЏРµРј Р·Р°РїСЂРѕСЃ РїРѕСЃС‚Р°РІС‰РёРєСѓ...';
      const ok = await requestSupplierOffer(offer, status);
      if (ok) btn.textContent = 'Р—Р°РїСЂРѕСЃ РѕС‚РїСЂР°РІР»РµРЅ';
      else btn.disabled = false;
    });
  }
  return card;
}

async function requestSupplierOffer(offer, statusNode) {
  const message = [
    value('supplyRequestTitle'),
    value('supplyRequestQuantity'),
    value('supplyRequestBudget'),
    value('supplyRequestCity'),
    value('supplyRequestMessage')
  ].filter(Boolean).join(' | ') || 'РРЅС‚РµСЂРµСЃСѓРµС‚ РїРѕСЃС‚Р°РІРєР° РїРѕ РІР°С€РµРјСѓ РїСЂРµРґР»РѕР¶РµРЅРёСЋ';
  const result = await dbInsert('supplier_inquiries', {
    offer_id: offer.id,
    restaurant_id: currentUser.id,
    supplier_id: offer.supplier_id,
    message,
    status: 'new',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, statusNode);
  if (result.error) {
    setMessage(statusNode, 'РћС€РёР±РєР° Р·Р°РїСЂРѕСЃР° РїРѕСЃС‚Р°РІС‰РёРєСѓ: ' + result.error.message);
    return false;
  }
  setMessage(statusNode, `Р—Р°РїСЂРѕСЃ РѕС‚РїСЂР°РІР»РµРЅ РїРѕСЃС‚Р°РІС‰РёРєСѓ. РҐСЂР°РЅРёР»РёС‰Рµ: ${result.local ? 'Р»РѕРєР°Р»СЊРЅРѕ' : 'Supabase'}.`);
  return true;
}

async function createSupplierOffer() {
  const title = value('supplierOfferTitle');
  if (!title) {
    setMessage(supplierOfferMessageBox, 'РЈРєР°Р¶РёС‚Рµ С‚РѕРІР°СЂ РёР»Рё СѓСЃР»СѓРіСѓ.');
    return;
  }
  const payload = {
    supplier_id: currentUser.id,
    title,
    category: value('supplierOfferCategory') || 'Р”СЂСѓРіРѕРµ',
    product_name: title,
    price: numberOrNull(value('supplierOfferPrice')),
    unit: 'СЂСѓР±.',
    min_order: value('supplierOfferQuantity'),
    delivery_cities: textToArray(value('supplierOfferCity')) || [],
    description: value('supplierOfferMessage'),
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  const result = await dbInsert('supplier_offers', payload, supplierOfferMessageBox);
  if (result.error) {
    setMessage(supplierOfferMessageBox, 'РћС€РёР±РєР° РїСѓР±Р»РёРєР°С†РёРё РїСЂРµРґР»РѕР¶РµРЅРёСЏ: ' + result.error.message);
    return;
  }
  setMessage(supplierOfferMessageBox, `РџСЂРµРґР»РѕР¶РµРЅРёРµ РѕРїСѓР±Р»РёРєРѕРІР°РЅРѕ. РҐСЂР°РЅРёР»РёС‰Рµ: ${result.local ? 'Р»РѕРєР°Р»СЊРЅРѕ' : 'Supabase'}.`);
}

async function loadSupplyRequests() {
  supplyRequestsList.innerHTML = '';
  setMessage(supplierOfferMessageBox, 'Р—Р°РіСЂСѓР¶Р°РµРј Р·Р°РїСЂРѕСЃС‹ Р·Р°РІРµРґРµРЅРёР№...');
  const result = await dbSelect('supply_requests', {}, supplierOfferMessageBox);
  if (result.error) {
    setMessage(supplierOfferMessageBox, 'РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё Р·Р°РїСЂРѕСЃРѕРІ: ' + result.error.message);
    return;
  }
  lastSupplyRequests = result.data || [];
  renderSupplyRequests();
}

async function createSupplyResponse(request, statusNode) {
  const message = [
    value('supplierOfferTitle'),
    value('supplierOfferPrice'),
    value('supplierOfferQuantity'),
    value('supplierOfferCity'),
    value('supplierOfferMessage')
  ].filter(Boolean).join(' | ') || 'Р“РѕС‚РѕРІ РѕР±СЃСѓРґРёС‚СЊ РїРѕСЃС‚Р°РІРєСѓ РїРѕ РІР°С€РµРјСѓ Р·Р°РїСЂРѕСЃСѓ';

  const result = await dbInsert('supplier_responses', {
    request_id: request.id,
    restaurant_id: request.restaurant_id,
    supplier_id: currentUser.id,
    category: value('supplierOfferCategory') || request.category || null,
    message,
    status: 'new',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, statusNode);
  if (result.error) {
    setMessage(statusNode, 'РћС€РёР±РєР° РѕС‚РєР»РёРєР° РЅР° Р·Р°РїСЂРѕСЃ: ' + result.error.message);
    return false;
  }
  setMessage(statusNode, `РћС‚РєР»РёРє РѕС‚РїСЂР°РІР»РµРЅ Р·Р°РІРµРґРµРЅРёСЋ. РҐСЂР°РЅРёР»РёС‰Рµ: ${result.local ? 'Р»РѕРєР°Р»СЊРЅРѕ' : 'Supabase'}.`);
  return true;
}

async function loadSupplierInquiries() {
  if (!supplierInquiriesList) return;
  supplierInquiriesList.innerHTML = '';
  setMessage(supplierInquiriesMessage, 'Р—Р°РіСЂСѓР¶Р°РµРј РІС…РѕРґСЏС‰РёРµ Р·Р°СЏРІРєРё...');
  const result = await dbSelect('supplier_inquiries', { supplier_id: currentUser.id }, supplierInquiriesMessage);
  if (result.error) {
    setMessage(supplierInquiriesMessage, 'РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё Р·Р°СЏРІРѕРє: ' + result.error.message);
    return;
  }
  const rows = result.data || [];
  rows.forEach(inquiry => {
    const card = document.createElement('article');
    card.className = 'data-card';
    const active = inquiry.status === 'new';
    card.innerHTML = `
      <h4>Р—Р°СЏРІРєР° РѕС‚ Р·Р°РІРµРґРµРЅРёСЏ</h4>
      <p><strong>РЎРѕРѕР±С‰РµРЅРёРµ:</strong> ${escapeHtml(inquiry.message || '-')}</p>
      <p><strong>РћС„С„РµСЂ:</strong> ${escapeHtml(inquiry.offer_id || '-')}</p>
      <p><strong>РЎС‚Р°С‚СѓСЃ:</strong> <span class="status-pill">${escapeHtml(statusText(inquiry.status || 'new'))}</span></p>
      <div class="card-actions" style="margin-top:14px;">
        <button type="button" class="acceptInquiryBtn">РџСЂРёРЅСЏС‚СЊ</button>
        <button type="button" class="declineInquiryBtn">РћС‚РєР»РѕРЅРёС‚СЊ</button>
      </div>
      <p class="inquiryStatus message"></p>
    `;
    const accept = card.querySelector('.acceptInquiryBtn');
    const decline = card.querySelector('.declineInquiryBtn');
    const status = card.querySelector('.inquiryStatus');
    accept.disabled = !active;
    decline.disabled = !active;
    accept.addEventListener('click', () => updateSupplierInquiry(inquiry.id, 'accepted', status));
    decline.addEventListener('click', () => updateSupplierInquiry(inquiry.id, 'declined', status));
    supplierInquiriesList.appendChild(card);
  });
  setMessage(supplierInquiriesMessage, rows.length ? `Р’С…РѕРґСЏС‰РёС… Р·Р°СЏРІРѕРє: ${rows.length}` : 'Р’С…РѕРґСЏС‰РёС… Р·Р°СЏРІРѕРє РїРѕРєР° РЅРµС‚.');
}

async function updateSupplierInquiry(inquiryId, status, statusNode) {
  const result = await dbUpdate('supplier_inquiries', { id: inquiryId, supplier_id: currentUser.id }, {
    status,
    updated_at: new Date().toISOString()
  }, statusNode);
  if (result.error) {
    setMessage(statusNode, 'РћС€РёР±РєР° РѕР±РЅРѕРІР»РµРЅРёСЏ Р·Р°СЏРІРєРё: ' + result.error.message);
    return;
  }
  setMessage(statusNode, `Р—Р°СЏРІРєР° РѕР±РЅРѕРІР»РµРЅР°: ${statusText(status)}.`);
  await loadSupplierInquiries();
}

function renderSupplyRequests() {
  const search = supplyRequestsSearchInput?.value.trim() || '';
  const rows = lastSupplyRequests.filter(row => matchesSearch(row, search));
  supplyRequestsList.innerHTML = '';
  rows.forEach(request => supplyRequestsList.appendChild(renderSupplyRequestCard(request)));
  if (!rows.length) setMessage(supplierOfferMessageBox, 'Р—Р°РїСЂРѕСЃС‹ Р·Р°РІРµРґРµРЅРёР№ РЅРµ РЅР°Р№РґРµРЅС‹.');
}

function renderSupplyRequestCard(request) {
  const card = document.createElement('article');
  card.className = 'data-card';
  const canRespond = currentProfile?.role === 'supplier' && request.id && request.restaurant_id;
  card.innerHTML = `
    <h4>${escapeHtml(request.title || '-')}</h4>
    <p><strong>РљР°С‚РµРіРѕСЂРёСЏ:</strong> ${escapeHtml(request.category || '-')}</p>
    <p><strong>РљРѕР»РёС‡РµСЃС‚РІРѕ:</strong> ${escapeHtml(request.quantity || '-')}</p>
    <p><strong>Р‘СЋРґР¶РµС‚:</strong> ${escapeHtml(request.budget || '-')}</p>
    <p><strong>Р“РѕСЂРѕРґ:</strong> ${escapeHtml(request.city || '-')}</p>
    <p><strong>РљРѕРјРјРµРЅС‚Р°СЂРёР№:</strong> ${escapeHtml(request.message || '-')}</p>
    ${canRespond ? '<div class="card-actions" style="margin-top:14px;"><button type="button" class="respondSupplyRequestBtn">РћС‚РєР»РёРєРЅСѓС‚СЊСЃСЏ</button></div><p class="supplyResponseStatus message"></p>' : ''}
  `;
  if (canRespond) {
    const btn = card.querySelector('.respondSupplyRequestBtn');
    const status = card.querySelector('.supplyResponseStatus');
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      status.textContent = 'РћС‚РїСЂР°РІР»СЏРµРј РѕС‚РєР»РёРє Р·Р°РІРµРґРµРЅРёСЋ...';
      const ok = await createSupplyResponse(request, status);
      if (ok) btn.textContent = 'РћС‚РєР»РёРє РѕС‚РїСЂР°РІР»РµРЅ';
      else btn.disabled = false;
    });
  }
  return card;
}

async function loadSupplyResponses() {
  if (!supplyResponsesList) return;
  supplyResponsesList.innerHTML = '';
  setMessage(supplyResponsesMessage, 'Р—Р°РіСЂСѓР¶Р°РµРј РѕС‚РєР»РёРєРё РїРѕСЃС‚Р°РІС‰РёРєРѕРІ...');
  const result = await dbSelect('supplier_responses', { restaurant_id: currentUser.id }, supplyResponsesMessage);
  if (result.error) {
    setMessage(supplyResponsesMessage, 'РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё РѕС‚РєР»РёРєРѕРІ РїРѕСЃС‚Р°РІС‰РёРєРѕРІ: ' + result.error.message);
    return;
  }
  lastSupplyResponses = result.data || [];
  lastSupplyResponses.forEach(response => supplyResponsesList.appendChild(renderSupplyResponseCard(response)));
  setMessage(supplyResponsesMessage, lastSupplyResponses.length ? `РћС‚РєР»РёРєРѕРІ РїРѕСЃС‚Р°РІС‰РёРєРѕРІ: ${lastSupplyResponses.length}` : 'РћС‚РєР»РёРєРѕРІ РїРѕСЃС‚Р°РІС‰РёРєРѕРІ РїРѕРєР° РЅРµС‚.');
}

function renderSupplyResponseCard(response) {
  const card = document.createElement('article');
  card.className = 'data-card';
  const active = response.status === 'new' || response.status === 'pending';
  card.innerHTML = `
    <h4>РћС‚РєР»РёРє РїРѕСЃС‚Р°РІС‰РёРєР°</h4>
    <p><strong>РџРѕСЃС‚Р°РІС‰РёРє:</strong> ${escapeHtml(response.supplier_id || '-')}</p>
    <p><strong>Р—Р°РїСЂРѕСЃ:</strong> ${escapeHtml(response.request_id || '-')}</p>
    <p><strong>РљР°С‚РµРіРѕСЂРёСЏ:</strong> ${escapeHtml(response.category || '-')}</p>
    <p><strong>РЎРѕРѕР±С‰РµРЅРёРµ:</strong> ${escapeHtml(response.message || '-')}</p>
    <p><strong>РЎС‚Р°С‚СѓСЃ:</strong> <span class="status-pill">${escapeHtml(statusText(response.status || 'new'))}</span></p>
    <div class="card-actions" style="margin-top:14px;">
      <button type="button" class="acceptSupplyResponseBtn">РџСЂРёРЅСЏС‚СЊ</button>
      <button type="button" class="declineSupplyResponseBtn">РћС‚РєР»РѕРЅРёС‚СЊ</button>
    </div>
    <p class="supplyResponseUpdateStatus message"></p>
  `;
  const accept = card.querySelector('.acceptSupplyResponseBtn');
  const decline = card.querySelector('.declineSupplyResponseBtn');
  const status = card.querySelector('.supplyResponseUpdateStatus');
  accept.disabled = !active;
  decline.disabled = !active;
  accept.addEventListener('click', () => updateSupplyResponse(response.id, 'accepted', status));
  decline.addEventListener('click', () => updateSupplyResponse(response.id, 'declined', status));
  return card;
}

async function updateSupplyResponse(responseId, status, statusNode) {
  const result = await dbUpdate('supplier_responses', { id: responseId, restaurant_id: currentUser.id }, {
    status,
    updated_at: new Date().toISOString()
  }, statusNode);
  if (result.error) {
    setMessage(statusNode, 'РћС€РёР±РєР° РѕР±РЅРѕРІР»РµРЅРёСЏ РѕС‚РєР»РёРєР° РїРѕСЃС‚Р°РІС‰РёРєР°: ' + result.error.message);
    return;
  }
  setMessage(statusNode, `РћС‚РєР»РёРє РїРѕСЃС‚Р°РІС‰РёРєР° РѕР±РЅРѕРІР»С‘РЅ: ${statusText(status)}.`);
  await loadSupplyResponses();
}

