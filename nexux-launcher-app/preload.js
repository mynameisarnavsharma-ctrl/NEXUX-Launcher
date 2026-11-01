const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nexuxApi', {
  // Window controls
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),

  // Config
  getConfig: () => ipcRenderer.invoke('config-get'),
  saveConfig: (cfg) => ipcRenderer.invoke('config-save', cfg),

  // Java & Versions
  detectJava: () => ipcRenderer.invoke('detect-java'),
  getMcVersions: () => ipcRenderer.invoke('get-mc-versions'),

  // 1-Click Mod Manager
  searchMods: (params) => ipcRenderer.invoke('modrinth-search', params),
  installMod: (params) => ipcRenderer.invoke('mod-install', params),
  listInstalledMods: () => ipcRenderer.invoke('mods-list'),
  toggleMod: (filename) => ipcRenderer.invoke('mod-toggle', filename),
  deleteMod: (filename) => ipcRenderer.invoke('mod-delete', filename),
  openModsFolder: () => ipcRenderer.invoke('mods-open-folder'),

  // Game execution
  launchGame: (customOpts) => ipcRenderer.invoke('game-launch', customOpts),
  killGame: () => ipcRenderer.invoke('game-kill'),

  // Events from Main process
  onLaunchProgress: (cb) => {
    ipcRenderer.on('launch-progress', (event, data) => cb(data));
  },
  onDownloadStatus: (cb) => {
    ipcRenderer.on('download-status', (event, data) => cb(data));
  },
  onGameLog: (cb) => {
    ipcRenderer.on('game-log', (event, line) => cb(line));
  },
  onGameDebug: (cb) => {
    ipcRenderer.on('game-debug', (event, line) => cb(line));
  },
  onGameClosed: (cb) => {
    ipcRenderer.on('game-closed', (event, code) => cb(code));
  },
});
