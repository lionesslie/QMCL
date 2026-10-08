import './style.css';
import { API, onEvent } from './wails.js';
import { iconStr } from './icons.js';

const I = (n, cls='') => iconStr(n, cls);

// ── State ──────────────────────────────────────────────────
const S = {
  page:'home', profiles:[], activeId:null, account:null,
  versions:null, installedVers:new Set(),
  modTab:'browse', modSrc:'modrinth', modResults:[],
  modPage:0, modLoading:false, modHasMore:true,
  packSrc:'modrinth', running:new Set(),
  sidebarWide:false, slideIdx:0,
};

// ── Boot ───────────────────────────────────────────────────
async function boot() {
  buildShell();
  buildBG();
  bindAll();
  const [profiles, account, active] = await Promise.all([
    API.getProfiles(), API.getCurrentAccount(), API.getActiveProfile()
  ]).catch(() => [[], null, null]);
  S.profiles = profiles || [];
  S.account  = account;
  S.activeId = active?.id || S.profiles[0]?.id || null;
  syncAcct();
  nav('home');
  autoCarousel();
}

// ── Background particles ───────────────────────────────────
function buildBG() {
  const pc = document.getElementById('particles');
  for (let i = 0; i < 28; i++) {
    const p = document.createElement('div');
    p.className = 'pt';
    p.style.cssText = `left:${Math.random()*100}%;animation-duration:${9+Math.random()*14}s;animation-delay:${-Math.random()*25}s;--dx:${(Math.random()-.5)*80}px`;
    pc.appendChild(p);
  }
}

// ── Profile icon mapping ───────────────────────────────────
// Maps profile icon field → Lucide icon name + accent color class
const PROFILE_ICONS = {
  grass:'grass', fire:'flame', snow:'snowflake', rocket:'rocket',
  star:'star', zap:'zap', boxes:'boxes', sparkles:'sparkles',
  sword:'sword', default:'layers'
};
function profileIconName(p) {
  return PROFILE_ICONS[p?.icon] || 'layers';
}

// Profile color → gradient bg style
function profileThumb(p) {
  const c = p.color || '#6C63FF';
  return `background:linear-gradient(135deg,${ca(c,.28)},${ca(c,.08)})`;
}

// ── Shell ──────────────────────────────────────────────────
function buildShell() {
  document.getElementById('app').innerHTML = `
    <div class="bg-root">
      <div class="blob blob1"></div><div class="blob blob2"></div><div class="blob blob3"></div>
    </div>
    <div class="particles" id="particles"></div>

    <!-- TITLEBAR -->
    <div class="tbar">
      <div class="tbar-logo">
        <div class="logo-gem">${I('zap')}</div>
        QMCL
      </div>
      <div class="tbar-mid">
        <div class="active-ver-pill" id="ver-pill" onclick="nav('versions')">
          <div class="ver-dot"></div>
          <span id="ver-pill-txt">Select a profile</span>
          <span class="ver-pill-arrow">${I('chevron-down')}</span>
        </div>
      </div>
      <div class="tbar-right">
        <button class="tbar-action" id="tb-notif" title="Notifications">${I('bell')}</button>
        <button class="tbar-action" id="tb-acct"  title="Account">${I('user')}</button>
        <button class="tbar-action" id="tb-cfg"   title="Settings">${I('settings')}</button>
        <div class="tbar-sep"></div>
        <button class="tbar-btn" id="tb-min">${I('minus')}</button>
        <button class="tbar-btn" id="tb-max">${I('maximize2')}</button>
        <button class="tbar-btn close" id="tb-cls">${I('x')}</button>
      </div>
    </div>

    <!-- MAIN -->
    <div class="main-wrap">
      <nav class="sidebar" id="sidebar">
        <button class="nav-btn on" data-p="home">
          <span class="nav-ico">${I('home')}</span>
          <span class="nav-lbl">Home</span>
        </button>
        <button class="nav-btn" data-p="versions">
          <span class="nav-ico">${I('layers')}</span>
          <span class="nav-lbl">Profiles</span>
        </button>
        <button class="nav-btn" data-p="store">
          <span class="nav-ico">${I('puzzle')}</span>
          <span class="nav-lbl">Mods</span>
        </button>
        <button class="nav-btn" data-p="skin">
          <span class="nav-ico">${I('palette')}</span>
          <span class="nav-lbl">Skin</span>
        </button>
        <div class="sb-gap"></div>
        <button class="sb-toggle" id="sb-toggle">${I('sidebar')}</button>
      </nav>

      <div class="content">

        <!-- HOME -->
        <div class="page on" id="page-home">
          <div class="home-wrap">
            <div class="home-main">
              <!-- Carousel -->
              <div class="carousel">
                <div class="c-slides" id="c-slides">
                  <div class="c-slide cs1">
                    <div class="c-content">
                      <div class="c-tag">${I('sparkles')} New Update</div>
                      <div class="c-title">Minecraft 1.21.4 — The Garden Awakens</div>
                      <div class="c-sub">New biomes, mobs and block variants now available</div>
                    </div>
                  </div>
                  <div class="c-slide cs2">
                    <div class="c-content">
                      <div class="c-tag">${I('boxes')} Mod Spotlight</div>
                      <div class="c-title">Create Mod 0.5.1 for Fabric Released</div>
                      <div class="c-sub">Full 1.21 compatibility with new automation features</div>
                    </div>
                  </div>
                  <div class="c-slide cs3">
                    <div class="c-content">
                      <div class="c-tag">${I('globe')} Community</div>
                      <div class="c-title">Top 10 Shader Packs for 2025</div>
                      <div class="c-sub">Curated selection of the best visual upgrades</div>
                    </div>
                  </div>
                </div>
                <div class="c-dots" id="c-dots">
                  <div class="cdot on" onclick="goSlide(0)"></div>
                  <div class="cdot" onclick="goSlide(1)"></div>
                  <div class="cdot" onclick="goSlide(2)"></div>
                </div>
              </div>

              <!-- 2-col grid -->
              <div class="home-grid">
                <div class="glass-card" id="sel-card">
                  <div class="empty">
                    <div class="empty-ico">${I('layers')}</div>
                    <div class="empty-t">No profile selected</div>
                    <div class="empty-d">Pick or create a profile to get started</div>
                    <button class="btn btn-p btn-sm" onclick="newProfileModal()">
                      ${I('plus')} New Profile
                    </button>
                  </div>
                </div>
                <div class="glass-card">
                  <div class="gc-title">${I('clock')} Recent Profiles</div>
                  <div id="recent-list">
                    <div class="empty" style="padding:20px">
                      <div class="empty-ico">${I('clock')}</div>
                      <div class="empty-t">No recent profiles</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Version install progress (hidden by default) -->
              <div id="ver-install-box" style="display:none;background:rgba(108,99,255,.08);border:1px solid rgba(108,99,255,.2);border-radius:var(--r2);padding:14px 16px">
                <div style="font-size:12px;color:var(--a1);display:flex;align-items:center;gap:8px;margin-bottom:8px">
                  <div class="spin" style="width:14px;height:14px;border-width:2px"></div>
                  <span id="ver-inst-title">Installing Minecraft...</span>
                </div>
                <div style="font-size:11px;color:var(--t2);margin-bottom:7px" id="ver-inst-msg"></div>
                <div style="height:5px;background:var(--bg3);border-radius:3px;overflow:hidden">
                  <div style="height:100%;background:linear-gradient(90deg,var(--a1),var(--a3));border-radius:3px;transition:width .3s" id="ver-inst-bar"></div>
                </div>
              </div>
            </div>

            <!-- Profile rail -->
            <div class="home-rail">
              <div class="rail-hd">
                ${I('layers')} Profiles
              </div>
              <div class="rail-list" id="rail-list"></div>
              <button class="rail-add" onclick="newProfileModal()">
                ${I('plus')} New Profile
              </button>
            </div>
          </div>

          <!-- Console -->
          <div class="console" id="console">
            <div class="con-bar">
              <div class="con-dot"></div>
              ${I('terminal')}
              <span id="con-lbl" style="margin-left:4px">Console</span>
              <button class="iBtn" id="con-close" style="margin-left:auto;width:20px;height:20px;padding:3px">${I('x')}</button>
            </div>
            <div class="con-out" id="con-out"></div>
          </div>
        </div>

        <!-- PROFILES / VERSIONS -->
        <div class="page" id="page-versions">
          <div class="vp-wrap">
            <div class="vp-top">
              <div class="vp-title">Profiles</div>
              <div class="pills" id="ver-pills">
                <div class="pill on" data-f="all">All</div>
                <div class="pill" data-f="vanilla">Vanilla</div>
                <div class="pill" data-f="fabric">Fabric</div>
                <div class="pill" data-f="forge">Forge</div>
                <div class="pill" data-f="neoforge">NeoForge</div>
              </div>
              <div class="search-box">
                <span class="search-ico">${I('search')}</span>
                <input type="text" id="ver-q" placeholder="Search profiles...">
                <button class="btn btn-p btn-sm" onclick="newProfileModal()">
                  ${I('plus')} New
                </button>
              </div>
            </div>
            <div class="vgrid" id="vgrid"></div>
          </div>
        </div>

        <!-- MODS / STORE -->
        <div class="page" id="page-store">
          <div class="sp-wrap">
            <div class="sp-top">
              <div class="sp-title">Mods &amp; Marketplace</div>
              <div class="cat-row" id="store-cats">
                <div class="cat-btn on" data-mt="browse">${I('search')} Browse</div>
                <div class="cat-btn" data-mt="installed">${I('hdd')} Installed</div>
                <div class="cat-btn" data-mt="modpacks">${I('boxes')} Modpacks</div>
              </div>
              <div style="display:flex;gap:8px;align-items:center">
                <div class="search-box" style="flex:1">
                  <span class="search-ico">${I('search')}</span>
                  <input type="text" id="mod-q" placeholder="Search mods...">
                </div>
                <div style="display:flex;gap:4px">
                  <div class="pill on" data-src="modrinth" style="font-size:11px">Modrinth</div>
                  <div class="pill" data-src="curseforge" style="font-size:11px">CurseForge</div>
                </div>
                <select class="fi" id="mod-prof-sel" style="width:150px">
                  <option value="">Profile...</option>
                </select>
              </div>
            </div>
            <div id="mt-browse" style="display:flex;flex-direction:column;flex:1;overflow:hidden">
              <div class="sgrid" id="mod-grid"></div>
            </div>
            <div id="mt-installed" style="display:none;flex-direction:column;flex:1;overflow:hidden">
              <div style="padding:8px 14px;border-bottom:1px solid var(--bd)">
                <div class="search-box">${I('search')}<input type="text" id="ins-q" placeholder="Filter installed..."></div>
              </div>
              <div style="overflow-y:auto;flex:1;padding:8px" id="ins-list"></div>
            </div>
            <div id="mt-modpacks" style="display:none;flex-direction:column;flex:1;overflow:hidden">
              <div class="sgrid" id="pack-grid"></div>
            </div>
          </div>
        </div>

        <!-- SKIN -->
        <div class="page" id="page-skin">
          <div class="skin-wrap">
            <div class="skin-main">
              <div class="skin-scene" id="skin-scene">
                <div class="skin-float">
                  <div class="skin-body" id="skin-char">
                    <!-- Minecraft-style character placeholder -->
                    <div class="mc-char">
                      <div class="mc-head"></div>
                      <div class="mc-body"></div>
                      <div class="mc-arms">
                        <div class="mc-arm left"></div>
                        <div class="mc-arm right"></div>
                      </div>
                      <div class="mc-legs">
                        <div class="mc-leg left"></div>
                        <div class="mc-leg right"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="skin-glow"></div>
              </div>
              <div class="skin-hint">${I('refresh-cw')} Drag to rotate</div>
            </div>
            <div class="skin-side">
              <div>
                <div class="sk-sec">${I('image')} My Skins</div>
                <div class="skin-gal" id="skin-gal">
                  ${['Steve','Alex','Ninja','Hero','Villager','Enderman'].map((n,i) =>
                    `<div class="sg-item ${i===0?'on':''}" onclick="pickSkin(this,'${n}')" data-skin="${n}">
                      <div class="sg-thumb sg-${i}"></div>
                      <span class="sg-label">${n}</span>
                    </div>`
                  ).join('')}
                </div>
              </div>
              <div>
                <div class="sk-sec">${I('upload')} Upload Skin</div>
                <div class="skin-drop" onclick="notify('File picker opened','inf')">
                  <div class="skin-drop-icon">${I('upload')}</div>
                  <div class="skin-drop-text">Drop PNG here or click to browse<br>
                    <span style="color:var(--t3);font-size:10px">64×64 or 128×128 pixels</span>
                  </div>
                </div>
              </div>
              <div>
                <div class="sk-sec">${I('sparkles')} Cape</div>
                <div class="skin-gal">
                  <div class="sg-item on" onclick="pickCape(this,'none')">
                    <div class="sg-thumb" style="display:flex;align-items:center;justify-content:center;color:var(--t3)">${I('x')}</div>
                    <span class="sg-label">None</span>
                  </div>
                  <div class="sg-item" onclick="pickCape(this,'optifine')">
                    <div class="sg-thumb cape-1"></div>
                    <span class="sg-label">OptiFine</span>
                  </div>
                  <div class="sg-item" onclick="pickCape(this,'minecon')">
                    <div class="sg-thumb cape-2"></div>
                    <span class="sg-label">Minecon</span>
                  </div>
                  <div class="sg-item" onclick="pickCape(this,'custom')">
                    <div class="sg-thumb cape-3"></div>
                    <span class="sg-label">Custom</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- BOTTOM BAR -->
    <div class="botbar">
      <div class="bb-acct" id="bb-acct">
        <div class="bb-av" id="bb-av">${I('user')}</div>
        <div>
          <div class="bb-name" id="bb-name">Not signed in</div>
          <div class="bb-type" id="bb-type">Click to add account</div>
        </div>
      </div>
      <div class="bb-mid">
        <button class="play-btn" id="play-btn" onclick="onPlay()">
          <span class="play-ico">${I('play')}</span>
          <span class="play-txt">LAUNCH</span>
        </button>
      </div>
      <div class="bb-right">
        <div id="prog-wrap" style="display:none">
          <div class="prog-lbl">
            <span id="prog-lbl">Installing...</span>
            <span id="prog-pct">0%</span>
          </div>
          <div class="pbar"><div class="pfill" id="pfill"></div></div>
        </div>
      </div>
    </div>

    <!-- ACCOUNT OVERLAY -->
    <div class="overlay" id="ov-acct" onclick="closeOv('acct')">
      <div class="panel" onclick="event.stopPropagation()">
        <div class="panel-hd">
          <div class="panel-title">${I('users')} Accounts</div>
          <button class="panel-x" onclick="closeOv('acct')">${I('x')}</button>
        </div>
        <div class="panel-body" id="acct-panel-body"></div>
      </div>
    </div>

    <!-- SETTINGS OVERLAY -->
    <div class="overlay" id="ov-cfg" onclick="closeOv('cfg')">
      <div class="panel wide" onclick="event.stopPropagation()">
        <div class="panel-hd">
          <div class="panel-title">${I('settings')} Settings</div>
          <button class="panel-x" onclick="closeOv('cfg')">${I('x')}</button>
        </div>
        <div class="settings-wrap">
          <div class="s-nav">
            <button class="sn-btn on" onclick="setSnav(this,'s-general')">${I('settings')} General</button>
            <button class="sn-btn" onclick="setSnav(this,'s-java')">${I('cpu')} Java &amp; RAM</button>
            <button class="sn-btn" onclick="setSnav(this,'s-look')">${I('palette')} Appearance</button>
            <button class="sn-btn" onclick="setSnav(this,'s-about')">${I('info')} About</button>
          </div>
          <div class="s-body">
            <div id="s-general">
              <div class="ss-sect"><div class="ss-title">Launch</div>
                <div class="s-row"><div class="sr-info"><div class="srl">Hide launcher on launch</div><div class="srd">Minimize when Minecraft starts</div></div><div class="toggle on" onclick="this.classList.toggle('on')"></div></div>
                <div class="s-row"><div class="sr-info"><div class="srl">Show game console</div><div class="srd">Display JVM output log</div></div><div class="toggle on" onclick="this.classList.toggle('on')"></div></div>
                <div class="s-row"><div class="sr-info"><div class="srl">Auto-update QMCL</div><div class="srd">Download launcher updates automatically</div></div><div class="toggle" onclick="this.classList.toggle('on')"></div></div>
              </div>
            </div>
            <div id="s-java" style="display:none">
              <div class="ss-sect"><div class="ss-title">Memory</div>
                <div class="s-row" style="flex-direction:column;align-items:flex-start;gap:8px">
                  <div class="sr-info"><div class="srl">Max RAM</div><div class="srd">Default for new profiles</div></div>
                  <div style="display:flex;align-items:center;gap:12px;width:100%">
                    <input type="range" min="1" max="32" value="8" step="1" style="flex:1" oninput="document.getElementById('ram-v').textContent=this.value+'GB'">
                    <span class="ram-val" id="ram-v">8GB</span>
                  </div>
                </div>
              </div>
              <div class="ss-sect"><div class="ss-title">Java</div>
                <div class="s-row"><div class="sr-info"><div class="srl">Auto-detect Java</div><div class="srd">Find from PATH and common install locations</div></div><div class="toggle on" onclick="this.classList.toggle('on')"></div></div>
                <div class="s-row" style="flex-direction:column;align-items:flex-start;gap:8px">
                  <div class="srl">Custom Java Path</div>
                  <div style="display:flex;gap:7px;width:100%">
                    <input type="text" class="fi" placeholder="/usr/bin/java" style="flex:1" id="java-path-in">
                    <button class="btn btn-s btn-sm" onclick="detectJava()">${I('search')} Detect</button>
                  </div>
                </div>
              </div>
            </div>
            <div id="s-look" style="display:none">
              <div class="ss-sect"><div class="ss-title">Visual Effects</div>
                <div class="s-row"><div class="sr-info"><div class="srl">Background particles</div><div class="srd">Floating particle animation</div></div><div class="toggle on" onclick="this.classList.toggle('on')"></div></div>
                <div class="s-row"><div class="sr-info"><div class="srl">Gradient blobs</div><div class="srd">Animated background gradients</div></div><div class="toggle on" onclick="this.classList.toggle('on')"></div></div>
                <div class="s-row"><div class="sr-info"><div class="srl">Glass blur effects</div><div class="srd">Backdrop blur on panels and cards</div></div><div class="toggle on" onclick="this.classList.toggle('on')"></div></div>
              </div>
            </div>
            <div id="s-about" style="display:none">
              <div style="text-align:center;padding:32px 0">
                <div class="about-logo">${I('zap')}</div>
                <div style="font-size:24px;font-weight:900;margin-bottom:4px">QMCL</div>
                <div style="font-size:13px;color:var(--t2)">Quantum Minecraft Launcher</div>
                <div style="font-size:12px;color:var(--t3);margin-top:4px">Version 1.0.0</div>
                <div class="divider" style="margin:18px 0"></div>
                <div style="font-size:12px;color:var(--t3);line-height:2">
                  Built with Golang + Wails<br>
                  ArchLinux &amp; Windows native support<br>
                  Modrinth · CurseForge · Fabric · Forge · NeoForge
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL -->
    <div class="modal-overlay" id="modal-ov">
      <div class="modal">
        <div class="modal-hd">
          <span class="modal-title" id="m-title"></span>
          <button class="modal-x" id="m-x">${I('x')}</button>
        </div>
        <div class="modal-body" id="m-body"></div>
        <div class="modal-foot" id="m-foot"></div>
      </div>
    </div>

    <div class="nstack" id="nstack"></div>
  `;
}

// ── Bind ───────────────────────────────────────────────────
function bindAll() {
  document.getElementById('tb-min').onclick   = () => API.minimize();
  document.getElementById('tb-max').onclick   = () => API.maximize();
  document.getElementById('tb-cls').onclick   = () => API.close();
  document.getElementById('tb-notif').onclick = () => notify('No new notifications','inf');
  document.getElementById('tb-acct').onclick  = () => openOv('acct');
  document.getElementById('tb-cfg').onclick   = () => openOv('cfg');
  document.querySelectorAll('.nav-btn[data-p]').forEach(b => b.onclick = () => nav(b.dataset.p));
  document.getElementById('sb-toggle').onclick = () => {
    S.sidebarWide = !S.sidebarWide;
    document.getElementById('sidebar').classList.toggle('wide', S.sidebarWide);
  };
  document.getElementById('m-x').onclick      = closeModal;
  document.getElementById('modal-ov').onclick = e => { if(e.target===e.currentTarget) closeModal(); };
  document.getElementById('con-close').onclick = () => document.getElementById('console').classList.remove('open');
  document.getElementById('bb-acct').onclick  = () => openOv('acct');
  document.querySelectorAll('[data-mt]').forEach(t => t.onclick = () => switchModTab(t.dataset.mt));
  document.querySelectorAll('[data-src]').forEach(t => t.onclick = () => {
    document.querySelectorAll('[data-src]').forEach(x => x.classList.remove('on'));
    t.classList.add('on'); S.modSrc = t.dataset.src;
  });
  document.getElementById('mod-q').onkeydown = e => { if(e.key==='Enter') searchMods(true); };
  document.getElementById('mod-prof-sel').onchange = () => { if(S.modTab==='installed') loadInstalled(); };
  document.getElementById('ins-q').oninput = e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.ins-row').forEach(r =>
      r.style.display = r.querySelector('.irn')?.textContent?.toLowerCase().includes(q) ? '' : 'none');
  };
  document.querySelectorAll('[data-f]').forEach(p => p.onclick = () => {
    p.closest('.pills').querySelectorAll('.pill').forEach(x => x.classList.remove('on'));
    p.classList.add('on'); renderVGrid();
  });
  document.getElementById('ver-q').oninput = () => renderVGrid();
  bindSkinDrag();
  bindModsScroll();
  onEvent('download:progress',        d => dlProgress(d));
  onEvent('game:started',             d => gameStarted(d));
  onEvent('game:stopped',             d => gameStopped(d));
  onEvent('game:log',                 d => gameLog(d));
  onEvent('version:install:progress', d => verProgress(d));
  onEvent('auth:waiting',             d => notify(d.message,'inf'));
  onEvent('auth:success',             d => { notify(`Signed in as ${d.username}`,'ok'); syncAcctPanel(); });
}

// ── Nav ────────────────────────────────────────────────────
function nav(p) {
  S.page = p;
  document.querySelectorAll('.page').forEach(x => x.classList.remove('on'));
  document.querySelectorAll('.nav-btn[data-p]').forEach(x => x.classList.remove('on'));
  document.getElementById(`page-${p}`)?.classList.add('on');
  document.querySelector(`.nav-btn[data-p="${p}"]`)?.classList.add('on');
  if(p==='home')     { renderRail(); renderSelCard(); renderRecent(); }
  if(p==='versions') { renderVGrid(); }
  if(p==='store')    { syncModProfSel(); switchModTab(S.modTab); }
}

// ── Account ────────────────────────────────────────────────
function syncAcct() {
  const a = S.account;
  const av = document.getElementById('bb-av');
  const nm = document.getElementById('bb-name');
  const tp = document.getElementById('bb-type');
  if(a) {
    av.textContent = a.username?.[0]?.toUpperCase() || '?';
    av.style.fontSize = '14px';
  } else {
    av.innerHTML = I('user');
  }
  if(nm) nm.textContent = a?.username || 'Not signed in';
  if(tp) tp.textContent = a ? (a.type==='microsoft'?'Microsoft Account':'Offline Account') : 'Click to add account';
}

// ── Overlays ───────────────────────────────────────────────
function openOv(name) {
  document.getElementById(`ov-${name}`)?.classList.add('open');
  if(name==='acct') renderAcctPanel();
}
function closeOv(name) { document.getElementById(`ov-${name}`)?.classList.remove('open'); }
function setSnav(el, sec) {
  document.querySelectorAll('.sn-btn').forEach(b => b.classList.remove('on'));
  el.classList.add('on');
  document.querySelectorAll('[id^="s-"]').forEach(s => s.style.display='none');
  document.getElementById(sec).style.display = '';
}
window.setSnav = setSnav;
async function detectJava() {
  try { const p = await API.getJavaPath(); document.getElementById('java-path-in').value = p||''; notify(p?`Java: ${p}`:'Java not found','ok'); }
  catch(e) { notify('Detection failed','err'); }
}
window.detectJava = detectJava;

// ── Carousel ───────────────────────────────────────────────
function goSlide(i) {
  S.slideIdx = i;
  document.getElementById('c-slides').style.transform = `translateX(-${i*100}%)`;
  document.querySelectorAll('.cdot').forEach((d,j) => d.classList.toggle('on', j===i));
}
window.goSlide = goSlide;
function autoCarousel() { setInterval(() => goSlide((S.slideIdx+1)%3), 5500); }

// ── Home ───────────────────────────────────────────────────
function renderRail() {
  const el = document.getElementById('rail-list');
  if(!el) return;
  if(!S.profiles.length) {
    el.innerHTML = `<div style="padding:14px 10px;font-size:11px;color:var(--t3);text-align:center">No profiles yet</div>`;
    return;
  }
  el.innerHTML = S.profiles.map(p => `
    <div class="rail-item ${p.id===S.activeId?'on':''}" data-id="${p.id}">
      <div class="ri-dot" style="${profileThumb(p)};border-color:${ca(p.color||'#6C63FF',.3)}">
        ${I(profileIconName(p))}
      </div>
      <div>
        <div class="ri-pname">${esc(p.name)}</div>
        <div class="ri-pver">${p.gameVersion} · ${cap(p.modLoader||'vanilla')}</div>
      </div>
    </div>
  `).join('');
  el.querySelectorAll('.rail-item').forEach(r => r.onclick = () => pickProfile(r.dataset.id));
}

function renderRecent() {
  const el = document.getElementById('recent-list');
  if(!el||!S.profiles.length) return;
  el.innerHTML = S.profiles.slice(0,5).map(p => `
    <div class="recent-item" data-id="${p.id}">
      <div class="ri-ico" style="${profileThumb(p)}">${I(profileIconName(p))}</div>
      <div>
        <div class="ri-name">${esc(p.name)}</div>
        <div class="ri-ver">${p.gameVersion} · ${cap(p.modLoader||'vanilla')}</div>
      </div>
      <div class="ri-time">${p.totalPlayedSecs>0?fmtPt(p.totalPlayedSecs):'New'}</div>
    </div>
  `).join('');
  el.querySelectorAll('.recent-item').forEach(r => r.onclick = () => pickProfile(r.dataset.id));
}

function renderSelCard() {
  const el = document.getElementById('sel-card');
  if(!el) return;
  const p = S.profiles.find(x => x.id===S.activeId);
  if(!p) {
    el.innerHTML = `<div class="empty">
      <div class="empty-ico">${I('layers')}</div>
      <div class="empty-t">No profile selected</div>
      <div class="empty-d">Pick a profile or create one</div>
      <button class="btn btn-p btn-sm" onclick="newProfileModal()">${I('plus')} New Profile</button>
    </div>`; return;
  }
  const run  = S.running.has(p.id);
  const inst = S.installedVers.has(p.gameVersion);
  const loaderColor = {fabric:'#f9a855',forge:'#e8834a',neoforge:'#c084fc',quilt:'#60a5fa',vanilla:'var(--ok)'};
  const lc = loaderColor[p.modLoader||'vanilla'] || 'var(--ok)';
  el.innerHTML = `
    <div class="gc-title">${I('layers')} Active Profile</div>
    <div class="sel-row">
      <div class="sel-icon" style="${profileThumb(p)};border:1px solid ${ca(p.color||'#6C63FF',.35)}">
        ${I(profileIconName(p))}
      </div>
      <div>
        <div class="sel-name">${esc(p.name)}</div>
        <div class="sel-meta">${p.description||'Minecraft '+p.gameVersion}</div>
      </div>
    </div>
    <div class="sel-badges">
      <span class="bdg bdg-ver">${I('package')} ${p.gameVersion}</span>
      <span class="bdg" style="background:${ca(lc.startsWith('var')?'#4ade80':lc,.15)};color:${lc};border-color:${ca(lc.startsWith('var')?'#4ade80':lc,.25)}">${cap(p.modLoader||'vanilla')}</span>
      ${inst
        ? `<span class="bdg bdg-ok">${I('check')} Ready</span>`
        : `<span class="bdg bdg-warn">${I('cloud-dl')} Not installed</span>`}
    </div>
    <div class="stats-grid">
      <div class="stat-box"><div class="sb-v">${p.maxMemoryMB||2048}MB</div><div class="sb-k">Max RAM</div></div>
      <div class="stat-box"><div class="sb-v">${fmtPt(p.totalPlayedSecs||0)}</div><div class="sb-k">Played</div></div>
      <div class="stat-box"><div class="sb-v">${cap(p.modLoader||'vanilla')}</div><div class="sb-k">Loader</div></div>
      <div class="stat-box"><div class="sb-v">${p.minMemoryMB||512}MB</div><div class="sb-k">Min RAM</div></div>
    </div>
    <div style="display:flex;gap:7px;margin-top:12px;flex-wrap:wrap">
      <button class="btn btn-s btn-sm" onclick="editProfileModal('${p.id}')">${I('edit3')} Edit</button>
      <button class="btn btn-s btn-sm" onclick="openModsFor('${p.id}')">${I('puzzle')} Mods</button>
      <button class="btn btn-g btn-sm" onclick="openFolder('${p.id}')" title="Open folder">${I('folder')}</button>
    </div>
  `;
  const pill = document.getElementById('ver-pill-txt');
  if(pill) pill.textContent = `${cap(p.modLoader||'vanilla')} ${p.gameVersion} — ${p.name}`;
}

async function pickProfile(id) {
  S.activeId = id;
  await API.setActiveProfile(id).catch(()=>{});
  renderRail(); renderSelCard(); renderRecent(); syncVGrid(); syncModProfSel();
  const p = S.profiles.find(x=>x.id===id);
  if(p && !S.installedVers.has(p.gameVersion)) {
    const inst = await API.isVersionInstalled(p.gameVersion).catch(()=>false);
    if(inst) { S.installedVers.add(p.gameVersion); renderSelCard(); }
  }
}

function openModsFor(id) { S.activeId=id; nav('store'); switchModTab('installed'); document.getElementById('mod-prof-sel').value=id; loadInstalled(); }
window.openModsFor = openModsFor;

// ── Launch ─────────────────────────────────────────────────
async function onPlay() {
  if(!S.account) { openOv('acct'); return; }
  const p = S.profiles.find(x=>x.id===S.activeId);
  if(!p) { notify('Select a profile first','err'); return; }
  if(S.running.has(p.id)) { await API.stopProfile(p.id).catch(()=>{}); return; }
  const inst = await API.isVersionInstalled(p.gameVersion).catch(()=>false);
  if(!inst) {
    showInstallBox(p.gameVersion);
    try { await API.installVersion(p.gameVersion); S.installedVers.add(p.gameVersion); }
    catch(e) { hideInstallBox(); renderSelCard(); notify('Install failed: '+(e.message||e),'err'); return; }
    hideInstallBox(); renderSelCard();
  }
  notify(`Launching ${p.name}...`,'inf');
  try { await API.launchProfile(p.id); }
  catch(e) { notify(e.message||'Launch failed','err'); }
}

function showInstallBox(ver) {
  const box = document.getElementById('ver-install-box');
  document.getElementById('ver-inst-title').textContent = `Installing Minecraft ${ver}...`;
  document.getElementById('ver-inst-msg').textContent   = 'Starting download...';
  document.getElementById('ver-inst-bar').style.width   = '0%';
  if(box) box.style.display = 'block';
  showProg(`Installing ${ver}`, 0);
}
function hideInstallBox() {
  const box = document.getElementById('ver-install-box');
  if(box) box.style.display = 'none';
  hideProg();
}
function verProgress(d) {
  const bar=document.getElementById('ver-inst-bar'), msg=document.getElementById('ver-inst-msg');
  if(bar) bar.style.width=(d.progress||0)+'%';
  if(msg) msg.textContent=d.message||'';
  showProg(d.message||'Installing...', d.progress||0);
}
function showProg(lbl,pct) {
  document.getElementById('prog-wrap').style.display='block';
  document.getElementById('prog-lbl').textContent=lbl;
  document.getElementById('prog-pct').textContent=Math.round(pct)+'%';
  document.getElementById('pfill').style.width=pct+'%';
}
function hideProg() { document.getElementById('prog-wrap').style.display='none'; }
function dlProgress(t) { showProg(t.name, t.progress||0); }

function gameStarted(d) {
  S.running.add(d.profileId);
  const p=S.profiles.find(x=>x.id===d.profileId);
  document.getElementById('con-lbl').textContent=p?.name||'Console';
  document.getElementById('console').classList.add('open');
  const btn=document.getElementById('play-btn');
  if(btn){ btn.querySelector('.play-ico').innerHTML=I('square'); btn.querySelector('.play-txt').textContent='STOP'; btn.classList.add('running'); }
  renderSelCard(); renderVGrid(); notify(`${p?.name||'Game'} launched!`,'ok');
}
function gameStopped(d) {
  S.running.delete(d.profileId);
  const btn=document.getElementById('play-btn');
  if(btn){ btn.querySelector('.play-ico').innerHTML=I('play'); btn.querySelector('.play-txt').textContent='LAUNCH'; btn.classList.remove('running'); }
  renderSelCard(); renderVGrid(); notify('Game closed','inf');
}
function gameLog(d) {
  const out=document.getElementById('con-out');
  if(!out) return;
  const t=d.line||'';
  const div=document.createElement('div');
  div.className=t.toLowerCase().includes('error')?'le':t.toLowerCase().includes('warn')?'lw':t.includes('[INFO]')?'li':'';
  div.textContent=t;
  out.appendChild(div);
  if(out.children.length>600) out.removeChild(out.firstChild);
  out.scrollTop=out.scrollHeight;
}
async function openFolder(id) { try{ await API.openProfileFolder(id); } catch(e){ notify('Cannot open folder','err'); } }
window.openFolder=openFolder;

// ── Profile Grid ───────────────────────────────────────────
function renderVGrid() {
  const g=document.getElementById('vgrid');
  if(!g) return;
  const q=(document.getElementById('ver-q')?.value||'').toLowerCase();
  const filter=document.querySelector('[data-f].on')?.dataset.f||'all';
  let list=S.profiles.filter(p=>{
    if(q&&!p.name.toLowerCase().includes(q)&&!p.gameVersion.toLowerCase().includes(q)) return false;
    if(filter==='all') return true;
    if(filter==='vanilla') return !p.modLoader||p.modLoader==='vanilla';
    return p.modLoader===filter;
  });
  if(!list.length){
    g.innerHTML=`<div class="empty" style="grid-column:1/-1">
      <div class="empty-ico">${I('layers')}</div>
      <div class="empty-t">No profiles found</div>
      <div class="empty-d">Try a different filter or create a new profile</div>
      <button class="btn btn-p btn-sm" onclick="newProfileModal()">${I('plus')} New Profile</button>
    </div>`; return;
  }
  g.innerHTML=list.map(p=>{
    const run=S.running.has(p.id);
    return `
    <div class="vcard ${p.id===S.activeId?'on':''}" data-id="${p.id}">
      ${p.id===S.activeId?'<div class="vcard-glow"></div>':''}
      <div class="vcard-thumb" style="${profileThumb(p)}">
        ${I(profileIconName(p))}
      </div>
      <div class="vcard-name">${esc(p.name)}</div>
      <div class="vcard-sub">${p.description||'Minecraft '+p.gameVersion}</div>
      <div class="vcard-tags">
        <span class="vtag vtag-v">${I('package')} ${p.gameVersion}</span>
        <span class="vtag vtag-l">${cap(p.modLoader||'vanilla')}</span>
        ${run?`<span class="vtag" style="background:rgba(74,222,128,.15);color:var(--ok)">${I('zap')} Running</span>`:''}
      </div>
      <div style="display:flex;gap:5px;margin-top:10px">
        <button class="btn ${run?'btn-d':'btn-p'} btn-sm" onclick="event.stopPropagation();launchCard('${p.id}')">
          ${run?I('square'):I('play')} ${run?'Stop':'Play'}
        </button>
        <button class="iBtn btn-sm" onclick="event.stopPropagation();editProfileModal('${p.id}')" title="Edit">${I('edit3')}</button>
        <button class="iBtn btn-sm" onclick="event.stopPropagation();dupProfile('${p.id}')" title="Duplicate">${I('copy')}</button>
        <button class="iBtn btn-sm" onclick="event.stopPropagation();openFolder('${p.id}')" title="Open folder">${I('folder')}</button>
        <button class="iBtn btn-sm" style="color:var(--err);margin-left:auto" onclick="event.stopPropagation();delProfile('${p.id}')" title="Delete">${I('trash2')}</button>
      </div>
    </div>`;
  }).join('');
  g.querySelectorAll('.vcard').forEach(c=>c.onclick=e=>{ if(!e.target.closest('.btn,.iBtn')) pickProfile(c.dataset.id); });
}
window.launchCard=function(id){ S.activeId=id; nav('home'); onPlay(); };
function syncVGrid(){ if(S.page==='versions') renderVGrid(); }

// ── Profile Modals ─────────────────────────────────────────
async function newProfileModal() { openModal('New Profile', await profForm(), [{lbl:'Cancel',cls:'btn-s',fn:closeModal},{lbl:'Create Profile',cls:'btn-p',fn:doCreate}]); }
async function editProfileModal(id) { const p=S.profiles.find(x=>x.id===id); if(!p)return; openModal('Edit Profile',await profForm(p),[{lbl:'Cancel',cls:'btn-s',fn:closeModal},{lbl:'Save Changes',cls:'btn-p',fn:()=>doEdit(id)}]); }
window.newProfileModal=newProfileModal; window.editProfileModal=editProfileModal;

async function profForm(p=null){
  const cols=['#6C63FF','#22c55e','#f59e0b','#ef4444','#2dd4bf','#f97316','#e879f9','#60a5fa'];
  const iconOpts=[{k:'grass',n:'Grass'},{k:'flame',n:'Fire'},{k:'snowflake',n:'Snow'},{k:'rocket',n:'Rocket'},{k:'zap',n:'Zap'},{k:'star',n:'Star'},{k:'sparkles',n:'Magic'},{k:'sword',n:'Sword'},{k:'boxes',n:'Pack'},{k:'layers',n:'Default'}];
  const sc=p?.color||'#6C63FF', si=p?.icon||'grass';
  let verOpts='<option value="1.21">1.21</option>';
  try{
    if(!S.versions) S.versions=await API.getVersionList();
    verOpts=S.versions.versions.filter(v=>v.type==='release').map(v=>`<option value="${v.id}" ${v.id===p?.gameVersion?'selected':''}>${v.id}</option>`).join('');
  }catch(_){}
  return `
    <div class="fg"><label class="fl">Icon</label>
      <div class="ico-grid">${iconOpts.map(ic=>`<button type="button" class="ico-o ${ic.k===si?'on':''}" title="${ic.n}"
        onclick="document.querySelectorAll('.ico-o').forEach(b=>b.classList.remove('on'));this.classList.add('on');document.getElementById('fi').value='${ic.k}'">${I(ic.k)}</button>`).join('')}</div>
      <input type="hidden" id="fi" value="${si}">
    </div>
    <div class="fg"><label class="fl">Name *</label>
      <input type="text" class="fi" id="fn" placeholder="My Profile" value="${esc(p?.name||'')}">
    </div>
    <div class="fg"><label class="fl">Color</label>
      <div class="clrs">${cols.map(c=>`<div class="clr ${c===sc?'on':''}" style="background:${c}"
        onclick="document.querySelectorAll('.clr').forEach(s=>s.classList.remove('on'));this.classList.add('on');document.getElementById('fc').value='${c}'"></div>`).join('')}</div>
      <input type="hidden" id="fc" value="${sc}">
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="fg" style="margin:0"><label class="fl">Minecraft Version *</label>
        <select class="fi" id="fv" style="width:100%">${verOpts}</select></div>
      <div class="fg" style="margin:0"><label class="fl">Mod Loader</label>
        <select class="fi" id="fl2" style="width:100%">
          ${['vanilla','fabric','forge','neoforge','quilt'].map(l=>`<option value="${l}" ${p?.modLoader===l?'selected':''}>${cap(l)}</option>`).join('')}
        </select></div>
    </div>
    <div class="fg" style="margin-top:10px"><label class="fl">Max RAM</label>
      <div style="display:flex;align-items:center;gap:10px">
        <input type="range" id="fm" min="512" max="32768" step="512" value="${p?.maxMemoryMB||2048}" oninput="document.getElementById('fmv').textContent=this.value+'MB'" style="flex:1">
        <span class="ram-val" id="fmv">${p?.maxMemoryMB||2048}MB</span>
      </div>
    </div>
    <div class="fg"><label class="fl">Description</label>
      <textarea class="fi" id="fd" rows="2" placeholder="Optional...">${esc(p?.description||'')}</textarea></div>
    <div class="fg" style="margin:0"><label class="fl">Java Arguments</label>
      <input type="text" class="fi" id="fj" value="${esc(p?.javaArgs||'-XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:MaxGCPauseMillis=50')}">
    </div>`;
}
function getForm(){return{icon:document.getElementById('fi')?.value||'grass',name:document.getElementById('fn')?.value?.trim()||'',color:document.getElementById('fc')?.value||'#6C63FF',gameVersion:document.getElementById('fv')?.value||'1.21',modLoader:document.getElementById('fl2')?.value||'vanilla',maxMemoryMB:parseInt(document.getElementById('fm')?.value||'2048'),description:document.getElementById('fd')?.value||'',javaArgs:document.getElementById('fj')?.value||''};}
async function doCreate(){const v=getForm();if(!v.name)return notify('Name is required','err');try{const prf=await API.createProfile(v);if(v.javaArgs)await API.updateProfile(prf.id,{javaArgs:v.javaArgs});S.profiles=await API.getProfiles();S.activeId=prf.id;closeModal();refresh();notify(`Profile "${v.name}" created`,'ok');}catch(e){notify(e.message||'Failed','err');}}
async function doEdit(id){const v=getForm();try{await API.updateProfile(id,v);S.profiles=await API.getProfiles();closeModal();refresh();notify('Saved','ok');}catch(e){notify(e.message||'Failed','err');}}
async function dupProfile(id){try{await API.duplicateProfile(id);S.profiles=await API.getProfiles();refresh();notify('Duplicated','ok');}catch(e){notify(e.message,'err');}}
function delProfile(id){const p=S.profiles.find(x=>x.id===id);if(!p)return;openModal('Delete Profile',`<div style="display:flex;gap:14px;align-items:flex-start"><div style="font-size:28px;color:var(--err)">${I('alert-circle')}</div><div><div style="font-weight:700;margin-bottom:6px">Delete "${esc(p.name)}"?</div><div style="font-size:12px;color:var(--t2);line-height:1.6">This will permanently remove the profile and all its game files. This cannot be undone.</div></div></div>`,[{lbl:'Cancel',cls:'btn-s',fn:closeModal},{lbl:'Delete',cls:'btn-d',fn:async()=>{await API.deleteProfile(id);S.profiles=await API.getProfiles();if(S.activeId===id)S.activeId=S.profiles[0]?.id||null;closeModal();refresh();notify('Deleted','inf');}}]);}
window.dupProfile=dupProfile;window.delProfile=delProfile;
function refresh(){renderRail();renderSelCard();renderRecent();renderVGrid();syncModProfSel();}

// ── Mods ───────────────────────────────────────────────────
function syncModProfSel(){const sel=document.getElementById('mod-prof-sel');if(!sel)return;sel.innerHTML=`<option value="">Profile...</option>`+S.profiles.map(p=>`<option value="${p.id}" ${p.id===S.activeId?'selected':''}>${esc(p.name)}</option>`).join('');if(S.activeId)sel.value=S.activeId;}
function switchModTab(tab){S.modTab=tab;document.querySelectorAll('[data-mt]').forEach(t=>t.classList.toggle('on',t.dataset.mt===tab));document.getElementById('mt-browse').style.display=tab==='browse'?'flex':'none';document.getElementById('mt-installed').style.display=tab==='installed'?'flex':'none';document.getElementById('mt-modpacks').style.display=tab==='modpacks'?'flex':'none';if(tab==='browse'&&!S.modResults.length)searchMods(true);if(tab==='installed')loadInstalled();if(tab==='modpacks')searchPacks();}

let modsObserver=null;
function bindModsScroll(){const grid=document.getElementById('mod-grid');if(!grid)return;modsObserver=new IntersectionObserver(entries=>{if(entries[0].isIntersecting&&!S.modLoading&&S.modHasMore)searchMods(false);},{root:grid,threshold:0.1});}

async function searchMods(reset=false){
  if(S.modLoading&&!reset)return;
  if(reset){S.modPage=0;S.modHasMore=true;S.modResults=[];}
  if(!S.modHasMore)return;
  const q=document.getElementById('mod-q')?.value||'';
  const gv=S.profiles.find(p=>p.id===S.activeId)?.gameVersion||'';
  const grid=document.getElementById('mod-grid');
  S.modLoading=true;
  if(reset)grid.innerHTML=`<div class="inf-end"><div class="spin spin-lg"></div></div>`;
  try{
    const res=S.modSrc==='modrinth'?await API.searchModrinth(q,gv,S.modPage):await API.searchCurseForge(q,gv,S.modPage);
    const items=res?.items||[];
    if(reset)grid.innerHTML='';
    if(!items.length&&reset){grid.innerHTML=`<div class="empty" style="grid-column:1/-1"><div class="empty-ico">${I('puzzle')}</div><div class="empty-t">No results</div><div class="empty-d">Try different keywords</div></div>`;S.modHasMore=false;return;}
    grid.querySelector('.inf-end')?.remove();
    items.forEach(m=>grid.appendChild(modCardEl(m)));
    S.modResults=[...S.modResults,...items];S.modHasMore=items.length>=20;S.modPage++;
    if(S.modHasMore){const s=document.createElement('div');s.className='inf-end';s.innerHTML='<div class="spin"></div>';grid.appendChild(s);modsObserver?.observe(s);}
  }catch(e){if(reset)grid.innerHTML=`<div class="empty" style="grid-column:1/-1"><div class="empty-ico">${I('alert-circle')}</div><div class="empty-t">Error</div><div class="empty-d">${esc(e.message)}</div></div>`;}
  finally{S.modLoading=false;}
}

function modCardEl(m){
  const el=document.createElement('div');el.className='scard';
  const srcCls=m.source==='modrinth'?'src-mr':'src-cf';
  const srcLbl=m.source==='modrinth'?'Modrinth':'CurseForge';
  el.innerHTML=`
    <div class="scard-img" style="--sg:linear-gradient(135deg,${ca(m.source==='modrinth'?'#1bd96a':'#f0763a',.15)},rgba(108,99,255,.06))">
      ${m.iconUrl?`<img src="${m.iconUrl}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;border-radius:var(--r3) var(--r3) 0 0" onerror="this.remove()">`:''}
      <span class="scard-fallback">${I('puzzle')}</span>
    </div>
    <div class="scard-body">
      <div class="scard-name">${esc(m.name)}</div>
      <div class="scard-desc">${esc(m.description)}</div>
      <div class="scard-foot">
        <span class="scard-src ${srcCls}">${srcLbl}</span>
        <span class="scard-dl">${I('download')} ${fmtN(m.downloads)}</span>
        <span class="scard-star">${I('star')} ${(4.5+Math.random()*.4).toFixed(1)}</span>
        <button class="scard-ibtn" title="Install">${I('plus')}</button>
      </div>
    </div>`;
  el.querySelector('.scard-ibtn').onclick=e=>{e.stopPropagation();installMod(m,el);};
  el.onclick=()=>modDetailModal(m);
  return el;
}

async function installMod(m,cardEl){
  const profId=document.getElementById('mod-prof-sel')?.value;
  if(!profId){notify('Select a profile first','err');return;}
  const btn=cardEl?.querySelector('.scard-ibtn');
  if(btn){btn.innerHTML='<div class="spin" style="width:13px;height:13px;border-width:2px"></div>';btn.style.pointerEvents='none';}
  try{await API.installMod(profId,m.id,m.source,'');if(btn){btn.innerHTML=I('check');btn.classList.add('done');}notify(`${m.name} installed`,'ok');}
  catch(e){if(btn){btn.innerHTML=I('plus');btn.style.pointerEvents='';}notify(e.message||'Install failed','err');}
}

function modDetailModal(m){
  openModal(m.name,`
    <div style="display:flex;gap:13px;margin-bottom:14px;align-items:flex-start">
      <div style="width:56px;height:56px;border-radius:var(--r2);background:var(--bg3);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:var(--t3)">
        ${m.iconUrl?`<img src="${m.iconUrl}" style="width:100%;height:100%;object-fit:cover">`:`<div style="width:28px;height:28px">${I('puzzle')}</div>`}
      </div>
      <div><div style="font-weight:800;font-size:14px;margin-bottom:4px">${esc(m.name)}</div>
        <div style="font-size:11px;color:var(--t2)">by ${esc(m.author||'Unknown')}</div>
        <div style="display:flex;gap:5px;margin-top:6px">
          <span class="scard-src ${m.source==='modrinth'?'src-mr':'src-cf'}">${m.source}</span>
          <span style="font-size:10px;color:var(--t3);display:flex;align-items:center;gap:3px">${I('download')} ${fmtN(m.downloads)}</span>
        </div>
      </div>
    </div>
    <div style="font-size:12px;color:var(--t2);line-height:1.65;margin-bottom:12px">${esc(m.description)}</div>
    ${m.gameVersions?.length?`<div style="font-size:11px;color:var(--t3);margin-bottom:5px;display:flex;align-items:center;gap:5px">${I('package')} <strong style="color:var(--t2)">Versions:</strong> ${m.gameVersions.slice(0,6).join(', ')}</div>`:''}
    ${m.modLoaders?.length?`<div style="font-size:11px;color:var(--t3);display:flex;align-items:center;gap:5px">${I('cpu')} <strong style="color:var(--t2)">Loaders:</strong> ${m.modLoaders.join(', ')}</div>`:''}
  `,[
    {lbl:'Close',cls:'btn-s',fn:closeModal},
    {lbl:'Install',cls:'btn-p',fn:async()=>{
      const profId=document.getElementById('mod-prof-sel')?.value;
      if(!profId){notify('Select a profile first','err');return;}
      closeModal();notify(`Installing ${m.name}...`,'inf');
      try{await API.installMod(profId,m.id,m.source,'');notify(`${m.name} installed`,'ok');}
      catch(e){notify(e.message,'err');}
    }},
  ]);
}

async function searchPacks(){
  const g=document.getElementById('pack-grid');
  g.innerHTML=`<div class="inf-end"><div class="spin spin-lg"></div></div>`;
  try{
    const res=await API.searchModpack('','modrinth','',0);
    const items=res?.items||[];
    if(!items.length){g.innerHTML=`<div class="empty" style="grid-column:1/-1"><div class="empty-ico">${I('boxes')}</div><div class="empty-t">No modpacks found</div></div>`;return;}
    g.innerHTML='';
    items.forEach(m=>{const el=modCardEl(m);el.querySelector('.scard-ibtn').onclick=e=>{e.stopPropagation();packInstallModal(m);};g.appendChild(el);});
  }catch(e){g.innerHTML=`<div class="empty" style="grid-column:1/-1"><div class="empty-t">Error</div></div>`;}
}

function packInstallModal(pack){
  openModal(`Install: ${pack.name}`,`
    <p style="font-size:12px;color:var(--t2);margin-bottom:13px;line-height:1.6">A new profile will be created with all mods automatically installed.</p>
    <div class="fg"><label class="fl">Profile Name</label><input type="text" class="fi" id="fpn" value="${esc(pack.name)}"></div>
  `,[{lbl:'Cancel',cls:'btn-s',fn:closeModal},{lbl:'Install Modpack',cls:'btn-p',fn:async()=>{
    const name=document.getElementById('fpn')?.value?.trim()||pack.name;
    closeModal();notify(`Installing "${name}"...`,'inf');
    try{await API.installModpack(pack.id,'','modrinth',name);S.profiles=await API.getProfiles();refresh();notify(`"${name}" installed`,'ok');}
    catch(e){notify(e.message,'err');}
  }}]);
}

async function loadInstalled(){
  const profId=document.getElementById('mod-prof-sel')?.value||S.activeId;
  const list=document.getElementById('ins-list');
  if(!list)return;
  if(!profId){list.innerHTML=`<div class="empty"><div class="empty-ico">${I('layers')}</div><div class="empty-t">Select a profile</div></div>`;return;}
  list.innerHTML=`<div style="display:flex;justify-content:center;padding:24px"><div class="spin spin-lg"></div></div>`;
  try{
    const mods=await API.getProfileMods(profId)||[];
    if(!mods.length){list.innerHTML=`<div class="empty"><div class="empty-ico">${I('puzzle')}</div><div class="empty-t">No mods installed</div><div class="empty-d">Browse mods and install them here</div></div>`;return;}
    list.innerHTML=mods.map(m=>`
      <div class="ins-row" style="display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:var(--r2);transition:background .12s">
        <div style="width:32px;height:32px;border-radius:7px;background:var(--bg3);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:var(--t3)">${I('puzzle')}</div>
        <div style="flex:1;min-width:0">
          <div class="irn" style="font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(m.name||m.fileName)}</div>
          <div style="font-size:10px;color:var(--t3)">${m.version||m.fileName} · ${fmtB(m.fileSize||0)}</div>
        </div>
        <div class="toggle ${m.enabled?'on':''}" data-f="${m.fileName}" style="flex-shrink:0"></div>
        <button class="iBtn" style="color:var(--err);flex-shrink:0" data-f="${m.fileName}">${I('trash2')}</button>
      </div>`).join('');
    list.querySelectorAll('.toggle').forEach(sw=>{sw.onclick=async()=>{const on=sw.classList.toggle('on');try{await API.toggleMod(profId,sw.dataset.f,on);}catch(e){sw.classList.toggle('on');notify(e.message,'err');}};});
    list.querySelectorAll('.iBtn[data-f]').forEach(btn=>{btn.onclick=()=>API.uninstallMod(profId,btn.dataset.f).then(()=>{loadInstalled();notify('Mod removed','inf');}).catch(e=>notify(e.message,'err'));});
  }catch(e){list.innerHTML=`<div class="empty"><div class="empty-t">${esc(e.message)}</div></div>`;}
}

// ── Account Panel ──────────────────────────────────────────
async function renderAcctPanel(){
  const body=document.getElementById('acct-panel-body');
  if(!body)return;
  const accounts=await API.getAllAccounts()||[];
  const cur=S.account;
  if(!accounts.length){
    body.innerHTML=`<div class="empty" style="padding:32px 20px"><div class="empty-ico">${I('user')}</div><div class="empty-t">No accounts</div><div class="empty-d">Sign in to access online features</div></div>
      <button class="add-btn" id="ab-ms">${I('log-in')} Sign in with Microsoft</button>
      <button class="add-btn sec" id="ab-off">${I('user')} Add Offline Account</button>`;
  }else{
    const checkIcon = I('check');
    const trash2Icon = I('trash2');
    const loginIcon = I('log-in');
    const userIcon = I('user');
    const acctRows = accounts.map(a=>{
      const avBg  = a.type==='microsoft'?'rgba(34,211,238,.12)':'rgba(108,99,255,.15)';
      const avCol = a.type==='microsoft'?'var(--a3)':'#b0a8ff';
      const avLetter = a.username?.[0]?.toUpperCase()||'?';
      const isActive = cur?.uuid===a.uuid;
      const useBtn = isActive
        ? `<span style="margin-left:auto;margin-right:10px;color:var(--ok);display:flex;align-items:center;width:16px">${checkIcon}</span>`
        : `<button class="btn btn-s btn-sm" style="margin-left:auto;margin-right:6px" onclick="swAcct('${a.uuid}')">Use</button>`;
      return `<div class="acct-row">
        <div class="ar-av" style="background:${avBg};color:${avCol}">${avLetter}</div>
        <div><div class="ar-name">${esc(a.username)}</div><div class="ar-type">${a.type==='microsoft'?'Microsoft':'Offline'}</div></div>
        ${useBtn}
        <button class="ar-del" onclick="rmAcct('${a.uuid}')">${trash2Icon}</button>
      </div>`;
    }).join('');
    body.innerHTML=`
      <div class="acct-hero">
        <div class="ah-av">${cur?.username?.[0]?.toUpperCase()||'?'}</div>
        <div><div class="ah-name">${esc(cur?.username||'Unknown')}</div><div class="ah-type">${cur?.type==='microsoft'?'Microsoft Account':'Offline Account'}</div></div>
        <div class="ah-badge">${checkIcon} Active</div>
      </div>
      <div style="font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.09em;margin-bottom:8px">All Accounts</div>
      <div class="acct-list">${acctRows}</div>
      <button class="add-btn" id="ab-ms" style="margin-top:10px">${loginIcon} Add Microsoft Account</button>
      <button class="add-btn sec" id="ab-off">${userIcon} Add Offline Account</button>`;
  }
  document.getElementById('ab-ms')?.addEventListener('click',doMsLogin);
  document.getElementById('ab-off')?.addEventListener('click',showOfflineModal);
}
window.syncAcctPanel=()=>{syncAcct();renderAcctPanel();};
window.swAcct=async function(uuid){await API.switchAccount(uuid);S.account=(await API.getAllAccounts()).find(a=>a.uuid===uuid)||null;syncAcct();renderAcctPanel();notify('Account switched','inf');};
window.rmAcct=async function(uuid){await API.removeAccount(uuid);S.account=(await API.getAllAccounts())[0]||null;syncAcct();renderAcctPanel();notify('Account removed','inf');};

async function doMsLogin(){
  closeOv('acct');
  openModal('Sign in with Microsoft',`
    <div style="text-align:center;padding:10px">
      <div style="font-size:13px;color:var(--t2);margin-bottom:18px;line-height:1.7">A browser window will open.<br>Sign in with your Microsoft account there.</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:10px;background:var(--ag);border:1px solid var(--bda);border-radius:var(--r2);padding:14px 20px;margin-bottom:14px">
        <div class="spin"></div><span id="ms-wait" style="font-size:13px;color:var(--a1)">Opening browser...</span>
      </div>
      <div style="font-size:11px;color:var(--t3)">Complete login in your browser, then return here.</div>
    </div>
  `,[{lbl:'Cancel',cls:'btn-s',fn:closeModal}]);
  const unsub=onEvent('auth:success',d=>{unsub?.();const el=document.getElementById('ms-wait');if(el)el.textContent=`✓ Signed in as ${d.username}`;setTimeout(()=>{closeModal();renderAcctPanel();},1200);});
  try{S.account=await API.loginMicrosoft();syncAcct();closeModal();renderAcctPanel();notify(`Signed in as ${S.account.username}`,'ok');}
  catch(e){closeModal();notify(e.message||'Login failed','err');}
}

function showOfflineModal(){
  openModal('Add Offline Account',`
    <div class="fg"><label class="fl">Username</label><input type="text" class="fi" id="off-un" placeholder="Enter username" maxlength="16"></div>
  `,[{lbl:'Cancel',cls:'btn-s',fn:closeModal},{lbl:'Add Account',cls:'btn-p',fn:async()=>{
    const u=document.getElementById('off-un')?.value?.trim();
    if(!u){notify('Enter a username','err');return;}
    try{S.account=await API.loginOffline(u);syncAcct();closeModal();renderAcctPanel();notify(`Playing as ${u}`,'ok');}
    catch(e){notify(e.message,'err');}
  }}]);
}

// ── Skin ───────────────────────────────────────────────────
function pickSkin(el,name){document.getElementById('skin-gal').querySelectorAll('.sg-item').forEach(s=>s.classList.remove('on'));el.classList.add('on');notify(`Skin "${name}" selected`,'ok');}
function pickCape(el,name){el.closest('.skin-gal').querySelectorAll('.sg-item').forEach(s=>s.classList.remove('on'));el.classList.add('on');notify(name==='none'?'Cape removed':`Cape "${name}" selected`,'ok');}
window.pickSkin=pickSkin; window.pickCape=pickCape;

function bindSkinDrag(){
  const scene=document.getElementById('skin-scene');
  if(!scene)return;
  let drag=false,lx=0,rot=0;
  scene.addEventListener('mousedown',e=>{drag=true;lx=e.clientX;});
  document.addEventListener('mousemove',e=>{if(!drag)return;rot+=(e.clientX-lx)*.5;scene.querySelector('.skin-float').style.transform=`translateY(${Math.sin(Date.now()/1000)*8}px) rotateY(${rot}deg)`;lx=e.clientX;});
  document.addEventListener('mouseup',()=>drag=false);
}

// ── Modal ──────────────────────────────────────────────────
function openModal(title,body,btns=[]){
  document.getElementById('m-title').textContent=title;
  document.getElementById('m-body').innerHTML=body;
  const f=document.getElementById('m-foot');
  f.innerHTML=btns.map((b,i)=>`<button class="btn ${b.cls}" id="mb${i}">${b.lbl}</button>`).join('');
  btns.forEach((b,i)=>document.getElementById(`mb${i}`).onclick=b.fn);
  document.getElementById('modal-ov').classList.add('open');
}
function closeModal(){document.getElementById('modal-ov').classList.remove('open');}
window.closeModal=closeModal;

// ── Notify ─────────────────────────────────────────────────
function notify(msg,type='inf'){
  const s=document.getElementById('nstack');
  const el=document.createElement('div');
  el.className=`notif ${type}`;
  const ic={ok:I('check'),err:I('x'),inf:I('info')};
  el.innerHTML=`<span style="width:14px;height:14px;flex-shrink:0">${ic[type]||''}</span><span>${esc(msg)}</span>`;
  s.appendChild(el);
  setTimeout(()=>el.remove(),3500);
}
window.notify=notify;

// ── Utils ──────────────────────────────────────────────────
function esc(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function cap(s){return s?s[0].toUpperCase()+s.slice(1):'';}
function ca(hex,a){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return `rgba(${r},${g},${b},${a})`;}
function fmtPt(s){if(!s)return'0h';const h=Math.floor(s/3600),m=Math.floor((s%3600)/60);return h>0?`${h}h ${m}m`:`${m}m`;}
function fmtN(n){if(!n)return'0';if(n>=1e6)return(n/1e6).toFixed(1)+'M';if(n>=1e3)return(n/1e3).toFixed(0)+'K';return String(n);}
function fmtB(b){if(!b)return'0B';if(b>=1048576)return(b/1048576).toFixed(1)+'MB';if(b>=1024)return(b/1024).toFixed(0)+'KB';return b+'B';}

boot();
