const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { Client, Authenticator } = require('minecraft-launcher-core');

// Determine launcher data directory
const LAUNCHER_DIR = path.join(
  process.env.APPDATA || (process.platform === 'darwin' ? path.join(process.env.HOME, 'Library', 'Preferences') : path.join(process.env.HOME, '.local', 'share')),
  '.nexuxlauncher'
);
const MODS_DIR = path.join(LAUNCHER_DIR, 'mods');
const CONFIG_FILE = path.join(LAUNCHER_DIR, 'launcher_config.json');

// Ensure directories exist
if (!fs.existsSync(LAUNCHER_DIR)) fs.mkdirSync(LAUNCHER_DIR, { recursive: true });
if (!fs.existsSync(MODS_DIR)) fs.mkdirSync(MODS_DIR, { recursive: true });

// Preferred default Java: Always use javaw.exe (GUI subsystem) to completely eliminate CMD windows
function getInitialJavaPath() {
  const jdk25W = 'C:\\Program Files\\Java\\jdk-25\\bin\\javaw.exe';
  const oracleW = 'C:\\Program Files\\Common Files\\Oracle\\Java\\javapath\\javaw.exe';
  if (fs.existsSync(jdk25W)) return jdk25W;
  if (fs.existsSync(oracleW)) return oracleW;
  return 'javaw';
}

// Default configuration
const DEFAULT_CONFIG = {
  theme: 'cyber_neon',
  minecraftFont: true,
  autoConnectServer: false,
  ramMin: 2048,
  ramMax: 4096,
  javaPath: getInitialJavaPath(),
  jvmArgs: ['-XX:+UseG1GC', '-XX:+ParallelRefProcEnabled'],
  resolution: { width: 1280, height: 720 },
  activeVersion: '1.21.1',
  lastPlayedVersion: '1.21.1',
  activeAccount: 'NEXUX_Player',
  accounts: ['NEXUX_Player'],
  serverAddress: 'nexuxsmp.play.hosting',
};

function sanitizeJavaPath(jp) {
  if (!jp || typeof jp !== 'string') return getInitialJavaPath();
  if (process.platform === 'win32' && jp.toLowerCase().endsWith('java.exe')) {
    const javawCandidate = jp.replace(/java\.exe$/i, 'javaw.exe');
    if (fs.existsSync(javawCandidate)) {
      return javawCandidate;
    }
  }
  return jp;
}

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      const merged = { ...DEFAULT_CONFIG, ...data };
      merged.javaPath = sanitizeJavaPath(merged.javaPath);
      return merged;
    }
  } catch (err) {
    console.error('[Config] Error loading config:', err.message);
  }
  return { ...DEFAULT_CONFIG };
}

function saveConfig(cfg) {
  try {
    const cleanCfg = { ...cfg, javaPath: sanitizeJavaPath(cfg.javaPath) };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cleanCfg, null, 2), 'utf8');
  } catch (err) {
    console.error('[Config] Error saving config:', err.message);
  }
}

let launcherConfig = loadConfig();
let mainWindow = null;
let activeLauncher = null;
let activeChildProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 760,
    minWidth: 1000,
    minHeight: 640,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#060b13',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'src', 'assets', 'icon.png'),
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Window controls IPC
ipcMain.handle('window-minimize', () => mainWindow?.minimize());
ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.handle('window-close', () => mainWindow?.close());

// Config IPC
ipcMain.handle('config-get', () => launcherConfig);
ipcMain.handle('config-save', (event, newCfg) => {
  launcherConfig = { ...launcherConfig, ...newCfg };
  saveConfig(launcherConfig);
  return launcherConfig;
});

// Auto-detect Java executable (strictly searches for javaw.exe to prevent any console window)
ipcMain.handle('detect-java', async () => {
  const commonPaths = [
    'C:\\Program Files\\Java\\jdk-25\\bin\\javaw.exe',
    'C:\\Program Files\\Common Files\\Oracle\\Java\\javapath\\javaw.exe',
    'C:\\Program Files\\Java\\jdk-21\\bin\\javaw.exe',
    'C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.0-hotspot\\bin\\javaw.exe',
    'C:\\Program Files\\Java\\jre-1.8\\bin\\javaw.exe',
    'C:\\Program Files (x86)\\Common Files\\Oracle\\Java\\javapath\\javaw.exe',
  ];

  if (process.env.JAVA_HOME) {
    const homeW = path.join(process.env.JAVA_HOME, 'bin', 'javaw.exe');
    if (fs.existsSync(homeW)) return homeW;
  }

  for (const p of commonPaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return 'javaw';
});

// Fetch Minecraft official versions manifest
ipcMain.handle('get-mc-versions', async () => {
  return new Promise((resolve, reject) => {
    https.get('https://piston-meta.mojang.com/mc/game/version_manifest_v2.json', (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', (err) => reject(err));
  });
});

// 1-Click Modrinth API Search
ipcMain.handle('modrinth-search', async (event, { query, loader = 'fabric', mcVersion = '1.21.1', limit = 20 }) => {
  return new Promise((resolve, reject) => {
    const facets = [];
    if (loader) facets.push([`categories:${loader}`]);
    if (mcVersion) facets.push([`versions:${mcVersion}`]);
    facets.push(['project_type:mod']);

    const encodedFacets = encodeURIComponent(JSON.stringify(facets));
    const url = `https://api.modrinth.com/v2/search?query=${encodeURIComponent(query || '')}&limit=${limit}&index=relevance&facets=${encodedFacets}`;

    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': 'NEXUX-Launcher/1.0.0 (contact@nexuxsmp.play.hosting)',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed.hits || []);
          } catch (e) {
            resolve([]);
          }
        });
      }
    );
    req.on('error', () => resolve([]));
  });
});

// 1-Click Mod Download & Install
ipcMain.handle('mod-install', async (event, { projectId, projectSlug, mcVersion = '1.21.1', loader = 'fabric' }) => {
  return new Promise((resolve) => {
    const versionsUrl = `https://api.modrinth.com/v2/project/${projectId || projectSlug}/version?loaders=${encodeURIComponent(JSON.stringify([loader]))}&game_versions=${encodeURIComponent(JSON.stringify([mcVersion]))}`;

    https.get(
      versionsUrl,
      {
        headers: { 'User-Agent': 'NEXUX-Launcher/1.0.0' },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            const versions = JSON.parse(raw);
            if (!Array.isArray(versions) || versions.length === 0) {
              return resolve({ success: false, error: 'No compatible file found for this Minecraft version.' });
            }

            const primaryFile = versions[0].files.find((f) => f.primary) || versions[0].files[0];
            if (!primaryFile || !primaryFile.url) {
              return resolve({ success: false, error: 'No downloadable file available.' });
            }

            const targetFilePath = path.join(MODS_DIR, primaryFile.filename);
            const fileStream = fs.createWriteStream(targetFilePath);

            https.get(primaryFile.url, (dlRes) => {
              if (dlRes.statusCode >= 300 && dlRes.statusCode < 400 && dlRes.headers.location) {
                https.get(dlRes.headers.location, (redirectRes) => {
                  redirectRes.pipe(fileStream);
                  fileStream.on('finish', () => {
                    fileStream.close();
                    resolve({ success: true, filename: primaryFile.filename, path: targetFilePath });
                  });
                });
                return;
              }

              dlRes.pipe(fileStream);
              fileStream.on('finish', () => {
                fileStream.close();
                resolve({ success: true, filename: primaryFile.filename, path: targetFilePath });
              });
            }).on('error', (err) => {
              fs.unlink(targetFilePath, () => {});
              resolve({ success: false, error: err.message });
            });
          } catch (err) {
            resolve({ success: false, error: err.message });
          }
        });
      }
    ).on('error', (err) => resolve({ success: false, error: err.message }));
  });
});

// List installed mods
ipcMain.handle('mods-list', async () => {
  try {
    if (!fs.existsSync(MODS_DIR)) return [];
    const files = fs.readdirSync(MODS_DIR);
    return files
      .filter((f) => f.endsWith('.jar') || f.endsWith('.jar.disabled'))
      .map((f) => {
        const stats = fs.statSync(path.join(MODS_DIR, f));
        return {
          filename: f,
          enabled: f.endsWith('.jar'),
          sizeBytes: stats.size,
          modified: stats.mtimeMs,
        };
      });
  } catch (e) {
    return [];
  }
});

// Toggle mod enable / disable
ipcMain.handle('mod-toggle', async (event, filename) => {
  try {
    const currentPath = path.join(MODS_DIR, filename);
    if (!fs.existsSync(currentPath)) return { success: false };

    let newPath = '';
    let newName = '';
    if (filename.endsWith('.jar')) {
      newName = filename + '.disabled';
      newPath = path.join(MODS_DIR, newName);
    } else if (filename.endsWith('.disabled')) {
      newName = filename.replace(/\.disabled$/, '');
      newPath = path.join(MODS_DIR, newName);
    }

    fs.renameSync(currentPath, newPath);
    return { success: true, filename: newName };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Delete mod
ipcMain.handle('mod-delete', async (event, filename) => {
  try {
    const p = path.join(MODS_DIR, filename);
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
      return { success: true };
    }
  } catch (err) {
    return { success: false, error: err.message };
  }
  return { success: false };
});

// Open mods folder
ipcMain.handle('mods-open-folder', () => {
  shell.openPath(MODS_DIR);
  return true;
});

// Launch Minecraft Game (Strictly suppress any CMD / terminal window)
ipcMain.handle('game-launch', async (event, customOpts = {}) => {
  if (activeChildProcess) {
    return { success: false, error: 'Minecraft is already running.' };
  }

  const cfg = { ...launcherConfig, ...customOpts };

  // Always remember the version that was launched as the last played version
  if (cfg.activeVersion) {
    launcherConfig.activeVersion = cfg.activeVersion;
    launcherConfig.lastPlayedVersion = cfg.activeVersion;
    saveConfig(launcherConfig);
  }

  // Enforce javaw.exe on Windows so that no console window is ever spawned
  let finalJava = sanitizeJavaPath(cfg.javaPath || getInitialJavaPath());

  const launcher = new Client();
  activeLauncher = launcher;

  launcher.on('progress', (e) => {
    mainWindow?.webContents.send('launch-progress', e);
  });

  launcher.on('download-status', (e) => {
    mainWindow?.webContents.send('download-status', e);
  });

  launcher.on('data', (line) => {
    mainWindow?.webContents.send('game-log', line);
  });

  launcher.on('debug', (line) => {
    mainWindow?.webContents.send('game-debug', line);
  });

  launcher.on('close', (code) => {
    activeChildProcess = null;
    activeLauncher = null;
    mainWindow?.webContents.send('game-closed', code);
  });

  try {
    const auth = Authenticator.getAuth(cfg.activeAccount || 'NEXUX_Player');

    // Build custom launch arguments
    const customArgs = [...(cfg.jvmArgs || ['-XX:+UseG1GC', '-XX:+ParallelRefProcEnabled'])];

    // 1-Click Direct Join Server if enabled
    if (cfg.autoConnectServer && cfg.serverAddress) {
      customArgs.push(`--quickPlayMultiplayer=${cfg.serverAddress}`);
    }

    const launchOptions = {
      clientPackage: null,
      authorization: auth,
      root: LAUNCHER_DIR,
      version: {
        number: cfg.activeVersion || '1.21.1',
        type: 'release',
      },
      memory: {
        max: `${cfg.ramMax || 4096}M`,
        min: `${cfg.ramMin || 2048}M`,
      },
      javaPath: finalJava,
      customArgs,
      window: {
        width: cfg.resolution?.width || 1280,
        height: cfg.resolution?.height || 720,
      },
      overrides: {
        detached: false,
        cwd: LAUNCHER_DIR,
      },
    };

    activeChildProcess = await launcher.launch(launchOptions);
    return { success: true };
  } catch (err) {
    activeChildProcess = null;
    activeLauncher = null;
    console.error('[Launch Error]', err);
    return { success: false, error: err.message };
  }
});

// Kill active game process
ipcMain.handle('game-kill', async () => {
  if (activeChildProcess) {
    try {
      activeChildProcess.kill();
      activeChildProcess = null;
      activeLauncher = null;
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  return { success: false, error: 'No active game process running.' };
});
