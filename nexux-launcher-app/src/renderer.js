// =========================================================
// NEXUX LAUNCHER - RENDERER CONTROLLER
// STRICT REQUIREMENT: ZERO EMOJIS ANYWHERE
// =========================================================

document.addEventListener('DOMContentLoaded', async () => {
  const api = window.nexuxApi || mockApi();

  let launcherConfig = {
    theme: 'cyber_neon',
    ramMin: 2048,
    ramMax: 4096,
    javaPath: 'C:\\Program Files\\Common Files\\Oracle\\Java\\javapath\\java.exe',
    jvmArgs: ['-XX:+UseG1GC', '-XX:+ParallelRefProcEnabled'],
    resolution: { width: 1280, height: 720 },
    activeVersion: '1.21.1',
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
  const launchVersionSelect = document.getElementById('launchVersionSelect');
  const btnLaunchGame = document.getElementById('btnLaunchGame');
  const btnKillGame = document.getElementById('btnKillGame');
  const launchBtnText = document.getElementById('launchBtnText');

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
    document.body.className = `theme-${themeKey.replace('_', '-')}`;
    themeOptions.forEach((opt) => {
      if (opt.getAttribute('data-theme') === themeKey.replace('_', '-')) {
        opt.classList.add('active');
      } else {
        opt.classList.remove('active');
      }
    });
  }

  themeOptions.forEach((opt) => {
    opt.addEventListener('click', () => {
      const selectedTheme = opt.getAttribute('data-theme').replace('-', '_');
      launcherConfig.theme = selectedTheme;
      applyTheme(selectedTheme);
      api.saveConfig(launcherConfig);
      showToast(`Theme switched to ${opt.querySelector('.theme-name').textContent}`);
    });
  });

  // ─── Load Config ────────────────────────────────────────
  try {
    const loaded = await api.getConfig();
    if (loaded) launcherConfig = { ...launcherConfig, ...loaded };
  } catch (e) {}

  applyTheme(launcherConfig.theme || 'cyber_neon');
  ramMaxSlider.value = launcherConfig.ramMax || 4096;
  ramMaxDisplay.textContent = `${launcherConfig.ramMax || 4096} MB (${((launcherConfig.ramMax || 4096) / 1024).toFixed(0)} GB)`;
  ramMinSlider.value = launcherConfig.ramMin || 2048;
  ramMinDisplay.textContent = `${launcherConfig.ramMin || 2048} MB (${((launcherConfig.ramMin || 2048) / 1024).toFixed(0)} GB)`;
  javaPathInput.value = launcherConfig.javaPath || '';
  resWidthInput.value = launcherConfig.resolution?.width || 1280;
  resHeightInput.value = launcherConfig.resolution?.height || 720;
  jvmArgsInput.value = (launcherConfig.jvmArgs || []).join(' ');
  serverAddressInput.value = launcherConfig.serverAddress || 'nexuxsmp.play.hosting';

  // ─── RAM Slider Updates ─────────────────────────────────
  ramMaxSlider.addEventListener('input', (e) => {
    const val = e.target.value;
    ramMaxDisplay.textContent = `${val} MB (${(val / 1024).toFixed(0)} GB)`;
  });

  ramMinSlider.addEventListener('input', (e) => {
    const val = e.target.value;
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

    await api.saveConfig(launcherConfig);
    showToast('Settings saved successfully.');
  });

  // ─── Accounts Management ────────────────────────────────
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
          <div class="account-avatar"></div>
          <div>
            <div class="account-username">${escapeHtml(acc)}</div>
            <div class="account-type">Offline Profile</div>
          </div>
        </div>
        <div class="mod-row-actions">
          <button class="cyber-btn small ${acc === launcherConfig.activeAccount ? 'primary' : ''}" data-action="select" data-acc="${escapeHtml(acc)}">
            ${acc === launcherConfig.activeAccount ? 'Active' : 'Select'}
          </button>
          ${accounts.length > 1 ? `<button class="cyber-btn small danger" data-action="delete" data-acc="${escapeHtml(acc)}">Delete</button>` : ''}
        </div>
      `;
      accountsList.appendChild(item);
    });
  }

  renderAccounts();

  launchAccountSelect?.addEventListener('change', (e) => {
    launcherConfig.activeAccount = e.target.value;
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
    versionsList.innerHTML = '<div class="loading-state">Loading official Mojang manifest...</div>';
    try {
      const manifest = await api.getMcVersions();
      if (!manifest || !manifest.versions) {
        versionsList.innerHTML = '<div class="loading-state">Failed to load manifest.</div>';
        return;
      }

      versionsList.innerHTML = '';
      manifest.versions.slice(0, 40).forEach((v) => {
        const row = document.createElement('div');
        row.className = 'mod-row';
        row.setAttribute('data-type', v.type);
        row.innerHTML = `
          <div>
            <span class="mod-row-name">${escapeHtml(v.id)}</span>
            <span style="font-size:11px;color:var(--text-muted);margin-left:10px;">${escapeHtml(v.type)}</span>
          </div>
          <button class="cyber-btn small ${v.id === launcherConfig.activeVersion ? 'primary' : ''}" data-vid="${escapeHtml(v.id)}">
            ${v.id === launcherConfig.activeVersion ? 'Active' : 'Select'}
          </button>
        `;
        versionsList.appendChild(row);
      });
    } catch (err) {
      versionsList.innerHTML = `<div class="loading-state">Error loading versions: ${escapeHtml(err.message)}</div>`;
    }
  }

  loadMojangVersions();

  btnRefreshVersions?.addEventListener('click', loadMojangVersions);

  versionsList?.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const vid = btn.getAttribute('data-vid');
    launcherConfig.activeVersion = vid;
    await api.saveConfig(launcherConfig);

    // Update select in Play tab
    if (![...launchVersionSelect.options].some((o) => o.value === vid)) {
      const newOpt = document.createElement('option');
      newOpt.value = vid;
      newOpt.textContent = `Minecraft ${vid}`;
      launchVersionSelect.appendChild(newOpt);
    }
    launchVersionSelect.value = vid;

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
        installedModsContainer.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);">No mods installed yet. Search and 1-click install mods from the Browse Modrinth tab.</div>';
        return;
      }

      installedModsContainer.innerHTML = '';
      installedModsList.forEach((mod) => {
        const row = document.createElement('div');
        row.className = 'mod-row';
        row.innerHTML = `
          <div class="mod-row-name ${mod.enabled ? '' : 'disabled'}">${escapeHtml(mod.filename)}</div>
          <div class="mod-row-actions">
            <button class="cyber-btn small ${mod.enabled ? 'primary' : ''}" data-mod-toggle="${escapeHtml(mod.filename)}">
              ${mod.enabled ? 'Enabled' : 'Disabled'}
            </button>
            <button class="cyber-btn small danger" data-mod-delete="${escapeHtml(mod.filename)}">
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

    modsGrid.innerHTML = '<div class="loading-state" style="grid-column: 1/-1;">Searching Modrinth repository...</div>';

    try {
      const hits = await api.searchMods({ query: q, loader, mcVersion, limit: 18 });
      if (!hits || hits.length === 0) {
        modsGrid.innerHTML = '<div class="loading-state" style="grid-column: 1/-1;">No matching mods found. Try adjusting keywords or loader filter.</div>';
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
              <div class="mod-title">${escapeHtml(mod.title)}</div>
              <div class="mod-author">by ${escapeHtml(mod.author)}</div>
            </div>
          </div>
          <div class="mod-description">${escapeHtml(mod.description)}</div>
          <div class="mod-footer">
            <span class="mod-downloads-count">${formatNumber(mod.downloads)} downloads</span>
            <button class="btn-install-mod" data-project-id="${escapeHtml(mod.project_id)}" data-slug="${escapeHtml(mod.slug)}">
              1-Click Install
            </button>
          </div>
        `;
        modsGrid.appendChild(card);
      });
    } catch (err) {
      modsGrid.innerHTML = `<div class="loading-state" style="grid-column: 1/-1;">Search failed: ${escapeHtml(err.message)}</div>`;
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

    isGameLaunching = true;
    btnLaunchGame.disabled = true;
    btnKillGame.classList.remove('hidden');
    launchBtnText.textContent = 'STARTING...';

    launchProgressCard.classList.remove('hidden');
    progressStatusText.textContent = 'Initializing launch engine...';
    progressPercent.textContent = '0%';
    progressBarFill.style.width = '0%';

    addLogLine('[Launcher] Launching Minecraft instance...', 'system');

    try {
      const launchRes = await api.launchGame({
        activeVersion: launchVersionSelect.value,
        activeAccount: launchAccountSelect.value,
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
    addLogLine('[Launcher] Force stopping game process...', 'warn');
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

  function mockApi() {
    return {
      minimize: () => {},
      maximize: () => {},
      close: () => {},
      getConfig: async () => null,
      saveConfig: async (cfg) => cfg,
      detectJava: async () => 'java',
      getMcVersions: async () => ({ versions: [] }),
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
