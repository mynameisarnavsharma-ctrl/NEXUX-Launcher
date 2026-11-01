import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const THEMES_DIR = path.resolve(__dirname, '..', 'themes');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Detect local Minecraft / Prism instances
function getLocalInstances() {
  const instances = [];
  const appData = process.env.APPDATA || path.join(process.env.USERPROFILE || 'C:\\', 'AppData', 'Roaming');
  
  // 1. Prism Launcher instances
  const prismInstancesDir = path.join(appData, 'PrismLauncher', 'instances');
  if (fs.existsSync(prismInstancesDir)) {
    try {
      const dirs = fs.readdirSync(prismInstancesDir);
      for (const d of dirs) {
        const fullPath = path.join(prismInstancesDir, d);
        if (fs.statSync(fullPath).isDirectory()) {
          const cfgPath = path.join(fullPath, 'instance.cfg');
          let name = d;
          if (fs.existsSync(cfgPath)) {
            const content = fs.readFileSync(cfgPath, 'utf-8');
            const match = content.match(/^name=(.+)$/m);
            if (match) name = match[1].trim();
          }
          instances.push({
            id: `prism_${d}`,
            name: `${name} (Prism)`,
            type: 'prism',
            path: fullPath,
            modsDir: path.join(fullPath, '.minecraft', 'mods'),
          });
        }
      }
    } catch (e) {}
  }

  // 2. Default .minecraft
  const defaultMc = path.join(appData, '.minecraft');
  if (fs.existsSync(defaultMc)) {
    instances.push({
      id: 'default_mc',
      name: 'Default .minecraft',
      type: 'vanilla',
      path: defaultMc,
      modsDir: path.join(defaultMc, 'mods'),
    });
  }

  // 3. User Downloads folder as fallback target
  const downloadsDir = path.join(process.env.USERPROFILE || 'C:\\', 'Downloads');
  instances.push({
    id: 'downloads_folder',
    name: 'Downloads Folder (.jar)',
    type: 'downloads',
    path: downloadsDir,
    modsDir: downloadsDir,
  });

  return instances;
}

// ─── API: List Detected Instances ─────────────────────────────────────────────
app.get('/api/instances', (req, res) => {
  res.json({ instances: getLocalInstances() });
});

// ─── API: Modrinth 1-Click Search ─────────────────────────────────────────────
app.get('/api/mods/search', async (req, res) => {
  try {
    const query = req.query.query || '';
    const gameVersion = req.query.version || '';
    const loader = req.query.loader || '';
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);

    const facets = [['project_type:mod']];
    if (gameVersion) facets.push([`versions:${gameVersion}`]);
    if (loader) facets.push([`categories:${loader.toLowerCase()}`]);

    const url = new URL('https://api.modrinth.com/v2/search');
    url.searchParams.set('query', query);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('facets', JSON.stringify(facets));

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'NEXUX-Launcher-Companion/1.0.0 (contact@nexuxsmp.play.hosting)',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Modrinth API error: ${response.statusText}` });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── API: 1-Click Mod Download & Install ──────────────────────────────────────
app.post('/api/mods/install', async (req, res) => {
  try {
    const { projectId, versionId, targetInstanceId, gameVersion, loader } = req.body;
    if (!projectId) {
      return res.status(400).json({ error: 'Missing projectId' });
    }

    const instances = getLocalInstances();
    const targetInst = instances.find((i) => i.id === targetInstanceId) || instances[0];
    const modsDir = targetInst.modsDir;

    if (!fs.existsSync(modsDir)) {
      fs.mkdirSync(modsDir, { recursive: true });
    }

    let downloadUrl = null;
    let filename = null;
    let versionInfo = null;

    if (versionId) {
      const vRes = await fetch(`https://api.modrinth.com/v2/version/${versionId}`, {
        headers: { 'User-Agent': 'NEXUX-Launcher-Companion/1.0.0' },
      });
      versionInfo = await vRes.json();
    } else {
      // Find latest compatible version
      const vRes = await fetch(`https://api.modrinth.com/v2/project/${projectId}/version`, {
        headers: { 'User-Agent': 'NEXUX-Launcher-Companion/1.0.0' },
      });
      const versions = await vRes.json();
      if (!Array.isArray(versions) || versions.length === 0) {
        return res.status(404).json({ error: 'No releases found for this mod' });
      }

      // Filter by version & loader if provided
      versionInfo = versions.find((v) => {
        const matchesVer = !gameVersion || v.game_versions.includes(gameVersion);
        const matchesLoader = !loader || v.loaders.includes(loader.toLowerCase());
        return matchesVer && matchesLoader;
      }) || versions[0];
    }

    const file = versionInfo.files.find((f) => f.primary) || versionInfo.files[0];
    if (!file || !file.url) {
      return res.status(404).json({ error: 'No downloadable jar found in release' });
    }

    downloadUrl = file.url;
    filename = file.filename;
    const destPath = path.join(modsDir, filename);

    // Stream download
    const jarRes = await fetch(downloadUrl);
    if (!jarRes.ok) throw new Error(`Download failed: ${jarRes.statusText}`);
    const buffer = await jarRes.arrayBuffer();
    fs.writeFileSync(destPath, Buffer.from(buffer));

    res.json({
      success: true,
      filename,
      version: versionInfo.version_number,
      targetInstance: targetInst.name,
      destPath,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── API: List NEXUX Themes ──────────────────────────────────────────────────
app.get('/api/themes', (req, res) => {
  const themes = [];
  if (fs.existsSync(THEMES_DIR)) {
    const list = fs.readdirSync(THEMES_DIR);
    for (const d of list) {
      const jsonPath = path.join(THEMES_DIR, d, 'theme.json');
      if (fs.existsSync(jsonPath)) {
        try {
          const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
          themes.push({ id: d, ...data });
        } catch (e) {}
      }
    }
  }
  res.json({ themes });
});

// ─── API: Install NEXUX Theme to Local Prism Launcher ─────────────────────────
app.post('/api/themes/install', (req, res) => {
  try {
    const { themeId } = req.body;
    const sourceThemeDir = path.join(THEMES_DIR, themeId || 'nexux_neon');
    if (!fs.existsSync(sourceThemeDir)) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    const appData = process.env.APPDATA || path.join(process.env.USERPROFILE || 'C:\\', 'AppData', 'Roaming');
    const targetPrismThemes = path.join(appData, 'PrismLauncher', 'themes', themeId || 'nexux_neon');

    if (!fs.existsSync(targetPrismThemes)) {
      fs.mkdirSync(targetPrismThemes, { recursive: true });
    }

    // Copy theme.json and themeStyle.css
    for (const f of fs.readdirSync(sourceThemeDir)) {
      fs.copyFileSync(path.join(sourceThemeDir, f), path.join(targetPrismThemes, f));
    }

    res.json({
      success: true,
      message: `Theme '${themeId}' installed to Prism Launcher!`,
      installedPath: targetPrismThemes,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4500;
app.listen(PORT, () => {
  console.log(`[NEXUX Companion] Dashboard running at http://localhost:${PORT}`);
});

