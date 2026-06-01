(function () {
  const client = window.supabaseClient;
  const $ = (id) => document.getElementById(id);

  const dom = Object.fromEntries(
    [
      "userInfo",
      "workerCabinet",
      "restaurantCabinet",
      "supplierCabinet",
      "adminCabinet",
      "unknownRole",
      "logoutBtn",
      "workerProfileMessage",
      "workersList",
      "workersMessage",
      "workerSearchInput",
      "invitesList",
      "invitesMessage",
      "shiftPostsList",
      "shiftPostsMessage",
      "shiftSearchInput",
      "restaurantShiftPostsList",
      "shiftApplicationsList",
      "shiftPostMessage",
      "supplierOffersList",
      "supplierOffersSearchInput",
      "supplyRequestMessageBox",
      "supplyResponsesMessage",
      "supplyResponsesList",
      "supplyRequestsList",
      "supplyRequestsSearchInput",
      "supplierOfferMessageBox",
      "supplierOwnOffersList",
      "supplierInquiriesMessage",
      "supplierInquiriesList",
      "adminMessage",
      "adminDataList",
    ].map((id) => [id, $(id)]),
  );

  const state = {
    user: null,
    profile: null,
    workers: [],
    shifts: [],
    supplierOffers: [],
    supplyRequests: [],
    supplierResponses: [],
    supplierInquiries: [],
    ownSupplierOffers: [],
  };

  const rolePanels = [
    "workerCabinet",
    "restaurantCabinet",
    "supplierCabinet",
    "adminCabinet",
    "unknownRole",
  ];

  const formMaps = {
    worker: {
      workerProfessions: "professions",
      workerAvailableDays: "available_days",
      workerExperience: "experience",
      workerAvailableTime: "available_time",
      workerPaymentType: "payment_type",
      workerCanTravel: "can_travel",
      workerTravelCities: "travel_cities",
      workerAbout: "about",
    },
    restaurant: {
      restaurantBusinessName: "business_name",
      restaurantBusinessType: "business_type",
      restaurantContactPerson: "contact_person",
      restaurantCity: "city",
      restaurantAddress: "address",
      restaurantAbout: "about",
    },
    supplier: {
      supplierCompanyName: "company_name",
      supplierProfileCategory: "category",
      supplierContactPerson: "contact_person",
      supplierProfileCity: "city",
      supplierDeliveryCities: "delivery_cities",
      supplierProfileAbout: "about",
    },
  };

  function setMessage(element, text) {
    if (element) element.textContent = text || "";
  }

  function value(id) {
    return ($(id)?.value || "").trim();
  }

  function numberValue(id) {
    const raw = value(id)
      .replace(",", ".")
      .replace(/[^\d.]/g, "");
    const number = Number(raw);
    return Number.isFinite(number) && raw ? number : null;
  }

  function listValue(id) {
    return value(id)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function escapeHtml(input) {
    return String(input ?? "").replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        })[char],
    );
  }

  function formatList(items) {
    return Array.isArray(items) && items.length ? items.join(", ") : "-";
  }

  function formatMoney(value) {
    return value || value === 0 ? `${value} ₽` : "-";
  }

  function formatStatus(status) {
    const labels = {
      pending: "ожидает",
      new: "новая",
      accepted: "принята",
      declined: "отклонена",
      cancelled: "отменена",
      done: "завершена",
      open: "открыта",
      closed: "закрыта",
      active: "активно",
      paused: "пауза",
    };
    return labels[status] || status || "-";
  }

  function matchesQuery(row, query) {
    if (!query) return true;
    return JSON.stringify(row).toLowerCase().includes(query.toLowerCase());
  }

  function makeCard(title, bodyHtml, actionsHtml = "") {
    const card = document.createElement("article");
    card.className = "data-card";
    card.innerHTML = `<h4>${escapeHtml(title)}</h4>${bodyHtml}${actionsHtml}`;
    return card;
  }

  function renderEmpty(container, text) {
    if (!container) return;
    container.innerHTML = "";
    container.appendChild(
      makeCard(
        text,
        "<p>Данные появятся здесь после публикации или отклика.</p>",
      ),
    );
  }

  function showPanel(panel) {
    rolePanels.forEach((id) => {
      const element = dom[id];
      if (element) element.style.display = element === panel ? "block" : "none";
    });
  }

  function fillForm(map, row) {
    Object.entries(map).forEach(([id, column]) => {
      const field = $(id);
      if (!field) return;
      const data = row?.[column];
      if (field.type === "checkbox") {
        field.checked = Boolean(data);
      } else {
        field.value = Array.isArray(data) ? data.join(", ") : (data ?? "");
      }
    });
  }

  function readMappedForm(map) {
    const data = {};
    Object.entries(map).forEach(([id, column]) => {
      const field = $(id);
      if (!field) return;
      const lowerId = id.toLowerCase();
      if (field.type === "checkbox") {
        data[column] = field.checked;
      } else if (
        lowerId.includes("cities") ||
        lowerId.includes("professions") ||
        lowerId.includes("days")
      ) {
        data[column] = listValue(id);
      } else {
        data[column] = value(id);
      }
    });
    return data;
  }

  function applyButtonState(button, isBusy, busyText = "Сохраняем...") {
    if (!button) return;
    if (isBusy) {
      button.dataset.defaultText = button.textContent;
      button.textContent = busyText;
      button.disabled = true;
    } else {
      button.textContent = button.dataset.defaultText || button.textContent;
      button.disabled = false;
    }
  }

  async function selectRows(table, filters = {}, options = {}) {
    let query = client.from(table).select(options.select || "*");
    Object.entries(filters).forEach(([column, filterValue]) => {
      if (filterValue !== undefined && filterValue !== null)
        query = query.eq(column, filterValue);
    });
    if (options.order)
      query = query.order(options.order.column, {
        ascending: options.order.ascending ?? false,
      });
    return query;
  }

  async function insertRow(table, data) {
    return client.from(table).insert(data).select();
  }

  async function updateRows(table, filters, data) {
    let query = client.from(table).update(data);
    Object.entries(filters).forEach(([column, filterValue]) => {
      query = query.eq(column, filterValue);
    });
    return query.select();
  }

  async function upsertByUser(table, data) {
    return client.from(table).upsert(data, { onConflict: "user_id" }).select();
  }

  async function ensureProfile() {
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) {
      window.location.href = "auth.html";
      return null;
    }

    state.user = sessionData.session.user;
    const { data, error } = await client
      .from("profiles")
      .select("*")
      .eq("id", state.user.id)
      .maybeSingle();

    if (error) {
      setMessage(dom.userInfo, `Ошибка профиля: ${error.message}`);
      return null;
    }

    if (data) {
      state.profile = data;
      return data;
    }

    const fallbackProfile = {
      id: state.user.id,
      role: state.user.user_metadata?.role || "worker",
      name: state.user.email || "Пользователь",
      status: "active",
      updated_at: new Date().toISOString(),
    };

    const { data: inserted, error: insertError } = await client
      .from("profiles")
      .upsert(fallbackProfile, { onConflict: "id" })
      .select()
      .maybeSingle();

    if (insertError) {
      setMessage(dom.userInfo, `Профиль не создан: ${insertError.message}`);
      state.profile = fallbackProfile;
      return fallbackProfile;
    }

    state.profile = inserted;
    return inserted;
  }

  async function loadWorkerProfile() {
    const { data, error } = await client
      .from("worker_profiles")
      .select("*")
      .eq("user_id", state.user.id)
      .maybeSingle();
    if (!error) {
      fillForm(formMaps.worker, data);
      if ($("workerMinRate")) $("workerMinRate").value = data?.min_rate ?? "";
      if ($("workerTravelRadiusKm"))
        $("workerTravelRadiusKm").value = data?.travel_radius_km ?? "";
    }
  }

  async function saveWorkerProfile(event) {
    const button = event?.currentTarget;
    applyButtonState(button, true);
    const payload = {
      user_id: state.user.id,
      ...readMappedForm(formMaps.worker),
      min_rate: numberValue("workerMinRate"),
      travel_radius_km: numberValue("workerTravelRadiusKm"),
      updated_at: new Date().toISOString(),
    };
    const { error } = await upsertByUser("worker_profiles", payload);
    setMessage(
      dom.workerProfileMessage,
      error ? `Ошибка: ${error.message}` : "Профиль работника сохранен.",
    );
    applyButtonState(button, false);
  }

  async function loadOpenShifts() {
    const { data, error } = await selectRows(
      "shift_posts",
      { status: "open" },
      { order: { column: "created_at", ascending: false } },
    );
    if (error) {
      setMessage(dom.shiftPostsMessage, error.message);
      return;
    }
    state.shifts = data || [];
    renderOpenShifts();
  }

  function renderOpenShifts() {
    const query = value("shiftSearchInput");
    const rows = state.shifts.filter((shift) => matchesQuery(shift, query));
    dom.shiftPostsList.innerHTML = "";

    if (!rows.length) {
      renderEmpty(dom.shiftPostsList, "Смен пока нет");
      setMessage(dom.shiftPostsMessage, "Подходящих смен нет.");
      return;
    }

    rows.forEach((shift) => {
      const card = makeCard(
        shift.title || "Смена",
        `
          <p>${escapeHtml(shift.profession || "-")} / ${escapeHtml(shift.city || "-")}</p>
          <p>${escapeHtml(shift.date_from || "")} ${escapeHtml(shift.time_from || "")}-${escapeHtml(shift.time_to || "")}</p>
          <p>Ставка: ${escapeHtml(formatMoney(shift.rate))}</p>
          <p>${escapeHtml(shift.requirements || "")}</p>
        `,
        '<button type="button" data-action="apply-shift">Откликнуться</button><p class="message"></p>',
      );
      card
        .querySelector('[data-action="apply-shift"]')
        .addEventListener("click", () => applyToShift(shift, card));
      dom.shiftPostsList.appendChild(card);
    });
    setMessage(dom.shiftPostsMessage, `Смен найдено: ${rows.length}`);
  }

  async function applyToShift(shift, card) {
    const message = card.querySelector(".message");
    const { error } = await insertRow("shift_applications", {
      shift_id: shift.id,
      worker_id: state.user.id,
      restaurant_id: shift.restaurant_id,
      message: "Отклик работника",
      status: "pending",
      created_at: new Date().toISOString(),
    });
    setMessage(
      message,
      error
        ? `Ошибка: ${error.code === "23505" ? "вы уже откликались на эту смену" : error.message}`
        : "Отклик отправлен заведению.",
    );
  }

  async function loadInvites() {
    const { data, error } = await selectRows(
      "shift_invites",
      { worker_id: state.user.id },
      { order: { column: "created_at", ascending: false } },
    );
    if (error) {
      setMessage(dom.invitesMessage, error.message);
      return;
    }
    renderInvites(data || []);
  }

  function renderInvites(invites) {
    dom.invitesList.innerHTML = "";
    if (!invites.length) {
      renderEmpty(dom.invitesList, "Приглашений нет");
      setMessage(dom.invitesMessage, "Входящих приглашений пока нет.");
      return;
    }

    invites.forEach((invite) => {
      const isPending = invite.status === "pending";
      const card = makeCard(
        "Приглашение на смену",
        `
          <p>Статус: ${escapeHtml(formatStatus(invite.status))}</p>
          <p>${escapeHtml(invite.message || "Заведение приглашает вас на смену.")}</p>
        `,
        isPending
          ? '<button type="button" data-status="accepted">Принять</button><button class="btn" type="button" data-status="declined">Отклонить</button><p class="message"></p>'
          : '<p class="message">Решение уже сохранено.</p>',
      );
      card.querySelectorAll("[data-status]").forEach((button) => {
        button.addEventListener("click", () =>
          updateInviteStatus(invite.id, button.dataset.status, card),
        );
      });
      dom.invitesList.appendChild(card);
    });
    setMessage(dom.invitesMessage, `Приглашений: ${invites.length}`);
  }

  async function updateInviteStatus(inviteId, status, card) {
    const { error } = await updateRows(
      "shift_invites",
      { id: inviteId, worker_id: state.user.id },
      { status, updated_at: new Date().toISOString() },
    );
    setMessage(
      card.querySelector(".message"),
      error ? `Ошибка: ${error.message}` : "Решение сохранено.",
    );
    if (!error) loadInvites();
  }

  async function loadRestaurantProfile() {
    const { data } = await client
      .from("restaurant_profiles")
      .select("*")
      .eq("user_id", state.user.id)
      .maybeSingle();
    fillForm(formMaps.restaurant, data);
  }

  async function saveRestaurantProfile(event) {
    const button = event?.currentTarget;
    applyButtonState(button, true);
    const { error } = await upsertByUser("restaurant_profiles", {
      user_id: state.user.id,
      ...readMappedForm(formMaps.restaurant),
      updated_at: new Date().toISOString(),
    });
    setMessage(
      dom.restaurantProfileMessage,
      error ? `Ошибка: ${error.message}` : "Профиль заведения сохранен.",
    );
    applyButtonState(button, false);
  }

  async function createShiftPost(event) {
    const button = event?.currentTarget;
    const title = value("shiftTitle");
    const profession = value("shiftProfession");
    if (!title || !profession) {
      setMessage(dom.shiftPostMessage, "Заполните название смены и профессию.");
      return;
    }

    applyButtonState(button, true, "Публикуем...");
    const { error } = await insertRow("shift_posts", {
      restaurant_id: state.user.id,
      title,
      profession,
      city: value("shiftCity"),
      district: value("shiftDistrict"),
      address: value("shiftAddress"),
      date_from: value("shiftDateFrom") || null,
      time_from: value("shiftTimeFrom") || null,
      time_to: value("shiftTimeTo") || null,
      rate: numberValue("shiftRate"),
      requirements: value("shiftRequirements"),
      status: "open",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setMessage(
      dom.shiftPostMessage,
      error ? `Ошибка: ${error.message}` : "Смена опубликована.",
    );
    applyButtonState(button, false);
    if (!error) loadRestaurantShiftPosts();
  }

  async function loadRestaurantShiftPosts() {
    const { data, error } = await selectRows(
      "shift_posts",
      { restaurant_id: state.user.id },
      { order: { column: "created_at", ascending: false } },
    );
    if (error) {
      setMessage(dom.shiftPostMessage, error.message);
      return;
    }

    dom.restaurantShiftPostsList.innerHTML = "";
    if (!data?.length) {
      renderEmpty(dom.restaurantShiftPostsList, "Смены еще не опубликованы");
      return;
    }
    data.forEach((shift) => {
      dom.restaurantShiftPostsList.appendChild(
        makeCard(
          shift.title || "Смена",
          `<p>${escapeHtml(shift.profession || "-")} / ${escapeHtml(shift.city || "-")}</p><p>Статус: ${escapeHtml(formatStatus(shift.status))}</p>`,
        ),
      );
    });
  }

  async function loadShiftApplications() {
    const { data, error } = await selectRows(
      "shift_applications",
      { restaurant_id: state.user.id },
      { order: { column: "created_at", ascending: false } },
    );
    if (error) {
      setMessage(dom.shiftPostMessage, error.message);
      return;
    }

    dom.shiftApplicationsList.innerHTML = "";
    if (!data?.length) {
      renderEmpty(dom.shiftApplicationsList, "Откликов работников пока нет");
      return;
    }

    data.forEach((application) => {
      const isPending = application.status === "pending";
      const card = makeCard(
        "Отклик работника",
        `<p>Работник: ${escapeHtml(application.worker_id)}</p><p>Статус: ${escapeHtml(formatStatus(application.status))}</p><p>${escapeHtml(application.message || "")}</p>`,
        isPending
          ? '<button type="button" data-status="accepted">Принять</button><button class="btn" type="button" data-status="declined">Отклонить</button><p class="message"></p>'
          : '<p class="message">Решение уже сохранено.</p>',
      );
      card.querySelectorAll("[data-status]").forEach((button) => {
        button.addEventListener("click", () =>
          updateShiftApplication(application.id, button.dataset.status, card),
        );
      });
      dom.shiftApplicationsList.appendChild(card);
    });
  }

  async function updateShiftApplication(applicationId, status, card) {
    const { error } = await updateRows(
      "shift_applications",
      { id: applicationId, restaurant_id: state.user.id },
      { status, updated_at: new Date().toISOString() },
    );
    setMessage(
      card.querySelector(".message"),
      error ? `Ошибка: ${error.message}` : "Решение сохранено.",
    );
    if (!error) loadShiftApplications();
  }

  async function loadWorkers() {
    setMessage(dom.workersMessage, "Загрузка анкет...");
    const { data, error } = await selectRows(
      "worker_profiles",
      {},
      { order: { column: "updated_at", ascending: false } },
    );
    if (error) {
      setMessage(dom.workersMessage, error.message);
      return;
    }
    state.workers = data || [];
    renderWorkers();
  }

  function renderWorkers() {
    const query = value("workerSearchInput");
    const rows = state.workers.filter((worker) => matchesQuery(worker, query));
    dom.workersList.innerHTML = "";
    if (!rows.length) {
      renderEmpty(dom.workersList, "Анкет работников пока нет");
      setMessage(dom.workersMessage, "Подходящих анкет нет.");
      return;
    }

    rows.forEach((worker) => {
      const card = makeCard(
        formatList(worker.professions) || "Работник",
        `
          <p>${escapeHtml(worker.experience || "Опыт не указан")}</p>
          <p>Дни: ${escapeHtml(formatList(worker.available_days))}</p>
          <p>Ставка: ${escapeHtml(formatMoney(worker.min_rate))}</p>
          <p>${worker.can_travel ? "Готов к выезду" : "Без выезда"}</p>
        `,
        '<button type="button" data-action="invite-worker">Пригласить</button><p class="message"></p>',
      );
      card
        .querySelector('[data-action="invite-worker"]')
        .addEventListener("click", () => inviteWorker(worker, card));
      dom.workersList.appendChild(card);
    });
    setMessage(dom.workersMessage, `Анкет найдено: ${rows.length}`);
  }

  async function inviteWorker(worker, card) {
    const { error } = await insertRow("shift_invites", {
      restaurant_id: state.user.id,
      worker_id: worker.user_id,
      message: "Приглашение на смену от заведения",
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setMessage(
      card.querySelector(".message"),
      error ? `Ошибка: ${error.message}` : "Приглашение отправлено работнику.",
    );
  }

  async function createSupplyRequest(event) {
    const button = event?.currentTarget;
    const title = value("supplyRequestTitle");
    if (!title) {
      setMessage(
        dom.supplyRequestMessageBox,
        "Заполните, что нужно заведению.",
      );
      return;
    }

    applyButtonState(button, true, "Публикуем...");
    const { error } = await insertRow("supply_requests", {
      restaurant_id: state.user.id,
      title,
      category: value("supplyRequestCategory"),
      quantity: value("supplyRequestQuantity"),
      budget: value("supplyRequestBudget"),
      city: value("supplyRequestCity"),
      message: value("supplyRequestMessage"),
      status: "open",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setMessage(
      dom.supplyRequestMessageBox,
      error
        ? `Ошибка: ${error.message}`
        : "Запрос опубликован для поставщиков.",
    );
    applyButtonState(button, false);
  }

  async function loadSupplierOffersForRestaurant() {
    const { data, error } = await selectRows(
      "supplier_offers",
      { status: "active" },
      { order: { column: "created_at", ascending: false } },
    );
    if (error) {
      setMessage(dom.supplyRequestMessageBox, error.message);
      return;
    }
    state.supplierOffers = data || [];
    renderSupplierOffersForRestaurant();
  }

  function renderSupplierOffersForRestaurant() {
    const query = value("supplierOffersSearchInput");
    const rows = state.supplierOffers.filter((offer) =>
      matchesQuery(offer, query),
    );
    dom.supplierOffersList.innerHTML = "";
    if (!rows.length) {
      renderEmpty(dom.supplierOffersList, "Предложений поставщиков пока нет");
      return;
    }

    rows.forEach((offer) => {
      const card = makeCard(
        offer.title || "Предложение",
        `
          <p>${escapeHtml(offer.category || "-")} / ${escapeHtml(formatMoney(offer.price))} ${escapeHtml(offer.unit || "")}</p>
          <p>Минимум: ${escapeHtml(offer.min_order || "-")}</p>
          <p>Доставка: ${escapeHtml(formatList(offer.delivery_cities))}</p>
          <p>${escapeHtml(offer.description || "")}</p>
        `,
        '<button type="button" data-action="send-supplier-inquiry">Отправить запрос</button><p class="message"></p>',
      );
      card
        .querySelector('[data-action="send-supplier-inquiry"]')
        .addEventListener("click", () => sendSupplierInquiry(offer, card));
      dom.supplierOffersList.appendChild(card);
    });
  }

  async function sendSupplierInquiry(offer, card) {
    const { error } = await insertRow("supplier_inquiries", {
      offer_id: offer.id,
      restaurant_id: state.user.id,
      supplier_id: offer.supplier_id,
      message: value("supplyRequestMessage") || "Запрос от заведения",
      status: "new",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setMessage(
      card.querySelector(".message"),
      error
        ? `Ошибка: ${error.code === "23505" ? "запрос по этому предложению уже отправлен" : error.message}`
        : "Запрос отправлен поставщику.",
    );
  }

  async function loadSupplyResponses() {
    const { data, error } = await selectRows(
      "supplier_responses",
      { restaurant_id: state.user.id },
      { order: { column: "created_at", ascending: false } },
    );
    if (error) {
      setMessage(dom.supplyResponsesMessage, error.message);
      return;
    }
    state.supplierResponses = data || [];
    renderSupplyResponses();
  }

  function renderSupplyResponses() {
    dom.supplyResponsesList.innerHTML = "";
    if (!state.supplierResponses.length) {
      renderEmpty(dom.supplyResponsesList, "Откликов поставщиков пока нет");
      setMessage(dom.supplyResponsesMessage, "Откликов нет.");
      return;
    }

    state.supplierResponses.forEach((response) => {
      const isNew = response.status === "new";
      const card = makeCard(
        "Отклик поставщика",
        `<p>Поставщик: ${escapeHtml(response.supplier_id)}</p><p>Категория: ${escapeHtml(response.category || "-")}</p><p>${escapeHtml(response.message || "")}</p><p>Статус: ${escapeHtml(formatStatus(response.status))}</p>`,
        isNew
          ? '<button type="button" data-status="accepted">Принять</button><button class="btn" type="button" data-status="declined">Отклонить</button><p class="message"></p>'
          : '<p class="message">Решение уже сохранено.</p>',
      );
      card.querySelectorAll("[data-status]").forEach((button) => {
        button.addEventListener("click", () =>
          updateSupplierResponse(response.id, button.dataset.status, card),
        );
      });
      dom.supplyResponsesList.appendChild(card);
    });
    setMessage(
      dom.supplyResponsesMessage,
      `Откликов: ${state.supplierResponses.length}`,
    );
  }

  async function updateSupplierResponse(responseId, status, card) {
    const { error } = await updateRows(
      "supplier_responses",
      { id: responseId, restaurant_id: state.user.id },
      { status, updated_at: new Date().toISOString() },
    );
    setMessage(
      card.querySelector(".message"),
      error ? `Ошибка: ${error.message}` : "Решение сохранено.",
    );
    if (!error) loadSupplyResponses();
  }

  async function loadSupplierProfile() {
    const { data } = await client
      .from("supplier_profiles")
      .select("*")
      .eq("user_id", state.user.id)
      .maybeSingle();
    fillForm(formMaps.supplier, data);
  }

  async function saveSupplierProfile(event) {
    const button = event?.currentTarget;
    applyButtonState(button, true);
    const { error } = await upsertByUser("supplier_profiles", {
      user_id: state.user.id,
      ...readMappedForm(formMaps.supplier),
      updated_at: new Date().toISOString(),
    });
    setMessage(
      dom.supplierProfileMessage,
      error ? `Ошибка: ${error.message}` : "Профиль поставщика сохранен.",
    );
    applyButtonState(button, false);
  }

  async function createSupplierOffer(event) {
    const button = event?.currentTarget;
    const title = value("supplierOfferTitle");
    const category = value("supplierOfferCategory");
    if (!title || !category) {
      setMessage(
        dom.supplierOfferMessageBox,
        "Заполните товар/услугу и категорию.",
      );
      return;
    }

    applyButtonState(button, true, "Публикуем...");
    const { error } = await insertRow("supplier_offers", {
      supplier_id: state.user.id,
      title,
      category,
      product_name: title,
      price: numberValue("supplierOfferPrice"),
      unit: "руб.",
      min_order: value("supplierOfferQuantity"),
      delivery_cities: listValue("supplierOfferCity"),
      description: value("supplierOfferMessage"),
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setMessage(
      dom.supplierOfferMessageBox,
      error
        ? `Ошибка: ${error.message}`
        : "Предложение опубликовано для заведений.",
    );
    applyButtonState(button, false);
    if (!error) loadOwnSupplierOffers();
  }

  async function loadOwnSupplierOffers() {
    const { data, error } = await selectRows(
      "supplier_offers",
      { supplier_id: state.user.id },
      { order: { column: "created_at", ascending: false } },
    );
    if (error) {
      setMessage(dom.supplierOfferMessageBox, error.message);
      return;
    }
    state.ownSupplierOffers = data || [];
    renderOwnSupplierOffers();
  }

  function renderOwnSupplierOffers() {
    if (!dom.supplierOwnOffersList) return;
    dom.supplierOwnOffersList.innerHTML = "";
    if (!state.ownSupplierOffers.length) {
      renderEmpty(dom.supplierOwnOffersList, "Ваших предложений пока нет");
      return;
    }
    state.ownSupplierOffers.forEach((offer) => {
      dom.supplierOwnOffersList.appendChild(
        makeCard(
          offer.title || "Предложение",
          `<p>${escapeHtml(offer.category || "-")} / ${escapeHtml(formatMoney(offer.price))} ${escapeHtml(offer.unit || "")}</p><p>Статус: ${escapeHtml(formatStatus(offer.status))}</p><p>${escapeHtml(offer.description || "")}</p>`,
        ),
      );
    });
  }

  async function loadSupplyRequests() {
    const { data, error } = await selectRows(
      "supply_requests",
      { status: "open" },
      { order: { column: "created_at", ascending: false } },
    );
    if (error) {
      setMessage(dom.supplierOfferMessageBox, error.message);
      return;
    }
    state.supplyRequests = data || [];
    renderSupplyRequests();
  }

  function renderSupplyRequests() {
    const query = value("supplyRequestsSearchInput");
    const rows = state.supplyRequests.filter((request) =>
      matchesQuery(request, query),
    );
    dom.supplyRequestsList.innerHTML = "";
    if (!rows.length) {
      renderEmpty(dom.supplyRequestsList, "Запросов заведений пока нет");
      return;
    }

    rows.forEach((request) => {
      const card = makeCard(
        request.title || "Запрос",
        `
          <p>${escapeHtml(request.category || "-")} / ${escapeHtml(request.quantity || "-")}</p>
          <p>Бюджет: ${escapeHtml(request.budget || "-")}</p>
          <p>Город: ${escapeHtml(request.city || "-")}</p>
          <p>${escapeHtml(request.message || "")}</p>
        `,
        '<button type="button" data-action="respond-supply-request">Откликнуться</button><p class="message"></p>',
      );
      card
        .querySelector('[data-action="respond-supply-request"]')
        .addEventListener("click", () => respondToSupplyRequest(request, card));
      dom.supplyRequestsList.appendChild(card);
    });
  }

  async function respondToSupplyRequest(request, card) {
    const { error } = await insertRow("supplier_responses", {
      request_id: request.id,
      restaurant_id: request.restaurant_id,
      supplier_id: state.user.id,
      category: value("supplierOfferCategory") || request.category,
      message: value("supplierOfferMessage") || "Отклик поставщика",
      status: "new",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setMessage(
      card.querySelector(".message"),
      error ? `Ошибка: ${error.message}` : "Отклик отправлен заведению.",
    );
  }

  async function loadSupplierInquiries() {
    const { data, error } = await selectRows(
      "supplier_inquiries",
      { supplier_id: state.user.id },
      { order: { column: "created_at", ascending: false } },
    );
    if (error) {
      setMessage(dom.supplierInquiriesMessage, error.message);
      return;
    }
    state.supplierInquiries = data || [];
    renderSupplierInquiries();
  }

  function renderSupplierInquiries() {
    dom.supplierInquiriesList.innerHTML = "";
    if (!state.supplierInquiries.length) {
      renderEmpty(dom.supplierInquiriesList, "Входящих заявок пока нет");
      setMessage(dom.supplierInquiriesMessage, "Заявок нет.");
      return;
    }

    state.supplierInquiries.forEach((inquiry) => {
      const isNew = inquiry.status === "new";
      const card = makeCard(
        "Заявка от заведения",
        `<p>${escapeHtml(inquiry.message || "Заведение заинтересовалось предложением.")}</p><p>Статус: ${escapeHtml(formatStatus(inquiry.status))}</p>`,
        isNew
          ? '<button type="button" data-status="accepted">Принять</button><button class="btn" type="button" data-status="declined">Отклонить</button><p class="message"></p>'
          : '<p class="message">Решение уже сохранено.</p>',
      );
      card.querySelectorAll("[data-status]").forEach((button) => {
        button.addEventListener("click", () =>
          updateSupplierInquiry(inquiry.id, button.dataset.status, card),
        );
      });
      dom.supplierInquiriesList.appendChild(card);
    });
    setMessage(
      dom.supplierInquiriesMessage,
      `Заявок: ${state.supplierInquiries.length}`,
    );
  }

  async function updateSupplierInquiry(inquiryId, status, card) {
    const { error } = await updateRows(
      "supplier_inquiries",
      { id: inquiryId, supplier_id: state.user.id },
      { status, updated_at: new Date().toISOString() },
    );
    setMessage(
      card.querySelector(".message"),
      error ? `Ошибка: ${error.message}` : "Решение сохранено.",
    );
    if (!error) loadSupplierInquiries();
  }

  async function loadAdminData() {
    const tables = [
      "profiles",
      "worker_profiles",
      "restaurant_profiles",
      "supplier_profiles",
      "shift_posts",
      "shift_applications",
      "shift_invites",
      "supplier_offers",
      "supplier_inquiries",
      "supply_requests",
      "supplier_responses",
    ];
    dom.adminDataList.innerHTML = "";
    setMessage(dom.adminMessage, "Загружаем данные...");

    for (const table of tables) {
      const { data, error } = await selectRows(table);
      dom.adminDataList.appendChild(
        makeCard(
          table,
          `<p>${error ? escapeHtml(error.message) : `Записей: ${(data || []).length}`}</p>`,
        ),
      );
    }
    setMessage(dom.adminMessage, "Данные обновлены.");
  }

  function bindEvents() {
    const bindClick = (id, handler) =>
      $(id)?.addEventListener("click", handler);

    bindClick("saveWorkerProfileBtn", saveWorkerProfile);
    bindClick("loadInvitesBtn", loadInvites);
    bindClick("loadShiftPostsBtn", loadOpenShifts);

    bindClick("saveRestaurantProfileBtn", saveRestaurantProfile);
    bindClick("createShiftPostBtn", createShiftPost);
    bindClick("loadRestaurantShiftPostsBtn", loadRestaurantShiftPosts);
    bindClick("loadShiftApplicationsBtn", loadShiftApplications);
    bindClick("loadWorkersBtn", loadWorkers);
    bindClick("createSupplyRequestBtn", createSupplyRequest);
    bindClick("loadSupplierOffersBtn", loadSupplierOffersForRestaurant);
    bindClick("loadSupplyResponsesBtn", loadSupplyResponses);

    bindClick("saveSupplierProfileBtn", saveSupplierProfile);
    bindClick("createSupplierOfferBtn", createSupplierOffer);
    bindClick("loadSupplierOwnOffersBtn", loadOwnSupplierOffers);
    bindClick("loadSupplyRequestsBtn", loadSupplyRequests);
    bindClick("loadSupplierInquiriesBtn", loadSupplierInquiries);

    bindClick("loadAdminDataBtn", loadAdminData);

    $("workerSearchInput")?.addEventListener("input", renderWorkers);
    $("shiftSearchInput")?.addEventListener("input", renderOpenShifts);
    $("supplierOffersSearchInput")?.addEventListener(
      "input",
      renderSupplierOffersForRestaurant,
    );
    $("supplyRequestsSearchInput")?.addEventListener(
      "input",
      renderSupplyRequests,
    );

    dom.logoutBtn?.addEventListener("click", async () => {
      await client.auth.signOut();
      window.location.href = "auth.html";
    });
  }

  async function initRole(profile) {
    setMessage(
      dom.userInfo,
      `${state.user.email || profile.name || "Пользователь"} / ${profile.role}`,
    );

    if (profile.role === "worker") {
      showPanel(dom.workerCabinet);
      await loadWorkerProfile();
      await Promise.all([loadInvites(), loadOpenShifts()]);
      return;
    }

    if (profile.role === "restaurant") {
      showPanel(dom.restaurantCabinet);
      await loadRestaurantProfile();
      await loadRestaurantShiftPosts();
      return;
    }

    if (profile.role === "supplier") {
      showPanel(dom.supplierCabinet);
      await loadSupplierProfile();
      await Promise.all([
        loadOwnSupplierOffers(),
        loadSupplyRequests(),
        loadSupplierInquiries(),
      ]);
      return;
    }

    if (profile.role === "admin") {
      showPanel(dom.adminCabinet);
      await loadAdminData();
      return;
    }

    showPanel(dom.unknownRole);
  }

  async function init() {
    if (!client) {
      setMessage(dom.userInfo, "Supabase не загрузился. Обновите страницу.");
      return;
    }

    bindEvents();
    const profile = await ensureProfile();
    if (profile) await initRole(profile);
  }

  init();
})();
