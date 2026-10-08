(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))l(n);new MutationObserver(n=>{for(const c of n)if(c.type==="childList")for(const o of c.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&l(o)}).observe(document,{childList:!0,subtree:!0});function i(n){const c={};return n.integrity&&(c.integrity=n.integrity),n.referrerPolicy&&(c.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?c.credentials="include":n.crossOrigin==="anonymous"?c.credentials="omit":c.credentials="same-origin",c}function l(n){if(n.ep)return;n.ep=!0;const c=i(n);fetch(n.href,c)}})();function v(){return typeof window<"u"&&window.go!==void 0&&window.go.main!==void 0&&window.go.main.App!==void 0}function p(e,...t){return window.go.main.App[e](...t)}function w(e,t){var i;return typeof window<"u"&&((i=window.runtime)!=null&&i.EventsOn)?(window.runtime.EventsOn(e,t),()=>window.runtime.EventsOff(e)):()=>{}}const u={minimize:()=>v()?p("MinimizeWindow"):F("minimize"),maximize:()=>v()?p("MaximizeWindow"):F("maximize"),close:()=>v()?p("CloseWindow"):F("close"),loginMicrosoft:()=>v()?p("LoginMicrosoft"):m("LoginMicrosoft"),loginOffline:e=>v()?p("LoginOffline",e):m("LoginOffline",e),getCurrentAccount:()=>v()?p("GetCurrentAccount"):m("GetCurrentAccount"),getAllAccounts:()=>v()?p("GetAllAccounts"):m("GetAllAccounts"),switchAccount:e=>v()?p("SwitchAccount",e):m("SwitchAccount",e),removeAccount:e=>v()?p("RemoveAccount",e):m("RemoveAccount",e),refreshAccount:e=>v()?p("RefreshAccount",e):m("RefreshAccount",e),getProfiles:()=>v()?p("GetProfiles"):m("GetProfiles"),getProfile:e=>v()?p("GetProfile",e):m("GetProfile",e),createProfile:e=>v()?p("CreateProfile",e):m("CreateProfile",e),updateProfile:(e,t)=>v()?p("UpdateProfile",e,t):m("UpdateProfile",e,t),deleteProfile:e=>v()?p("DeleteProfile",e):m("DeleteProfile",e),duplicateProfile:e=>v()?p("DuplicateProfile",e):m("DuplicateProfile",e),setActiveProfile:e=>v()?p("SetActiveProfile",e):m("SetActiveProfile",e),getActiveProfile:()=>v()?p("GetActiveProfile"):m("GetActiveProfile"),openProfileFolder:e=>v()?p("OpenProfileFolder",e):m("OpenProfileFolder",e),getVersionList:()=>v()?p("GetVersionList"):m("GetVersionList"),getInstalledVersions:()=>v()?p("GetInstalledVersions"):m("GetInstalledVersions"),installVersion:e=>v()?p("InstallVersion",e):m("InstallVersion",e),isVersionInstalled:e=>v()?p("IsVersionInstalled",e):m("IsVersionInstalled",e),getVersionDetails:e=>v()?p("GetVersionDetails",e):m("GetVersionDetails",e),searchModrinth:(e,t,i)=>v()?p("SearchModrinth",e,t,i):m("SearchModrinth",e,t,i),searchCurseForge:(e,t,i)=>v()?p("SearchCurseForge",e,t,i):m("SearchCurseForge",e,t,i),getProfileMods:e=>v()?p("GetProfileMods",e):m("GetProfileMods",e),installMod:(e,t,i,l)=>v()?p("InstallMod",e,t,i,l):m("InstallMod",e,t,i,l),uninstallMod:(e,t)=>v()?p("UninstallMod",e,t):m("UninstallMod",e,t),toggleMod:(e,t,i)=>v()?p("ToggleMod",e,t,i):m("ToggleMod",e,t,i),getModVersions:(e,t,i)=>v()?p("GetModVersions",e,t,i):m("GetModVersions",e,t,i),searchModpack:(e,t,i,l)=>v()?p("SearchModpack",e,t,i,l):m("SearchModpack",e,t,i,l),installModpack:(e,t,i,l)=>v()?p("InstallModpack",e,t,i,l):m("InstallModpack",e,t,i,l),getDownloadQueue:()=>v()?p("GetDownloadQueue"):m("GetDownloadQueue"),cancelDownload:e=>v()?p("CancelDownload",e):m("CancelDownload",e),launchProfile:e=>v()?p("LaunchProfile",e):m("LaunchProfile",e),stopProfile:e=>v()?p("StopProfile",e):m("StopProfile",e),isProfileRunning:e=>v()?p("IsProfileRunning",e):m("IsProfileRunning",e),getJavaPath:()=>v()?p("GetJavaPath"):m("GetJavaPath"),getAppVersion:()=>v()?p("GetAppVersion"):m("GetAppVersion"),getDataDir:()=>v()?p("GetDataDir"):m("GetDataDir")},$={id:"p1",name:"Create Mod Pack",gameVersion:"1.21.1",modLoader:"fabric",icon:"grass",color:"#6C63FF",maxMemoryMB:4096,minMemoryMB:512,description:"Automation & trains",totalPlayedSecs:3600,gameDir:"",javaArgs:"",isModpack:!1},C={uuid:"offline-test",username:"Player",type:"offline",accessToken:"offline"},ce={latest:{release:"1.21.1",snapshot:"1.21.4"},versions:[{id:"1.21.4",type:"release",url:"",releaseTime:"2024-12-03T00:00:00Z"},{id:"1.21.1",type:"release",url:"",releaseTime:"2024-08-08T00:00:00Z"},{id:"1.21",type:"release",url:"",releaseTime:"2024-06-13T00:00:00Z"},{id:"1.20.6",type:"release",url:"",releaseTime:"2024-04-29T00:00:00Z"},{id:"1.20.4",type:"release",url:"",releaseTime:"2023-12-07T00:00:00Z"},{id:"1.20.1",type:"release",url:"",releaseTime:"2023-06-12T00:00:00Z"},{id:"1.19.4",type:"release",url:"",releaseTime:"2023-03-14T00:00:00Z"},{id:"1.18.2",type:"release",url:"",releaseTime:"2022-02-28T00:00:00Z"},{id:"1.16.5",type:"release",url:"",releaseTime:"2021-01-14T00:00:00Z"}]},W={items:[{id:"sodium",name:"Sodium",description:"Modern rendering engine. Optimize FPS.",downloads:18e6,source:"modrinth",author:"jellysquid3",iconUrl:"",gameVersions:["1.21.1"],modLoaders:["fabric"]},{id:"create",name:"Create Mod",description:"Automation and trains. Aesthetic technology.",downloads:22e6,source:"modrinth",author:"simibubi",iconUrl:"",gameVersions:["1.21.1"],modLoaders:["fabric","forge"]},{id:"iris",name:"Iris Shaders",description:"Modern shaders with OptiFine compat.",downloads:14e6,source:"modrinth",author:"IrisShaders",iconUrl:"",gameVersions:["1.21.1"],modLoaders:["fabric"]},{id:"jei",name:"JEI",description:"Just Enough Items — recipe browser.",downloads:3e8,source:"modrinth",author:"mezz",iconUrl:"",gameVersions:["1.21.1"],modLoaders:["fabric","forge"]}]};function m(e,...t){console.log("[MOCK]",e,t);const l={GetProfiles:()=>[$],GetProfile:()=>$,CreateProfile:n=>({...$,...n,id:"p"+Date.now()}),UpdateProfile:(n,c)=>({...$,id:n,...c}),DeleteProfile:()=>null,DuplicateProfile:()=>({...$,id:"p"+Date.now(),name:$.name+" (Copy)"}),SetActiveProfile:()=>null,GetActiveProfile:()=>$,OpenProfileFolder:()=>null,GetCurrentAccount:()=>C,GetAllAccounts:()=>[C],LoginOffline:([n])=>({...C,username:n}),LoginMicrosoft:()=>{throw new Error("Dev mode: Microsoft login not available")},SwitchAccount:()=>null,RemoveAccount:()=>null,RefreshAccount:()=>C,GetVersionList:()=>ce,GetInstalledVersions:()=>[],IsVersionInstalled:()=>!1,InstallVersion:()=>new Promise(n=>setTimeout(n,800)),GetVersionDetails:()=>null,SearchModrinth:()=>W,SearchCurseForge:()=>({items:[]}),GetProfileMods:()=>[],InstallMod:()=>new Promise(n=>setTimeout(n,600)),UninstallMod:()=>null,ToggleMod:()=>null,GetModVersions:()=>[],SearchModpack:()=>W,InstallModpack:()=>new Promise(n=>setTimeout(n,800)),GetDownloadQueue:()=>[],CancelDownload:()=>null,LaunchProfile:()=>new Promise((n,c)=>setTimeout(()=>c(new Error("Dev mode: launch not supported")),300)),StopProfile:()=>null,IsProfileRunning:()=>!1,GetJavaPath:()=>"/usr/bin/java",GetAppVersion:()=>"1.0.0",GetDataDir:()=>"~/.config/qmcl"}[e];if(!l)return Promise.resolve(null);try{const n=l(t);return Promise.resolve(n)}catch(n){return Promise.reject(n)}}function F(e){return console.log("[MOCK window control]",e),Promise.resolve()}const d=(e,t="")=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${t}>${e}</svg>`,X={home:d('<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'),package:d('<line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>'),puzzle:d('<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>'),shirt:d('<path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/>'),store:d('<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/>'),settings:d('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),minus:d('<line x1="5" y1="12" x2="19" y2="12"/>'),maximize2:d('<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>'),x:d('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),play:d('<polygon points="5 3 19 12 5 21 5 3"/>','fill="currentColor" stroke="none"'),square:d('<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>','fill="currentColor" stroke="none"'),plus:d('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'),trash2:d('<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>'),edit3:d('<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>'),copy:d('<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),folder:d('<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>'),check:d('<polyline points="20 6 9 17 4 12"/>'),search:d('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'),download:d('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'),"cloud-dl":d('<polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>'),upload:d('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>'),"refresh-cw":d('<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>'),user:d('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),users:d('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),"log-in":d('<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>'),"log-out":d('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>'),shield:d('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'),info:d('<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'),"alert-circle":d('<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'),bell:d('<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>'),terminal:d('<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>'),cpu:d('<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>'),clock:d('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),hdd:d('<line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/>'),zap:d('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'),star:d('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>'),layers:d('<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>'),grid:d('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>'),list:d('<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>'),"chevron-right":d('<polyline points="9 18 15 12 9 6"/>'),"chevron-down":d('<polyline points="6 9 12 15 18 9"/>'),"arrow-left":d('<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>'),menu:d('<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>'),sidebar:d('<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/>'),sliders:d('<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>'),palette:d('<circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>'),image:d('<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>'),"file-text":d('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>'),globe:d('<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'),link:d('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'),grass:d('<path d="M12 22V12"/><path d="m7 12 5-5 5 5"/><path d="M2 22h20"/><path d="M12 12C12 7 7 3 2 3s5 5 4 9"/><path d="M12 12c0-5 5-9 10-9s-5 5-4 9"/>'),sword:d('<polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/>'),flame:d('<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>'),sparkles:d('<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>'),boxes:d('<path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z"/><path d="m7 16.5-4.74-2.85"/><path d="m7 16.5 5-3"/><path d="M7 16.5v5.17"/><path d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z"/><path d="m17 16.5-5-3"/><path d="m17 16.5 4.74-2.85"/><path d="M17 16.5v5.17"/><path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z"/><path d="M12 8 7.26 5.15"/><path d="m12 8 4.74-2.85"/><path d="M12 13.5V8"/>'),snowflake:d('<line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/>'),rocket:d('<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>')};function re(e,t=""){const i=X[e]||X.package;return t?i.replace("<svg ",`<svg class="${t}" `):i}const s=(e,t="")=>re(e,t),a={page:"home",profiles:[],activeId:null,account:null,versions:null,installedVers:new Set,modTab:"browse",modSrc:"modrinth",modResults:[],modPage:0,modLoading:!1,modHasMore:!0,packSrc:"modrinth",running:new Set,sidebarWide:!1,slideIdx:0};async function ve(){var l;me(),pe(),fe();const[e,t,i]=await Promise.all([u.getProfiles(),u.getCurrentAccount(),u.getActiveProfile()]).catch(()=>[[],null,null]);a.profiles=e||[],a.account=t,a.activeId=(i==null?void 0:i.id)||((l=a.profiles[0])==null?void 0:l.id)||null,E(),H("home"),be()}function pe(){const e=document.getElementById("particles");for(let t=0;t<28;t++){const i=document.createElement("div");i.className="pt",i.style.cssText=`left:${Math.random()*100}%;animation-duration:${9+Math.random()*14}s;animation-delay:${-Math.random()*25}s;--dx:${(Math.random()-.5)*80}px`,e.appendChild(i)}}const ue={grass:"grass",fire:"flame",snow:"snowflake",rocket:"rocket",star:"star",zap:"zap",boxes:"boxes",sparkles:"sparkles",sword:"sword",default:"layers"};function T(e){return ue[e==null?void 0:e.icon]||"layers"}function z(e){const t=e.color||"#6C63FF";return`background:linear-gradient(135deg,${I(t,.28)},${I(t,.08)})`}function me(){document.getElementById("app").innerHTML=`
    <div class="bg-root">
      <div class="blob blob1"></div><div class="blob blob2"></div><div class="blob blob3"></div>
    </div>
    <div class="particles" id="particles"></div>

    <!-- TITLEBAR -->
    <div class="tbar">
      <div class="tbar-logo">
        <div class="logo-gem">${s("zap")}</div>
        QMCL
      </div>
      <div class="tbar-mid">
        <div class="active-ver-pill" id="ver-pill" onclick="nav('versions')">
          <div class="ver-dot"></div>
          <span id="ver-pill-txt">Select a profile</span>
          <span class="ver-pill-arrow">${s("chevron-down")}</span>
        </div>
      </div>
      <div class="tbar-right">
        <button class="tbar-action" id="tb-notif" title="Notifications">${s("bell")}</button>
        <button class="tbar-action" id="tb-acct"  title="Account">${s("user")}</button>
        <button class="tbar-action" id="tb-cfg"   title="Settings">${s("settings")}</button>
        <div class="tbar-sep"></div>
        <button class="tbar-btn" id="tb-min">${s("minus")}</button>
        <button class="tbar-btn" id="tb-max">${s("maximize2")}</button>
        <button class="tbar-btn close" id="tb-cls">${s("x")}</button>
      </div>
    </div>

    <!-- MAIN -->
    <div class="main-wrap">
      <nav class="sidebar" id="sidebar">
        <button class="nav-btn on" data-p="home">
          <span class="nav-ico">${s("home")}</span>
          <span class="nav-lbl">Home</span>
        </button>
        <button class="nav-btn" data-p="versions">
          <span class="nav-ico">${s("layers")}</span>
          <span class="nav-lbl">Profiles</span>
        </button>
        <button class="nav-btn" data-p="store">
          <span class="nav-ico">${s("puzzle")}</span>
          <span class="nav-lbl">Mods</span>
        </button>
        <button class="nav-btn" data-p="skin">
          <span class="nav-ico">${s("palette")}</span>
          <span class="nav-lbl">Skin</span>
        </button>
        <div class="sb-gap"></div>
        <button class="sb-toggle" id="sb-toggle">${s("sidebar")}</button>
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
                      <div class="c-tag">${s("sparkles")} New Update</div>
                      <div class="c-title">Minecraft 1.21.4 — The Garden Awakens</div>
                      <div class="c-sub">New biomes, mobs and block variants now available</div>
                    </div>
                  </div>
                  <div class="c-slide cs2">
                    <div class="c-content">
                      <div class="c-tag">${s("boxes")} Mod Spotlight</div>
                      <div class="c-title">Create Mod 0.5.1 for Fabric Released</div>
                      <div class="c-sub">Full 1.21 compatibility with new automation features</div>
                    </div>
                  </div>
                  <div class="c-slide cs3">
                    <div class="c-content">
                      <div class="c-tag">${s("globe")} Community</div>
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
                    <div class="empty-ico">${s("layers")}</div>
                    <div class="empty-t">No profile selected</div>
                    <div class="empty-d">Pick or create a profile to get started</div>
                    <button class="btn btn-p btn-sm" onclick="newProfileModal()">
                      ${s("plus")} New Profile
                    </button>
                  </div>
                </div>
                <div class="glass-card">
                  <div class="gc-title">${s("clock")} Recent Profiles</div>
                  <div id="recent-list">
                    <div class="empty" style="padding:20px">
                      <div class="empty-ico">${s("clock")}</div>
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
                ${s("layers")} Profiles
              </div>
              <div class="rail-list" id="rail-list"></div>
              <button class="rail-add" onclick="newProfileModal()">
                ${s("plus")} New Profile
              </button>
            </div>
          </div>

          <!-- Console -->
          <div class="console" id="console">
            <div class="con-bar">
              <div class="con-dot"></div>
              ${s("terminal")}
              <span id="con-lbl" style="margin-left:4px">Console</span>
              <button class="iBtn" id="con-close" style="margin-left:auto;width:20px;height:20px;padding:3px">${s("x")}</button>
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
                <span class="search-ico">${s("search")}</span>
                <input type="text" id="ver-q" placeholder="Search profiles...">
                <button class="btn btn-p btn-sm" onclick="newProfileModal()">
                  ${s("plus")} New
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
                <div class="cat-btn on" data-mt="browse">${s("search")} Browse</div>
                <div class="cat-btn" data-mt="installed">${s("hdd")} Installed</div>
                <div class="cat-btn" data-mt="modpacks">${s("boxes")} Modpacks</div>
              </div>
              <div style="display:flex;gap:8px;align-items:center">
                <div class="search-box" style="flex:1">
                  <span class="search-ico">${s("search")}</span>
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
                <div class="search-box">${s("search")}<input type="text" id="ins-q" placeholder="Filter installed..."></div>
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
              <div class="skin-hint">${s("refresh-cw")} Drag to rotate</div>
            </div>
            <div class="skin-side">
              <div>
                <div class="sk-sec">${s("image")} My Skins</div>
                <div class="skin-gal" id="skin-gal">
                  ${["Steve","Alex","Ninja","Hero","Villager","Enderman"].map((e,t)=>`<div class="sg-item ${t===0?"on":""}" onclick="pickSkin(this,'${e}')" data-skin="${e}">
                      <div class="sg-thumb sg-${t}"></div>
                      <span class="sg-label">${e}</span>
                    </div>`).join("")}
                </div>
              </div>
              <div>
                <div class="sk-sec">${s("upload")} Upload Skin</div>
                <div class="skin-drop" onclick="notify('File picker opened','inf')">
                  <div class="skin-drop-icon">${s("upload")}</div>
                  <div class="skin-drop-text">Drop PNG here or click to browse<br>
                    <span style="color:var(--t3);font-size:10px">64×64 or 128×128 pixels</span>
                  </div>
                </div>
              </div>
              <div>
                <div class="sk-sec">${s("sparkles")} Cape</div>
                <div class="skin-gal">
                  <div class="sg-item on" onclick="pickCape(this,'none')">
                    <div class="sg-thumb" style="display:flex;align-items:center;justify-content:center;color:var(--t3)">${s("x")}</div>
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
        <div class="bb-av" id="bb-av">${s("user")}</div>
        <div>
          <div class="bb-name" id="bb-name">Not signed in</div>
          <div class="bb-type" id="bb-type">Click to add account</div>
        </div>
      </div>
      <div class="bb-mid">
        <button class="play-btn" id="play-btn" onclick="onPlay()">
          <span class="play-ico">${s("play")}</span>
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
          <div class="panel-title">${s("users")} Accounts</div>
          <button class="panel-x" onclick="closeOv('acct')">${s("x")}</button>
        </div>
        <div class="panel-body" id="acct-panel-body"></div>
      </div>
    </div>

    <!-- SETTINGS OVERLAY -->
    <div class="overlay" id="ov-cfg" onclick="closeOv('cfg')">
      <div class="panel wide" onclick="event.stopPropagation()">
        <div class="panel-hd">
          <div class="panel-title">${s("settings")} Settings</div>
          <button class="panel-x" onclick="closeOv('cfg')">${s("x")}</button>
        </div>
        <div class="settings-wrap">
          <div class="s-nav">
            <button class="sn-btn on" onclick="setSnav(this,'s-general')">${s("settings")} General</button>
            <button class="sn-btn" onclick="setSnav(this,'s-java')">${s("cpu")} Java &amp; RAM</button>
            <button class="sn-btn" onclick="setSnav(this,'s-look')">${s("palette")} Appearance</button>
            <button class="sn-btn" onclick="setSnav(this,'s-about')">${s("info")} About</button>
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
                    <button class="btn btn-s btn-sm" onclick="detectJava()">${s("search")} Detect</button>
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
                <div class="about-logo">${s("zap")}</div>
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
          <button class="modal-x" id="m-x">${s("x")}</button>
        </div>
        <div class="modal-body" id="m-body"></div>
        <div class="modal-foot" id="m-foot"></div>
      </div>
    </div>

    <div class="nstack" id="nstack"></div>
  `}function fe(){document.getElementById("tb-min").onclick=()=>u.minimize(),document.getElementById("tb-max").onclick=()=>u.maximize(),document.getElementById("tb-cls").onclick=()=>u.close(),document.getElementById("tb-notif").onclick=()=>r("No new notifications","inf"),document.getElementById("tb-acct").onclick=()=>B("acct"),document.getElementById("tb-cfg").onclick=()=>B("cfg"),document.querySelectorAll(".nav-btn[data-p]").forEach(e=>e.onclick=()=>H(e.dataset.p)),document.getElementById("sb-toggle").onclick=()=>{a.sidebarWide=!a.sidebarWide,document.getElementById("sidebar").classList.toggle("wide",a.sidebarWide)},document.getElementById("m-x").onclick=y,document.getElementById("modal-ov").onclick=e=>{e.target===e.currentTarget&&y()},document.getElementById("con-close").onclick=()=>document.getElementById("console").classList.remove("open"),document.getElementById("bb-acct").onclick=()=>B("acct"),document.querySelectorAll("[data-mt]").forEach(e=>e.onclick=()=>R(e.dataset.mt)),document.querySelectorAll("[data-src]").forEach(e=>e.onclick=()=>{document.querySelectorAll("[data-src]").forEach(t=>t.classList.remove("on")),e.classList.add("on"),a.modSrc=e.dataset.src}),document.getElementById("mod-q").onkeydown=e=>{e.key==="Enter"&&U(!0)},document.getElementById("mod-prof-sel").onchange=()=>{a.modTab==="installed"&&O()},document.getElementById("ins-q").oninput=e=>{const t=e.target.value.toLowerCase();document.querySelectorAll(".ins-row").forEach(i=>{var l,n;return i.style.display=(n=(l=i.querySelector(".irn"))==null?void 0:l.textContent)!=null&&n.toLowerCase().includes(t)?"":"none"})},document.querySelectorAll("[data-f]").forEach(e=>e.onclick=()=>{e.closest(".pills").querySelectorAll(".pill").forEach(t=>t.classList.remove("on")),e.classList.add("on"),P()}),document.getElementById("ver-q").oninput=()=>P(),Je(),Oe(),w("download:progress",e=>Ie(e)),w("game:started",e=>Pe(e)),w("game:stopped",e=>Le(e)),w("game:log",e=>Ae(e)),w("version:install:progress",e=>$e(e)),w("auth:waiting",e=>r(e.message,"inf")),w("auth:success",e=>{r(`Signed in as ${e.username}`,"ok"),syncAcctPanel()})}function H(e){var t,i;a.page=e,document.querySelectorAll(".page").forEach(l=>l.classList.remove("on")),document.querySelectorAll(".nav-btn[data-p]").forEach(l=>l.classList.remove("on")),(t=document.getElementById(`page-${e}`))==null||t.classList.add("on"),(i=document.querySelector(`.nav-btn[data-p="${e}"]`))==null||i.classList.add("on"),e==="home"&&(G(),M(),N()),e==="versions"&&P(),e==="store"&&(j(),R(a.modTab))}function E(){var n,c;const e=a.account,t=document.getElementById("bb-av"),i=document.getElementById("bb-name"),l=document.getElementById("bb-type");e?(t.textContent=((c=(n=e.username)==null?void 0:n[0])==null?void 0:c.toUpperCase())||"?",t.style.fontSize="14px"):t.innerHTML=s("user"),i&&(i.textContent=(e==null?void 0:e.username)||"Not signed in"),l&&(l.textContent=e?e.type==="microsoft"?"Microsoft Account":"Offline Account":"Click to add account")}function B(e){var t;(t=document.getElementById(`ov-${e}`))==null||t.classList.add("open"),e==="acct"&&L()}function ge(e){var t;(t=document.getElementById(`ov-${e}`))==null||t.classList.remove("open")}function ye(e,t){document.querySelectorAll(".sn-btn").forEach(i=>i.classList.remove("on")),e.classList.add("on"),document.querySelectorAll('[id^="s-"]').forEach(i=>i.style.display="none"),document.getElementById(t).style.display=""}window.setSnav=ye;async function he(){try{const e=await u.getJavaPath();document.getElementById("java-path-in").value=e||"",r(e?`Java: ${e}`:"Java not found","ok")}catch{r("Detection failed","err")}}window.detectJava=he;function Q(e){a.slideIdx=e,document.getElementById("c-slides").style.transform=`translateX(-${e*100}%)`,document.querySelectorAll(".cdot").forEach((t,i)=>t.classList.toggle("on",i===e))}window.goSlide=Q;function be(){setInterval(()=>Q((a.slideIdx+1)%3),5500)}function G(){const e=document.getElementById("rail-list");if(e){if(!a.profiles.length){e.innerHTML='<div style="padding:14px 10px;font-size:11px;color:var(--t3);text-align:center">No profiles yet</div>';return}e.innerHTML=a.profiles.map(t=>`
    <div class="rail-item ${t.id===a.activeId?"on":""}" data-id="${t.id}">
      <div class="ri-dot" style="${z(t)};border-color:${I(t.color||"#6C63FF",.3)}">
        ${s(T(t))}
      </div>
      <div>
        <div class="ri-pname">${f(t.name)}</div>
        <div class="ri-pver">${t.gameVersion} · ${k(t.modLoader||"vanilla")}</div>
      </div>
    </div>
  `).join(""),e.querySelectorAll(".rail-item").forEach(t=>t.onclick=()=>D(t.dataset.id))}}function N(){const e=document.getElementById("recent-list");!e||!a.profiles.length||(e.innerHTML=a.profiles.slice(0,5).map(t=>`
    <div class="recent-item" data-id="${t.id}">
      <div class="ri-ico" style="${z(t)}">${s(T(t))}</div>
      <div>
        <div class="ri-name">${f(t.name)}</div>
        <div class="ri-ver">${t.gameVersion} · ${k(t.modLoader||"vanilla")}</div>
      </div>
      <div class="ri-time">${t.totalPlayedSecs>0?te(t.totalPlayedSecs):"New"}</div>
    </div>
  `).join(""),e.querySelectorAll(".recent-item").forEach(t=>t.onclick=()=>D(t.dataset.id)))}function M(){const e=document.getElementById("sel-card");if(!e)return;const t=a.profiles.find(o=>o.id===a.activeId);if(!t){e.innerHTML=`<div class="empty">
      <div class="empty-ico">${s("layers")}</div>
      <div class="empty-t">No profile selected</div>
      <div class="empty-d">Pick a profile or create one</div>
      <button class="btn btn-p btn-sm" onclick="newProfileModal()">${s("plus")} New Profile</button>
    </div>`;return}a.running.has(t.id);const i=a.installedVers.has(t.gameVersion),n={fabric:"#f9a855",forge:"#e8834a",neoforge:"#c084fc",quilt:"#60a5fa",vanilla:"var(--ok)"}[t.modLoader||"vanilla"]||"var(--ok)";e.innerHTML=`
    <div class="gc-title">${s("layers")} Active Profile</div>
    <div class="sel-row">
      <div class="sel-icon" style="${z(t)};border:1px solid ${I(t.color||"#6C63FF",.35)}">
        ${s(T(t))}
      </div>
      <div>
        <div class="sel-name">${f(t.name)}</div>
        <div class="sel-meta">${t.description||"Minecraft "+t.gameVersion}</div>
      </div>
    </div>
    <div class="sel-badges">
      <span class="bdg bdg-ver">${s("package")} ${t.gameVersion}</span>
      <span class="bdg" style="background:${I(n.startsWith("var")?"#4ade80":n,.15)};color:${n};border-color:${I(n.startsWith("var")?"#4ade80":n,.25)}">${k(t.modLoader||"vanilla")}</span>
      ${i?`<span class="bdg bdg-ok">${s("check")} Ready</span>`:`<span class="bdg bdg-warn">${s("cloud-dl")} Not installed</span>`}
    </div>
    <div class="stats-grid">
      <div class="stat-box"><div class="sb-v">${t.maxMemoryMB||2048}MB</div><div class="sb-k">Max RAM</div></div>
      <div class="stat-box"><div class="sb-v">${te(t.totalPlayedSecs||0)}</div><div class="sb-k">Played</div></div>
      <div class="stat-box"><div class="sb-v">${k(t.modLoader||"vanilla")}</div><div class="sb-k">Loader</div></div>
      <div class="stat-box"><div class="sb-v">${t.minMemoryMB||512}MB</div><div class="sb-k">Min RAM</div></div>
    </div>
    <div style="display:flex;gap:7px;margin-top:12px;flex-wrap:wrap">
      <button class="btn btn-s btn-sm" onclick="editProfileModal('${t.id}')">${s("edit3")} Edit</button>
      <button class="btn btn-s btn-sm" onclick="openModsFor('${t.id}')">${s("puzzle")} Mods</button>
      <button class="btn btn-g btn-sm" onclick="openFolder('${t.id}')" title="Open folder">${s("folder")}</button>
    </div>
  `;const c=document.getElementById("ver-pill-txt");c&&(c.textContent=`${k(t.modLoader||"vanilla")} ${t.gameVersion} — ${t.name}`)}async function D(e){a.activeId=e,await u.setActiveProfile(e).catch(()=>{}),G(),M(),N(),Se(),j();const t=a.profiles.find(i=>i.id===e);t&&!a.installedVers.has(t.gameVersion)&&await u.isVersionInstalled(t.gameVersion).catch(()=>!1)&&(a.installedVers.add(t.gameVersion),M())}function xe(e){a.activeId=e,H("store"),R("installed"),document.getElementById("mod-prof-sel").value=e,O()}window.openModsFor=xe;async function we(){if(!a.account){B("acct");return}const e=a.profiles.find(i=>i.id===a.activeId);if(!e){r("Select a profile first","err");return}if(a.running.has(e.id)){await u.stopProfile(e.id).catch(()=>{});return}if(!await u.isVersionInstalled(e.gameVersion).catch(()=>!1)){Me(e.gameVersion);try{await u.installVersion(e.gameVersion),a.installedVers.add(e.gameVersion)}catch(i){K(),M(),r("Install failed: "+(i.message||i),"err");return}K(),M()}r(`Launching ${e.name}...`,"inf");try{await u.launchProfile(e.id)}catch(i){r(i.message||"Launch failed","err")}}function Me(e){const t=document.getElementById("ver-install-box");document.getElementById("ver-inst-title").textContent=`Installing Minecraft ${e}...`,document.getElementById("ver-inst-msg").textContent="Starting download...",document.getElementById("ver-inst-bar").style.width="0%",t&&(t.style.display="block"),q(`Installing ${e}`,0)}function K(){const e=document.getElementById("ver-install-box");e&&(e.style.display="none"),ke()}function $e(e){const t=document.getElementById("ver-inst-bar"),i=document.getElementById("ver-inst-msg");t&&(t.style.width=(e.progress||0)+"%"),i&&(i.textContent=e.message||""),q(e.message||"Installing...",e.progress||0)}function q(e,t){document.getElementById("prog-wrap").style.display="block",document.getElementById("prog-lbl").textContent=e,document.getElementById("prog-pct").textContent=Math.round(t)+"%",document.getElementById("pfill").style.width=t+"%"}function ke(){document.getElementById("prog-wrap").style.display="none"}function Ie(e){q(e.name,e.progress||0)}function Pe(e){a.running.add(e.profileId);const t=a.profiles.find(l=>l.id===e.profileId);document.getElementById("con-lbl").textContent=(t==null?void 0:t.name)||"Console",document.getElementById("console").classList.add("open");const i=document.getElementById("play-btn");i&&(i.querySelector(".play-ico").innerHTML=s("square"),i.querySelector(".play-txt").textContent="STOP",i.classList.add("running")),M(),P(),r(`${(t==null?void 0:t.name)||"Game"} launched!`,"ok")}function Le(e){a.running.delete(e.profileId);const t=document.getElementById("play-btn");t&&(t.querySelector(".play-ico").innerHTML=s("play"),t.querySelector(".play-txt").textContent="LAUNCH",t.classList.remove("running")),M(),P(),r("Game closed","inf")}function Ae(e){const t=document.getElementById("con-out");if(!t)return;const i=e.line||"",l=document.createElement("div");l.className=i.toLowerCase().includes("error")?"le":i.toLowerCase().includes("warn")?"lw":i.includes("[INFO]")?"li":"",l.textContent=i,t.appendChild(l),t.children.length>600&&t.removeChild(t.firstChild),t.scrollTop=t.scrollHeight}async function Ee(e){try{await u.openProfileFolder(e)}catch{r("Cannot open folder","err")}}window.openFolder=Ee;function P(){var n,c;const e=document.getElementById("vgrid");if(!e)return;const t=(((n=document.getElementById("ver-q"))==null?void 0:n.value)||"").toLowerCase(),i=((c=document.querySelector("[data-f].on"))==null?void 0:c.dataset.f)||"all";let l=a.profiles.filter(o=>t&&!o.name.toLowerCase().includes(t)&&!o.gameVersion.toLowerCase().includes(t)?!1:i==="all"?!0:i==="vanilla"?!o.modLoader||o.modLoader==="vanilla":o.modLoader===i);if(!l.length){e.innerHTML=`<div class="empty" style="grid-column:1/-1">
      <div class="empty-ico">${s("layers")}</div>
      <div class="empty-t">No profiles found</div>
      <div class="empty-d">Try a different filter or create a new profile</div>
      <button class="btn btn-p btn-sm" onclick="newProfileModal()">${s("plus")} New Profile</button>
    </div>`;return}e.innerHTML=l.map(o=>{const g=a.running.has(o.id);return`
    <div class="vcard ${o.id===a.activeId?"on":""}" data-id="${o.id}">
      ${o.id===a.activeId?'<div class="vcard-glow"></div>':""}
      <div class="vcard-thumb" style="${z(o)}">
        ${s(T(o))}
      </div>
      <div class="vcard-name">${f(o.name)}</div>
      <div class="vcard-sub">${o.description||"Minecraft "+o.gameVersion}</div>
      <div class="vcard-tags">
        <span class="vtag vtag-v">${s("package")} ${o.gameVersion}</span>
        <span class="vtag vtag-l">${k(o.modLoader||"vanilla")}</span>
        ${g?`<span class="vtag" style="background:rgba(74,222,128,.15);color:var(--ok)">${s("zap")} Running</span>`:""}
      </div>
      <div style="display:flex;gap:5px;margin-top:10px">
        <button class="btn ${g?"btn-d":"btn-p"} btn-sm" onclick="event.stopPropagation();launchCard('${o.id}')">
          ${s(g?"square":"play")} ${g?"Stop":"Play"}
        </button>
        <button class="iBtn btn-sm" onclick="event.stopPropagation();editProfileModal('${o.id}')" title="Edit">${s("edit3")}</button>
        <button class="iBtn btn-sm" onclick="event.stopPropagation();dupProfile('${o.id}')" title="Duplicate">${s("copy")}</button>
        <button class="iBtn btn-sm" onclick="event.stopPropagation();openFolder('${o.id}')" title="Open folder">${s("folder")}</button>
        <button class="iBtn btn-sm" style="color:var(--err);margin-left:auto" onclick="event.stopPropagation();delProfile('${o.id}')" title="Delete">${s("trash2")}</button>
      </div>
    </div>`}).join(""),e.querySelectorAll(".vcard").forEach(o=>o.onclick=g=>{g.target.closest(".btn,.iBtn")||D(o.dataset.id)})}window.launchCard=function(e){a.activeId=e,H("home"),we()};function Se(){a.page==="versions"&&P()}async function Ce(){A("New Profile",await _(),[{lbl:"Cancel",cls:"btn-s",fn:y},{lbl:"Create Profile",cls:"btn-p",fn:Ve}])}async function Be(e){const t=a.profiles.find(i=>i.id===e);t&&A("Edit Profile",await _(t),[{lbl:"Cancel",cls:"btn-s",fn:y},{lbl:"Save Changes",cls:"btn-p",fn:()=>Te(e)}])}window.newProfileModal=Ce;window.editProfileModal=Be;async function _(e=null){const t=["#6C63FF","#22c55e","#f59e0b","#ef4444","#2dd4bf","#f97316","#e879f9","#60a5fa"],i=[{k:"grass",n:"Grass"},{k:"flame",n:"Fire"},{k:"snowflake",n:"Snow"},{k:"rocket",n:"Rocket"},{k:"zap",n:"Zap"},{k:"star",n:"Star"},{k:"sparkles",n:"Magic"},{k:"sword",n:"Sword"},{k:"boxes",n:"Pack"},{k:"layers",n:"Default"}],l=(e==null?void 0:e.color)||"#6C63FF",n=(e==null?void 0:e.icon)||"grass";let c='<option value="1.21">1.21</option>';try{a.versions||(a.versions=await u.getVersionList()),c=a.versions.versions.filter(o=>o.type==="release").map(o=>`<option value="${o.id}" ${o.id===(e==null?void 0:e.gameVersion)?"selected":""}>${o.id}</option>`).join("")}catch{}return`
    <div class="fg"><label class="fl">Icon</label>
      <div class="ico-grid">${i.map(o=>`<button type="button" class="ico-o ${o.k===n?"on":""}" title="${o.n}"
        onclick="document.querySelectorAll('.ico-o').forEach(b=>b.classList.remove('on'));this.classList.add('on');document.getElementById('fi').value='${o.k}'">${s(o.k)}</button>`).join("")}</div>
      <input type="hidden" id="fi" value="${n}">
    </div>
    <div class="fg"><label class="fl">Name *</label>
      <input type="text" class="fi" id="fn" placeholder="My Profile" value="${f((e==null?void 0:e.name)||"")}">
    </div>
    <div class="fg"><label class="fl">Color</label>
      <div class="clrs">${t.map(o=>`<div class="clr ${o===l?"on":""}" style="background:${o}"
        onclick="document.querySelectorAll('.clr').forEach(s=>s.classList.remove('on'));this.classList.add('on');document.getElementById('fc').value='${o}'"></div>`).join("")}</div>
      <input type="hidden" id="fc" value="${l}">
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="fg" style="margin:0"><label class="fl">Minecraft Version *</label>
        <select class="fi" id="fv" style="width:100%">${c}</select></div>
      <div class="fg" style="margin:0"><label class="fl">Mod Loader</label>
        <select class="fi" id="fl2" style="width:100%">
          ${["vanilla","fabric","forge","neoforge","quilt"].map(o=>`<option value="${o}" ${(e==null?void 0:e.modLoader)===o?"selected":""}>${k(o)}</option>`).join("")}
        </select></div>
    </div>
    <div class="fg" style="margin-top:10px"><label class="fl">Max RAM</label>
      <div style="display:flex;align-items:center;gap:10px">
        <input type="range" id="fm" min="512" max="32768" step="512" value="${(e==null?void 0:e.maxMemoryMB)||2048}" oninput="document.getElementById('fmv').textContent=this.value+'MB'" style="flex:1">
        <span class="ram-val" id="fmv">${(e==null?void 0:e.maxMemoryMB)||2048}MB</span>
      </div>
    </div>
    <div class="fg"><label class="fl">Description</label>
      <textarea class="fi" id="fd" rows="2" placeholder="Optional...">${f((e==null?void 0:e.description)||"")}</textarea></div>
    <div class="fg" style="margin:0"><label class="fl">Java Arguments</label>
      <input type="text" class="fi" id="fj" value="${f((e==null?void 0:e.javaArgs)||"-XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:MaxGCPauseMillis=50")}">
    </div>`}function Y(){var e,t,i,l,n,c,o,g,h;return{icon:((e=document.getElementById("fi"))==null?void 0:e.value)||"grass",name:((i=(t=document.getElementById("fn"))==null?void 0:t.value)==null?void 0:i.trim())||"",color:((l=document.getElementById("fc"))==null?void 0:l.value)||"#6C63FF",gameVersion:((n=document.getElementById("fv"))==null?void 0:n.value)||"1.21",modLoader:((c=document.getElementById("fl2"))==null?void 0:c.value)||"vanilla",maxMemoryMB:parseInt(((o=document.getElementById("fm"))==null?void 0:o.value)||"2048"),description:((g=document.getElementById("fd"))==null?void 0:g.value)||"",javaArgs:((h=document.getElementById("fj"))==null?void 0:h.value)||""}}async function Ve(){const e=Y();if(!e.name)return r("Name is required","err");try{const t=await u.createProfile(e);e.javaArgs&&await u.updateProfile(t.id,{javaArgs:e.javaArgs}),a.profiles=await u.getProfiles(),a.activeId=t.id,y(),S(),r(`Profile "${e.name}" created`,"ok")}catch(t){r(t.message||"Failed","err")}}async function Te(e){const t=Y();try{await u.updateProfile(e,t),a.profiles=await u.getProfiles(),y(),S(),r("Saved","ok")}catch(i){r(i.message||"Failed","err")}}async function ze(e){try{await u.duplicateProfile(e),a.profiles=await u.getProfiles(),S(),r("Duplicated","ok")}catch(t){r(t.message,"err")}}function He(e){const t=a.profiles.find(i=>i.id===e);t&&A("Delete Profile",`<div style="display:flex;gap:14px;align-items:flex-start"><div style="font-size:28px;color:var(--err)">${s("alert-circle")}</div><div><div style="font-weight:700;margin-bottom:6px">Delete "${f(t.name)}"?</div><div style="font-size:12px;color:var(--t2);line-height:1.6">This will permanently remove the profile and all its game files. This cannot be undone.</div></div></div>`,[{lbl:"Cancel",cls:"btn-s",fn:y},{lbl:"Delete",cls:"btn-d",fn:async()=>{var i;await u.deleteProfile(e),a.profiles=await u.getProfiles(),a.activeId===e&&(a.activeId=((i=a.profiles[0])==null?void 0:i.id)||null),y(),S(),r("Deleted","inf")}}])}window.dupProfile=ze;window.delProfile=He;function S(){G(),M(),N(),P(),j()}function j(){const e=document.getElementById("mod-prof-sel");e&&(e.innerHTML='<option value="">Profile...</option>'+a.profiles.map(t=>`<option value="${t.id}" ${t.id===a.activeId?"selected":""}>${f(t.name)}</option>`).join(""),a.activeId&&(e.value=a.activeId))}function R(e){a.modTab=e,document.querySelectorAll("[data-mt]").forEach(t=>t.classList.toggle("on",t.dataset.mt===e)),document.getElementById("mt-browse").style.display=e==="browse"?"flex":"none",document.getElementById("mt-installed").style.display=e==="installed"?"flex":"none",document.getElementById("mt-modpacks").style.display=e==="modpacks"?"flex":"none",e==="browse"&&!a.modResults.length&&U(!0),e==="installed"&&O(),e==="modpacks"&&Ne()}let V=null;function Oe(){const e=document.getElementById("mod-grid");e&&(V=new IntersectionObserver(t=>{t[0].isIntersecting&&!a.modLoading&&a.modHasMore&&U(!1)},{root:e,threshold:.1}))}async function U(e=!1){var n,c,o;if(a.modLoading&&!e||(e&&(a.modPage=0,a.modHasMore=!0,a.modResults=[]),!a.modHasMore))return;const t=((n=document.getElementById("mod-q"))==null?void 0:n.value)||"",i=((c=a.profiles.find(g=>g.id===a.activeId))==null?void 0:c.gameVersion)||"",l=document.getElementById("mod-grid");a.modLoading=!0,e&&(l.innerHTML='<div class="inf-end"><div class="spin spin-lg"></div></div>');try{const g=a.modSrc==="modrinth"?await u.searchModrinth(t,i,a.modPage):await u.searchCurseForge(t,i,a.modPage),h=(g==null?void 0:g.items)||[];if(e&&(l.innerHTML=""),!h.length&&e){l.innerHTML=`<div class="empty" style="grid-column:1/-1"><div class="empty-ico">${s("puzzle")}</div><div class="empty-t">No results</div><div class="empty-d">Try different keywords</div></div>`,a.modHasMore=!1;return}if((o=l.querySelector(".inf-end"))==null||o.remove(),h.forEach(b=>l.appendChild(ee(b))),a.modResults=[...a.modResults,...h],a.modHasMore=h.length>=20,a.modPage++,a.modHasMore){const b=document.createElement("div");b.className="inf-end",b.innerHTML='<div class="spin"></div>',l.appendChild(b),V==null||V.observe(b)}}catch(g){e&&(l.innerHTML=`<div class="empty" style="grid-column:1/-1"><div class="empty-ico">${s("alert-circle")}</div><div class="empty-t">Error</div><div class="empty-d">${f(g.message)}</div></div>`)}finally{a.modLoading=!1}}function ee(e){const t=document.createElement("div");t.className="scard";const i=e.source==="modrinth"?"src-mr":"src-cf",l=e.source==="modrinth"?"Modrinth":"CurseForge";return t.innerHTML=`
    <div class="scard-img" style="--sg:linear-gradient(135deg,${I(e.source==="modrinth"?"#1bd96a":"#f0763a",.15)},rgba(108,99,255,.06))">
      ${e.iconUrl?`<img src="${e.iconUrl}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;border-radius:var(--r3) var(--r3) 0 0" onerror="this.remove()">`:""}
      <span class="scard-fallback">${s("puzzle")}</span>
    </div>
    <div class="scard-body">
      <div class="scard-name">${f(e.name)}</div>
      <div class="scard-desc">${f(e.description)}</div>
      <div class="scard-foot">
        <span class="scard-src ${i}">${l}</span>
        <span class="scard-dl">${s("download")} ${ie(e.downloads)}</span>
        <span class="scard-star">${s("star")} ${(4.5+Math.random()*.4).toFixed(1)}</span>
        <button class="scard-ibtn" title="Install">${s("plus")}</button>
      </div>
    </div>`,t.querySelector(".scard-ibtn").onclick=n=>{n.stopPropagation(),Fe(e,t)},t.onclick=()=>Ge(e),t}async function Fe(e,t){var n;const i=(n=document.getElementById("mod-prof-sel"))==null?void 0:n.value;if(!i){r("Select a profile first","err");return}const l=t==null?void 0:t.querySelector(".scard-ibtn");l&&(l.innerHTML='<div class="spin" style="width:13px;height:13px;border-width:2px"></div>',l.style.pointerEvents="none");try{await u.installMod(i,e.id,e.source,""),l&&(l.innerHTML=s("check"),l.classList.add("done")),r(`${e.name} installed`,"ok")}catch(c){l&&(l.innerHTML=s("plus"),l.style.pointerEvents=""),r(c.message||"Install failed","err")}}function Ge(e){var t,i;A(e.name,`
    <div style="display:flex;gap:13px;margin-bottom:14px;align-items:flex-start">
      <div style="width:56px;height:56px;border-radius:var(--r2);background:var(--bg3);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:var(--t3)">
        ${e.iconUrl?`<img src="${e.iconUrl}" style="width:100%;height:100%;object-fit:cover">`:`<div style="width:28px;height:28px">${s("puzzle")}</div>`}
      </div>
      <div><div style="font-weight:800;font-size:14px;margin-bottom:4px">${f(e.name)}</div>
        <div style="font-size:11px;color:var(--t2)">by ${f(e.author||"Unknown")}</div>
        <div style="display:flex;gap:5px;margin-top:6px">
          <span class="scard-src ${e.source==="modrinth"?"src-mr":"src-cf"}">${e.source}</span>
          <span style="font-size:10px;color:var(--t3);display:flex;align-items:center;gap:3px">${s("download")} ${ie(e.downloads)}</span>
        </div>
      </div>
    </div>
    <div style="font-size:12px;color:var(--t2);line-height:1.65;margin-bottom:12px">${f(e.description)}</div>
    ${(t=e.gameVersions)!=null&&t.length?`<div style="font-size:11px;color:var(--t3);margin-bottom:5px;display:flex;align-items:center;gap:5px">${s("package")} <strong style="color:var(--t2)">Versions:</strong> ${e.gameVersions.slice(0,6).join(", ")}</div>`:""}
    ${(i=e.modLoaders)!=null&&i.length?`<div style="font-size:11px;color:var(--t3);display:flex;align-items:center;gap:5px">${s("cpu")} <strong style="color:var(--t2)">Loaders:</strong> ${e.modLoaders.join(", ")}</div>`:""}
  `,[{lbl:"Close",cls:"btn-s",fn:y},{lbl:"Install",cls:"btn-p",fn:async()=>{var n;const l=(n=document.getElementById("mod-prof-sel"))==null?void 0:n.value;if(!l){r("Select a profile first","err");return}y(),r(`Installing ${e.name}...`,"inf");try{await u.installMod(l,e.id,e.source,""),r(`${e.name} installed`,"ok")}catch(c){r(c.message,"err")}}}])}async function Ne(){const e=document.getElementById("pack-grid");e.innerHTML='<div class="inf-end"><div class="spin spin-lg"></div></div>';try{const t=await u.searchModpack("","modrinth","",0),i=(t==null?void 0:t.items)||[];if(!i.length){e.innerHTML=`<div class="empty" style="grid-column:1/-1"><div class="empty-ico">${s("boxes")}</div><div class="empty-t">No modpacks found</div></div>`;return}e.innerHTML="",i.forEach(l=>{const n=ee(l);n.querySelector(".scard-ibtn").onclick=c=>{c.stopPropagation(),De(l)},e.appendChild(n)})}catch{e.innerHTML='<div class="empty" style="grid-column:1/-1"><div class="empty-t">Error</div></div>'}}function De(e){A(`Install: ${e.name}`,`
    <p style="font-size:12px;color:var(--t2);margin-bottom:13px;line-height:1.6">A new profile will be created with all mods automatically installed.</p>
    <div class="fg"><label class="fl">Profile Name</label><input type="text" class="fi" id="fpn" value="${f(e.name)}"></div>
  `,[{lbl:"Cancel",cls:"btn-s",fn:y},{lbl:"Install Modpack",cls:"btn-p",fn:async()=>{var i,l;const t=((l=(i=document.getElementById("fpn"))==null?void 0:i.value)==null?void 0:l.trim())||e.name;y(),r(`Installing "${t}"...`,"inf");try{await u.installModpack(e.id,"","modrinth",t),a.profiles=await u.getProfiles(),S(),r(`"${t}" installed`,"ok")}catch(n){r(n.message,"err")}}}])}async function O(){var i;const e=((i=document.getElementById("mod-prof-sel"))==null?void 0:i.value)||a.activeId,t=document.getElementById("ins-list");if(t){if(!e){t.innerHTML=`<div class="empty"><div class="empty-ico">${s("layers")}</div><div class="empty-t">Select a profile</div></div>`;return}t.innerHTML='<div style="display:flex;justify-content:center;padding:24px"><div class="spin spin-lg"></div></div>';try{const l=await u.getProfileMods(e)||[];if(!l.length){t.innerHTML=`<div class="empty"><div class="empty-ico">${s("puzzle")}</div><div class="empty-t">No mods installed</div><div class="empty-d">Browse mods and install them here</div></div>`;return}t.innerHTML=l.map(n=>`
      <div class="ins-row" style="display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:var(--r2);transition:background .12s">
        <div style="width:32px;height:32px;border-radius:7px;background:var(--bg3);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:var(--t3)">${s("puzzle")}</div>
        <div style="flex:1;min-width:0">
          <div class="irn" style="font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f(n.name||n.fileName)}</div>
          <div style="font-size:10px;color:var(--t3)">${n.version||n.fileName} · ${Ze(n.fileSize||0)}</div>
        </div>
        <div class="toggle ${n.enabled?"on":""}" data-f="${n.fileName}" style="flex-shrink:0"></div>
        <button class="iBtn" style="color:var(--err);flex-shrink:0" data-f="${n.fileName}">${s("trash2")}</button>
      </div>`).join(""),t.querySelectorAll(".toggle").forEach(n=>{n.onclick=async()=>{const c=n.classList.toggle("on");try{await u.toggleMod(e,n.dataset.f,c)}catch(o){n.classList.toggle("on"),r(o.message,"err")}}}),t.querySelectorAll(".iBtn[data-f]").forEach(n=>{n.onclick=()=>u.uninstallMod(e,n.dataset.f).then(()=>{O(),r("Mod removed","inf")}).catch(c=>r(c.message,"err"))})}catch(l){t.innerHTML=`<div class="empty"><div class="empty-t">${f(l.message)}</div></div>`}}}async function L(){var l,n,c,o;const e=document.getElementById("acct-panel-body");if(!e)return;const t=await u.getAllAccounts()||[],i=a.account;if(!t.length)e.innerHTML=`<div class="empty" style="padding:32px 20px"><div class="empty-ico">${s("user")}</div><div class="empty-t">No accounts</div><div class="empty-d">Sign in to access online features</div></div>
      <button class="add-btn" id="ab-ms">${s("log-in")} Sign in with Microsoft</button>
      <button class="add-btn sec" id="ab-off">${s("user")} Add Offline Account</button>`;else{const g=s("check"),h=s("trash2"),b=s("log-in"),se=s("user"),ne=t.map(x=>{var J,Z;const le=x.type==="microsoft"?"rgba(34,211,238,.12)":"rgba(108,99,255,.15)",ae=x.type==="microsoft"?"var(--a3)":"#b0a8ff",oe=((Z=(J=x.username)==null?void 0:J[0])==null?void 0:Z.toUpperCase())||"?",de=(i==null?void 0:i.uuid)===x.uuid?`<span style="margin-left:auto;margin-right:10px;color:var(--ok);display:flex;align-items:center;width:16px">${g}</span>`:`<button class="btn btn-s btn-sm" style="margin-left:auto;margin-right:6px" onclick="swAcct('${x.uuid}')">Use</button>`;return`<div class="acct-row">
        <div class="ar-av" style="background:${le};color:${ae}">${oe}</div>
        <div><div class="ar-name">${f(x.username)}</div><div class="ar-type">${x.type==="microsoft"?"Microsoft":"Offline"}</div></div>
        ${de}
        <button class="ar-del" onclick="rmAcct('${x.uuid}')">${h}</button>
      </div>`}).join("");e.innerHTML=`
      <div class="acct-hero">
        <div class="ah-av">${((n=(l=i==null?void 0:i.username)==null?void 0:l[0])==null?void 0:n.toUpperCase())||"?"}</div>
        <div><div class="ah-name">${f((i==null?void 0:i.username)||"Unknown")}</div><div class="ah-type">${(i==null?void 0:i.type)==="microsoft"?"Microsoft Account":"Offline Account"}</div></div>
        <div class="ah-badge">${g} Active</div>
      </div>
      <div style="font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.09em;margin-bottom:8px">All Accounts</div>
      <div class="acct-list">${ne}</div>
      <button class="add-btn" id="ab-ms" style="margin-top:10px">${b} Add Microsoft Account</button>
      <button class="add-btn sec" id="ab-off">${se} Add Offline Account</button>`}(c=document.getElementById("ab-ms"))==null||c.addEventListener("click",qe),(o=document.getElementById("ab-off"))==null||o.addEventListener("click",je)}window.syncAcctPanel=()=>{E(),L()};window.swAcct=async function(e){await u.switchAccount(e),a.account=(await u.getAllAccounts()).find(t=>t.uuid===e)||null,E(),L(),r("Account switched","inf")};window.rmAcct=async function(e){await u.removeAccount(e),a.account=(await u.getAllAccounts())[0]||null,E(),L(),r("Account removed","inf")};async function qe(){ge("acct"),A("Sign in with Microsoft",`
    <div style="text-align:center;padding:10px">
      <div style="font-size:13px;color:var(--t2);margin-bottom:18px;line-height:1.7">A browser window will open.<br>Sign in with your Microsoft account there.</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:10px;background:var(--ag);border:1px solid var(--bda);border-radius:var(--r2);padding:14px 20px;margin-bottom:14px">
        <div class="spin"></div><span id="ms-wait" style="font-size:13px;color:var(--a1)">Opening browser...</span>
      </div>
      <div style="font-size:11px;color:var(--t3)">Complete login in your browser, then return here.</div>
    </div>
  `,[{lbl:"Cancel",cls:"btn-s",fn:y}]);const e=w("auth:success",t=>{e==null||e();const i=document.getElementById("ms-wait");i&&(i.textContent=`✓ Signed in as ${t.username}`),setTimeout(()=>{y(),L()},1200)});try{a.account=await u.loginMicrosoft(),E(),y(),L(),r(`Signed in as ${a.account.username}`,"ok")}catch(t){y(),r(t.message||"Login failed","err")}}function je(){A("Add Offline Account",`
    <div class="fg"><label class="fl">Username</label><input type="text" class="fi" id="off-un" placeholder="Enter username" maxlength="16"></div>
  `,[{lbl:"Cancel",cls:"btn-s",fn:y},{lbl:"Add Account",cls:"btn-p",fn:async()=>{var t,i;const e=(i=(t=document.getElementById("off-un"))==null?void 0:t.value)==null?void 0:i.trim();if(!e){r("Enter a username","err");return}try{a.account=await u.loginOffline(e),E(),y(),L(),r(`Playing as ${e}`,"ok")}catch(l){r(l.message,"err")}}}])}function Re(e,t){document.getElementById("skin-gal").querySelectorAll(".sg-item").forEach(i=>i.classList.remove("on")),e.classList.add("on"),r(`Skin "${t}" selected`,"ok")}function Ue(e,t){e.closest(".skin-gal").querySelectorAll(".sg-item").forEach(i=>i.classList.remove("on")),e.classList.add("on"),r(t==="none"?"Cape removed":`Cape "${t}" selected`,"ok")}window.pickSkin=Re;window.pickCape=Ue;function Je(){const e=document.getElementById("skin-scene");if(!e)return;let t=!1,i=0,l=0;e.addEventListener("mousedown",n=>{t=!0,i=n.clientX}),document.addEventListener("mousemove",n=>{t&&(l+=(n.clientX-i)*.5,e.querySelector(".skin-float").style.transform=`translateY(${Math.sin(Date.now()/1e3)*8}px) rotateY(${l}deg)`,i=n.clientX)}),document.addEventListener("mouseup",()=>t=!1)}function A(e,t,i=[]){document.getElementById("m-title").textContent=e,document.getElementById("m-body").innerHTML=t;const l=document.getElementById("m-foot");l.innerHTML=i.map((n,c)=>`<button class="btn ${n.cls}" id="mb${c}">${n.lbl}</button>`).join(""),i.forEach((n,c)=>document.getElementById(`mb${c}`).onclick=n.fn),document.getElementById("modal-ov").classList.add("open")}function y(){document.getElementById("modal-ov").classList.remove("open")}window.closeModal=y;function r(e,t="inf"){const i=document.getElementById("nstack"),l=document.createElement("div");l.className=`notif ${t}`;const n={ok:s("check"),err:s("x"),inf:s("info")};l.innerHTML=`<span style="width:14px;height:14px;flex-shrink:0">${n[t]||""}</span><span>${f(e)}</span>`,i.appendChild(l),setTimeout(()=>l.remove(),3500)}window.notify=r;function f(e){return e?String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"):""}function k(e){return e?e[0].toUpperCase()+e.slice(1):""}function I(e,t){const i=parseInt(e.slice(1,3),16),l=parseInt(e.slice(3,5),16),n=parseInt(e.slice(5,7),16);return`rgba(${i},${l},${n},${t})`}function te(e){if(!e)return"0h";const t=Math.floor(e/3600),i=Math.floor(e%3600/60);return t>0?`${t}h ${i}m`:`${i}m`}function ie(e){return e?e>=1e6?(e/1e6).toFixed(1)+"M":e>=1e3?(e/1e3).toFixed(0)+"K":String(e):"0"}function Ze(e){return e?e>=1048576?(e/1048576).toFixed(1)+"MB":e>=1024?(e/1024).toFixed(0)+"KB":e+"B":"0B"}ve();
