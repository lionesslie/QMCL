// Wails v2 bridge — window.go.main.App.<MethodName>()
// Falls back to mock in dev mode

function isWails() {
  return typeof window !== 'undefined'
    && window.go !== undefined
    && window.go.main !== undefined
    && window.go.main.App !== undefined;
}

function wailsCall(fn, ...args) {
  return window.go.main.App[fn](...args);
}

export function onEvent(name, cb) {
  if (typeof window !== 'undefined' && window.runtime?.EventsOn) {
    window.runtime.EventsOn(name, cb);
    return () => window.runtime.EventsOff(name);
  }
  return () => {};
}

// ── API surface ────────────────────────────────────────────
export const API = {
  // Window
  minimize:        () => isWails() ? wailsCall('MinimizeWindow')       : mock('minimize'),
  maximize:        () => isWails() ? wailsCall('MaximizeWindow')       : mock('maximize'),
  close:           () => isWails() ? wailsCall('CloseWindow')          : mock('close'),

  // Auth
  loginMicrosoft:  ()      => isWails() ? wailsCall('LoginMicrosoft')          : mockFn('LoginMicrosoft'),
  loginOffline:    (u)     => isWails() ? wailsCall('LoginOffline', u)         : mockFn('LoginOffline', u),
  getCurrentAccount:()     => isWails() ? wailsCall('GetCurrentAccount')       : mockFn('GetCurrentAccount'),
  getAllAccounts:   ()      => isWails() ? wailsCall('GetAllAccounts')          : mockFn('GetAllAccounts'),
  switchAccount:   (uuid)  => isWails() ? wailsCall('SwitchAccount', uuid)     : mockFn('SwitchAccount', uuid),
  removeAccount:   (uuid)  => isWails() ? wailsCall('RemoveAccount', uuid)     : mockFn('RemoveAccount', uuid),
  refreshAccount:  (uuid)  => isWails() ? wailsCall('RefreshAccount', uuid)    : mockFn('RefreshAccount', uuid),

  // Profiles
  getProfiles:       ()        => isWails() ? wailsCall('GetProfiles')                : mockFn('GetProfiles'),
  getProfile:        (id)      => isWails() ? wailsCall('GetProfile', id)             : mockFn('GetProfile', id),
  createProfile:     (req)     => isWails() ? wailsCall('CreateProfile', req)         : mockFn('CreateProfile', req),
  updateProfile:     (id, req) => isWails() ? wailsCall('UpdateProfile', id, req)     : mockFn('UpdateProfile', id, req),
  deleteProfile:     (id)      => isWails() ? wailsCall('DeleteProfile', id)          : mockFn('DeleteProfile', id),
  duplicateProfile:  (id)      => isWails() ? wailsCall('DuplicateProfile', id)       : mockFn('DuplicateProfile', id),
  setActiveProfile:  (id)      => isWails() ? wailsCall('SetActiveProfile', id)       : mockFn('SetActiveProfile', id),
  getActiveProfile:  ()        => isWails() ? wailsCall('GetActiveProfile')           : mockFn('GetActiveProfile'),
  openProfileFolder: (id)      => isWails() ? wailsCall('OpenProfileFolder', id)      : mockFn('OpenProfileFolder', id),

  // Versions
  getVersionList:       ()   => isWails() ? wailsCall('GetVersionList')          : mockFn('GetVersionList'),
  getInstalledVersions: ()   => isWails() ? wailsCall('GetInstalledVersions')    : mockFn('GetInstalledVersions'),
  installVersion:       (id) => isWails() ? wailsCall('InstallVersion', id)      : mockFn('InstallVersion', id),
  isVersionInstalled:   (id) => isWails() ? wailsCall('IsVersionInstalled', id)  : mockFn('IsVersionInstalled', id),
  getVersionDetails:    (id) => isWails() ? wailsCall('GetVersionDetails', id)   : mockFn('GetVersionDetails', id),

  // Mods
  searchModrinth:   (q,gv,p)         => isWails() ? wailsCall('SearchModrinth', q, gv, p)          : mockFn('SearchModrinth', q, gv, p),
  searchCurseForge: (q,gv,p)         => isWails() ? wailsCall('SearchCurseForge', q, gv, p)        : mockFn('SearchCurseForge', q, gv, p),
  getProfileMods:   (pid)            => isWails() ? wailsCall('GetProfileMods', pid)               : mockFn('GetProfileMods', pid),
  installMod:       (pid,mid,src,vid)=> isWails() ? wailsCall('InstallMod', pid, mid, src, vid)    : mockFn('InstallMod', pid, mid, src, vid),
  uninstallMod:     (pid,fname)      => isWails() ? wailsCall('UninstallMod', pid, fname)          : mockFn('UninstallMod', pid, fname),
  toggleMod:        (pid,fname,en)   => isWails() ? wailsCall('ToggleMod', pid, fname, en)         : mockFn('ToggleMod', pid, fname, en),
  getModVersions:   (mid,src,gv)     => isWails() ? wailsCall('GetModVersions', mid, src, gv)      : mockFn('GetModVersions', mid, src, gv),
  searchModpack:    (q,src,gv,p)     => isWails() ? wailsCall('SearchModpack', q, src, gv, p)      : mockFn('SearchModpack', q, src, gv, p),
  installModpack:   (pid,vid,src,nm) => isWails() ? wailsCall('InstallModpack', pid, vid, src, nm) : mockFn('InstallModpack', pid, vid, src, nm),

  // Download
  getDownloadQueue: ()   => isWails() ? wailsCall('GetDownloadQueue') : mockFn('GetDownloadQueue'),
  cancelDownload:   (id) => isWails() ? wailsCall('CancelDownload', id) : mockFn('CancelDownload', id),

  // Launcher
  launchProfile:    (id) => isWails() ? wailsCall('LaunchProfile', id)    : mockFn('LaunchProfile', id),
  stopProfile:      (id) => isWails() ? wailsCall('StopProfile', id)      : mockFn('StopProfile', id),
  isProfileRunning: (id) => isWails() ? wailsCall('IsProfileRunning', id) : mockFn('IsProfileRunning', id),
  getJavaPath:      ()   => isWails() ? wailsCall('GetJavaPath')          : mockFn('GetJavaPath'),
  getAppVersion:    ()   => isWails() ? wailsCall('GetAppVersion')        : mockFn('GetAppVersion'),
  getDataDir:       ()   => isWails() ? wailsCall('GetDataDir')           : mockFn('GetDataDir'),
};

// ── Dev mock data ──────────────────────────────────────────
const MOCK_PROFILE = {
  id:'p1', name:'Create Mod Pack', gameVersion:'1.21.1',
  modLoader:'fabric', icon:'grass', color:'#6C63FF',
  maxMemoryMB:4096, minMemoryMB:512,
  description:'Automation & trains', totalPlayedSecs:3600,
  gameDir:'', javaArgs:'', isModpack:false,
};
const MOCK_ACCOUNT = {
  uuid:'offline-test', username:'Player', type:'offline', accessToken:'offline'
};
const MOCK_VERSIONS = {
  latest:{ release:'1.21.1', snapshot:'1.21.4' },
  versions:[
    {id:'1.21.4',type:'release',url:'',releaseTime:'2024-12-03T00:00:00Z'},
    {id:'1.21.1',type:'release',url:'',releaseTime:'2024-08-08T00:00:00Z'},
    {id:'1.21',  type:'release',url:'',releaseTime:'2024-06-13T00:00:00Z'},
    {id:'1.20.6',type:'release',url:'',releaseTime:'2024-04-29T00:00:00Z'},
    {id:'1.20.4',type:'release',url:'',releaseTime:'2023-12-07T00:00:00Z'},
    {id:'1.20.1',type:'release',url:'',releaseTime:'2023-06-12T00:00:00Z'},
    {id:'1.19.4',type:'release',url:'',releaseTime:'2023-03-14T00:00:00Z'},
    {id:'1.18.2',type:'release',url:'',releaseTime:'2022-02-28T00:00:00Z'},
    {id:'1.16.5',type:'release',url:'',releaseTime:'2021-01-14T00:00:00Z'},
  ]
};
const MOCK_MODS = { items:[
  {id:'sodium', name:'Sodium',      description:'Modern rendering engine. Optimize FPS.',       downloads:18000000, source:'modrinth', author:'jellysquid3', iconUrl:'', gameVersions:['1.21.1'], modLoaders:['fabric']},
  {id:'create', name:'Create Mod',  description:'Automation and trains. Aesthetic technology.', downloads:22000000, source:'modrinth', author:'simibubi',    iconUrl:'', gameVersions:['1.21.1'], modLoaders:['fabric','forge']},
  {id:'iris',   name:'Iris Shaders',description:'Modern shaders with OptiFine compat.',         downloads:14000000, source:'modrinth', author:'IrisShaders', iconUrl:'', gameVersions:['1.21.1'], modLoaders:['fabric']},
  {id:'jei',    name:'JEI',         description:'Just Enough Items — recipe browser.',           downloads:300000000,source:'modrinth', author:'mezz',        iconUrl:'', gameVersions:['1.21.1'], modLoaders:['fabric','forge']},
]};

function mockFn(fn, ...args) {
  console.log('[MOCK]', fn, args);
  const M = {
    GetProfiles:       () => [MOCK_PROFILE],
    GetProfile:        () => MOCK_PROFILE,
    CreateProfile:     (req) => ({ ...MOCK_PROFILE, ...req, id: 'p' + Date.now() }),
    UpdateProfile:     (id, req) => ({ ...MOCK_PROFILE, id, ...req }),
    DeleteProfile:     () => null,
    DuplicateProfile:  () => ({ ...MOCK_PROFILE, id: 'p' + Date.now(), name: MOCK_PROFILE.name + ' (Copy)' }),
    SetActiveProfile:  () => null,
    GetActiveProfile:  () => MOCK_PROFILE,
    OpenProfileFolder: () => null,

    GetCurrentAccount:  () => MOCK_ACCOUNT,
    GetAllAccounts:     () => [MOCK_ACCOUNT],
    LoginOffline:       ([u]) => ({ ...MOCK_ACCOUNT, username: u }),
    LoginMicrosoft:     () => { throw new Error('Dev mode: Microsoft login not available'); },
    SwitchAccount:      () => null,
    RemoveAccount:      () => null,
    RefreshAccount:     () => MOCK_ACCOUNT,

    GetVersionList:       () => MOCK_VERSIONS,
    GetInstalledVersions: () => [],
    IsVersionInstalled:   () => false,
    InstallVersion:       () => new Promise(r => setTimeout(r, 800)),
    GetVersionDetails:    () => null,

    SearchModrinth:   () => MOCK_MODS,
    SearchCurseForge: () => ({ items: [] }),
    GetProfileMods:   () => [],
    InstallMod:       () => new Promise(r => setTimeout(r, 600)),
    UninstallMod:     () => null,
    ToggleMod:        () => null,
    GetModVersions:   () => [],
    SearchModpack:    () => MOCK_MODS,
    InstallModpack:   () => new Promise(r => setTimeout(r, 800)),

    GetDownloadQueue: () => [],
    CancelDownload:   () => null,

    LaunchProfile:    () => new Promise((_,rej) => setTimeout(() => rej(new Error('Dev mode: launch not supported')), 300)),
    StopProfile:      () => null,
    IsProfileRunning: () => false,
    GetJavaPath:      () => '/usr/bin/java',
    GetAppVersion:    () => '1.0.0',
    GetDataDir:       () => '~/.config/qmcl',
  };
  const handler = M[fn];
  if (!handler) return Promise.resolve(null);
  try {
    const result = handler(args);
    return Promise.resolve(result);
  } catch(e) {
    return Promise.reject(e);
  }
}

function mock(name) {
  console.log('[MOCK window control]', name);
  return Promise.resolve();
}
