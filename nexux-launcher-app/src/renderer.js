// =========================================================
// NEXUX LAUNCHER - RENDERER CONTROLLER
// STRICT REQUIREMENT: ZERO EMOJIS ANYWHERE
// =========================================================

document.addEventListener('DOMContentLoaded', async () => {
  const api = window.nexuxApi || mockApi();

  let launcherConfig = {
    theme: 'cyber_neon',
    minecraftFont: true,
    autoConnectServer: false,
    ramMin: 2048,
    ramMax: 4096,
    javaPath: 'C:\\Program Files\\Java\\jdk-25\\bin\\javaw.exe',
    jvmArgs: ['-XX:+UseG1GC', '-XX:+ParallelRefProcEnabled'],
    resolution: { width: 1280, height: 720 },
    activeVersion: '1.21.1',
    lastPlayedVersion: '1.21.1',
    activeAccount: 'NEXUX_Player',
    accounts: ['NEXUX_Player'],
    serverAddress: 'nexuxsmp.play.hosting',
  };

  let installedModsList = [];
  let isGameLaunching = false;

  // ─── Elements ──────────────────────────────────────────
  const winMinimize = document.getElementById('winMinimize');
  const winMaximize = document.getElementById('winMaximize');
  const winClose = document.getElementById('winClose');

  const navItems = document.querySelectorAll('.nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');

  const launchAccountSelect = document.getElementById('launchAccountSelect');
  const activeAccountAvatar = document.getElementById('activeAccountAvatar');
  const launchVersionSelect = document.getElementById('launchVersionSelect');
  const btnLaunchGame = document.getElementById('btnLaunchGame');
  const btnKillGame = document.getElementById('btnKillGame');
  const launchBtnText = document.getElementById('launchBtnText');

  const btnCopyServerIp = document.getElementById('btnCopyServerIp');
  const autoJoinServerToggle = document.getElementById('autoJoinServerToggle');

  const launchProgressCard = document.getElementById('launchProgressCard');
  const progressStatusText = document.getElementById('progressStatusText');
  const progressPercent = document.getElementById('progressPercent');
  const progressBarFill = document.getElementById('progressBarFill');
  const progressSubDetail = document.getElementById('progressSubDetail');

  const btnRefreshVersions = document.getElementById('btnRefreshVersions');
  const versionsList = document.getElementById('versionsList');
  const versionFilterChips = document.querySelectorAll('.filter-chip');

  const modSearchInput = document.getElementById('modSearchInput');
  const modLoaderSelect = document.getElementById('modLoaderSelect');
  const btnSearchMods = document.getElementById('btnSearchMods');
  const modsGrid = document.getElementById('modsGrid');
  const installedModsContainer = document.getElementById('installedModsList');
  const installedCount = document.getElementById('installedCount');
  const btnOpenModsFolder = document.getElementById('btnOpenModsFolder');

  const newAccountUsername = document.getElementById('newAccountUsername');
  const btnAddAccount = document.getElementById('btnAddAccount');
  const accountsList = document.getElementById('accountsList');

  const themeOptions = document.querySelectorAll('.theme-option');
  const minecraftFontToggle = document.getElementById('minecraftFontToggle');
  const ramChips = document.querySelectorAll('.ram-chip');
  const ramMaxSlider = document.getElementById('ramMaxSlider');
  const ramMaxDisplay = document.getElementById('ramMaxDisplay');
  const ramMinSlider = document.getElementById('ramMinSlider');
  const ramMinDisplay = document.getElementById('ramMinDisplay');
  const javaPathInput = document.getElementById('javaPathInput');
  const btnAutoDetectJava = document.getElementById('btnAutoDetectJava');
  const resWidthInput = document.getElementById('resWidthInput');
  const resHeightInput = document.getElementById('resHeightInput');
  const jvmArgsInput = document.getElementById('jvmArgsInput');
  const serverAddressInput = document.getElementById('serverAddressInput');
  const btnSaveSettings = document.getElementById('btnSaveSettings');

  const consoleOutput = document.getElementById('consoleOutput');
  const btnClearLogs = document.getElementById('btnClearLogs');
  const btnCopyLogs = document.getElementById('btnCopyLogs');

  const toast = document.getElementById('toastNotification');
  const toastMessage = document.getElementById('toastMessage');

  // ─── Toast Helper ───────────────────────────────────────
  function showToast(msg, duration = 3000) {
    toastMessage.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, duration);
  }

  // ─── Window Controls ────────────────────────────────────
  winMinimize?.addEventListener('click', () => api.minimize());
  winMaximize?.addEventListener('click', () => api.maximize());
  winClose?.addEventListener('click', () => api.close());

  // ─── Copy Server IP ─────────────────────────────────────
  btnCopyServerIp?.addEventListener('click', () => {
    const ip = launcherConfig.serverAddress || 'nexuxsmp.play.hosting';
    navigator.clipboard.writeText(ip);
    showToast(`Server IP copied to clipboard: ${ip}`);
  });

  // ─── Auto-Join Toggle ───────────────────────────────────
  autoJoinServerToggle?.addEventListener('change', (e) => {
    launcherConfig.autoConnectServer = e.target.checked;
    api.saveConfig(launcherConfig);
    showToast(e.target.checked ? 'Auto-connect to server enabled' : 'Auto-connect disabled');
  });

  // ─── Minecraft Font Toggle ──────────────────────────────
  function applyMinecraftFont(enabled) {
    if (enabled) {
      document.body.classList.add('mc-font-enabled');
    } else {
      document.body.classList.remove('mc-font-enabled');
    }
  }

  minecraftFontToggle?.addEventListener('change', (e) => {
    launcherConfig.minecraftFont = e.target.checked;
    applyMinecraftFont(e.target.checked);
    api.saveConfig(launcherConfig);
    showToast(e.target.checked ? 'Minecraft font enabled' : 'Standard font enabled');
  });

  // ─── Tab Routing ────────────────────────────────────────
  navItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      navItems.forEach((b) => b.classList.remove('active'));
      tabPanes.forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(`pane-${targetTab}`)?.classList.add('active');

      if (targetTab === 'mods') {
        loadInstalledMods();
      }
    });
  });

  // ─── Theme Switcher ─────────────────────────────────────
  function applyTheme(themeKey) {
    const cleanKey = (themeKey || 'cyber_neon').replace(/_/g, '-');
    document.body.className = `theme-${cleanKey} ${launcherConfig.minecraftFont ? 'mc-font-enabled' : ''}`;
    themeOptions.forEach((opt) => {
      if (opt.getAttribute('data-theme') === cleanKey) {
        opt.classList.add('active');
      } else {
        opt.classList.remove('active');
      }
    });
  }

  themeOptions.forEach((opt) => {
    opt.addEventListener('click', () => {
      const selectedTheme = opt.getAttribute('data-theme').replace(/-/g, '_');
      launcherConfig.theme = selectedTheme;
      applyTheme(selectedTheme);
      api.saveConfig(launcherConfig);
      showToast(`Theme switched to ${opt.querySelector('.theme-name').textContent}`);
    });
  });

  // ─── RAM Preset Chips ───────────────────────────────────
  function updateRamPresetChips(val) {
    ramChips.forEach((chip) => {
      if (parseInt(chip.getAttribute('data-ram'), 10) === parseInt(val, 10)) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });
  }

  ramChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const mb = parseInt(chip.getAttribute('data-ram'), 10);
      ramMaxSlider.value = mb;
      ramMaxDisplay.textContent = `${mb} MB (${(mb / 1024).toFixed(0)} GB)`;
      updateRamPresetChips(mb);
      launcherConfig.ramMax = mb;
      api.saveConfig(launcherConfig);
      showToast(`RAM allocation set to ${(mb / 1024).toFixed(0)} GB`);
    });
  });

  // ─── Load Config ────────────────────────────────────────
  try {
    const loaded = await api.getConfig();
    if (loaded) launcherConfig = { ...launcherConfig, ...loaded };
  } catch (e) {}

  // Enforce javaw.exe
  if (launcherConfig.javaPath && launcherConfig.javaPath.toLowerCase().endsWith('java.exe')) {
    launcherConfig.javaPath = launcherConfig.javaPath.replace(/java\.exe$/i, 'javaw.exe');
  }

  applyMinecraftFont(launcherConfig.minecraftFont !== false);
  if (minecraftFontToggle) minecraftFontToggle.checked = launcherConfig.minecraftFont !== false;
  if (autoJoinServerToggle) autoJoinServerToggle.checked = !!launcherConfig.autoConnectServer;

  applyTheme(launcherConfig.theme || 'cyber_neon');
  ramMaxSlider.value = launcherConfig.ramMax || 4096;
  ramMaxDisplay.textContent = `${launcherConfig.ramMax || 4096} MB (${((launcherConfig.ramMax || 4096) / 1024).toFixed(0)} GB)`;
  updateRamPresetChips(launcherConfig.ramMax || 4096);

  ramMinSlider.value = launcherConfig.ramMin || 2048;
  ramMinDisplay.textContent = `${launcherConfig.ramMin || 2048} MB (${((launcherConfig.ramMin || 2048) / 1024).toFixed(0)} GB)`;
  javaPathInput.value = launcherConfig.javaPath || 'C:\\Program Files\\Java\\jdk-25\\bin\\javaw.exe';
  resWidthInput.value = launcherConfig.resolution?.width || 1280;
  resHeightInput.value = launcherConfig.resolution?.height || 720;
  jvmArgsInput.value = (launcherConfig.jvmArgs || []).join(' ');
  serverAddressInput.value = launcherConfig.serverAddress || 'nexuxsmp.play.hosting';

  // ─── Version Dropdown Selector & Full Persistence ────────────
  const lastPlayedIndicator = document.getElementById('lastPlayedIndicator');

  const POPULAR_PRESETS = [
    { id: '1.21.1', name: 'Minecraft 1.21.1 (Latest Release)' },
    { id: '1.21', name: 'Minecraft 1.21 (Tricky Trials)' },
    { id: '1.20.4', name: 'Minecraft 1.20.4' },
    { id: '1.20.1', name: 'Minecraft 1.20.1' },
    { id: '1.19.4', name: 'Minecraft 1.19.4' },
    { id: '1.16.5', name: 'Minecraft 1.16.5' },
  ];

  async function syncAndSelectVersion(targetVer) {
    if (!launchVersionSelect) return;

    // Detect installed local versions in .nexuxlauncher/versions (e.g. 26.3, 1.21.1)
    let installedVersions = [];
    try {
      if (api.getInstalledVersions) {
        installedVersions = await api.getInstalledVersions();
      }
    } catch (e) {
      installedVersions = [];
    }

    // Determine target version to restore and remember
    const rememberedVer = targetVer || launcherConfig.lastPlayedVersion || localStorage.getItem('nexux_last_played_version') || launcherConfig.activeVersion || (installedVersions.length > 0 ? installedVersions[0] : '1.21.1');
    const cleanVer = String(rememberedVer).trim();

    // Build unified versions list: target remembered first, then installed, then popular presets
    const allVersions = new Map();

    // 1. Target remembered version
    allVersions.set(cleanVer, {
      id: cleanVer,
      title: `Minecraft ${cleanVer} [Last Played]`,
      isLast: true,
    });

    // 2. Installed versions
    installedVersions.forEach((v) => {
      if (!allVersions.has(v)) {
        allVersions.set(v, {
          id: v,
          title: `Minecraft ${v} [Installed]`,
          isLast: false,
        });
      }
    });

    // 3. Popular presets
    POPULAR_PRESETS.forEach((p) => {
      if (!allVersions.has(p.id)) {
        allVersions.set(p.id, {
          id: p.id,
          title: p.name,
          isLast: false,
        });
      }
    });

    // Render options
    launchVersionSelect.innerHTML = '';
    allVersions.forEach((item) => {
      const opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = item.title;
      if (item.id === cleanVer) {
        opt.selected = true;
      }
      launchVersionSelect.appendChild(opt);
    });

    launchVersionSelect.value = cleanVer;

    // Update indicator tag
    if (lastPlayedIndicator) {
      lastPlayedIndicator.textContent = `Remembered: ${cleanVer}`;
    }

    // Save everywhere (config file and local storage)
    launcherConfig.activeVersion = cleanVer;
    launcherConfig.lastPlayedVersion = cleanVer;
    try {
      localStorage.setItem('nexux_last_played_version', cleanVer);
    } catch (e) {}
    await api.saveConfig(launcherConfig);
  }

  // Restore and remember version on startup
  await syncAndSelectVersion();

  // When user changes dropdown, remember it immediately
  launchVersionSelect?.addEventListener('change', async (e) => {
    const chosen = e.target.value;
    await syncAndSelectVersion(chosen);
    showToast(`Active version set to Minecraft ${chosen}`);
  });

  // ─── RAM Slider Updates ─────────────────────────────────
  ramMaxSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    ramMaxDisplay.textContent = `${val} MB (${(val / 1024).toFixed(0)} GB)`;
    updateRamPresetChips(val);
  });

  ramMinSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    ramMinDisplay.textContent = `${val} MB (${(val / 1024).toFixed(0)} GB)`;
  });

  // ─── Auto-Detect Java ───────────────────────────────────
  btnAutoDetectJava?.addEventListener('click', async () => {
    try {
      const detected = await api.detectJava();
      if (detected) {
        javaPathInput.value = detected;
        showToast(`Java auto-detected: ${detected}`);
      }
    } catch (err) {
      showToast('Could not auto-detect Java. Please enter manually.');
    }
  });

  // ─── Save Settings ──────────────────────────────────────
  btnSaveSettings?.addEventListener('click', async () => {
    launcherConfig.ramMax = parseInt(ramMaxSlider.value, 10);
    launcherConfig.ramMin = parseInt(ramMinSlider.value, 10);
    launcherConfig.javaPath = javaPathInput.value.trim();
    launcherConfig.resolution = {
      width: parseInt(resWidthInput.value, 10) || 1280,
      height: parseInt(resHeightInput.value, 10) || 720,
    };
    launcherConfig.jvmArgs = jvmArgsInput.value.split(' ').filter(Boolean);
    launcherConfig.serverAddress = serverAddressInput.value.trim();
    launcherConfig.minecraftFont = minecraftFontToggle ? minecraftFontToggle.checked : true;

    await api.saveConfig(launcherConfig);
    showToast('Settings saved successfully.');
  });

  // ─── Accounts Management & Live Avatar Heads ───────────
  function updatePlayerAvatar(uname) {
    if (!activeAccountAvatar) return;
    const cleanUname = encodeURIComponent(uname || 'NEXUX_Player');
    activeAccountAvatar.src = `https://minotar.net/helm/${cleanUname}/32`;
    activeAccountAvatar.style.display = 'block';
  }

  function renderAccounts() {
    launchAccountSelect.innerHTML = '';
    accountsList.innerHTML = '';

    const accounts = launcherConfig.accounts || ['NEXUX_Player'];
    accounts.forEach((acc) => {
      const opt = document.createElement('option');
      opt.value = acc;
      opt.textContent = acc;
      if (acc === launcherConfig.activeAccount) opt.selected = true;
      launchAccountSelect.appendChild(opt);

      const item = document.createElement('div');
      item.className = `account-item ${acc === launcherConfig.activeAccount ? 'active' : ''}`;
      item.innerHTML = `
        <div class="account-name-group">
          <img class="account-avatar" src="https://minotar.net/helm/${encodeURIComponent(acc)}/32" onerror="this.src='https://minotar.net/helm/char/32'" />
          <div>
            <div class="account-username mc-font">${escapeHtml(acc)}</div>
            <div class="account-type mc-font">Offline Player</div>
          </div>
        </div>
        <div class="mod-row-actions">
          <button class="cyber-btn small mc-font ${acc === launcherConfig.activeAccount ? 'primary' : ''}" data-action="select" data-acc="${escapeHtml(acc)}">
            ${acc === launcherConfig.activeAccount ? 'Active' : 'Select'}
          </button>
          ${accounts.length > 1 ? `<button class="cyber-btn small danger mc-font" data-action="delete" data-acc="${escapeHtml(acc)}">Delete</button>` : ''}
        </div>
      `;
      accountsList.appendChild(item);
    });

    updatePlayerAvatar(launcherConfig.activeAccount);
  }

  renderAccounts();

  launchAccountSelect?.addEventListener('change', (e) => {
    launcherConfig.activeAccount = e.target.value;
    updatePlayerAvatar(e.target.value);
    api.saveConfig(launcherConfig);
    renderAccounts();
  });

  accountsList?.addEventListener('click', async (e) => {
    const target = e.target.closest('button');
    if (!target) return;
    const action = target.getAttribute('data-action');
    const accName = target.getAttribute('data-acc');

    if (action === 'select') {
      launcherConfig.activeAccount = accName;
      await api.saveConfig(launcherConfig);
      renderAccounts();
      showToast(`Active account set to ${accName}`);
    } else if (action === 'delete') {
      launcherConfig.accounts = (launcherConfig.accounts || []).filter((a) => a !== accName);
      if (launcherConfig.activeAccount === accName) {
        launcherConfig.activeAccount = launcherConfig.accounts[0] || 'NEXUX_Player';
      }
      await api.saveConfig(launcherConfig);
      renderAccounts();
      showToast(`Account ${accName} removed.`);
    }
  });

  btnAddAccount?.addEventListener('click', async () => {
    const uname = newAccountUsername.value.trim();
    if (!uname) return showToast('Please enter a username.');
    if (!/^[a-zA-Z0-9_]{3,16}$/.test(uname)) {
      return showToast('Username must be 3-16 alphanumeric characters.');
    }

    if (!launcherConfig.accounts.includes(uname)) {
      launcherConfig.accounts.push(uname);
    }
    launcherConfig.activeAccount = uname;
    await api.saveConfig(launcherConfig);
    newAccountUsername.value = '';
    renderAccounts();
    showToast(`Account ${uname} added and selected.`);
  });

  // ─── Versions Manifest ──────────────────────────────────
  async function loadMojangVersions() {
    versionsList.innerHTML = '<div class="loading-state mc-font">Loading official Mojang manifest...</div>';
    try {
      const manifest = await api.getMcVersions();
      if (!manifest || !manifest.versions) {
        versionsList.innerHTML = '<div class="loading-state mc-font">Failed to load manifest.</div>';
        return;
      }

      versionsList.innerHTML = '';
      manifest.versions.slice(0, 45).forEach((v) => {
        const row = document.createElement('div');
        row.className = 'mod-row';
        row.setAttribute('data-type', v.type);
        row.innerHTML = `
          <div>
            <span class="mod-row-name mc-font">${escapeHtml(v.id)}</span>
            <span style="font-size:11px;color:var(--text-muted);margin-left:10px;">[${escapeHtml(v.type)}]</span>
          </div>
          <button class="cyber-btn small mc-font ${v.id === launcherConfig.activeVersion ? 'primary' : ''}" data-vid="${escapeHtml(v.id)}">
            ${v.id === launcherConfig.activeVersion ? 'Active' : 'Select'}
          </button>
        `;
        versionsList.appendChild(row);
      });
    } catch (err) {
      versionsList.innerHTML = `<div class="loading-state mc-font">Error loading versions: ${escapeHtml(err.message)}</div>`;
    }
  }

  loadMojangVersions();

  btnRefreshVersions?.addEventListener('click', loadMojangVersions);

  versionsList?.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const vid = btn.getAttribute('data-vid');
    launcherConfig.activeVersion = vid;
    launcherConfig.lastPlayedVersion = vid;
    try {
      localStorage.setItem('nexux_last_played_version', vid);
    } catch (err) {}
    await api.saveConfig(launcherConfig);

    await syncAndSelectVersion(vid);
    loadMojangVersions();
    showToast(`Active version set to Minecraft ${vid}`);
  });

  versionFilterChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      versionFilterChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      const filter = chip.getAttribute('data-vfilter');

      const rows = versionsList.querySelectorAll('.mod-row');
      rows.forEach((r) => {
        const type = r.getAttribute('data-type');
        if (filter === 'all' || type === filter) {
          r.style.display = 'flex';
        } else {
          r.style.display = 'none';
        }
      });
    });
  });

  // ─── 1-Click Mod Manager ────────────────────────────────
  const modSubTabs = document.querySelectorAll('.sub-tab');
  const modTabContents = document.querySelectorAll('.modtab-content');

  modSubTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-modtab');
      modSubTabs.forEach((t) => t.classList.remove('active'));
      modTabContents.forEach((c) => c.classList.remove('active'));

      tab.classList.add('active');
      document.getElementById(`modtab-${target}`)?.classList.add('active');
    });
  });

  btnOpenModsFolder?.addEventListener('click', () => api.openModsFolder());

  async function loadInstalledMods() {
    try {
      installedModsList = await api.listInstalledMods();
      installedCount.textContent = installedModsList.length;

      if (installedModsList.length === 0) {
        installedModsContainer.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);" class="mc-font">No mods installed yet. Search and 1-click install mods from the Browse Modrinth tab.</div>';
        return;
      }

      installedModsContainer.innerHTML = '';
      installedModsList.forEach((mod) => {
        const row = document.createElement('div');
        row.className = 'mod-row';
        row.innerHTML = `
          <div class="mod-row-name ${mod.enabled ? '' : 'disabled'}">${escapeHtml(mod.filename)}</div>
          <div class="mod-row-actions">
            <button class="cyber-btn small mc-font ${mod.enabled ? 'primary' : ''}" data-mod-toggle="${escapeHtml(mod.filename)}">
              ${mod.enabled ? 'Enabled' : 'Disabled'}
            </button>
            <button class="cyber-btn small danger mc-font" data-mod-delete="${escapeHtml(mod.filename)}">
              Delete
            </button>
          </div>
        `;
        installedModsContainer.appendChild(row);
      });
    } catch (e) {}
  }

  installedModsContainer?.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const toggleFile = btn.getAttribute('data-mod-toggle');
    const deleteFile = btn.getAttribute('data-mod-delete');

    if (toggleFile) {
      await api.toggleMod(toggleFile);
      loadInstalledMods();
      showToast(`Toggled ${toggleFile}`);
    } else if (deleteFile) {
      await api.deleteMod(deleteFile);
      loadInstalledMods();
      showToast(`Deleted ${deleteFile}`);
    }
  });

  async function searchMods() {
    const q = modSearchInput.value.trim();
    const loader = modLoaderSelect.value;
    const mcVersion = launcherConfig.activeVersion || '1.21.1';

    modsGrid.innerHTML = '<div class="loading-state mc-font" style="grid-column: 1/-1;">Searching Modrinth repository...</div>';

    try {
      const hits = await api.searchMods({ query: q, loader, mcVersion, limit: 18 });
      if (!hits || hits.length === 0) {
        modsGrid.innerHTML = '<div class="loading-state mc-font" style="grid-column: 1/-1;">No matching mods found. Try adjusting keywords or loader filter.</div>';
        return;
      }

      modsGrid.innerHTML = '';
      hits.forEach((mod) => {
        const card = document.createElement('div');
        card.className = 'mod-card';
        card.innerHTML = `
          <div class="mod-header">
            <img class="mod-icon-img" src="${mod.icon_url || 'https://cdn.modrinth.com/placeholder.svg'}" onerror="this.src='https://cdn.modrinth.com/placeholder.svg'" />
            <div class="mod-header-info">
              <div class="mod-title mc-font">${escapeHtml(mod.title)}</div>
              <div class="mod-author">by ${escapeHtml(mod.author)}</div>
            </div>
          </div>
          <div class="mod-description">${escapeHtml(mod.description)}</div>
          <div class="mod-footer">
            <span class="mod-downloads-count">${formatNumber(mod.downloads)} downloads</span>
            <button class="btn-install-mod mc-font" data-project-id="${escapeHtml(mod.project_id)}" data-slug="${escapeHtml(mod.slug)}">
              1-Click Install
            </button>
          </div>
        `;
        modsGrid.appendChild(card);
      });
    } catch (err) {
      modsGrid.innerHTML = `<div class="loading-state mc-font" style="grid-column: 1/-1;">Search failed: ${escapeHtml(err.message)}</div>`;
    }
  }

  btnSearchMods?.addEventListener('click', searchMods);
  modSearchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') searchMods();
  });

  // Initial popular search
  searchMods();

  // 1-Click Install Handler
  modsGrid?.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-install-mod');
    if (!btn) return;

    const projectId = btn.getAttribute('data-project-id');
    const slug = btn.getAttribute('data-slug');
    const loader = modLoaderSelect.value;
    const mcVersion = launcherConfig.activeVersion || '1.21.1';

    btn.textContent = 'Installing...';
    btn.disabled = true;

    try {
      const res = await api.installMod({ projectId, projectSlug: slug, mcVersion, loader });
      if (res.success) {
        btn.textContent = 'Installed';
        btn.classList.add('installed');
        showToast(`Successfully installed ${res.filename}!`);
        loadInstalledMods();
      } else {
        btn.textContent = 'Failed';
        showToast(`Install failed: ${res.error}`);
        setTimeout(() => {
          btn.textContent = '1-Click Install';
          btn.disabled = false;
        }, 2000);
      }
    } catch (err) {
      btn.textContent = 'Error';
      showToast(`Install error: ${err.message}`);
    }
  });

  // ─── Launch Minecraft Engine ────────────────────────────
  btnLaunchGame?.addEventListener('click', async () => {
    if (isGameLaunching) return;

    // Automatically save and remember last played version
    const versionToPlay = launchVersionSelect ? launchVersionSelect.value : launcherConfig.activeVersion;
    launcherConfig.activeVersion = versionToPlay;
    launcherConfig.lastPlayedVersion = versionToPlay;
    try {
      localStorage.setItem('nexux_last_played_version', versionToPlay);
    } catch (e) {}
    await api.saveConfig(launcherConfig);

    isGameLaunching = true;
    btnLaunchGame.disabled = true;
    btnKillGame.classList.remove('hidden');
    launchBtnText.textContent = 'STARTING...';

    launchProgressCard.classList.remove('hidden');
    progressStatusText.textContent = 'Initializing game client (no CMD)...';
    progressPercent.textContent = '0%';
    progressBarFill.style.width = '0%';

    addLogLine('[Launcher] Starting Minecraft process with javaw (windowed, zero console)...', 'system');

    try {
      const launchRes = await api.launchGame({
        activeVersion: launchVersionSelect.value,
        activeAccount: launchAccountSelect.value,
        autoConnectServer: autoJoinServerToggle ? autoJoinServerToggle.checked : false,
        ramMin: parseInt(ramMinSlider.value, 10),
        ramMax: parseInt(ramMaxSlider.value, 10),
        javaPath: javaPathInput.value.trim(),
        jvmArgs: jvmArgsInput.value.split(' ').filter(Boolean),
        resolution: {
          width: parseInt(resWidthInput.value, 10) || 1280,
          height: parseInt(resHeightInput.value, 10) || 720,
        },
      });

      if (!launchRes.success) {
        addLogLine(`[Launcher Error] ${launchRes.error}`, 'error');
        showToast(`Launch failed: ${launchRes.error}`);
        resetLaunchState();
      } else {
        launchBtnText.textContent = 'RUNNING';
        progressStatusText.textContent = 'Game running';
        addLogLine('[Launcher] Game process started successfully.', 'system');
      }
    } catch (err) {
      addLogLine(`[Fatal Launch Error] ${err.message}`, 'error');
      showToast(`Error: ${err.message}`);
      resetLaunchState();
    }
  });

  btnKillGame?.addEventListener('click', async () => {
    addLogLine('[Launcher] Stopping game process...', 'warn');
    await api.killGame();
    resetLaunchState();
    showToast('Game process stopped.');
  });

  function resetLaunchState() {
    isGameLaunching = false;
    btnLaunchGame.disabled = false;
    btnKillGame.classList.add('hidden');
    launchBtnText.textContent = 'PLAY MINECRAFT';
    launchProgressCard.classList.add('hidden');
  }

  // ─── Engine Event Listeners ─────────────────────────────
  api.onLaunchProgress((data) => {
    if (!data) return;
    const task = data.task || 0;
    const total = data.total || 1;
    const percent = Math.min(100, Math.floor((task / total) * 100));

    progressPercent.textContent = `${percent}%`;
    progressBarFill.style.width = `${percent}%`;
    progressStatusText.textContent = data.type ? `Processing: ${data.type}` : 'Downloading game assets...';
  });

  api.onDownloadStatus((data) => {
    if (!data) return;
    progressSubDetail.textContent = `${data.name || 'file'} (${data.current || 0}/${data.total || 0})`;
  });

  api.onGameLog((line) => {
    addLogLine(line);
  });

  api.onGameDebug((line) => {
    addLogLine(`[Debug] ${line}`, 'system');
  });

  api.onGameClosed((code) => {
    addLogLine(`[Game Closed] Exit code: ${code}`, 'system');
    resetLaunchState();
    showToast('Minecraft process closed.');
  });

  // ─── Console Logger ─────────────────────────────────────
  function addLogLine(text, type = 'normal') {
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    line.textContent = text;
    consoleOutput.appendChild(line);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  }

  btnClearLogs?.addEventListener('click', () => {
    consoleOutput.innerHTML = '';
    addLogLine('[Launcher] Console cleared.', 'system');
  });

  btnCopyLogs?.addEventListener('click', () => {
    const allText = consoleOutput.innerText;
    navigator.clipboard.writeText(allText);
    showToast('Console logs copied to clipboard.');
  });

  // ─── Utility Helpers ────────────────────────────────────
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return String(num);
  }

  // ─── Dynamic Interactive Background Animation (Cyber & Minecraft Fun) ──
  function initDynamicBackground() {
    const canvas = document.getElementById('bgFunCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement ? canvas.parentElement.clientWidth : window.innerWidth);
    let height = (canvas.height = canvas.parentElement ? canvas.parentElement.clientHeight : window.innerHeight);

    window.addEventListener('resize', () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    });

    const themeColors = {
      cyber_neon: { main: '0, 240, 255', alt: '0, 119, 255' },
      matrix_emerald: { main: '16, 185, 129', alt: '52, 211, 153' },
      crimson_blood: { main: '239, 68, 68', alt: '244, 63, 94' },
      synth_violet: { main: '168, 85, 247', alt: '236, 72, 153' },
      pure_obsidian: { main: '148, 163, 184', alt: '56, 189, 248' },
    };

    function getActiveColors() {
      const th = launcherConfig.theme || 'cyber_neon';
      return themeColors[th] || themeColors.cyber_neon;
    }

    // 1. Floating Pixel Cubes & Minecraft Embers
    const PARTICLE_COUNT = 45;
    const particles = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.floor(Math.random() * 5) + 3,
        vy: -(Math.random() * 0.5 + 0.3),
        vx: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.5 + 0.2,
        phase: Math.random() * Math.PI * 2,
        isAlt: Math.random() > 0.65,
        rotSpeed: (Math.random() - 0.5) * 0.02,
      });
    }

    // 2. Interactive Sparks on Click (Burst particles)
    const bursts = [];

    window.addEventListener('pointerdown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      if (clickX < 0 || clickX > width || clickY < 0 || clickY > height) return;

      const colors = getActiveColors();
      for (let i = 0; i < 14; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3.5 + 1.2;
        bursts.push({
          x: clickX,
          y: clickY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.floor(Math.random() * 4) + 3,
          color: Math.random() > 0.5 ? colors.main : colors.alt,
          alpha: 1.0,
          decay: Math.random() * 0.03 + 0.02,
        });
      }
    });

    // 3. Mouse position for subtle ambient repulsion
    let mouse = { x: -9999, y: -9999 };
    window.addEventListener('pointermove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    window.addEventListener('pointerleave', () => {
      mouse.x = -9999;
      mouse.y = -9999;
    });

    // 4. Animation Loop
    let gridOffset = 0;
    let animId = null;

    function renderLoop() {
      ctx.clearRect(0, 0, width, height);
      const colors = getActiveColors();

      // Draw subtle scrolling perspective cyber-grid at bottom
      const gridY = height * 0.72;
      const gridH = height - gridY;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, gridY, width, gridH);
      ctx.clip();

      gridOffset = (gridOffset + 0.35) % 36;
      ctx.strokeStyle = `rgba(${colors.main}, 0.07)`;
      ctx.lineWidth = 1;

      // Horizontal perspective lines
      for (let y = gridY + gridOffset; y < height; y += 22) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Vertical converging perspective lines
      const cx = width / 2;
      const horizonY = gridY - 60;
      for (let x = -width * 0.5; x <= width * 1.5; x += 60) {
        ctx.beginPath();
        ctx.moveTo(cx, horizonY);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      ctx.restore();

      // Render & Update Floating Minecraft Pixel Cubes
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.phase += 0.02;
        p.y += p.vy;
        p.x += p.vx + Math.sin(p.phase) * 0.25;

        // Mouse repulsion
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80) {
          const force = (80 - dist) / 80;
          p.x += (dx / dist) * force * 2.5;
          p.y += (dy / dist) * force * 2.5;
        }

        // Wrap around top to bottom
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const pColor = p.isAlt ? colors.alt : colors.main;
        const currentAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.phase));

        // Draw crisp pixel cube with subtle glow
        ctx.save();
        ctx.translate(Math.round(p.x), Math.round(p.y));
        ctx.fillStyle = `rgba(${pColor}, ${currentAlpha.toFixed(2)})`;
        ctx.shadowColor = `rgba(${pColor}, 0.6)`;
        ctx.shadowBlur = 6;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }

      // Render & Update Interactive Click Bursts
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i];
        b.x += b.vx;
        b.y += b.vy;
        b.vy += 0.08;
        b.alpha -= b.decay;

        if (b.alpha <= 0) {
          bursts.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.fillStyle = `rgba(${b.color}, ${b.alpha.toFixed(2)})`;
        ctx.shadowColor = `rgba(${b.color}, 0.8)`;
        ctx.shadowBlur = 8;
        ctx.fillRect(Math.round(b.x), Math.round(b.y), b.size, b.size);
        ctx.restore();
      }

      animId = requestAnimationFrame(renderLoop);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (animId) cancelAnimationFrame(animId);
      } else {
        animId = requestAnimationFrame(renderLoop);
      }
    });

    animId = requestAnimationFrame(renderLoop);
  }

  // Start animated background
  initDynamicBackground();

  function mockApi() {
    return {
      minimize: () => {},
      maximize: () => {},
      close: () => {},
      getConfig: async () => null,
      saveConfig: async (cfg) => cfg,
      detectJava: async () => 'javaw',
      getMcVersions: async () => ({ versions: [] }),
      getInstalledVersions: async () => ['1.21.1', '26.3'],
      searchMods: async () => [],
      installMod: async () => ({ success: true, filename: 'test.jar' }),
      listInstalledMods: async () => [],
      toggleMod: async () => ({ success: true }),
      deleteMod: async () => ({ success: true }),
      openModsFolder: () => {},
      launchGame: async () => ({ success: true }),
      killGame: async () => ({ success: true }),
      onLaunchProgress: () => {},
      onDownloadStatus: () => {},
      onGameLog: () => {},
      onGameDebug: () => {},
      onGameClosed: () => {},
    };
  }
});
