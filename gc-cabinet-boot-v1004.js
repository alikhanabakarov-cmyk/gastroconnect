async function loadAdminData() {
  adminDataList.innerHTML = '';
  setMessage(adminMessage, 'Р—Р°РіСЂСѓР¶Р°РµРј РґР°РЅРЅС‹Рµ...');
  const tables = ['worker_profiles', 'shift_posts', 'shift_applications', 'shift_invites', 'supplier_offers', 'supplier_inquiries', 'supply_requests', 'supplier_responses'];
  for (const table of tables) {
    const result = await dbSelect(table, {}, adminMessage);
    const rows = result.data || [];
    const card = document.createElement('article');
    card.className = 'data-card';
    card.innerHTML = `<h4>${escapeHtml(table)}</h4><p>Р—Р°РїРёСЃРµР№: ${rows.length}</p>`;
    adminDataList.appendChild(card);
  }
  setMessage(adminMessage, 'Р”Р°РЅРЅС‹Рµ РѕР±РЅРѕРІР»РµРЅС‹.');
}

if (loadWorkersBtn) loadWorkersBtn.addEventListener('click', loadWorkers);
if (workerSearchInput) workerSearchInput.addEventListener('input', renderWorkers);
if (saveWorkerProfileBtn) saveWorkerProfileBtn.addEventListener('click', saveWorkerProfile);
if (saveRestaurantProfileBtn) saveRestaurantProfileBtn.addEventListener('click', saveRestaurantProfile);
if (saveSupplierProfileBtn) saveSupplierProfileBtn.addEventListener('click', saveSupplierProfile);
if (loadInvitesBtn) loadInvitesBtn.addEventListener('click', loadInvites);
if (loadShiftPostsBtn) loadShiftPostsBtn.addEventListener('click', loadShiftPosts);
if (shiftSearchInput) shiftSearchInput.addEventListener('input', renderShiftPosts);
if (createShiftPostBtn) createShiftPostBtn.addEventListener('click', createShiftPost);
if (loadRestaurantShiftPostsBtn) loadRestaurantShiftPostsBtn.addEventListener('click', loadRestaurantShiftPosts);
if (loadShiftApplicationsBtn) loadShiftApplicationsBtn.addEventListener('click', loadShiftApplications);
if (createSupplyRequestBtn) createSupplyRequestBtn.addEventListener('click', createSupplyRequest);
if (loadSupplierOffersBtn) loadSupplierOffersBtn.addEventListener('click', loadSupplierOffers);
if (loadSupplyResponsesBtn) loadSupplyResponsesBtn.addEventListener('click', loadSupplyResponses);
if (supplierOffersSearchInput) supplierOffersSearchInput.addEventListener('input', renderSupplierOffers);
if (createSupplierOfferBtn) createSupplierOfferBtn.addEventListener('click', createSupplierOffer);
if (loadSupplyRequestsBtn) loadSupplyRequestsBtn.addEventListener('click', loadSupplyRequests);
if (supplyRequestsSearchInput) supplyRequestsSearchInput.addEventListener('input', renderSupplyRequests);
if (loadSupplierInquiriesBtn) loadSupplierInquiriesBtn.addEventListener('click', loadSupplierInquiries);
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
