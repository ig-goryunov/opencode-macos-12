export const MOBILE_HTML = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="theme-color" content="#0b0b0c">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="OpenCode">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="apple-touch-icon" href="/icon.svg">
<title>OpenCode</title>
<style>
  :root { color-scheme: dark; --bg:#0b0b0c; --card:#161618; --line:#26262b; --text:#e4e4e7; --muted:#8f8f99; --accent:#4f8cff; --danger:#f2555a; }
  * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
  html,body { margin:0; height:100%; height:100dvh; touch-action:pan-x pan-y; -webkit-text-size-adjust:100%; background:var(--bg); color:var(--text); font:15px/1.45 -apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif; }
  body { display:flex; flex-direction:column; }
  header { position:sticky; top:0; z-index:5; display:flex; align-items:center; gap:10px; padding:calc(env(safe-area-inset-top) + 10px) 14px 10px; background:rgba(11,11,12,.94); backdrop-filter:blur(12px); border-bottom:1px solid var(--line); }
  header .t { flex:1; min-width:0; font-weight:600; font-size:15px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  header button { border:0; background:none; color:var(--muted); font-size:20px; padding:2px 6px; border-radius:8px; }
  header button:active { background:var(--card); }
  main { flex:1; overflow:auto; padding:12px 12px 18px; -webkit-overflow-scrolling:touch; }
  main[hidden] { display:none; }
  .hint { display:flex; align-items:center; gap:8px; color:var(--muted); font-size:12px; letter-spacing:.02em; text-transform:uppercase; margin:6px 4px 10px; }
  .hint .grow { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .newses { margin-left:auto; border:1px solid var(--line); background:var(--card); color:var(--text); border-radius:8px; padding:3px 8px; font-size:11px; text-transform:none; letter-spacing:0; }
  .card { display:block; width:100%; text-align:left; border:1px solid var(--line); background:var(--card); color:var(--text); border-radius:14px; padding:13px 14px; margin:0 0 10px; }
  .card:active { background:#1d1d21; }
  .card .name { font-weight:600; font-size:15px; display:flex; align-items:center; gap:8px; }
  .card .path { color:var(--muted); font-size:12px; margin-top:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .card .name .meta { margin-left:auto; display:flex; align-items:center; gap:6px; flex:none; }
  .card.unread .name { color:#fff; }
  .badge { display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:600; border-radius:999px; padding:1px 7px; }
  .badge.busy { background:#152a45; color:#8ab6ff; }
  .badge.unread { background:#1f2b1f; color:#86d494; }
  .badge.perm { background:#3a2a12; color:#f0b45a; }
  .empty { color:var(--muted); text-align:center; padding:40px 10px; font-size:14px; }
  .dot { width:7px; height:7px; border-radius:50%; background:#39c07a; flex:none; }
  .dot.busy { background:var(--accent); animation:pulse 1.2s infinite; }
  .dot.new { background:#86d494; }
  @keyframes pulse { 50% { opacity:.35; } }
  #messages { display:flex; flex-direction:column; gap:10px; }
  #chat, #messages { overflow-anchor:none; }
  .msg { position:relative; border:1px solid var(--line); border-radius:14px; padding:11px 13px; background:var(--card); user-select:text; -webkit-user-select:text; }
  .msg.user { background:#1a2333; border-color:#24314a; }
  .msg .role { font-size:11px; color:var(--muted); margin-bottom:6px; text-transform:uppercase; letter-spacing:.04em; }
  .msg .txt { white-space:pre-wrap; word-break:break-word; }
  .msg .txt + .txt { margin-top:8px; }
  .msg .txt strong { font-weight:650; }
  .msg .txt em { font-style:italic; }
  .msg .txt code { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:13px; background:#222226; border-radius:5px; padding:1px 5px; }
  .msg .txt pre { margin:8px 0; padding:10px; background:#101012; border:1px solid var(--line); border-radius:10px; overflow:auto; }
  .msg .txt pre code { background:none; padding:0; font-size:12.5px; line-height:1.4; }
  .msg .txt a { color:var(--accent); text-decoration:none; }
  .msg .txt h1,.msg .txt h2,.msg .txt h3 { font-size:15px; margin:10px 0 6px; }
  .msg .txt ul { margin:6px 0; padding-left:20px; }
  .msg .txt blockquote { margin:6px 0; padding-left:10px; border-left:2px solid var(--line); color:var(--muted); }
  .msg .copy { position:absolute; top:6px; right:6px; display:flex; align-items:center; justify-content:center; width:26px; height:26px; padding:0; border:1px solid var(--line); background:#1b1b1f; color:var(--muted); border-radius:8px; opacity:.8; }
  .msg .copy:active { background:#26262b; color:var(--text); }
  .msg .copy svg { width:14px; height:14px; display:block; }
  .tool { font-size:12px; color:var(--muted); margin-top:8px; border-left:2px solid var(--line); padding-left:8px; }
  .more { text-align:center; padding:4px 0 2px; }
  .more button { border:1px solid var(--line); background:var(--card); color:var(--muted); border-radius:10px; padding:7px 12px; font-size:12px; }
  .perm { border:1px solid #6a5320; background:#241f12; border-radius:14px; padding:12px; margin-bottom:8px; }
  .perm-t { font-weight:600; font-size:13px; }
  .perm-p { color:var(--muted); font-size:12px; margin:4px 0 10px; word-break:break-word; }
  .perm-b { display:flex; gap:8px; }
  .perm-b button { flex:1; border:1px solid var(--line); background:#1b1b1f; color:var(--text); border-radius:10px; padding:9px 4px; font-size:13px; }
  .perm-b button.danger { color:var(--danger); }
  #perms { display:none; flex-direction:column; gap:6px; padding:8px 12px; background:#1d1910; border-bottom:1px solid #3a2f1a; max-height:42dvh; overflow:auto; }
  #perms.show { display:flex; }
  #perms .perm { margin:0; padding:10px; }
  .perm-head { color:#f0b45a; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.04em; }
  .perm-more { color:var(--muted); font-size:11px; }
  footer { position:sticky; bottom:0; border-top:1px solid var(--line); background:rgba(11,11,12,.97); padding:8px 12px calc(env(safe-area-inset-bottom) + 10px); backdrop-filter:blur(12px); }
  footer[hidden] { display:none; }
  #statusrow { display:flex; align-items:center; gap:8px; padding:0 2px 6px; min-height:20px; }
  #statusline { flex:1; min-width:0; color:var(--muted); font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  #modelchip { border:1px solid var(--line); background:#141416; color:var(--muted); border-radius:8px; padding:2px 8px; font-size:11px; max-width:150px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:none; }
  #modelchip:active { background:#1d1d21; }
  .row { display:flex; gap:8px; align-items:flex-end; }
  #input { flex:1; resize:none; max-height:120px; border:1px solid var(--line); background:var(--card); color:var(--text); border-radius:12px; padding:10px 12px; font:16px/1.4 inherit; outline:none; }
  #input:focus { border-color:#3a3a44; }
  #send { border:0; background:var(--accent); color:#fff; width:42px; height:42px; border-radius:12px; flex:none; display:flex; align-items:center; justify-content:center; }
  #send svg { width:18px; height:18px; display:block; }
  #send.stop { background:#3a2a2c; color:#ff8b90; }
  #queue { display:flex; flex-direction:column; gap:6px; padding:0 0 8px; }
  #queue[hidden] { display:none; }
  .qhead { display:flex; align-items:center; gap:8px; color:var(--muted); font-size:11px; text-transform:uppercase; letter-spacing:.03em; }
  .qhead button { margin-left:auto; border:1px solid var(--line); background:#141416; color:var(--accent); border-radius:8px; padding:2px 8px; font-size:11px; text-transform:none; letter-spacing:0; }
  .qitem { display:flex; align-items:center; gap:6px; border:1px solid var(--line); background:#141416; border-radius:10px; padding:6px 8px; font-size:13px; color:var(--muted); }
  .qitem .t { flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .qitem button { border:0; background:none; color:var(--muted); font-size:12px; padding:2px 4px; }
  .qitem button.now { color:var(--accent); }
  #down { position:fixed; right:16px; bottom:calc(env(safe-area-inset-bottom) + 96px); z-index:6; display:flex; align-items:center; gap:6px; border:1px solid var(--line); background:#1c1c20; color:var(--text); border-radius:999px; padding:8px 14px; font-size:13px; box-shadow:0 8px 24px rgba(0,0,0,.45); }
  #down[hidden] { display:none; }
  #banner { display:none; padding:8px 14px; background:#3a1d1f; color:#ffb4b7; font-size:12px; border-bottom:1px solid #5a2a2d; }
  #banner.show { display:block; }
  #offline { position:fixed; inset:0; z-index:50; display:none; flex-direction:column; align-items:center; justify-content:center; gap:10px; padding:32px; background:var(--bg); text-align:center; }
  #offline.show { display:flex; }
  #offline h2 { margin:0; font-size:18px; }
  #offline p { margin:0; color:var(--muted); font-size:14px; max-width:280px; }
  #offline button { margin-top:8px; border:1px solid var(--line); background:var(--card); color:var(--text); border-radius:10px; padding:10px 18px; font-size:14px; }
  #sheet { position:fixed; inset:0; z-index:60; display:none; }
  #sheet.show { display:block; }
  #sheet .backdrop { position:absolute; inset:0; background:rgba(0,0,0,.55); }
  #sheet .panel { position:absolute; left:0; right:0; bottom:0; max-height:70dvh; display:flex; flex-direction:column; background:#121214; border-top:1px solid var(--line); border-radius:16px 16px 0 0; padding-bottom:env(safe-area-inset-bottom); }
  #sheet .head { display:flex; align-items:center; gap:8px; padding:12px 14px; border-bottom:1px solid var(--line); font-weight:600; font-size:14px; }
  #sheet .head button { margin-left:auto; border:0; background:none; color:var(--muted); font-size:18px; }
  #sheet .list { overflow:auto; padding:6px 0 12px; }
  #sheet .item { display:block; width:100%; text-align:left; border:0; background:none; color:var(--text); padding:10px 14px; font-size:14px; }
  #sheet .item small { display:block; color:var(--muted); font-size:11px; margin-top:2px; }
  #sheet .item:active { background:#1b1b1f; }
  #sheet .item.sel { color:var(--accent); }
</style>
</head>
<body>
  <header>
    <button id="back" hidden>&#8249;</button>
    <div class="t" id="title">OpenCode</div>
    <button id="reload">&#8635;</button>
  </header>
  <div id="banner"></div>
  <div id="perms"></div>
  <main id="list"></main>
  <main id="chat" hidden><div id="messages"></div></main>
  <button id="down" hidden>&#8595;<span id="downcount">0</span></button>
  <div id="offline">
    <h2>Доступ отключён</h2>
    <p>Включите мобильный доступ заново в приложении на компьютере и отсканируйте новый QR-код.</p>
    <button id="offline-retry">Повторить</button>
  </div>
  <div id="sheet">
    <div class="backdrop" id="sheet-backdrop"></div>
    <div class="panel">
      <div class="head">Модель<button id="sheet-close">&#10005;</button></div>
      <div class="list" id="sheet-list"></div>
    </div>
  </div>
  <footer hidden>
    <div id="statusrow">
      <button id="modelchip" hidden>Модель</button>
      <div id="statusline"></div>
    </div>
    <div id="queue" hidden></div>
    <div class="row">
      <textarea id="input" rows="1" placeholder="Сообщение..." enterkeyhint="send"></textarea>
      <button id="send"></button>
    </div>
  </footer>
<script>
(function () {
  var LIMIT = 80
  var SEND_ICON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12.5V4"/><path d="M4 7.5 8 3.5l4 4"/></svg>'
  var STOP_ICON = '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="4.5" y="4.5" width="7" height="7" rx="1.6"/></svg>'
  var COPY_ICON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 5.5V3.5A1.5 1.5 0 0 0 9 2H3.5A1.5 1.5 0 0 0 2 3.5V9a1.5 1.5 0 0 0 1.5 1.5H5.5"/></svg>'
  var CHECK_ICON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 8.5 6.5 12 13 4.5"/></svg>'

  var S = {
    workspaces: [], ws: null, sessions: [], session: null, messages: [], pending: [], children: [], event: undefined, eventDir: "",
    statuses: {}, mode: "list", raw: {}, rendered: "", ids: "", seen: {}, wsMeta: {},
    queue: {}, drafts: {}, sending: false, lastSendAt: 0, newCount: 0, lastCount: 0,
    models: [], modelSel: {}, offline: false, hasMore: false, loadingOlder: false,
    modelLoaded: false
  }

  function el(id) { return document.getElementById(id) }
  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    })
  }
  function dirOf() {
    if (S.session && S.session.directory) return S.session.directory
    if (S.ws) return S.ws.directory
    return ""
  }
  function q(extra) {
    var parts = []
    var dir = dirOf()
    if (dir) parts.push("directory=" + encodeURIComponent(dir))
    if (extra) parts.push(extra)
    return parts.length ? "?" + parts.join("&") : ""
  }
  function store(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || "null") || fallback } catch (e) { return fallback }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch (e) {}
  }

  function api(path, opts) {
    opts = opts || {}
    return fetch("/api" + path, {
      method: opts.method || "GET",
      headers: { "content-type": "application/json" },
      body: opts.body,
      credentials: "same-origin",
      cache: "no-store",
    }).then(function (r) {
      if (r.status === 401 || r.status === 403) setOffline(true)
      return r.text().then(function (t) {
        var data
        try { data = t ? JSON.parse(t) : null } catch (e) { data = t }
        if (!r.ok) throw new Error((data && (data.error || data.message)) || r.status)
        return data
      })
    })
  }

  function setOffline(value) {
    if (S.offline === value) return
    S.offline = value
    el("offline").classList.toggle("show", value)
    if (value) closeEvents()
  }

  function ago(ts) {
    if (!ts) return ""
    var s = Math.max(0, Math.round((Date.now() - ts) / 1000))
    if (s < 60) return "только что"
    if (s < 3600) return Math.round(s / 60) + " мин назад"
    if (s < 86400) return Math.round(s / 3600) + " ч назад"
    return Math.round(s / 86400) + " дн назад"
  }

  function fail(e) {
    var message = "Ошибка: " + (e && e.message ? e.message : e)
    el("statusline").textContent = message
    var banner = el("banner")
    banner.textContent = message
    banner.classList.add("show")
    clearTimeout(S.bannerTimer)
    S.bannerTimer = setTimeout(function () { banner.classList.remove("show") }, 4000)
  }

  function vibrate() {
    if (navigator.vibrate) navigator.vibrate(120)
  }

  function md(src) {
    var s = esc(src)
    s = s.replace(/\`\`\`([\\s\\S]*?)\`\`\`/g, function (_, code) {
      return "<pre><code>" + code.replace(/^\\n/, "").replace(/\\n$/, "") + "</code></pre>"
    })
    s = s.replace(/\`([^\`\\n]+)\`/g, "<code>$1</code>")
    s = s.replace(/\\*\\*([^*]+)\\*\\*/g, "<strong>$1</strong>")
    s = s.replace(/(^|[^*])\\*([^*\\n]+)\\*/g, "$1<em>$2</em>")
    s = s.replace(/\\[([^\\]]+)\\]\\((https?:\\/\\/[^\\s)]+)\\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    s = s.replace(/^### (.+)$/gm, "<h3>$1</h3>")
    s = s.replace(/^## (.+)$/gm, "<h2>$1</h2>")
    s = s.replace(/^# (.+)$/gm, "<h1>$1</h1>")
    s = s.replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>")
    s = s.replace(/^\\s*[-*] (.+)$/gm, "<li>$1</li>")
    s = s.replace(/(?:<li>[\\s\\S]*?<\\/li>\\n?)+/g, function (m) { return "<ul>" + m + "</ul>" })
    return s
  }

  // ---- seen / drafts / queue / model

  function loadState() {
    S.seen = store("oc_seen", {})
    S.queue = store("oc_queue", {})
    S.drafts = store("oc_drafts", {})
    S.modelSel = store("oc_model", {})
  }
  function saveSeen() {
    var keys = Object.keys(S.seen)
    if (keys.length > 500) {
      keys.sort(function (a, b) { return S.seen[a] - S.seen[b] })
      keys.slice(0, keys.length - 500).forEach(function (k) { delete S.seen[k] })
    }
    save("oc_seen", S.seen)
  }
  function markSeen(id) { if (!id) return; S.seen[id] = Date.now(); saveSeen() }

  function draftOf(id) { return (id && S.drafts[id]) || "" }
  function saveDraft(id, text) {
    if (!id) return
    if (text) S.drafts[id] = text
    else delete S.drafts[id]
    save("oc_drafts", S.drafts)
  }

  function queueOf(id) { if (!S.queue[id]) S.queue[id] = []; return S.queue[id] }
  function saveQueue() { save("oc_queue", S.queue) }
  function isBusy() {
    var st = S.session && S.statuses[S.session.id]
    return !!(st && st.type && st.type !== "idle")
  }

  function modelFor(id) { return id ? S.modelSel[id] : undefined }
  function modelLabel(sel) {
    if (!sel) return "Модель"
    var name = sel.name || sel.modelID
    return name.length > 22 ? name.slice(0, 20) + "…" : name
  }
  function loadModels() {
    if (S.modelLoaded) return Promise.resolve()
    return api("/config/providers").then(function (data) {
      var list = []
      ;((data && data.providers) || []).forEach(function (p) {
        var models = p.models || {}
        Object.keys(models).forEach(function (id) {
          var model = models[id] || {}
          list.push({ providerID: p.id, modelID: id, name: model.name || id, provider: p.name || p.id })
        })
      })
      S.models = list
      S.modelLoaded = true
    }).catch(function () {})
  }
  function updateModelChip() {
    var chip = el("modelchip")
    if (!S.session) { chip.hidden = true; return }
    chip.hidden = false
    chip.textContent = modelLabel(modelFor(S.session.id))
  }
  function renderSheet() {
    var list = el("sheet-list")
    var current = S.session ? modelFor(S.session.id) : undefined
    var html = '<button class="item" data-model=""><strong>По умолчанию</strong><small>модель сессии</small></button>'
    html += S.models.map(function (m, i) {
      var sel = current && current.providerID === m.providerID && current.modelID === m.modelID
      return '<button class="item' + (sel ? " sel" : "") + '" data-model="' + i + '">' + esc(m.name) + "<small>" + esc(m.provider) + " · " + esc(m.modelID) + "</small></button>"
    }).join("")
    list.innerHTML = html
    Array.prototype.forEach.call(list.querySelectorAll("[data-model]"), function (b) {
      b.onclick = function () {
        var raw = b.getAttribute("data-model")
        var id = S.session && S.session.id
        if (!id) return
        if (raw === "") delete S.modelSel[id]
        else S.modelSel[id] = S.models[+raw]
        save("oc_model", S.modelSel)
        updateModelChip()
        closeSheet()
      }
    })
  }
  function openSheet() {
    if (!S.session) return
    renderSheet()
    el("sheet").classList.add("show")
    loadModels().then(renderSheet)
  }
  function closeSheet() { el("sheet").classList.remove("show") }

  // ---- list views

  function renderList() {
    S.mode = "list"
    el("list").hidden = false
    el("chat").hidden = true
    document.querySelector("footer").hidden = true
    el("down").hidden = true
    el("back").hidden = !(S.ws)
    el("title").textContent = S.ws ? S.ws.name : "OpenCode"

    if (!S.ws) {
      var items = S.workspaces.map(function (w, i) {
        return { w: w, i: i, meta: S.wsMeta[w.directory] || { busy: 0, unread: 0, perms: 0 } }
      })
      items.sort(function (a, b) {
        if ((b.meta.perms || 0) !== (a.meta.perms || 0)) return (b.meta.perms || 0) - (a.meta.perms || 0)
        if ((b.meta.busy || 0) !== (a.meta.busy || 0)) return (b.meta.busy || 0) - (a.meta.busy || 0)
        if ((b.meta.unread || 0) !== (a.meta.unread || 0)) return (b.meta.unread || 0) - (a.meta.unread || 0)
        return 0
      })
      var html = '<div class="hint"><span class="grow">Рабочие области</span></div>'
      items.forEach(function (item) {
        var meta = item.meta
        var badges = ""
        if (meta.perms) badges += '<span class="badge perm">доступ: ' + meta.perms + '</span>'
        if (meta.busy) badges += '<span class="badge busy"><span class="dot busy"></span>' + meta.busy + '</span>'
        if (meta.unread) badges += '<span class="badge unread">+' + meta.unread + '</span>'
        html += '<button class="card' + (meta.unread ? " unread" : "") + '" data-ws="' + item.i + '"><div class="name">' + esc(item.w.name) + '<span class="meta">' + badges + '</span></div><div class="path">' + esc(item.w.directory) + '</div></button>'
      })
      if (!S.workspaces.length) html += '<div class="empty">Нет рабочих областей</div>'
      el("list").innerHTML = html
      Array.prototype.forEach.call(el("list").querySelectorAll("[data-ws]"), function (b) {
        b.onclick = function () { openWorkspace(+b.getAttribute("data-ws")) }
      })
      return
    }

    var out = '<div class="hint"><span class="grow">' + esc(S.ws.name) + ' · задачи</span><button class="newses" id="newses">+ новая</button></div>'
    S.sessions.forEach(function (s) {
      var st = S.statuses[s.id]
      var busy = st && st.type && st.type !== "idle"
      var unread = ((s.time && s.time.updated) || 0) > (S.seen[s.id] || 0)
      out += '<button class="card' + (unread && !busy ? " unread" : "") + '" data-ses="' + esc(s.id) + '"><div class="name">' + (busy ? '<span class="dot busy"></span>' : "") + esc(s.title || "Без названия") + (unread ? '<span class="meta"><span class="dot new"></span></span>' : "") + '</div><div class="path">' + esc(ago(s.time && s.time.updated)) + '</div></button>'
    })
    if (!S.sessions.length) out += '<div class="empty">Задач нет</div>'
    el("list").innerHTML = out
    var newses = el("newses")
    if (newses) newses.onclick = createSession
    Array.prototype.forEach.call(el("list").querySelectorAll("[data-ses]"), function (b) {
      b.onclick = function () { openSession(b.getAttribute("data-ses")) }
    })
  }

  function createSession() {
    if (!S.ws) return
    api("/session" + q(), { method: "POST", body: "{}" })
      .then(function (created) {
        var id = created && (created.id || (created.info && created.info.id))
        return loadSessions().then(function () {
          if (id) openSession(id)
        })
      })
      .catch(fail)
  }

  // ---- chat

  function messageHtml(m) {
    var role = m.info && m.info.role
    var body = ""
    var text = ""
    ;(m.parts || []).forEach(function (p) {
      if (p.type === "text" && p.text) {
        text += (text ? "\\n\\n" : "") + p.text
        body += '<div class="txt">' + md(p.text) + "</div>"
      } else if (p.type === "tool") {
        var state = p.state && p.state.status ? p.state.status : ""
        body += '<div class="tool">&#9881; ' + esc(p.tool || "tool") + (state ? " · " + esc(state) : "") + "</div>"
      }
    })
    if (!body) return ""
    var id = (m.info && m.info.id) || ""
    S.raw[id] = text
    return '<div class="msg ' + (role === "user" ? "user" : "assistant") + '">' +
      '<div class="role">' + (role === "user" ? "Вы" : "Ассистент") + "</div>" + body +
      (text ? '<button class="copy" data-copy="' + esc(id) + '" aria-label="Скопировать">' + COPY_ICON + "</button>" : "") +
      "</div>"
  }

  function bindCopies(root) {
    Array.prototype.forEach.call(root.querySelectorAll("[data-copy]"), function (b) {
      b.onclick = function (event) {
        event.stopPropagation()
        var value = S.raw[b.getAttribute("data-copy")] || ""
        if (!value) return
        var done = function () {
          b.innerHTML = CHECK_ICON
          setTimeout(function () { b.innerHTML = COPY_ICON }, 1200)
        }
        navigator.clipboard.writeText(value).then(done).catch(function () {
          var area = document.createElement("textarea")
          area.value = value
          document.body.appendChild(area)
          area.select()
          try { document.execCommand("copy") } catch (e) {}
          document.body.removeChild(area)
          done()
        })
      }
    })
  }

  function signature() {
    var last = S.messages[S.messages.length - 1]
    var parts = last && last.parts ? last.parts.length : 0
    var tail = ""
    if (last && last.parts && last.parts.length) {
      var p = last.parts[last.parts.length - 1]
      tail = (p.type || "") + ":" + String(p.text || "").length + ":" + (p.state && p.state.status ? p.state.status : "")
    }
    var st = S.session && S.statuses[S.session.id]
    return [S.session && S.session.id, S.messages.length, parts, tail, st && st.type, S.hasMore, S.pending.length].join("|")
  }

  function renderChat(force) {
    S.mode = "chat"
    el("list").hidden = true
    el("chat").hidden = false
    document.querySelector("footer").hidden = false
    el("back").hidden = false
    el("title").textContent = (S.session && S.session.title) || "Задача"
    updateModelChip()

    var busy = isBusy()
    var queued = S.session ? queueOf(S.session.id).length : 0
    el("statusline").textContent = (busy ? "Агент работает..." : "") + (queued ? (busy ? " · " : "") + "в очереди: " + queued : "")
    var send = el("send")
    send.classList.toggle("stop", busy)
    send.innerHTML = busy ? STOP_ICON : SEND_ICON
    send.setAttribute("aria-label", busy ? "Остановить агента" : "Отправить")
    renderQueue()

    var sig = signature()
    if (!force && sig === S.rendered) return
    S.rendered = sig

    var view = el("chat")
    var distance = view.scrollHeight - view.scrollTop - view.clientHeight
    var stick = distance < 80 || S.forceBottom
    S.forceBottom = false
    var prevTop = view.scrollTop

    var list = S.messages.slice(-LIMIT)
    var ids = list.map(function (m) { return (m.info && m.info.id) || "" }).join(",")
    var container = el("messages")

    if (!force && ids === S.ids && container.children.length) {
      var html = messageHtml(list[list.length - 1])
      var node = container.lastElementChild
      if (html && node && node.classList.contains("msg") && node.outerHTML !== html) {
        node.outerHTML = html
        var fresh = container.lastElementChild
        if (fresh && fresh.classList.contains("msg")) bindCopies(fresh)
      }
    } else {
      S.raw = {}
      S.ids = ids
      var out = ""
      if (S.hasMore) out += '<div class="more"><button id="more">Показать раньше</button></div>'
      list.forEach(function (m) { out += messageHtml(m) })
      container.innerHTML = out || '<div class="empty">Сообщений пока нет</div>'
      bindCopies(container)
      var more = el("more")
      if (more) more.onclick = loadOlder
    }

    if (S.messages.length > S.lastCount && !stick) S.newCount += S.messages.length - S.lastCount
    S.lastCount = S.messages.length
    if (stick) {
      view.scrollTop = view.scrollHeight
      S.newCount = 0
    } else if (view.scrollTop !== prevTop) {
      view.scrollTop = prevTop
    }
    updateDown()
    updateTitle()
  }

  function updateDown() {
    var show = S.mode === "chat" && S.newCount > 0
    el("down").hidden = !show
    el("downcount").textContent = S.newCount > 99 ? "99+" : String(S.newCount)
  }

  function updateTitle() {
    var count = S.newCount + (S.pending.length || 0)
    document.title = (count ? "(" + count + ") " : "") + "OpenCode"
  }

  function sessionLabel(id) {
    if (S.session && id === S.session.id) return "текущая задача"
    var found = (S.sessions || []).filter(function (s) { return s.id === id })[0]
    if (found && found.title) return found.title
    return "другая задача"
  }

  function fetchPerms() {
    var dirs = {}
    if (S.ws && S.ws.directory) dirs[S.ws.directory] = true
    if (S.session && S.session.directory) dirs[S.session.directory] = true
    if (!Object.keys(dirs).length && S.workspaces.length) {
      S.workspaces.forEach(function (w) { if (w.directory) dirs[w.directory] = true })
    }
    return Promise.all(Object.keys(dirs).map(function (dir) {
      return api("/permission?directory=" + encodeURIComponent(dir))
        .then(function (list) {
          return (list || []).map(function (p) { return Object.assign({}, p, { __dir: dir }) })
        })
        .catch(function () { return [] })
    })).then(function (groups) {
      var seen = {}
      var all = []
      groups.forEach(function (group) {
        group.forEach(function (p) {
          if (seen[p.id]) return
          seen[p.id] = true
          all.push(p)
        })
      })
      if (!S.pending.length && all.length) vibrate()
      S.pending = all
      return all
    })
  }

  function renderPerms() {
    var box = el("perms")
    var list = S.pending || []
    if (!list.length) {
      S.permsSig = ""
      box.classList.remove("show")
      box.innerHTML = ""
      updateTitle()
      return
    }
    var sig = list.map(function (p) { return p.id }).join(",")
    if (sig === S.permsSig && box.innerHTML) {
      updateTitle()
      return
    }
    S.permsSig = sig
    box.classList.add("show")
    var shown = list.slice(0, 3)
    var html = '<div class="perm-head">Требуется разрешение' + (list.length > 1 ? " · " + list.length : "") + "</div>"
    html += shown.map(function (p) {
      var dir = esc(p.__dir || "")
      return '<div class="perm"><div class="perm-t">' + esc(p.permission) + '</div><div class="perm-p">' + esc((p.patterns || []).join(", ")) + '</div><div class="perm-p">' + esc(sessionLabel(p.sessionID)) + '</div><div class="perm-b">' +
        '<button data-perm="' + esc(p.id) + '" data-dir="' + dir + '" data-reply="once">Разрешить</button>' +
        '<button data-perm="' + esc(p.id) + '" data-dir="' + dir + '" data-reply="always">Всегда</button>' +
        '<button data-perm="' + esc(p.id) + '" data-dir="' + dir + '" data-reply="reject" class="danger">Отклонить</button>' +
        "</div></div>"
    }).join("")
    if (list.length > shown.length) html += '<div class="perm-more">и ещё ' + (list.length - shown.length) + "</div>"
    box.innerHTML = html
    Array.prototype.forEach.call(box.querySelectorAll("[data-perm]"), function (b) {
      b.onclick = function () {
        b.disabled = true
        var dir = b.getAttribute("data-dir")
        var query = dir ? "?directory=" + encodeURIComponent(dir) : q()
        api("/permission/" + encodeURIComponent(b.getAttribute("data-perm")) + "/reply" + query, {
          method: "POST",
          body: JSON.stringify({ reply: b.getAttribute("data-reply") }),
        })
          .then(function () { return fetchPerms() })
          .then(renderPerms)
          .then(function () { if (S.mode === "chat") return loadChat() })
          .catch(function (e) { fail(e); b.disabled = false })
      }
    })
    updateTitle()
  }

  function renderQueue() {
    var box = el("queue")
    if (!box) return
    if (!S.session) { box.hidden = true; box.innerHTML = ""; return }
    var list = queueOf(S.session.id)
    if (!list.length) { box.hidden = true; box.innerHTML = ""; return }
    box.hidden = false
    var head = '<div class="qhead">В очереди: ' + list.length + (list.length > 1 ? '<button id="qall">Отправить все</button>' : "") + "</div>"
    box.innerHTML = head + list.map(function (text, i) {
      return '<div class="qitem"><div class="t">' + esc(text) + '</div><button class="now" data-now="' + i + '">Сейчас</button><button data-del="' + i + '">&#10005;</button></div>'
    }).join("")
    var all = el("qall")
    if (all) all.onclick = sendAllQueued
    Array.prototype.forEach.call(box.querySelectorAll("[data-now]"), function (b) {
      b.onclick = function () { sendQueuedNow(+b.getAttribute("data-now")) }
    })
    Array.prototype.forEach.call(box.querySelectorAll("[data-del]"), function (b) {
      b.onclick = function () { dequeue(+b.getAttribute("data-del")) }
    })
  }

  // ---- navigation

  function openWorkspace(index) {
    S.ws = S.workspaces[index]
    S.session = null
    S.sessions = []
    S.rendered = ""
    history.pushState({ level: "tasks" }, "")
    renderList()
    syncEvents()
    loadSessions()
  }

  function openSession(id) {
    S.session = S.sessions.filter(function (s) { return s.id === id })[0] || { id: id }
    markSeen(id)
    S.rendered = ""
    S.messages = []
    S.lastCount = 0
    S.newCount = 0
    S.hasMore = false
    S.forceBottom = true
    history.pushState({ level: "chat" }, "")
    el("input").value = draftOf(id)
    el("input").style.height = "auto"
    renderChat(true)
    syncEvents()
    loadChat()
  }

  function goBack() {
    if (S.mode === "chat") {
      S.session = null
      S.rendered = ""
      renderList()
      syncEvents()
      loadSessions()
      return
    }
    if (S.ws) {
      S.ws = null
      S.sessions = []
      renderList()
      syncEvents()
    }
  }

  // ---- loaders

  function refreshWorkspaces() {
    return Promise.all(S.workspaces.map(function (w) {
      var enc = encodeURIComponent(w.directory)
      return Promise.all([
        api("/session?directory=" + enc).catch(function () { return [] }),
        api("/session/status?directory=" + enc).catch(function () { return {} }),
        api("/permission?directory=" + enc).catch(function () { return [] }),
      ]).then(function (res) {
        var sessions = (res[0] || []).filter(function (s) { return !s.parentID })
        var statuses = res[1] || {}
        var perms = res[2] || []
        var busy = 0
        var unread = 0
        sessions.forEach(function (s) {
          var st = statuses[s.id]
          if (st && st.type && st.type !== "idle") busy++
          if (((s.time && s.time.updated) || 0) > (S.seen[s.id] || 0)) unread++
        })
        S.wsMeta[w.directory] = { busy: busy, unread: unread, perms: perms.length, sessions: sessions.length }
      })
    })).then(function () { if (!S.ws) renderList() })
  }

  function loadMeta() {
    return api("/meta").then(function (d) {
      S.workspaces = (d && d.workspaces) || []
      renderList()
      syncEvents()
      fetchPerms().then(renderPerms)
      refreshWorkspaces()
    }).catch(fail)
  }

  function loadSessions() {
    if (!S.ws) return Promise.resolve()
    return api("/session" + q()).then(function (d) {
      var list = (d || []).filter(function (s) { return !s.parentID })
      list.sort(function (a, b) { return ((b.time && b.time.updated) || 0) - ((a.time && a.time.updated) || 0) })
      S.sessions = list
      return api("/session/status" + q())
    }).then(function (st) {
      S.statuses = st || {}
      if (S.session) {
        var found = S.sessions.filter(function (s) { return s.id === S.session.id })[0]
        if (found) S.session = found
      }
      return fetchPerms()
    }).then(function () {
      renderPerms()
      renderList()
    }).catch(fail)
  }

  function loadChat() {
    if (!S.session || S.loading) return Promise.resolve()
    S.loading = true
    var id = S.session.id
    markSeen(id)
    var base = "/session/" + encodeURIComponent(id)
    return api(base + "/message" + q("limit=" + LIMIT)).then(function (d) {
      S.messages = d || []
      S.hasMore = S.messages.length >= LIMIT
      return api("/session/status" + q())
    }).then(function (st) {
      S.statuses = st || {}
      return api(base + "/children" + q()).catch(function () { return [] })
    }).then(function (children) {
      S.children = (children || []).map(function (child) { return child && child.id }).filter(Boolean)
      return fetchPerms()
    }).then(function () {
      renderPerms()
      renderChat(false)
      flushQueue()
    }).catch(fail).finally(function () { S.loading = false })
  }

  function loadOlder() {
    if (!S.session || S.loadingOlder || !S.messages.length) return
    var first = S.messages[0]
    var before = first && first.info && first.info.id
    if (!before) return
    S.loadingOlder = true
    var view = el("chat")
    var height = view.scrollHeight
    var top = view.scrollTop
    api("/session/" + encodeURIComponent(S.session.id) + "/message" + q("limit=" + LIMIT + "&before=" + encodeURIComponent(before)))
      .then(function (older) {
        var list = older || []
        if (!list.length) { S.hasMore = false; S.rendered = ""; renderChat(true); return }
        S.messages = list.concat(S.messages)
        S.hasMore = list.length >= LIMIT
        S.rendered = ""
        renderChat(true)
        view.scrollTop = top + (view.scrollHeight - height)
      })
      .catch(fail)
      .finally(function () { S.loadingOlder = false })
  }

  // ---- sending / queue

  function sendNow(text) {
    if (!text || !S.session) return Promise.resolve()
    S.lastSendAt = Date.now()
    S.forceBottom = true
    var model = modelFor(S.session.id)
    var body = { parts: [{ type: "text", text: text }] }
    if (model) body.model = { providerID: model.providerID, modelID: model.modelID }
    return api("/session/" + encodeURIComponent(S.session.id) + "/prompt_async" + q(), {
      method: "POST",
      body: JSON.stringify(body),
    })
  }

  function send() {
    var text = el("input").value.trim()
    if (!text || !S.session) return
    el("input").value = ""
    el("input").style.height = "auto"
    saveDraft(S.session.id, "")
    if (isBusy()) {
      queueOf(S.session.id).push(text)
      saveQueue()
      renderChat(true)
      return
    }
    sendNow(text).then(function () { return loadChat() }).catch(function (e) { fail(e); el("input").value = text })
  }

  function dequeue(index) {
    if (!S.session) return
    queueOf(S.session.id).splice(index, 1)
    saveQueue()
    renderChat(true)
  }

  function sendQueuedNow(index) {
    if (!S.session) return
    var list = queueOf(S.session.id)
    var text = list[index]
    if (!text) return
    list.splice(index, 1)
    saveQueue()
    renderQueue()
    sendNow(text).then(function () { return loadChat() }).catch(fail)
  }

  function sendAllQueued() {
    if (!S.session) return
    var list = queueOf(S.session.id)
    if (!list.length) return
    var all = list.splice(0, list.length)
    saveQueue()
    renderQueue()
    var chain = Promise.resolve()
    all.forEach(function (text) { chain = chain.then(function () { return sendNow(text) }) })
    chain.then(function () { return loadChat() }).catch(fail)
  }

  function flushQueue() {
    if (!S.session || isBusy() || S.sending) return
    if (Date.now() - (S.lastSendAt || 0) < 3000) return
    var list = queueOf(S.session.id)
    if (!list.length) return
    var text = list.shift()
    saveQueue()
    renderQueue()
    S.sending = true
    sendNow(text)
      .then(function () { S.sending = false; setTimeout(function () { loadChat() }, 600) })
      .catch(function (e) { S.sending = false; list.unshift(text); saveQueue(); renderQueue(); fail(e) })
  }

  function abort() {
    if (!S.session) return
    api("/session/" + encodeURIComponent(S.session.id) + "/abort" + q(), { method: "POST", body: "{}" })
      .then(function () { return loadChat() })
      .catch(fail)
  }

  // ---- live events

  function eventsDir() {
    if (S.session && S.session.directory) return S.session.directory
    if (S.ws && S.ws.directory) return S.ws.directory
    return ""
  }

  function closeEvents() {
    if (!S.event) return
    try { S.event.close() } catch (e) {}
    S.event = undefined
    S.eventDir = ""
  }

  function syncEvents() {
    if (S.offline) return
    var dir = eventsDir()
    if (S.eventDir === dir) return
    closeEvents()
    if (!dir) return
    try {
      var es = new EventSource("/api/event?directory=" + encodeURIComponent(dir))
      S.event = es
      S.eventDir = dir
      es.onmessage = function (e) {
        var type = ""
        try { type = (JSON.parse(e.data) || {}).type || "" } catch (err) {}
        if (/permission\./.test(type)) { vibrate(); dirty(0) } else dirty(900)
      }
      es.onerror = function () {
        try { es.close() } catch (err) {}
        S.event = undefined
        S.eventDir = ""
        if (S.offline) return
        fetch("/api/meta", { credentials: "same-origin", cache: "no-store" })
          .then(function (r) { if (r.status === 401 || r.status === 403) setOffline(true) })
          .catch(function () {})
        setTimeout(syncEvents, 5000)
      }
    } catch (err) {}
  }

  var dirtyTimer
  function dirty(ms) {
    if (document.hidden && ms > 0) return
    clearTimeout(dirtyTimer)
    dirtyTimer = setTimeout(refreshNow, ms)
  }
  function refreshNow() {
    if (S.offline) return
    if (S.mode === "chat") loadChat()
    else if (S.ws) loadSessions()
    else refreshWorkspaces()
  }

  // ---- wiring

  el("back").onclick = function () {
    if (history.state && history.state.level) history.back()
    else goBack()
  }
  window.addEventListener("popstate", function () { goBack() })
  el("reload").onclick = function () {
    if (S.mode === "chat") { S.rendered = ""; loadChat() }
    else if (S.ws) loadSessions()
    else loadMeta()
  }
  el("send").onclick = function () { if (isBusy()) abort(); else send() }
  el("input").addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() }
  })
  el("input").addEventListener("input", function () {
    var t = el("input")
    t.style.height = "auto"
    t.style.height = Math.min(120, t.scrollHeight) + "px"
    clearTimeout(S.draftTimer)
    var id = S.session && S.session.id
    var value = t.value
    S.draftTimer = setTimeout(function () { saveDraft(id, value) }, 300)
  })
  el("chat").addEventListener("scroll", function () {
    var view = el("chat")
    if (view.scrollHeight - view.scrollTop - view.clientHeight < 40) {
      S.newCount = 0
      updateDown()
      updateTitle()
    }
  })
  el("down").onclick = function () {
    S.newCount = 0
    S.forceBottom = true
    var view = el("chat")
    view.scrollTop = view.scrollHeight
    updateDown()
    updateTitle()
  }
  el("modelchip").onclick = openSheet
  el("sheet-close").onclick = closeSheet
  el("sheet-backdrop").onclick = closeSheet
  el("offline-retry").onclick = function () { location.reload() }
  window.addEventListener("focus", updateTitle)
  document.addEventListener("visibilitychange", function () { if (document.hidden) updateTitle() })
  document.addEventListener("gesturestart", function (e) { e.preventDefault() })
  document.addEventListener("gesturechange", function (e) { e.preventDefault() })
  document.addEventListener("dblclick", function (e) { e.preventDefault() }, { passive: false })

  setInterval(function () {
    if (S.offline || document.hidden) return
    fetchPerms().then(renderPerms).catch(function () {})
  }, 8000)
  setInterval(function () {
    if (S.offline || document.hidden) return
    refreshNow()
  }, 10000)

  loadState()
  loadMeta()
})()
</script>
</body>
</html>`
