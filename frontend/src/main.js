import './style.css';
import { API, onEvent } from './wails.js';
import { iconStr } from './icons.js';

// ─── State ───────────────────────────────────────────────
const S = {
  page: 'home',
  profiles: [], activeId: null, account: null,
  versions: null, installedVers: new Set(),
  // mods
  modTab: 'browse', modSrc: 'modrinth',
  modResults: [], modPage: 0, modLoading: false, modHasMore: true,
  modQ: '',
  // packs
  packSrc: 'modrinth',
  // runtime
  running: new Set(),
  // version install progress
  verProgress: {},
};

// ─── Boot ────────────────────────────────────────────────
async function boot() {
  shell();
  bind();
  const [profiles, account, active] = await Promise.all([
    API.getProfiles(), API.getCurrentAccount(), API.getActiveProfile()
  ]).catch(() => [[], null, null]);
  S.profiles = profiles || [];
  S.account  = account;
  S.activeId = active?.id || S.profiles[0]?.id || null;
  syncAcct();
  nav('home');
}

// ─── Shell ───────────────────────────────────────────────
function shell() {
  document.getElementById('app').innerHTML = `
    <div class="tbar">
      <div class="tbar-logo">
        <div class="tbar-logomark">${I('minecraft')}</div>QMCL
      </div>
      <div class="tbar-drag"></div>
      <div class="tbar-ctrls">
        <button class="tbar-btn" id="tMin">${I('minimize')}</button>
        <button class="tbar-btn" id="tMax">${I('maximize')}</button>
        <button class="tbar-btn cls" id="tClose">${I('x')}</button>
      </div>
    </div>
    <div class="layout">
      <nav class="sidebar">
        ${nb('home','home','Home')}
        ${nb('profiles','layers','Profiles')}
        ${nb('mods','puzzle','Mods')}
        ${nb('versions','package','Versions')}
        ${nb('downloads','download-cloud','Queue')}
        <div class="sb-gap"></div>
        ${nb('settings','settings','Config')}
        <button class="sb-acct" id="sb-acct">
          <div class="sb-av" id="sb-av">?</div>
          <div class="sb-aname" id="sb-an">—</div>
        </button>
      </nav>
      <div class="content">

        <!-- HOME -->
        <div id="page-home" class="page">
          <div class="home-wrap">
            <div class="home-main">
              <div id="sel-card"></div>
              <div id="ver-install-box" style="display:none">
                <div class="ver-installing">
                  <div class="ver-install-label">${I('download-cloud')} <span id="ver-inst-title">Installing Minecraft...</span></div>
                  <div class="ver-install-msg" id="ver-inst-msg">Preparing...</div>
                  <div class="ver-pbar"><div class="ver-pfill" id="ver-inst-bar" style="width:0%"></div></div>
                </div>
              </div>
            </div>
            <div class="home-rail">
              <div class="rail-head">Profiles</div>
              <div class="rail-list" id="rail"></div>
              <div style="padding:8px">
                <button class="btn btn-s btn-sm" id="new-home" style="width:100%;justify-content:center">
                  ${I('plus')} New Profile
                </button>
              </div>
            </div>
          </div>
          <div class="console" id="console">
            <div class="con-hd">
              <div class="con-dot"></div>${I('terminal')}
              <span id="con-lbl">Console</span>
              <button class="iBtn" id="con-close" style="margin-left:auto;width:20px;height:20px">${I('x')}</button>
            </div>
            <div class="con-out" id="con-out"></div>
          </div>
        </div>

        <!-- PROFILES -->
        <div id="page-profiles" class="page">
          <div class="ph">
            <div class="ph-icon">${I('layers')}</div>
            <div><div class="ph-title">Profiles</div><div class="ph-sub">Manage your Minecraft instances</div></div>
            <div class="ph-actions">
              <button class="btn btn-p" id="btn-new-prof">${I('plus')} New Profile</button>
            </div>
          </div>
          <div class="pgrid" id="pgrid"></div>
        </div>

        <!-- MODS -->
        <div id="page-mods" class="page">
          <div class="ph">
            <div class="ph-icon">${I('puzzle')}</div>
            <div><div class="ph-title">Mods</div><div class="ph-sub">Search, install and manage mods</div></div>
            <div class="ph-actions">
              <select class="fs" id="mod-prof-sel" style="width:160px">
                <option value="">Select profile...</option>
              </select>
            </div>
          </div>
          <div class="tbbar">
            <div class="tb on" data-mt="browse">Browse</div>
            <div class="tb" data-mt="installed">Installed</div>
            <div class="tb" data-mt="modpacks">Modpacks</div>
          </div>
          <!-- Browse -->
          <div id="mt-browse" style="display:flex;flex-direction:column;flex:1;overflow:hidden">
            <div class="mtbar">
              <div class="srch">
                ${I('search')}<input type="text" id="mod-q" placeholder="Search mods...">
              </div>
              <div class="stabs">
                <div class="stab on" data-src="modrinth">Modrinth</div>
                <div class="stab" data-src="curseforge">CurseForge</div>
              </div>
              <button class="btn btn-p btn-sm" id="btn-srch-mods">${I('search')} Search</button>
            </div>
            <div class="mgrid" id="mgrid">
              <div class="empty" style="grid-column:1/-1">
                ${I('search')}<div class="empty-t">Search for mods</div>
                <div class="empty-d">Type a mod name and press Search</div>
              </div>
            </div>
          </div>
          <!-- Installed -->
          <div id="mt-installed" style="display:none;flex-direction:column;flex:1;overflow:hidden">
            <div class="mtbar">
              <div class="srch">${I('search')}<input type="text" id="ins-q" placeholder="Filter..."></div>
            </div>
            <div class="ilist" id="ilist"></div>
          </div>
          <!-- Modpacks -->
          <div id="mt-modpacks" style="display:none;flex-direction:column;flex:1;overflow:hidden">
            <div class="mtbar">
              <div class="srch">
                ${I('search')}<input type="text" id="pack-q" placeholder="Search modpacks...">
              </div>
              <div class="stabs">
                <div class="stab on" data-ps="modrinth">Modrinth</div>
                <div class="stab" data-ps="curseforge">CurseForge</div>
              </div>
              <button class="btn btn-p btn-sm" id="btn-srch-packs">${I('search')} Search</button>
            </div>
            <div class="mgrid" id="pgrid2"></div>
          </div>
        </div>

        <!-- VERSIONS -->
        <div id="page-versions" class="page">
          <div class="ph">
            <div class="ph-icon">${I('package')}</div>
            <div><div class="ph-title">Minecraft Versions</div><div class="ph-sub">Download and manage versions</div></div>
            <div class="ph-actions">
              <label style="display:flex;align-items:center;gap:4px;font-size:11px;cursor:pointer">
                <input type="checkbox" id="vr" checked style="accent-color:var(--a)"> Releases
              </label>
              <label style="display:flex;align-items:center;gap:4px;font-size:11px;cursor:pointer">
                <input type="checkbox" id="vs" style="accent-color:var(--a)"> Snapshots
              </label>
              <label style="display:flex;align-items:center;gap:4px;font-size:11px;cursor:pointer">
                <input type="checkbox" id="vo" style="accent-color:var(--a)"> Old
              </label>
              <button class="btn btn-s btn-sm" id="btn-ver-ref">${I('refresh')} Refresh</button>
            </div>
          </div>
          <div class="vlist" id="vlist"></div>
        </div>

        <!-- DOWNLOADS -->
        <div id="page-downloads" class="page">
          <div class="ph">
            <div class="ph-icon">${I('download-cloud')}</div>
            <div><div class="ph-title">Downloads</div><div class="ph-sub">Active and recent downloads</div></div>
          </div>
          <div style="padding:18px;flex:1;overflow-y:auto" id="dl-list">
            <div class="empty">${I('download-cloud')}<div class="empty-t">No downloads</div></div>
          </div>
        </div>

        <!-- SETTINGS -->
        <div id="page-settings" class="page">
          <div class="ph">
            <div class="ph-icon">${I('settings')}</div>
            <div><div class="ph-title">Settings</div><div class="ph-sub">Configure QMCL</div></div>
          </div>
          <div class="slayout">
            <div class="snav">
              <div class="sni on" data-sec="general">${I('settings')} General</div>
              <div class="sni" data-sec="java">${I('cpu')} Java</div>
              <div class="sni" data-sec="accounts">${I('users')} Accounts</div>
              <div class="sni" data-sec="about">${I('info')} About</div>
            </div>
            <div class="scon" id="scon"></div>
          </div>
        </div>

      </div>
    </div>
    <div class="nstack" id="nstack"></div>
    <div class="movl" id="movl">
      <div class="modal">
        <div class="mhd">
          <span class="mhd-t" id="m-title"></span>
          <button class="mhd-x" id="m-close">${I('x')}</button>
        </div>
        <div class="mbdy" id="m-body"></div>
        <div class="mft" id="m-foot"></div>
      </div>
    </div>
  `;
}

function nb(p, ic, lbl) {
  return `<button class="nav" data-p="${p}">${I(ic)}<span class="nl">${lbl}</span></button>`;
}
function I(n) { return iconStr(n); }

// ─── Bind ────────────────────────────────────────────────
function bind() {
  document.getElementById('tMin').onclick   = () => API.minimize();
  document.getElementById('tMax').onclick   = () => API.maximize();
  document.getElementById('tClose').onclick = () => API.close();

  document.querySelectorAll('.nav[data-p]').forEach(b => b.onclick = () => nav(b.dataset.p));

  document.getElementById('m-close').onclick  = closeM;
  document.getElementById('movl').onclick = e => { if (e.target===e.currentTarget) closeM(); };

  document.getElementById('btn-new-prof').onclick = () => newProfModal();
  document.getElementById('new-home').onclick     = () => newProfModal();
  document.getElementById('sb-acct').onclick      = () => { nav('settings'); setSecTab('accounts'); };
  document.getElementById('con-close').onclick    = () => document.getElementById('console').classList.remove('open');

  // Mod tabs
  document.querySelectorAll('[data-mt]').forEach(t => t.onclick = () => switchModTab(t.dataset.mt));

  // Source tabs (browse)
  document.querySelectorAll('[data-src]').forEach(t => t.onclick = () => {
    document.querySelectorAll('[data-src]').forEach(x => x.classList.remove('on'));
    t.classList.add('on'); S.modSrc = t.dataset.src;
  });

  document.getElementById('btn-srch-mods').onclick = () => searchMods(true);
  document.getElementById('mod-q').onkeydown = e => { if (e.key==='Enter') searchMods(true); };

  // Pack source tabs
  document.querySelectorAll('[data-ps]').forEach(t => t.onclick = () => {
    document.querySelectorAll('[data-ps]').forEach(x => x.classList.remove('on'));
    t.classList.add('on'); S.packSrc = t.dataset.ps;
  });

  document.getElementById('btn-srch-packs').onclick = () => searchPacks();
  document.getElementById('pack-q').onkeydown = e => { if (e.key==='Enter') searchPacks(); };

  document.getElementById('ins-q').oninput = e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.imi').forEach(el =>
      el.style.display = (el.querySelector('.imi-name')?.textContent||'').toLowerCase().includes(q) ? '' : 'none');
  };

  document.getElementById('mod-prof-sel').onchange = e => {
    S.activeId = e.target.value;
    if (S.modTab==='installed') loadInstalled();
  };

  document.getElementById('vr').onchange = renderVList;
  document.getElementById('vs').onchange = renderVList;
  document.getElementById('vo').onchange = renderVList;
  document.getElementById('btn-ver-ref').onclick = loadVersions;

  document.querySelectorAll('[data-sec]').forEach(i => i.onclick = () => setSecTab(i.dataset.sec));

  // Infinite scroll — use IntersectionObserver on sentinel
  bindModsScroll();

  // Wails events
  onEvent('download:progress',         d => dlProgress(d));
  onEvent('game:started',              d => gameStarted(d));
  onEvent('game:stopped',              d => gameStopped(d));
  onEvent('game:log',                  d => gameLog(d));
  onEvent('version:install:progress',  d => verInstProgress(d));
}

// ─── Navigation ──────────────────────────────────────────
function nav(p) {
  S.page = p;
  document.querySelectorAll('.page').forEach(x => x.classList.remove('on'));
  document.querySelectorAll('.nav').forEach(x => x.classList.remove('on'));
  document.getElementById(`page-${p}`)?.classList.add('on');
  document.querySelector(`.nav[data-p="${p}"]`)?.classList.add('on');

  if (p==='home')      renderHome();
  if (p==='profiles')  renderPGrid();
  if (p==='mods')      initMods();
  if (p==='versions')  loadVersions();
  if (p==='settings')  setSecTab('general');
}

// ─── Account ─────────────────────────────────────────────
function syncAcct() {
  const a = S.account;
  document.getElementById('sb-av').textContent = a?.username?.[0]?.toUpperCase() || '?';
  document.getElementById('sb-an').textContent = a?.username || '—';
}

// ─── HOME ────────────────────────────────────────────────
function renderHome() {
  renderRail();
  renderSelCard();
}

function renderRail() {
  const el = document.getElementById('rail');
  if (!el) return;
  if (!S.profiles.length) {
    el.innerHTML = `<div style="padding:12px 8px;font-size:11px;color:var(--t3)">No profiles yet</div>`;
    return;
  }
  el.innerHTML = S.profiles.map(p => `
    <div class="ri ${p.id===S.activeId?'on':''}" data-id="${p.id}">
      <div class="ri-ic" style="background:${ca(p.color||'#7b68ee',.15)}">${p.icon||'🌿'}</div>
      <div>
        <div class="ri-name">${esc(p.name)}</div>
        <div class="ri-ver">${p.gameVersion}</div>
      </div>
    </div>
  `).join('');
  el.querySelectorAll('.ri').forEach(r => r.onclick = () => pickProfile(r.dataset.id));
}

function renderSelCard() {
  const wrap = document.getElementById('sel-card');
  if (!wrap) return;
  const p = S.profiles.find(x => x.id===S.activeId);

  if (!p) {
    wrap.innerHTML = `<div class="sel-card">
      <div class="empty" style="padding:40px 20px">
        ${I('layers')}<div class="empty-t">No profile selected</div>
        <div class="empty-d">Create your first profile to start playing</div>
        <button class="btn btn-p" onclick="document.getElementById('new-home').click()">
          ${I('plus')} New Profile
        </button>
      </div>
    </div>`;
    return;
  }

  const running = S.running.has(p.id);
  const inst    = S.installedVers.has(p.gameVersion);

  wrap.innerHTML = `
    <div class="sel-card">
      <div class="sel-header">
        <div class="sel-bigicon" style="background:${ca(p.color||'#7b68ee',.18)};border:1px solid ${ca(p.color||'#7b68ee',.3)}">
          ${p.icon||'🌿'}
        </div>
        <div style="flex:1;min-width:0">
          <div class="sel-name">${esc(p.name)}</div>
          <div class="sel-badges">
            <span class="chip">${I('package')} ${p.gameVersion}</span>
            <span class="bdg ${p.modLoader||'vanilla'}">${cap(p.modLoader||'vanilla')}</span>
            ${inst
              ? `<span class="bdg" style="background:rgba(34,197,94,.12);color:var(--ok);border-color:rgba(34,197,94,.2)">${I('check')} Ready</span>`
              : `<span class="bdg" style="background:rgba(245,158,11,.12);color:var(--warn);border-color:rgba(245,158,11,.2)">${I('download')} Not installed</span>`
            }
          </div>
          ${p.description ? `<div class="sel-desc">${esc(p.description)}</div>` : ''}
        </div>
      </div>
      <div class="sel-stats">
        <div class="stat"><div class="stat-v">${p.maxMemoryMB||2048}MB</div><div class="stat-k">Max RAM</div></div>
        <div class="stat"><div class="stat-v">${fmtPt(p.totalPlayedSecs||0)}</div><div class="stat-k">Played</div></div>
        <div class="stat"><div class="stat-v">${cap(p.modLoader||'Vanilla')}</div><div class="stat-k">Loader</div></div>
      </div>
      <div class="sel-actions">
        <button class="lbtn ${running?'running':''}" id="main-lbtn">
          ${running ? I('stop') : I('play')}
          ${running ? 'Stop' : inst ? 'Launch' : 'Install & Launch'}
        </button>
        <button class="btn btn-s" id="home-mods">${I('puzzle')} Mods</button>
        <button class="btn btn-g" id="home-edit">${I('edit')} Edit</button>
        <button class="btn btn-g" id="home-folder">${I('folder')}</button>
      </div>
    </div>
  `;

  document.getElementById('main-lbtn').onclick = () => {
    if (running) stopProf(p.id);
    else launch(p.id);
  };
  document.getElementById('home-mods').onclick = () => {
    nav('mods');
    setTimeout(() => {
      document.getElementById('mod-prof-sel').value = p.id;
      switchModTab('installed');
    }, 50);
  };
  document.getElementById('home-edit').onclick   = () => editProfModal(p.id);
  document.getElementById('home-folder').onclick = () => openFolder(p.id);
}

// ─── SELECT PROFILE ──────────────────────────────────────
async function pickProfile(id) {
  S.activeId = id;
  await API.setActiveProfile(id).catch(() => {});
  renderHome();
  renderPGrid();
  syncModProfSel();
  // Auto-check if version installed, if not show install prompt
  checkAndInstallVer(id);
}

async function checkAndInstallVer(profileId) {
  const p = S.profiles.find(x => x.id===profileId);
  if (!p) return;
  if (S.installedVers.has(p.gameVersion)) return;
  // Fetch from backend
  const inst = await API.isVersionInstalled(p.gameVersion).catch(() => false);
  if (inst) { S.installedVers.add(p.gameVersion); renderSelCard(); return; }
  // Not installed — show install bar and start install
  showVerInstallBox(p.gameVersion);
  try {
    await API.installVersion(p.gameVersion);
    S.installedVers.add(p.gameVersion);
  } catch(e) {
    notify('Version install failed: ' + (e.message||e), 'err');
  }
  hideVerInstallBox();
  renderSelCard();
}

function showVerInstallBox(ver) {
  const box = document.getElementById('ver-install-box');
  document.getElementById('ver-inst-title').textContent = `Installing Minecraft ${ver}...`;
  document.getElementById('ver-inst-msg').textContent = 'Fetching version info...';
  document.getElementById('ver-inst-bar').style.width = '0%';
  box.style.display = 'block';
}

function hideVerInstallBox() {
  document.getElementById('ver-install-box').style.display = 'none';
}

function verInstProgress(d) {
  S.verProgress[d.versionId] = d;
  const bar = document.getElementById('ver-inst-bar');
  const msg = document.getElementById('ver-inst-msg');
  if (bar) bar.style.width = (d.progress||0) + '%';
  if (msg) msg.textContent = d.message || '';
  // Also update versions page
  const fill = document.getElementById(`vpf-${d.versionId}`);
  if (fill) fill.style.width = (d.progress||0) + '%';
}

// ─── LAUNCH ──────────────────────────────────────────────
async function launch(id) {
  if (!S.account) { loginModal(); return; }
  const p = S.profiles.find(x => x.id===id);
  if (!p) return;
  // Install version first if needed
  if (!S.installedVers.has(p.gameVersion)) {
    const inst = await API.isVersionInstalled(p.gameVersion).catch(() => false);
    if (!inst) {
      notify(`Installing Minecraft ${p.gameVersion} first...`, 'inf');
      showVerInstallBox(p.gameVersion);
      try {
        await API.installVersion(p.gameVersion);
        S.installedVers.add(p.gameVersion);
        hideVerInstallBox();
        renderSelCard();
      } catch(e) {
        hideVerInstallBox();
        notify('Failed to install version: ' + (e.message||e), 'err');
        return;
      }
    } else {
      S.installedVers.add(p.gameVersion);
    }
  }
  notify(`Launching ${p.name}...`, 'inf');
  try { await API.launchProfile(id); }
  catch(e) { notify(e.message||'Launch failed', 'err'); }
}

async function stopProf(id) {
  try { await API.stopProfile(id); }
  catch(e) { notify(e.message||'Stop failed', 'err'); }
}

function gameStarted(d) {
  S.running.add(d.profileId);
  const p = S.profiles.find(x => x.id===d.profileId);
  document.getElementById('con-lbl').textContent = p?.name || 'Console';
  document.getElementById('console').classList.add('open');
  renderSelCard(); renderPGrid();
  notify(`${p?.name||'Game'} started`, 'ok');
}

function gameStopped(d) {
  S.running.delete(d.profileId);
  renderSelCard(); renderPGrid();
  notify('Game closed', 'inf');
}

function gameLog(d) {
  const out = document.getElementById('con-out');
  if (!out) return;
  const t = d.line||'';
  const div = document.createElement('div');
  div.className = t.toLowerCase().includes('error') ? 'le'
    : t.toLowerCase().includes('warn') ? 'lw'
    : t.includes('[INFO]') ? 'li' : '';
  div.textContent = t;
  out.appendChild(div);
  if (out.children.length > 800) out.removeChild(out.firstChild);
  out.scrollTop = out.scrollHeight;
}

async function openFolder(id) {
  try { await API.openProfileFolder(id); }
  catch(e) { notify('Could not open folder', 'err'); }
}

// ─── PROFILES GRID ───────────────────────────────────────
function renderPGrid() {
  const g = document.getElementById('pgrid');
  if (!g) return;
  if (!S.profiles.length) {
    g.innerHTML = `<div class="empty" style="grid-column:1/-1">
      ${I('layers')}<div class="empty-t">No profiles</div>
      <div class="empty-d">Create your first Minecraft profile</div>
      <button class="btn btn-p" onclick="document.getElementById('btn-new-prof').click()">${I('plus')} Create</button>
    </div>`;
    return;
  }
  g.innerHTML = S.profiles.map(p => {
    const run = S.running.has(p.id);
    return `<div class="pcard ${p.id===S.activeId?'on':''}" data-id="${p.id}" style="--pc:${p.color||'#7b68ee'}">
      <div class="pcard-acts">
        <button class="pcard-act" data-a="edit"   data-id="${p.id}">${I('edit')}</button>
        <button class="pcard-act" data-a="dup"    data-id="${p.id}">${I('copy')}</button>
        <button class="pcard-act" data-a="folder" data-id="${p.id}">${I('folder')}</button>
        <button class="pcard-act" data-a="del"    data-id="${p.id}" style="color:var(--err)">${I('trash')}</button>
      </div>
      <div class="pcard-icon" style="background:${ca(p.color||'#7b68ee',.15)}">${p.icon||'🌿'}</div>
      <div class="pcard-name">${esc(p.name)}</div>
      <div class="pcard-meta">
        <span class="bdg"><small>${I('package')}</small> ${p.gameVersion}</span>
        <span class="bdg ${p.modLoader||'vanilla'}">${cap(p.modLoader||'vanilla')}</span>
      </div>
      ${p.description ? `<div style="font-size:11px;color:var(--t3);margin-bottom:8px">${esc(p.description)}</div>` : ''}
      <div class="pcard-foot">
        <span class="pstat">${I('clock')} ${fmtPt(p.totalPlayedSecs||0)}</span>
        <span class="pstat">${I('cpu')} ${p.maxMemoryMB||2048}MB</span>
        <button class="lbtn ${run?'running':''}" data-a="${run?'stop':'launch'}" data-id="${p.id}"
          style="padding:7px 14px;font-size:11px;margin-left:auto" onclick="event.stopPropagation()">
          ${run ? I('stop') : I('play')} ${run ? 'Running' : 'Play'}
        </button>
      </div>
    </div>`;
  }).join('');

  g.querySelectorAll('.pcard').forEach(c => {
    c.onclick = e => { if (!e.target.closest('.pcard-acts,.lbtn')) pickProfile(c.dataset.id); };
  });
  g.querySelectorAll('[data-a="launch"]').forEach(b => b.onclick = e => { e.stopPropagation(); launch(b.dataset.id); });
  g.querySelectorAll('[data-a="stop"]').forEach(b   => b.onclick = e => { e.stopPropagation(); stopProf(b.dataset.id); });
  g.querySelectorAll('[data-a="edit"]').forEach(b   => b.onclick = e => { e.stopPropagation(); editProfModal(b.dataset.id); });
  g.querySelectorAll('[data-a="dup"]').forEach(b    => b.onclick = e => { e.stopPropagation(); dupProf(b.dataset.id); });
  g.querySelectorAll('[data-a="del"]').forEach(b    => b.onclick = e => { e.stopPropagation(); delProf(b.dataset.id); });
  g.querySelectorAll('[data-a="folder"]').forEach(b => b.onclick = e => { e.stopPropagation(); openFolder(b.dataset.id); });
}

// ─── PROFILE MODAL ───────────────────────────────────────
async function newProfModal() {
  openM('New Profile', await profForm(), [
    {lbl:'Cancel', cls:'btn-s', fn: closeM},
    {lbl:'Create', cls:'btn-p', fn: doCreate},
  ]);
}

async function editProfModal(id) {
  const p = S.profiles.find(x => x.id===id);
  if (!p) return;
  openM('Edit Profile', await profForm(p), [
    {lbl:'Cancel', cls:'btn-s', fn: closeM},
    {lbl:'Save',   cls:'btn-p', fn: () => doEdit(id)},
  ]);
}

async function profForm(p=null) {
  const colors = ['#7b68ee','#22c55e','#f59e0b','#ef4444','#2dd4bf','#f97316','#e879f9','#60a5fa','#a78bfa'];
  const icos   = ['🌿','⚙️','🔥','❄️','⚡','🌊','🏔️','🎮','🛡️','⚔️','🏹','🧪','🌙','☀️','💎','🦊','🐉','🚀'];
  const sc = p?.color||'#7b68ee', si = p?.icon||'🌿';

  let verOpts = `<option value="1.21">1.21</option>`;
  try {
    if (!S.versions) S.versions = await API.getVersionList();
    verOpts = S.versions.versions
      .filter(v => v.type==='release')
      .map(v => `<option value="${v.id}" ${v.id===p?.gameVersion?'selected':''}>${v.id}</option>`)
      .join('');
  } catch(_){}

  return `
    <div class="fg">
      <label class="fl">Icon</label>
      <div class="ico-grid">
        ${icos.map(ic => `<button type="button" class="ico-opt ${ic===si?'on':''}"
          onclick="document.querySelectorAll('.ico-opt').forEach(b=>b.classList.remove('on'));
            this.classList.add('on');document.getElementById('fi').value=this.textContent">${ic}</button>`).join('')}
      </div>
      <input type="hidden" id="fi" value="${si}">
    </div>
    <div class="fg">
      <label class="fl">Name *</label>
      <input type="text" class="fi" id="fn" placeholder="My Survival World" value="${esc(p?.name||'')}">
    </div>
    <div class="fg">
      <label class="fl">Color</label>
      <div class="cswatches">
        ${colors.map(c=>`<div class="csw ${c===sc?'on':''}" style="background:${c}"
          onclick="document.querySelectorAll('.csw').forEach(s=>s.classList.remove('on'));
            this.classList.add('on');document.getElementById('fc').value='${c}'"></div>`).join('')}
      </div>
      <input type="hidden" id="fc" value="${sc}">
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="fg" style="margin:0">
        <label class="fl">Minecraft Version *</label>
        <select class="fs" id="fv" style="width:100%">${verOpts}</select>
      </div>
      <div class="fg" style="margin:0">
        <label class="fl">Mod Loader</label>
        <select class="fs" id="fl2" style="width:100%">
          ${['vanilla','fabric','forge','neoforge','quilt'].map(l =>
            `<option value="${l}" ${p?.modLoader===l?'selected':''}>${cap(l)}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="fg" style="margin-top:10px">
      <label class="fl">Max RAM</label>
      <div class="sldr">
        <input type="range" id="fm" min="512" max="32768" step="512" value="${p?.maxMemoryMB||2048}"
          oninput="document.getElementById('fmv').textContent=this.value+'MB'">
        <span class="sval" id="fmv">${p?.maxMemoryMB||2048}MB</span>
      </div>
    </div>
    <div class="fg">
      <label class="fl">Description</label>
      <textarea class="fi" id="fd" rows="2" placeholder="Optional...">${esc(p?.description||'')}</textarea>
    </div>
    <div class="fg" style="margin:0">
      <label class="fl">Java Arguments</label>
      <input type="text" class="fi" id="fj"
        value="${esc(p?.javaArgs||'-XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:MaxGCPauseMillis=50')}">
    </div>
  `;
}

function getFormVals() {
  return {
    icon: document.getElementById('fi')?.value||'🌿',
    name: document.getElementById('fn')?.value?.trim()||'',
    color: document.getElementById('fc')?.value||'#7b68ee',
    gameVersion: document.getElementById('fv')?.value||'1.21',
    modLoader: document.getElementById('fl2')?.value||'vanilla',
    maxMemoryMB: parseInt(document.getElementById('fm')?.value||'2048'),
    description: document.getElementById('fd')?.value||'',
    javaArgs: document.getElementById('fj')?.value||'',
  };
}

async function doCreate() {
  const v = getFormVals();
  if (!v.name) return notify('Name required', 'err');
  try {
    const prf = await API.createProfile(v);
    if (v.javaArgs) await API.updateProfile(prf.id, {javaArgs: v.javaArgs});
    S.profiles = await API.getProfiles();
    S.activeId = prf.id;
    closeM(); refresh(); notify(`Profile "${v.name}" created`, 'ok');
    // Auto-install version for new profile
    checkAndInstallVer(prf.id);
  } catch(e) { notify(e.message||'Failed', 'err'); }
}

async function doEdit(id) {
  const v = getFormVals();
  try {
    await API.updateProfile(id, v);
    S.profiles = await API.getProfiles();
    closeM(); refresh(); notify('Profile saved', 'ok');
  } catch(e) { notify(e.message||'Failed', 'err'); }
}

async function dupProf(id) {
  try {
    await API.duplicateProfile(id);
    S.profiles = await API.getProfiles();
    refresh(); notify('Profile duplicated', 'ok');
  } catch(e) { notify(e.message, 'err'); }
}

function delProf(id) {
  const p = S.profiles.find(x => x.id===id);
  if (!p) return;
  openM('Delete Profile', `
    <p style="font-size:12px;color:var(--t2);line-height:1.6">
      Delete <strong style="color:var(--t1)">${esc(p.name)}</strong>?<br>
      This permanently removes the profile and all its files.
    </p>
  `, [
    {lbl:'Cancel', cls:'btn-s', fn: closeM},
    {lbl:'Delete', cls:'btn-d', fn: async () => {
      await API.deleteProfile(id);
      S.profiles = await API.getProfiles();
      if (S.activeId===id) S.activeId = S.profiles[0]?.id||null;
      closeM(); refresh(); notify('Deleted', 'inf');
    }},
  ]);
}

function refresh() {
  renderPGrid(); renderHome(); syncModProfSel();
}

// ─── MODS ────────────────────────────────────────────────
function initMods() {
  syncModProfSel();
  switchModTab(S.modTab);
}

function syncModProfSel() {
  const sel = document.getElementById('mod-prof-sel');
  if (!sel) return;
  sel.innerHTML = `<option value="">Select profile...</option>` +
    S.profiles.map(p => `<option value="${p.id}" ${p.id===S.activeId?'selected':''}>${esc(p.name)}</option>`).join('');
  if (S.activeId) sel.value = S.activeId;
}

function switchModTab(tab) {
  S.modTab = tab;
  document.querySelectorAll('[data-mt]').forEach(t => t.classList.toggle('on', t.dataset.mt===tab));
  document.getElementById('mt-browse').style.display    = tab==='browse'    ? 'flex' : 'none';
  document.getElementById('mt-installed').style.display = tab==='installed' ? 'flex' : 'none';
  document.getElementById('mt-modpacks').style.display  = tab==='modpacks'  ? 'flex' : 'none';

  if (tab==='installed') loadInstalled();
  if (tab==='modpacks' && !document.getElementById('pgrid2')?.children.length) searchPacks();
}

// ── Infinite scroll via IntersectionObserver ──────────────
let modsObserver = null;

function bindModsScroll() {
  const grid = document.getElementById('mgrid');
  if (!grid) return;

  modsObserver = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !S.modLoading && S.modHasMore) {
      searchMods(false);
    }
  }, { root: grid, threshold: 0.1 });
}

function attachSentinel(grid) {
  // Remove old sentinel
  grid.querySelector('.inf-sentinel')?.remove();
  const s = document.createElement('div');
  s.className = 'inf-sentinel';
  s.innerHTML = '<div class="spin" style="width:16px;height:16px;border-width:2px"></div>';
  grid.appendChild(s);
  if (modsObserver) modsObserver.observe(s);
}

async function searchMods(reset=false) {
  if (S.modLoading && !reset) return;
  if (reset) {
    S.modPage = 0; S.modHasMore = true; S.modResults = [];
    const grid = document.getElementById('mgrid');
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="spin spin-lg"></div></div>`;
  }
  if (!S.modHasMore) return;

  const q    = document.getElementById('mod-q')?.value||'';
  const src  = S.modSrc;
  const profId = document.getElementById('mod-prof-sel')?.value;
  const gv   = S.profiles.find(p => p.id===profId)?.gameVersion||'';
  const grid = document.getElementById('mgrid');

  S.modLoading = true;
  try {
    const res = src==='modrinth'
      ? await API.searchModrinth(q, gv, S.modPage)
      : await API.searchCurseForge(q, gv, S.modPage);

    const items = res?.items||[];

    if (reset) {
      grid.innerHTML = '';
    }

    if (!items.length && reset) {
      grid.innerHTML = `<div class="empty" style="grid-column:1/-1">
        ${I('puzzle')}<div class="empty-t">No results</div>
        <div class="empty-d">Try different keywords or switch source</div></div>`;
      S.modHasMore = false;
      return;
    }

    items.forEach(m => grid.appendChild(modCardEl(m)));
    S.modResults = [...S.modResults, ...items];
    S.modHasMore = items.length >= 20;
    S.modPage++;

    if (S.modHasMore) {
      attachSentinel(grid);
    } else {
      grid.querySelector('.inf-sentinel')?.remove();
    }
  } catch(e) {
    if (reset) {
      grid.innerHTML = `<div class="empty" style="grid-column:1/-1">
        ${I('x')}<div class="empty-t">Error</div><div class="empty-d">${esc(e.message)}</div></div>`;
    }
  } finally {
    S.modLoading = false;
  }
}

function modCardEl(m) {
  const el = document.createElement('div');
  el.className = 'mcard';
  el.innerHTML = `
    <div class="mico">
      ${m.iconUrl ? `<img src="${m.iconUrl}" alt="" onerror="this.parentNode.textContent='🧩'">` : '🧩'}
    </div>
    <div class="minfo">
      <div class="mname">${esc(m.name)}</div>
      <div class="mdesc">${esc(m.description)}</div>
      <div class="mmeta">
        <span class="sbdg ${m.source}">${m.source==='modrinth'?'Modrinth':'CF'}</span>
        ${I('download')} ${fmtN(m.downloads)}
        ${m.author?`· ${esc(m.author)}`:''}
      </div>
    </div>
    <button class="mibtn" title="Install">${I('download')}</button>
  `;
  el.querySelector('.mibtn').onclick = e => { e.stopPropagation(); installMod(m, el); };
  el.onclick = () => modDetail(m);
  return el;
}

async function installMod(m, cardEl) {
  const profId = document.getElementById('mod-prof-sel')?.value;
  if (!profId) { notify('Select a profile first', 'err'); return; }
  const btn = cardEl?.querySelector('.mibtn');
  if (btn) { btn.innerHTML = `<div class="spin" style="width:13px;height:13px;border-width:2px"></div>`; btn.style.pointerEvents='none'; }
  try {
    await API.installMod(profId, m.id, m.source, '');
    if (btn) { btn.innerHTML = I('check'); btn.classList.add('done'); }
    notify(`${m.name} installed`, 'ok');
  } catch(e) {
    if (btn) { btn.innerHTML = I('download'); btn.style.pointerEvents=''; }
    notify(e.message||'Install failed', 'err');
  }
}

function modDetail(m) {
  openM(m.name, `
    <div style="display:flex;gap:13px;margin-bottom:15px">
      <div style="width:56px;height:56px;border-radius:10px;background:var(--c4);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:25px">
        ${m.iconUrl?`<img src="${m.iconUrl}" style="width:100%;height:100%;object-fit:cover">`:'🧩'}
      </div>
      <div>
        <div style="font-weight:800;font-size:14px;margin-bottom:4px">${esc(m.name)}</div>
        <div style="font-size:11px;color:var(--t2)">by ${esc(m.author||'Unknown')}</div>
        <div style="margin-top:6px;display:flex;gap:5px">
          <span class="sbdg ${m.source}">${m.source}</span>
          <span class="chip">${I('download')} ${fmtN(m.downloads)}</span>
        </div>
      </div>
    </div>
    <div style="font-size:12px;color:var(--t2);line-height:1.6;margin-bottom:12px">${esc(m.description)}</div>
    ${m.gameVersions?.length?`<div style="font-size:11px;color:var(--t3);margin-bottom:5px"><strong style="color:var(--t2)">Versions:</strong> ${m.gameVersions.slice(0,6).join(', ')}</div>`:''}
    ${m.modLoaders?.length?`<div style="font-size:11px;color:var(--t3)"><strong style="color:var(--t2)">Loaders:</strong> ${m.modLoaders.join(', ')}</div>`:''}
  `, [
    {lbl:'Close', cls:'btn-s', fn: closeM},
    {lbl:'Install', cls:'btn-p', fn: async () => {
      const profId = document.getElementById('mod-prof-sel')?.value;
      if (!profId) { notify('Select a profile first','err'); return; }
      closeM();
      notify(`Installing ${m.name}...`, 'inf');
      try { await API.installMod(profId, m.id, m.source, ''); notify(`${m.name} installed`,'ok'); }
      catch(e) { notify(e.message,'err'); }
    }},
  ]);
}

async function searchPacks() {
  const q   = document.getElementById('pack-q')?.value||'';
  const src = S.packSrc;
  const g   = document.getElementById('pgrid2');
  g.innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="spin spin-lg"></div></div>`;
  try {
    const res = await API.searchModpack(q, src, '', 0);
    const items = res?.items||[];
    if (!items.length) { g.innerHTML=`<div class="empty" style="grid-column:1/-1">${I('package')}<div class="empty-t">No modpacks found</div></div>`; return; }
    g.innerHTML = '';
    items.forEach(m => {
      const el = modCardEl(m);
      el.querySelector('.mibtn').onclick = e => { e.stopPropagation(); packInstallModal(m, src); };
      g.appendChild(el);
    });
  } catch(e) { g.innerHTML=`<div class="empty" style="grid-column:1/-1"><div class="empty-t">Error: ${esc(e.message)}</div></div>`; }
}

function packInstallModal(pack, src) {
  openM('Install Modpack', `
    <p style="font-size:12px;color:var(--t2);margin-bottom:13px;line-height:1.6">
      A new profile will be created with all mods automatically installed.
    </p>
    <div class="fg">
      <label class="fl">Profile Name</label>
      <input type="text" class="fi" id="fpn" value="${esc(pack.name)}">
    </div>
  `, [
    {lbl:'Cancel', cls:'btn-s', fn: closeM},
    {lbl:'Install', cls:'btn-p', fn: async () => {
      const name = document.getElementById('fpn')?.value?.trim()||pack.name;
      closeM(); notify(`Installing "${name}"...`, 'inf');
      try {
        await API.installModpack(pack.id, '', src, name);
        S.profiles = await API.getProfiles(); refresh(); notify(`"${name}" installed`,'ok');
      } catch(e) { notify(e.message,'err'); }
    }},
  ]);
}

async function loadInstalled() {
  const profId = document.getElementById('mod-prof-sel')?.value||S.activeId;
  const list   = document.getElementById('ilist');
  if (!list) return;
  if (!profId) { list.innerHTML=`<div class="empty"><div class="empty-t">Select a profile</div></div>`; return; }
  list.innerHTML = `<div style="display:flex;justify-content:center;padding:24px"><div class="spin"></div></div>`;
  try {
    const mods = await API.getProfileMods(profId)||[];
    if (!mods.length) {
      list.innerHTML=`<div class="empty">${I('puzzle')}<div class="empty-t">No mods installed</div><div class="empty-d">Browse mods and install them here</div></div>`;
      return;
    }
    list.innerHTML = mods.map(m => `
      <div class="imi">
        <div class="imi-ico">
          ${m.iconUrl?`<img src="${m.iconUrl}" style="width:100%;height:100%;object-fit:cover">`:'🧩'}
        </div>
        <div class="imi-inf">
          <div class="imi-name">${esc(m.name||m.fileName)}</div>
          <div class="imi-ver">${m.version||m.fileName} · ${fmtB(m.fileSize||0)}</div>
        </div>
        <div class="tsw ${m.enabled?'on':''}" data-f="${m.fileName}"></div>
        <button class="iBtn" style="color:var(--err)" data-f="${m.fileName}">${I('trash')}</button>
      </div>
    `).join('');
    list.querySelectorAll('.tsw').forEach(sw => {
      sw.onclick = async () => {
        const on = sw.classList.toggle('on');
        try { await API.toggleMod(profId, sw.dataset.f, on); }
        catch(e) { sw.classList.toggle('on'); notify(e.message,'err'); }
      };
    });
    list.querySelectorAll('.iBtn[data-f]').forEach(btn => {
      btn.onclick = () => API.uninstallMod(profId, btn.dataset.f)
        .then(() => { loadInstalled(); notify('Mod removed','inf'); })
        .catch(e => notify(e.message,'err'));
    });
  } catch(e) {
    list.innerHTML=`<div class="empty"><div class="empty-t">Error</div><div class="empty-d">${esc(e.message)}</div></div>`;
  }
}

// ─── VERSIONS ────────────────────────────────────────────
async function loadVersions() {
  const list = document.getElementById('vlist');
  if (!list) return;
  list.innerHTML = `<div style="display:flex;justify-content:center;padding:48px"><div class="spin spin-lg"></div></div>`;
  try {
    const [vers, inst] = await Promise.all([
      API.getVersionList(),
      API.getInstalledVersions().then(v => new Set(v||[]))
    ]);
    S.versions = vers; S.installedVers = inst;
    renderVList();
  } catch(e) {
    list.innerHTML=`<div class="empty"><div class="empty-t">Failed to load</div><div class="empty-d">${esc(e.message)}</div></div>`;
  }
}

function renderVList() {
  const list = document.getElementById('vlist');
  if (!list||!S.versions) return;
  const sr = document.getElementById('vr')?.checked;
  const ss = document.getElementById('vs')?.checked;
  const so = document.getElementById('vo')?.checked;

  const filtered = S.versions.versions.filter(v => {
    if (v.type==='release') return sr;
    if (v.type==='snapshot') return ss;
    return so;
  });

  list.innerHTML = filtered.map(v => {
    const inst = S.installedVers.has(v.id);
    return `<div class="vi" id="vr-${v.id}">
      <div class="vdot ${inst?'ok':''}"></div>
      <span class="vid">${v.id}</span>
      <span class="vtype ${v.type}">${v.type}</span>
      <span class="vdate">${new Date(v.releaseTime).toLocaleDateString()}</span>
      ${inst
        ? `<span style="font-size:11px;color:var(--ok);display:flex;align-items:center;gap:3px">${I('check')} Installed</span>`
        : `<div class="vpbar" id="vpb-${v.id}" style="display:none"><div class="vpfill" id="vpf-${v.id}"></div></div>
           <button class="btn btn-s btn-sm" onclick="instVer('${v.id}')">${I('download')} Install</button>`
      }
    </div>`;
  }).join('');
}

window.instVer = async function(id) {
  const row = document.getElementById(`vr-${id}`);
  const bar = document.getElementById(`vpb-${id}`);
  const btn = row?.querySelector('button');
  if (bar) bar.style.display='block';
  if (btn) { btn.innerHTML=`<div class="spin" style="width:12px;height:12px;border-width:1.5px"></div>`; btn.disabled=true; }
  notify(`Installing ${id}...`, 'inf');
  try {
    await API.installVersion(id);
    S.installedVers.add(id);
    renderVList();
    notify(`${id} installed`, 'ok');
  } catch(e) {
    if (btn) { btn.innerHTML=`${I('download')} Install`; btn.disabled=false; }
    if (bar) bar.style.display='none';
    notify(e.message||'Install failed', 'err');
  }
};

// ─── DOWNLOADS ───────────────────────────────────────────
function dlProgress(t) {
  const list = document.getElementById('dl-list');
  if (!list) return;
  if (list.querySelector('.empty')) list.innerHTML='';
  let el = document.getElementById(`dl-${t.id}`);
  if (!el) { el=document.createElement('div'); el.id=`dl-${t.id}`; el.className='dl-item'; list.prepend(el); }
  el.innerHTML = `
    <div class="dl-name"><span>${esc(t.name)}</span><span class="dl-spd">${t.speed>0?fmtB(t.speed)+'/s':''}</span></div>
    <div class="pbar"><div class="pfill" style="width:${t.progress||0}%"></div></div>
    <div class="dl-meta"><span>${t.status}</span><span>${Math.round(t.progress||0)}%${t.totalBytes>0?' · '+fmtB(t.doneBytes||0)+'/'+fmtB(t.totalBytes):''}</span></div>
  `;
}

// ─── SETTINGS ────────────────────────────────────────────
function setSecTab(sec) {
  document.querySelectorAll('[data-sec]').forEach(i => i.classList.toggle('on', i.dataset.sec===sec));
  const c = document.getElementById('scon');
  if (!c) return;
  if (sec==='general') c.innerHTML = secGeneral();
  else if (sec==='java') c.innerHTML = secJava();
  else if (sec==='accounts') { c.innerHTML = secAccts(); renderAcctList(); }
  else if (sec==='about') c.innerHTML = secAbout();
  if (sec==='accounts') {
    document.getElementById('ms-btn')?.addEventListener('click', doMsLogin);
    document.getElementById('off-btn')?.addEventListener('click', showOfflineM);
  }
}

function secGeneral() {
  return `<div class="ssect"><div class="ssect-t">Behaviour</div>
    <div class="srow"><div class="srow-info"><div class="srow-label">Close game with launcher</div><div class="srow-desc">Kill Minecraft when QMCL closes</div></div><div class="tsw"></div></div>
    <div class="srow"><div class="srow-info"><div class="srow-label">Show console on launch</div><div class="srow-desc">Display game output automatically</div></div><div class="tsw on"></div></div>
  </div>`;
}

function secJava() {
  return `<div class="ssect"><div class="ssect-t">Java Executable</div>
    <div class="srow" style="flex-direction:column;align-items:flex-start;gap:8px">
      <div class="srow-info"><div class="srow-label">Java Path</div><div class="srow-desc">Leave empty to auto-detect</div></div>
      <div style="display:flex;gap:8px;width:100%">
        <input type="text" class="fi" placeholder="Auto-detect..." style="flex:1">
        <button class="btn btn-s btn-sm" id="det-java">${I('search')} Detect</button>
      </div>
    </div>
  </div>`;
}

function secAccts() {
  return `<div class="ssect">
    <div class="ssect-t" style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <span>Accounts</span>
      <div style="display:flex;gap:6px">
        <button class="btn btn-s btn-sm" id="ms-btn">${I('log-in')} Microsoft</button>
        <button class="btn btn-s btn-sm" id="off-btn">${I('user')} Offline</button>
      </div>
    </div>
    <div id="acct-list"></div>
  </div>`;
}

async function renderAcctList() {
  const el = document.getElementById('acct-list');
  if (!el) return;
  const accounts = await API.getAllAccounts()||[];
  if (!accounts.length) {
    el.innerHTML=`<div class="empty">${I('user')}<div class="empty-t">No accounts</div><div class="empty-d">Add Microsoft or offline account</div></div>`;
    return;
  }
  el.innerHTML = accounts.map(a => `
    <div class="srow">
      <div style="width:34px;height:34px;border-radius:8px;background:linear-gradient(135deg,var(--a),var(--a3));
        display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;flex-shrink:0">
        ${a.username?.[0]?.toUpperCase()||'?'}
      </div>
      <div class="srow-info">
        <div class="srow-label">${esc(a.username)}</div>
        <div class="srow-desc">${a.type==='microsoft'?'🔷 Microsoft':'👤 Offline'}${S.account?.uuid===a.uuid?' · Active':''}</div>
      </div>
      ${S.account?.uuid!==a.uuid
        ? `<button class="btn btn-s btn-sm" onclick="swAcct('${a.uuid}')">Use</button>`
        : `<span style="font-size:11px;color:var(--ok);display:flex;align-items:center;gap:3px">${I('check')} Active</span>`}
      <button class="btn btn-g btn-sm" style="color:var(--err)" onclick="rmAcct('${a.uuid}')">${I('trash')}</button>
    </div>
  `).join('');
}

window.swAcct = async function(uuid) {
  await API.switchAccount(uuid);
  S.account = (await API.getAllAccounts()).find(a=>a.uuid===uuid)||null;
  syncAcct(); renderAcctList(); notify('Account switched','inf');
};
window.rmAcct = async function(uuid) {
  await API.removeAccount(uuid);
  S.account = (await API.getAllAccounts())[0]||null;
  syncAcct(); renderAcctList(); notify('Account removed','inf');
};

function secAbout() {
  return `<div style="display:flex;flex-direction:column;align-items:center;padding:40px;text-align:center;gap:14px">
    <div style="width:70px;height:70px;background:linear-gradient(135deg,var(--a),var(--a3));border-radius:18px;
      display:flex;align-items:center;justify-content:center;font-size:32px;box-shadow:0 0 40px var(--ag)">⚡</div>
    <div><div style="font-size:24px;font-weight:900;margin-bottom:4px">QMCL</div>
    <div style="font-size:12px;color:var(--t2)">Quantum Minecraft Launcher</div></div>
    <div style="font-size:11px;color:var(--t3)">Version 1.0.0</div>
    <div class="divider" style="width:100%"></div>
    <div style="font-size:12px;color:var(--t3);line-height:1.9">
      Golang + Wails · ArchLinux &amp; Windows<br>
      Modrinth &amp; CurseForge · Fabric · Forge · NeoForge · Quilt
    </div>
  </div>`;
}

// ─── LOGIN ────────────────────────────────────────────────
function loginModal() {
  openM('Sign In to Play', `
    <button class="btn btn-p" id="ms-login-btn" style="width:100%;justify-content:center;margin-bottom:12px">
      ${I('log-in')} Sign in with Microsoft
    </button>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
      <div class="divider" style="flex:1"></div><span style="font-size:11px;color:var(--t3)">or</span><div class="divider" style="flex:1"></div>
    </div>
    <div class="fg">
      <label class="fl">Offline Username</label>
      <input type="text" class="fi" id="off-u" placeholder="Username" maxlength="16">
    </div>
    <button class="btn btn-s" id="off-login-btn" style="width:100%;justify-content:center">
      ${I('user')} Play Offline
    </button>
  `, []);
  document.getElementById('ms-login-btn').onclick = doMsLogin;
  document.getElementById('off-login-btn').onclick = () => {
    const u = document.getElementById('off-u')?.value?.trim();
    if (!u) { notify('Enter username','err'); return; }
    doOfflineLogin(u);
  };
  document.getElementById('off-u').onkeydown = e => { if(e.key==='Enter') document.getElementById('off-login-btn').click(); };
}

function showOfflineM() {
  openM('Add Offline Account', `
    <div class="fg"><label class="fl">Username</label>
    <input type="text" class="fi" id="off-u2" placeholder="Username" maxlength="16"></div>
  `, [
    {lbl:'Cancel', cls:'btn-s', fn: closeM},
    {lbl:'Add', cls:'btn-p', fn: () => {
      const u = document.getElementById('off-u2')?.value?.trim();
      if (!u) { notify('Enter username','err'); return; }
      doOfflineLogin(u);
    }},
  ]);
}

async function doMsLogin() {
  closeM();

  // Show "waiting for browser" modal
  openM('Sign in with Microsoft', `
    <div style="text-align:center;padding:10px 0">
      <div style="font-size:13px;color:var(--t2);margin-bottom:20px;line-height:1.7">
        A browser window will open automatically.<br>
        Sign in with your Microsoft account there.
      </div>
      <div style="display:flex;align-items:center;justify-content:center;gap:10px;
        background:var(--ag2);border:1px solid var(--bda);border-radius:var(--r2);
        padding:14px 20px;margin-bottom:16px">
        <div class="spin"></div>
        <span id="ms-wait-msg" style="font-size:13px;color:var(--a2)">Opening browser...</span>
      </div>
      <div style="font-size:11px;color:var(--t3)">
        Browser didn't open? The login will continue automatically once you sign in.
      </div>
    </div>
  `, [
    {lbl:'Cancel', cls:'btn-s', fn: closeM},
  ]);

  // Listen for success event
  const unsubSuccess = onEvent('auth:success', (d) => {
    unsubSuccess && unsubSuccess();
    document.getElementById('ms-wait-msg').textContent = `✅ Signed in as ${d.username}!`;
    setTimeout(() => {
      closeM();
      notify(`Signed in as ${d.username}`, 'ok');
    }, 1000);
  });

  try {
    S.account = await API.loginMicrosoft();
    syncAcct();
    renderAcctList();
    closeM();
    notify(`Signed in as ${S.account.username}`, 'ok');
  } catch(e) {
    closeM();
    notify(e.message || 'Login failed', 'err');
  }
}

async function doOfflineLogin(username) {
  closeM();
  try {
    S.account = await API.loginOffline(username);
    syncAcct(); notify(`Playing as ${username}`,'ok');
  } catch(e) { notify(e.message||'Failed','err'); }
}

// ─── MODAL ───────────────────────────────────────────────
function openM(title, body, btns=[]) {
  document.getElementById('m-title').textContent = title;
  document.getElementById('m-body').innerHTML = body;
  const f = document.getElementById('m-foot');
  f.innerHTML = btns.map((b,i) => `<button class="btn ${b.cls}" id="mb${i}">${b.lbl}</button>`).join('');
  btns.forEach((b,i) => document.getElementById(`mb${i}`).onclick = b.fn);
  document.getElementById('movl').classList.add('open');
}
function closeM() { document.getElementById('movl').classList.remove('open'); }

// ─── NOTIFICATIONS ───────────────────────────────────────
function notify(msg, type='inf') {
  const s = document.getElementById('nstack');
  const el = document.createElement('div');
  el.className = `ntf ${type}`;
  const ic = {ok:I('check'), err:I('x'), inf:I('info')};
  el.innerHTML = `${ic[type]||''}<span>${esc(msg)}</span>`;
  s.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ─── UTILS ───────────────────────────────────────────────
function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function cap(s) { return s ? s[0].toUpperCase()+s.slice(1) : ''; }
function ca(hex, a) {
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}
function fmtPt(s) {
  if (!s) return '0h';
  const h=Math.floor(s/3600), m=Math.floor((s%3600)/60);
  return h>0?`${h}h ${m}m`:`${m}m`;
}
function fmtN(n) {
  if (!n) return '0';
  if (n>=1e6) return (n/1e6).toFixed(1)+'M';
  if (n>=1e3) return (n/1e3).toFixed(0)+'K';
  return String(n);
}
function fmtB(b) {
  if (!b) return '0B';
  if (b>=1073741824) return (b/1073741824).toFixed(1)+'GB';
  if (b>=1048576) return (b/1048576).toFixed(1)+'MB';
  if (b>=1024) return (b/1024).toFixed(0)+'KB';
  return b+'B';
}

boot();
