(function () {
  const SETTINGS_KEY = "gc_site_settings";
  const SETTINGS_ROW = "public_site";
  const SUBMISSIONS_KEY = "gc_public_submissions";
  const SUBMISSIONS_TABLE = "public_submissions";
  const roles = ["worker", "restaurant", "supplier"];
  const roleName = {
    worker: "работника",
    restaurant: "заведения",
    supplier: "поставщика",
  };

  const normalizeRole = (role) => (roles.includes(role) ? role : "worker");

  function getPath(source, path) {
    return path.split(".").reduce((value, key) => value?.[key], source);
  }

  function mergeDeep(base, extra) {
    if (!extra || typeof extra !== "object") return base || {};
    const result = { ...(base || {}) };
    Object.entries(extra).forEach(([key, value]) => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        result[key] = mergeDeep(result[key], value);
      } else if (value !== undefined && value !== null && value !== "") {
        result[key] = value;
      }
    });
    return result;
  }

  function readJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || "") || fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }

  function applySettings(settings) {
    if (!settings || typeof settings !== "object") return;
    document.querySelectorAll("[data-site-setting]").forEach((node) => {
      const value = getPath(settings, node.dataset.siteSetting);
      if (typeof value === "string") node.textContent = value;
    });
    document.querySelectorAll("[data-site-image]").forEach((image) => {
      const value = getPath(settings, image.dataset.siteImage);
      if (typeof value === "string" && image.getAttribute("src") !== value) {
        image.src = value;
      }
    });
    document.querySelectorAll("[data-site-logo]").forEach((image) => {
      if (typeof settings.logo === "string") image.src = settings.logo;
    });
  }

  async function refreshSettings() {
    const client = window.supabaseClient;
    if (!client) return;
    try {
      const { data, error } = await client
        .from("site_settings")
        .select("settings")
        .eq("id", SETTINGS_ROW)
        .maybeSingle();
      if (error || !data?.settings) return;
      const next = mergeDeep(readJson(SETTINGS_KEY, {}), data.settings);
      writeJson(SETTINGS_KEY, next);
      applySettings(next);
    } catch {}
  }

  function readSubmissions() {
    return readJson(SUBMISSIONS_KEY, []);
  }

  function saveLocalSubmission(row) {
    const rows = readSubmissions();
    rows.unshift(row);
    writeJson(SUBMISSIONS_KEY, rows.slice(0, 100));
  }

  function makeSubmission(type, data) {
    const title = data.name || data.company || data.role || data.product || "Заявка";
    return {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type,
      title,
      phone: data.phone || "",
      telegram: data.telegram || "",
      city: data.city || "",
      data,
      source: "site",
      created_at: new Date().toISOString(),
    };
  }

  async function saveRemoteSubmission(row) {
    const client = window.supabaseClient;
    if (!client) return false;
    const { error } = await client.from(SUBMISSIONS_TABLE).insert(row);
    if (error) throw error;
    return true;
  }

  function initPublicForms() {
    document.querySelectorAll("form[data-form-type]").forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const button = form.querySelector('button[type="submit"], input[type="submit"]');
        const box = form.querySelector(".success");
        if (button) button.disabled = true;
        const row = makeSubmission(
          form.dataset.formType,
          Object.fromEntries(new FormData(form).entries()),
        );
        saveLocalSubmission(row);
        try {
          await saveRemoteSubmission(row);
          if (box) box.textContent = "Заявка отправлена. Дальше работайте с ней в личном кабинете.";
        } catch {
          if (box) box.textContent = "Заявка сохранена локально. Попробуйте отправить ещё раз позже.";
        } finally {
          if (box) box.style.display = "block";
          form.reset();
          if (button) button.disabled = false;
        }
      });
    });
  }

  function initAuthPage() {
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const roleInput = document.getElementById("role");
    const roleField = document.getElementById("roleField");
    const message = document.getElementById("authMessage");
    const registerBtn = document.getElementById("registerBtn");
    const loginBtn = document.getElementById("loginBtn");
    const showLoginBtn = document.getElementById("showLoginBtn");
    const showRegisterBtn = document.getElementById("showRegisterBtn");
    const formTitle = document.getElementById("authFormTitle");
    const modeHint = document.getElementById("authModeHint");
    const cabinetShortcut = document.getElementById("cabinetShortcut");
    if (!emailInput || !passwordInput || !roleInput || !message) return;

    const params = new URLSearchParams(window.location.search);
    let mode = params.get("mode") === "login" ? "login" : "signup";
    let roleWasExplicit = roles.includes(params.get("role"));
    roleInput.value = normalizeRole(params.get("role"));

    const cabinetUrl = () => `cabinet.html?role=${encodeURIComponent(roleInput.value)}`;
    const profileCabinetUrl = (profile) => {
      const role = profile?.role || roleInput.value;
      return `cabinet.html?role=${encodeURIComponent(role)}`;
    };

    function roleFromUser(user) {
      return roles.find((role) => role === user?.app_metadata?.role || role === user?.user_metadata?.role) || "";
    }

    function setBusy(isBusy, text) {
      [registerBtn, loginBtn, showLoginBtn, showRegisterBtn].forEach((button) => {
        if (button) button.disabled = isBusy;
      });
      if (text) message.textContent = text;
    }

    function setMode(nextMode, updateUrl = true) {
      mode = nextMode === "login" ? "login" : "signup";
      if (formTitle) formTitle.textContent = mode === "login" ? "Вход" : "Регистрация";
      if (roleField) roleField.hidden = mode === "login";
      if (registerBtn) registerBtn.hidden = mode !== "signup";
      if (loginBtn) loginBtn.hidden = mode !== "login";
      if (passwordInput) {
        passwordInput.autocomplete = mode === "login" ? "current-password" : "new-password";
      }
      showLoginBtn?.classList.toggle("is-active", mode === "login");
      showRegisterBtn?.classList.toggle("is-active", mode === "signup");
      if (modeHint) {
        modeHint.textContent =
          mode === "login"
            ? "Введите email и пароль. Роль подтянется из вашего профиля."
            : `Будет создан кабинет ${roleName[roleInput.value]}.`;
      }
      if (cabinetShortcut) cabinetShortcut.href = cabinetUrl();
      if (updateUrl) {
        const next = new URLSearchParams(window.location.search);
        next.set("mode", mode);
        next.set("role", roleInput.value);
        window.history.replaceState(null, "", `auth.html?${next}`);
      }
    }

    async function ensureProfile(user, role) {
      if (!user) return null;
      const profileRole = roleFromUser(user) || (roles.includes(role) ? role : "");
      const { data: existing, error: readError } = await window.supabaseClient
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .maybeSingle();
      if (readError) throw readError;
      if (existing) return existing;
      if (!profileRole) {
        throw new Error("Профиль не найден. Откройте регистрацию, выберите роль и создайте профиль.");
      }
      const payload = {
        id: user.id,
        role: profileRole,
        name: user.email || "Пользователь",
        status: "active",
        updated_at: new Date().toISOString(),
      };
      const { error } = await window.supabaseClient
        .from("profiles")
        .upsert(payload, { onConflict: "id" });
      if (error) throw error;
      return payload;
    }

    async function refreshSession() {
      const client = window.supabaseClient;
      if (!client || !cabinetShortcut) return;
      const { data } = await client.auth.getSession();
      if (data?.session?.user) {
        let sessionProfile = null;
        try {
          sessionProfile = await ensureProfile(data.session.user, roleWasExplicit ? roleInput.value : "");
        } catch (error) {
          cabinetShortcut.hidden = true;
          message.textContent = error.message;
          return;
        }
        cabinetShortcut.hidden = false;
        cabinetShortcut.href = profileCabinetUrl(sessionProfile);
        message.textContent = "Вы уже вошли. Можно открыть кабинет.";
      }
    }

    registerBtn?.addEventListener("click", async () => {
      const client = window.supabaseClient;
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const role = normalizeRole(roleInput.value);
      if (!client) return (message.textContent = "Supabase не загрузился. Обновите страницу.");
      if (!email || !password) return (message.textContent = "Введите email и пароль.");
      if (password.length < 6) return (message.textContent = "Пароль должен быть минимум 6 символов.");

      setBusy(true, "Создаём аккаунт...");
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: { data: { role } },
      });
      if (error) {
        setBusy(false);
        return (message.textContent = `Ошибка регистрации: ${error.message}`);
      }
      if (data?.session?.user) {
        try {
          const profile = await ensureProfile(data.session.user, role);
          window.location.href = profileCabinetUrl(profile);
          return;
        } catch (profileError) {
          setBusy(false);
          return (message.textContent = `Аккаунт создан, но профиль не сохранён: ${profileError.message}`);
        }
      }
      setBusy(false);
      message.textContent = "Аккаунт создан. Если нужно подтверждение email, подтвердите почту и войдите.";
      setMode("login");
    });

    loginBtn?.addEventListener("click", async () => {
      const client = window.supabaseClient;
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      if (!client) return (message.textContent = "Supabase не загрузился. Обновите страницу.");
      if (!email || !password) return (message.textContent = "Введите email и пароль.");

      setBusy(true, "Входим...");
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) {
        setBusy(false);
        return (message.textContent = `Ошибка входа: ${error.message}`);
      }
      try {
        const profile = await ensureProfile(data.user, roleWasExplicit ? roleInput.value : "");
        window.location.href = profileCabinetUrl(profile);
      } catch (profileError) {
        setBusy(false);
        message.textContent = `Вход выполнен, но профиль не проверен: ${profileError.message}`;
      }
    });

    showLoginBtn?.addEventListener("click", () => setMode("login"));
    showRegisterBtn?.addEventListener("click", () => setMode("signup"));
    roleInput.addEventListener("change", () => {
      roleWasExplicit = true;
      setMode(mode);
    });
    passwordInput.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      (mode === "login" ? loginBtn : registerBtn)?.click();
    });

    setMode(mode, false);
    refreshSession();
  }

  applySettings(readJson(SETTINGS_KEY, {}));
  initPublicForms();
  initAuthPage();
  window.addEventListener("load", () => setTimeout(refreshSettings, 400), { once: true });
})();
