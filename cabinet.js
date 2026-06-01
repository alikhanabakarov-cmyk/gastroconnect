(() => {
  const e = (e) => document.getElementById(e),
    t = window.supabaseClient,
    s = Object.fromEntries(
      [
        "userInfo",
        "workerCabinet",
        "restaurantCabinet",
        "supplierCabinet",
        "adminCabinet",
        "unknownRole",
        "logoutBtn",
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
        "supplierInquiriesMessage",
        "supplierInquiriesList",
        "adminMessage",
        "adminDataList",
      ].map((t) => [t, e(t)]),
    );
  let i = null,
    r = null,
    a = [],
    n = [],
    o = [],
    l = [],
    p = [];
  const u = (e, t) => {
      e && (e.textContent = t);
    },
    c = (t) => (e(t)?.value || "").trim(),
    d = (e) => {
      let t = Number(
        c(e)
          .replace(",", ".")
          .replace(/[^\d.]/g, ""),
      );
      return Number.isFinite(t) ? t : null;
    },
    f = (e) =>
      c(e)
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean),
    y = (e) =>
      String(e ?? "").replace(
        /[&<>"']/g,
        (e) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;",
          })[e],
      ),
    g = (t) =>
      [
        "workerCabinet",
        "restaurantCabinet",
        "supplierCabinet",
        "adminCabinet",
        "unknownRole",
      ].forEach((s) => {
        let i = e(s);
        i && (i.style.display = i === t ? "block" : "none");
      }),
    m = (e, s = {}) => {
      let i = t.from(e).select("*");
      for (const [e, t] of Object.entries(s)) null != t && (i = i.eq(e, t));
      return i;
    },
    _ = (e, s) => t.from(e).insert(s).select(),
    w = (e, s, i) => {
      let r = t.from(e).update(i);
      for (const [e, t] of Object.entries(s)) r = r.eq(e, t);
      return r.select();
    },
    h = (e, s, i = "user_id") =>
      t.from(e).upsert(s, { onConflict: i }).select();
  function S(e, t, s = "") {
    let i = document.createElement("article");
    return (
      (i.className = "data-card"), (i.innerHTML = `<h4>${y(e)}</h4>${t}${s}`), i
    );
  }
  function b(t, s) {
    for (const [i, r] of Object.entries(t)) {
      let t = e(i);
      if (!t) continue;
      let a = s?.[r] ?? "";
      "checkbox" === t.type
        ? (t.checked = !!a)
        : (t.value = Array.isArray(a) ? a.join(", ") : a);
    }
  }
  function k(t) {
    let s = {};
    for (const [i, r] of Object.entries(t)) {
      let t = e(i);
      t &&
        (s[r] =
          "checkbox" === t.type
            ? t.checked
            : i.toLowerCase().includes("cities") ||
                i.toLowerCase().includes("professions") ||
                i.toLowerCase().includes("days")
              ? f(i)
              : c(i));
    }
    return s;
  }
  const q = {
      workerProfessions: "professions",
      workerAvailableDays: "available_days",
      workerExperience: "experience",
      workerAvailableTime: "available_time",
      workerPaymentType: "payment_type",
      workerCanTravel: "can_travel",
      workerTravelCities: "travel_cities",
      workerAbout: "about",
    },
    L = {
      restaurantBusinessName: "business_name",
      restaurantBusinessType: "business_type",
      restaurantContactPerson: "contact_person",
      restaurantCity: "city",
      restaurantAddress: "address",
      restaurantAbout: "about",
    },
    C = {
      supplierCompanyName: "company_name",
      supplierProfileCategory: "category",
      supplierContactPerson: "contact_person",
      supplierProfileCity: "city",
      supplierDeliveryCities: "delivery_cities",
      supplierProfileAbout: "about",
    };
  function M() {
    let e = (c("workerSearchInput") || "").toLowerCase();
    (s.workersList.innerHTML = ""),
      a
        .filter((t) => JSON.stringify(t).toLowerCase().includes(e))
        .forEach((e) => {
          let t = S(
            (e.professions || []).join(", ") || "Работник",
            `<p>${y(e.experience || "")}</p><p>Ставка: ${y(e.min_rate || "-")}</p>`,
            '<button class="invite">Пригласить</button><p class="message"></p>',
          );
          (t.querySelector(".invite").onclick = () =>
            (async function (e, t) {
              let { error: s } = await _("shift_invites", {
                restaurant_id: i.id,
                worker_id: e,
                message: "Приглашение на смену",
                status: "pending",
                created_at: new Date().toISOString(),
              });
              u(t, s ? "Ошибка: " + s.message : "Приглашение отправлено");
            })(e.user_id, t.querySelector(".message"))),
            s.workersList.appendChild(t);
        }),
      u(s.workersMessage, a.length ? `Анкет: ${a.length}` : "Анкет пока нет");
  }
  async function v() {
    let { data: e, error: t } = await m("shift_invites", { worker_id: i.id });
    (s.invitesList.innerHTML = ""),
      t
        ? u(s.invitesMessage, t.message)
        : ((e || []).forEach((e) => {
            let t = S(
              "Приглашение",
              `<p>Статус: ${y(e.status)}</p><p>${y(e.message || "")}</p>`,
              '<button class="yes">Принять</button><button class="no">Отклонить</button><p class="message"></p>',
            );
            (t.querySelector(".yes").onclick = () =>
              O(e.id, "accepted", t.querySelector(".message"))),
              (t.querySelector(".no").onclick = () =>
                O(e.id, "declined", t.querySelector(".message"))),
              s.invitesList.appendChild(t);
          }),
          u(
            s.invitesMessage,
            (e || []).length ? `Приглашений: ${e.length}` : "Приглашений нет",
          ));
  }
  async function O(e, t, s) {
    let { error: r } = await w(
      "shift_invites",
      { id: e, worker_id: i.id },
      { status: t, updated_at: new Date().toISOString() },
    );
    u(s, r ? "Ошибка: " + r.message : "Готово");
  }
  async function $() {
    let { data: e, error: t } = await m("shift_posts", { status: "open" });
    t ? u(s.shiftPostsMessage, t.message) : ((n = e || []), R());
  }
  function R() {
    let e = (c("shiftSearchInput") || "").toLowerCase();
    (s.shiftPostsList.innerHTML = ""),
      n
        .filter((t) => JSON.stringify(t).toLowerCase().includes(e))
        .forEach((e) => {
          let t = S(
            e.title || "Смена",
            `<p>${y(e.profession)} / ${y(e.city)}</p><p>${y(e.date_from || "")} ${y(e.time_from || "")}-${y(e.time_to || "")}</p><p>Ставка: ${y(e.rate || "-")}</p>`,
            '<button>Откликнуться</button><p class="message"></p>',
          );
          (t.querySelector("button").onclick = () =>
            (async function (e, t) {
              let { error: s } = await _("shift_applications", {
                shift_id: e,
                worker_id: i.id,
                message: "Отклик работника",
                status: "new",
                created_at: new Date().toISOString(),
              });
              u(t, s ? "Ошибка: " + s.message : "Отклик отправлен");
            })(e.id, t.querySelector(".message"))),
            s.shiftPostsList.appendChild(t);
        }),
      u(s.shiftPostsMessage, n.length ? `Смен: ${n.length}` : "Смен пока нет");
  }
  async function I() {
    let { data: e } = await m("shift_posts", { restaurant_id: i.id });
    (s.restaurantShiftPostsList.innerHTML = ""),
      (e || []).forEach((e) =>
        s.restaurantShiftPostsList.appendChild(
          S(
            e.title || "Смена",
            `<p>${y(e.profession)} / ${y(e.city)}</p><p>${y(e.status)}</p>`,
          ),
        ),
      );
  }
  async function P(e, t, s) {
    let { error: i } = await w(
      "shift_applications",
      { id: e },
      { status: t, updated_at: new Date().toISOString() },
    );
    u(s, i ? "Ошибка: " + i.message : "Готово");
  }
  async function B() {
    let { data: e, error: t } = await m("supply_requests", { status: "open" });
    (l = e || []),
      (s.supplyRequestsList.innerHTML = ""),
      t
        ? u(s.supplierOfferMessageBox, t.message)
        : l.forEach((e) => {
            let t = S(
              e.title || "Запрос",
              `<p>${y(e.category)} ${y(e.quantity)} ${y(e.budget)}</p><p>${y(e.message || "")}</p>`,
              '<button>Откликнуться</button><p class="message"></p>',
            );
            (t.querySelector("button").onclick = () =>
              (async function (e, t) {
                let { error: s } = await _("supplier_responses", {
                  request_id: e.id,
                  restaurant_id: e.restaurant_id,
                  supplier_id: i.id,
                  category: c("supplierOfferCategory") || e.category,
                  message: c("supplierOfferMessage") || "Отклик поставщика",
                  status: "new",
                  created_at: new Date().toISOString(),
                });
                u(t, s ? "Ошибка: " + s.message : "Отклик отправлен");
              })(e, t.querySelector(".message"))),
              s.supplyRequestsList.appendChild(t);
          });
  }
  async function T(e, t, s) {
    let { error: r } = await w(
      "supplier_responses",
      { id: e, restaurant_id: i.id },
      { status: t, updated_at: new Date().toISOString() },
    );
    u(s, r ? "Ошибка: " + r.message : "Готово");
  }
  async function D() {
    let { data: e, error: t } = await m("supplier_inquiries", {
      supplier_id: i.id,
    });
    (s.supplierInquiriesList.innerHTML = ""),
      t
        ? u(s.supplierInquiriesMessage, t.message)
        : (e || []).forEach((e) => {
            let t = S(
              "Заявка от заведения",
              `<p>${y(e.message)}</p><p>${y(e.status)}</p>`,
              '<button class="yes">Принять</button><button class="no">Отклонить</button><p class="message"></p>',
            );
            (t.querySelector(".yes").onclick = () =>
              E(e.id, "accepted", t.querySelector(".message"))),
              (t.querySelector(".no").onclick = () =>
                E(e.id, "declined", t.querySelector(".message"))),
              s.supplierInquiriesList.appendChild(t);
          });
  }
  async function E(e, t, s) {
    let { error: r } = await w(
      "supplier_inquiries",
      { id: e, supplier_id: i.id },
      { status: t, updated_at: new Date().toISOString() },
    );
    u(s, r ? "Ошибка: " + r.message : "Готово");
  }
  async function A() {
    s.adminDataList.innerHTML = "";
    for (const e of [
      "worker_profiles",
      "shift_posts",
      "shift_applications",
      "shift_invites",
      "supplier_offers",
      "supplier_inquiries",
      "supply_requests",
      "supplier_responses",
    ]) {
      let { data: t } = await m(e);
      s.adminDataList.appendChild(S(e, `<p>${(t || []).length}</p>`));
    }
  }
  [
    [
      "saveWorkerProfileBtn",
      async function () {
        let t = {
            user_id: i.id,
            ...k(q),
            min_rate: d("workerMinRate"),
            travel_radius_km: d("workerTravelRadiusKm"),
            updated_at: new Date().toISOString(),
          },
          { error: s } = await h("worker_profiles", t);
        u(
          e("workerProfileMessage"),
          s ? "Ошибка: " + s.message : "Профиль сохранен",
        );
      },
    ],
    [
      "loadWorkersBtn",
      async function () {
        u(s.workersMessage, "Загрузка...");
        let { data: e, error: t } = await m("worker_profiles");
        t ? u(s.workersMessage, t.message) : ((a = e || []), M());
      },
    ],
    ["loadInvitesBtn", v],
    ["loadShiftPostsBtn", $],
    [
      "createShiftPostBtn",
      async function () {
        let e = {
            restaurant_id: i.id,
            title: c("shiftTitle"),
            profession: c("shiftProfession"),
            city: c("shiftCity"),
            district: c("shiftDistrict"),
            address: c("shiftAddress"),
            date_from: c("shiftDateFrom") || null,
            time_from: c("shiftTimeFrom") || null,
            time_to: c("shiftTimeTo") || null,
            rate: d("shiftRate"),
            requirements: c("shiftRequirements"),
            status: "open",
            created_at: new Date().toISOString(),
          },
          { error: t } = await _("shift_posts", e);
        u(
          s.shiftPostMessage,
          t ? "Ошибка: " + t.message : "Смена опубликована",
        ),
          I();
      },
    ],
    [
      "saveRestaurantProfileBtn",
      async function () {
        let { error: t } = await h("restaurant_profiles", {
          user_id: i.id,
          ...k(L),
          updated_at: new Date().toISOString(),
        });
        u(
          e("restaurantProfileMessage"),
          t ? "Ошибка: " + t.message : "Профиль заведения сохранен",
        );
      },
    ],
    ["loadRestaurantShiftPostsBtn", I],
    [
      "loadShiftApplicationsBtn",
      async function () {
        let { data: e, error: t } = await m("shift_applications");
        (s.shiftApplicationsList.innerHTML = ""),
          t
            ? u(s.shiftPostMessage, t.message)
            : (e || []).forEach((e) => {
                let t = S(
                  "Отклик работника",
                  `<p>${y(e.worker_id)}</p><p>${y(e.status)}</p>`,
                  '<button class="yes">Принять</button><button class="no">Отклонить</button><p class="message"></p>',
                );
                (t.querySelector(".yes").onclick = () =>
                  P(e.id, "accepted", t.querySelector(".message"))),
                  (t.querySelector(".no").onclick = () =>
                    P(e.id, "declined", t.querySelector(".message"))),
                  s.shiftApplicationsList.appendChild(t);
              });
      },
    ],
    [
      "createSupplyRequestBtn",
      async function () {
        let e = {
            restaurant_id: i.id,
            title: c("supplyRequestTitle"),
            category: c("supplyRequestCategory"),
            quantity: c("supplyRequestQuantity"),
            budget: c("supplyRequestBudget"),
            city: c("supplyRequestCity"),
            message: c("supplyRequestMessage"),
            status: "open",
            created_at: new Date().toISOString(),
          },
          { error: t } = await _("supply_requests", e);
        u(
          s.supplyRequestMessageBox,
          t ? "Ошибка: " + t.message : "Запрос опубликован",
        );
      },
    ],
    [
      "loadSupplierOffersBtn",
      async function () {
        let { data: e, error: t } = await m("supplier_offers", {
          status: "active",
        });
        (o = e || []),
          (s.supplierOffersList.innerHTML = ""),
          t
            ? u(s.supplyRequestMessageBox, t.message)
            : o.forEach((e) => {
                let t = S(
                  e.title || "Оффер",
                  `<p>${y(e.category)} ${y(e.price || "")}</p><p>${y(e.description || "")}</p>`,
                  '<button>Отправить запрос</button><p class="message"></p>',
                );
                (t.querySelector("button").onclick = () =>
                  (async function (e, t) {
                    let { error: s } = await _("supplier_inquiries", {
                      offer_id: e.id,
                      restaurant_id: i.id,
                      supplier_id: e.supplier_id,
                      message:
                        c("supplyRequestMessage") || "Запрос от заведения",
                      status: "new",
                      created_at: new Date().toISOString(),
                    });
                    u(t, s ? "Ошибка: " + s.message : "Запрос отправлен");
                  })(e, t.querySelector(".message"))),
                  s.supplierOffersList.appendChild(t);
              });
      },
    ],
    [
      "loadSupplyResponsesBtn",
      async function () {
        let { data: e, error: t } = await m("supplier_responses", {
          restaurant_id: i.id,
        });
        (s.supplyResponsesList.innerHTML = ""),
          t
            ? u(s.supplyResponsesMessage, t.message)
            : ((p = e || []),
              p.forEach((e) => {
                let t = S(
                  "Отклик поставщика",
                  `<p>${y(e.supplier_id)}</p><p>${y(e.message)}</p><p>${y(e.status)}</p>`,
                  '<button class="yes">Принять</button><button class="no">Отклонить</button><p class="message"></p>',
                );
                (t.querySelector(".yes").onclick = () =>
                  T(e.id, "accepted", t.querySelector(".message"))),
                  (t.querySelector(".no").onclick = () =>
                    T(e.id, "declined", t.querySelector(".message"))),
                  s.supplyResponsesList.appendChild(t);
              }),
              u(
                s.supplyResponsesMessage,
                p.length ? `Откликов: ${p.length}` : "Откликов нет",
              ));
      },
    ],
    [
      "saveSupplierProfileBtn",
      async function () {
        let { error: t } = await h("supplier_profiles", {
          user_id: i.id,
          ...k(C),
          updated_at: new Date().toISOString(),
        });
        u(
          e("supplierProfileMessage"),
          t ? "Ошибка: " + t.message : "Профиль поставщика сохранен",
        );
      },
    ],
    [
      "createSupplierOfferBtn",
      async function () {
        let e = {
            supplier_id: i.id,
            title: c("supplierOfferTitle"),
            category: c("supplierOfferCategory"),
            product_name: c("supplierOfferTitle"),
            price: d("supplierOfferPrice"),
            unit: "руб.",
            min_order: c("supplierOfferQuantity"),
            delivery_cities: f("supplierOfferCity"),
            description: c("supplierOfferMessage"),
            status: "active",
            created_at: new Date().toISOString(),
          },
          { error: t } = await _("supplier_offers", e);
        u(
          s.supplierOfferMessageBox,
          t ? "Ошибка: " + t.message : "Предложение опубликовано",
        );
      },
    ],
    ["loadSupplyRequestsBtn", B],
    ["loadSupplierInquiriesBtn", D],
    ["loadAdminDataBtn", A],
  ].forEach(([t, s]) => e(t)?.addEventListener("click", s)),
    e("workerSearchInput")?.addEventListener("input", M),
    e("shiftSearchInput")?.addEventListener("input", R),
    e("logoutBtn")?.addEventListener("click", async () => {
      await t.auth.signOut(), (location.href = "auth.html");
    }),
    (async function () {
      let a = (await t.auth.getSession()).data.session;
      if (!a) return void (location.href = "auth.html");
      i = a.user;
      let { data: n } = await m("profiles", { id: i.id }).maybeSingle();
      (r = n || { id: i.id, role: "worker", email: i.email }),
        u(s.userInfo, `${r.email || i.email} / ${r.role}`),
        "worker" === r.role
          ? (g(s.workerCabinet),
            (async function () {
              let { data: t } = await m("worker_profiles", {
                user_id: i.id,
              }).maybeSingle();
              b(q, t),
                e("workerMinRate") &&
                  (e("workerMinRate").value = t?.min_rate || ""),
                e("workerTravelRadiusKm") &&
                  (e("workerTravelRadiusKm").value = t?.travel_radius_km || "");
            })(),
            v(),
            $())
          : "restaurant" === r.role
            ? (g(s.restaurantCabinet),
              (async function () {
                let { data: e } = await m("restaurant_profiles", {
                  user_id: i.id,
                }).maybeSingle();
                b(L, e);
              })(),
              I())
            : "supplier" === r.role
              ? (g(s.supplierCabinet),
                (async function () {
                  let { data: e } = await m("supplier_profiles", {
                    user_id: i.id,
                  }).maybeSingle();
                  b(C, e);
                })(),
                B(),
                D())
              : "admin" === r.role
                ? (g(s.adminCabinet), A())
                : g(s.unknownRole);
    })();
})();
