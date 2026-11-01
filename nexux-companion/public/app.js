// NEXUX Launcher Companion Frontend Logic

const state = {
  theme: localStorage.getItem('nexux_theme') || 'nexux_neon',
  instances: [],
  selectedInstance: null,
  currentQuery: 'optimization',
  gameVersion: '1.21.1',
  loader: 'fabric',
};

// ─── Theme Manager ────────────────────────────────────────────────────────────
function setTheme(themeId) {
  state.theme = themeId;
  document.body.setAttribute('data-theme', themeId);
  localStorage.setItem('nexux_theme', themeId);

  document.querySelectorAll('[data-theme-btn]').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-theme-btn') === themeId);
  });
}

// ─── Toast Notifications ──────────────────────────────────────────────────────
function showToast(message, duration = 3500) {
  const toast = document.getElementById('toast');
  toast.innerHTML = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

// ─── Format Numbers ───────────────────────────────────────────────────────────
function formatCount(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return String(num);
}

// ─── Load Local Instances ─────────────────────────────────────────────────────
async function loadInstances() {
  try {
    const res = await fetch('/api/instances');
    const data = await res.json();
    state.instances = data.instances || [];

    const select = document.getElementById('instanceSelect');
    select.innerHTML = '';

    if (state.instances.length === 0) {
      select.innerHTML = '<option value="">No instances detected (Downloads only)</option>';
      return;
    }

    state.instances.forEach((inst, index) => {
      const opt = document.createElement('option');
      opt.value = inst.id;
      opt.textContent = `${inst.name} [${inst.modsDir}]`;
      if (index === 0) opt.selected = true;
      select.appendChild(opt);
    });

    state.selectedInstance = state.instances[0].id;
  } catch (err) {
    console.error('Failed to load instances:', err);
  }
}

// ─── Search Mods from Modrinth ────────────────────────────────────────────────
async function searchMods(query = state.currentQuery) {
  state.currentQuery = query;
  const grid = document.getElementById('modsGrid');
  grid.innerHTML = `
    <div class="loading-state">
      <div class="cyber-spinner"></div>
      <p>Searching Modrinth for "${query || 'all mods'}"...</p>
    </div>
  `;

  try {
    const params = new URLSearchParams({
      query: query.trim(),
      version: state.gameVersion,
      loader: state.loader,
      limit: '24',
    });

    const res = await fetch(`/api/mods/search?${params.toString()}`);
    const data = await res.json();

    const hits = data.hits || [];
    document.getElementById('resultsCount').textContent = `Found ${data.total_hits || hits.length} Mods for ${state.gameVersion || 'All Versions'} (${state.loader.toUpperCase() || 'All Loaders'})`;

    if (hits.length === 0) {
      grid.innerHTML = `
        <div class="loading-state">
          <p>⚠️ No mods found matching your filters. Try clearing the Minecraft version or loader filter.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = hits.map((mod) => {
      const iconUrl = mod.icon_url || 'https://cdn.modrinth.com/assets/unknown.svg';
      const categories = (mod.display_categories || mod.categories || []).slice(0, 3);
      
      return `
        <div class="mod-card" data-project-id="${mod.project_id}">
          <div class="mod-top">
            <img class="mod-icon" src="${iconUrl}" alt="${mod.title}" onerror="this.src='https://cdn.modrinth.com/assets/unknown.svg'" />
            <div class="mod-meta">
              <h3 class="mod-title">${escapeHtml(mod.title)}</h3>
              <p class="mod-author">by <strong>${escapeHtml(mod.author || 'Author')}</strong></p>
              <div class="mod-stats">
                <span>⬇️ ${formatCount(mod.downloads)}</span>
                <span>⭐ ${formatCount(mod.follows)}</span>
              </div>
            </div>
          </div>

          <p class="mod-desc">${escapeHtml(mod.description || 'No description available.')}</p>

          <div class="mod-bottom">
            <div class="mod-categories">
              ${categories.map((c) => `<span class="cat-tag">${c}</span>`).join('')}
            </div>
            <button class="btn-install" onclick="installMod('${mod.project_id}', '${escapeHtml(mod.title)}', this)">
              ⚡ 1-Click Install
            </button>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    grid.innerHTML = `
      <div class="loading-state">
        <p style="color:#f87171;">❌ Search error: ${err.message}</p>
      </div>
    `;
  }
}

// ─── 1-Click Install Execution ────────────────────────────────────────────────
window.installMod = async function (projectId, modTitle, btnElement) {
  if (btnElement.classList.contains('installing')) return;

  const originalText = btnElement.innerHTML;
  btnElement.classList.add('installing');
  btnElement.innerHTML = '⏳ Downloading...';

  try {
    const res = await fetch('/api/mods/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        targetInstanceId: state.selectedInstance,
        gameVersion: state.gameVersion,
        loader: state.loader,
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Failed to install mod');
    }

    btnElement.classList.remove('installing');
    btnElement.classList.add('installed');
    btnElement.innerHTML = '✅ Installed!';

    showToast(`⚡ <strong>${modTitle}</strong> successfully installed!<br><span style="font-size:11px;color:#94a3b8;">Saved to: ${result.destPath}</span>`);

    setTimeout(() => {
      btnElement.classList.remove('installed');
      btnElement.innerHTML = originalText;
    }, 4000);
  } catch (err) {
    btnElement.classList.remove('installing');
    btnElement.innerHTML = '❌ Failed';
    showToast(`❌ Failed to install ${modTitle}: ${err.message}`);
    setTimeout(() => {
      btnElement.innerHTML = originalText;
    }, 3000);
  }
};

// ─── Apply Theme to Prism Launcher ────────────────────────────────────────────
async function applyThemeToPrism() {
  const btn = document.getElementById('btnApplyPrismTheme');
  btn.textContent = '⏳ Installing Theme...';
  try {
    const res = await fetch('/api/themes/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ themeId: state.theme }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to install theme');

    btn.textContent = '✅ Applied!';
    showToast(`🎉 <strong>Theme Applied!</strong><br>Installed <strong>${state.theme}</strong> into Prism Launcher! Select it under <em>Settings ➔ Appearance</em>.`);
    setTimeout(() => {
      btn.textContent = '🚀 Apply to Prism Launcher';
    }, 3000);
  } catch (err) {
    btn.textContent = '❌ Failed';
    showToast(`❌ Failed to export theme: ${err.message}`);
    setTimeout(() => {
      btn.textContent = '🚀 Apply to Prism Launcher';
    }, 3000);
  }
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── Initialize ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setTheme(state.theme);
  loadInstances();

  // Theme Pill Click Listeners
  document.querySelectorAll('[data-theme-btn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setTheme(btn.getAttribute('data-theme-btn'));
    });
  });

  // Export to Prism button
  document.getElementById('btnApplyPrismTheme').addEventListener('click', applyThemeToPrism);

  // Instance selector change
  document.getElementById('instanceSelect').addEventListener('change', (e) => {
    state.selectedInstance = e.target.value;
  });

  // Version & Loader filters
  document.getElementById('versionFilter').addEventListener('change', (e) => {
    state.gameVersion = e.target.value;
    searchMods();
  });

  document.getElementById('loaderFilter').addEventListener('change', (e) => {
    state.loader = e.target.value;
    searchMods();
  });

  // Search input & button
  document.getElementById('btnSearch').addEventListener('click', () => {
    searchMods(document.getElementById('searchInput').value);
  });

  document.getElementById('searchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      searchMods(e.target.value);
    }
  });

  // Popular Mod Pills
  document.querySelectorAll('.quick-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      const q = pill.getAttribute('data-query');
      document.getElementById('searchInput').value = q;
      searchMods(q);
    });
  });

  // Initial search
  searchMods('optimization');
});
