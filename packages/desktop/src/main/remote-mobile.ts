export const MOBILE_HTML = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="theme-color" content="#0b0b0c">
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
  .hint { color:var(--muted); font-size:12px; letter-spacing:.02em; text-transform:uppercase; margin:6px 4px 10px; }
  .card { display:block; width:100%; text-align:left; border:1px solid var(--line); background:var(--card); color:var(--text); border-radius:14px; padding:13px 14px; margin:0 0 10px; }
  .card:active { background:#1d1d21; }
  .card .name { font-weight:600; font-size:15px; display:flex; align-items:center; gap:8px; }
  .card .path { color:var(--muted); font-size:12px; margin-top:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .empty { color:var(--muted); text-align:center; padding:40px 10px; font-size:14px; }
  #banner { display:none; padding:8px 14px; background:#3a1d1f; color:#ffb4b7; font-size:12px; border-bottom:1px solid #5a2a2d; }
  #banner.show { display:block; }
  .dot { width:7px; height:7px; border-radius:50%; background:#39c07a; flex:none; }
  .dot.busy { background:var(--accent); animation:pulse 1.2s infinite; }
  @keyframes pulse { 50% { opacity:.35; } }
  #chat, #messages { overflow-anchor:none; }
  #messages { display:flex; flex-direction:column; gap:10px; }
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
  .msg .copy:active { background:#26262b; }
  .tool { font-size:12px; color:var(--muted); margin-top:8px; border-left:2px solid var(--line); padding-left:8px; }
  .more { text-align:center; color:var(--muted); font-size:12px; padding:6px 0 2px; }
  .perm { border:1px solid #6a5320; background:#241f12; border-radius:14px; padding:12px; margin-bottom:10px; }
  .perm-t { font-weight:600; font-size:13px; }
  .perm-p { color:var(--muted); font-size:12px; margin:4px 0 10px; word-break:break-word; }
  .perm-b { display:flex; gap:8px; }
  .perm-b button { flex:1; border:1px solid var(--line); background:#1b1b1f; color:var(--text); border-radius:10px; padding:9px 4px; font-size:13px; }
  .perm-b button.danger { color:var(--danger); }
  footer { position:sticky; bottom:0; border-top:1px solid var(--line); background:rgba(11,11,12,.97); padding:8px 12px calc(env(safe-area-inset-bottom) + 10px); backdrop-filter:blur(12px); }
  footer[hidden] { display:none; }
  #statusline { color:var(--muted); font-size:12px; padding:0 2px 6px; min-height:14px; }
  .row { display:flex; gap:8px; align-items:flex-end; }
  #input { flex:1; resize:none; max-height:120px; border:1px solid var(--line); background:var(--card); color:var(--text); border-radius:12px; padding:10px 12px; font:16px/1.4 inherit; outline:none; }
  #input:focus { border-color:#3a3a44; }
  #send { border:0; background:var(--accent); color:#fff; width:42px; height:42px; border-radius:12px; font-size:18px; flex:none; }
  #send:disabled { opacity:.4; }
  #abort { margin-top:8px; width:100%; border:1px solid var(--line); background:#1b1b1f; color:var(--danger); border-radius:12px; padding:9px; font-size:13px; }
  #abort[hidden] { display:none; }
</style>
</head>
<body>
  <header>
    <button id="back" hidden>&#8249;</button>
    <div class="t" id="title">OpenCode</div>
    <button id="reload">&#8635;</button>
  </header>
  <div id="banner"></div>
  <main id="list"></main>
  <main id="chat" hidden><div id="perms"></div><div id="messages"></div></main>
  <footer hidden>
    <div id="statusline"></div>
    <div class="row">
      <textarea id="input" rows="1" placeholder="Сообщение..." enterkeyhint="send"></textarea>
      <button id="send">&#8594;</button>
    </div>
    <button id="abort" hidden>Остановить агента</button>
  </footer>
<script>
(function () {
  var LIMIT = 80
  var COPY_ICON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 5.5V3.5A1.5 1.5 0 0 0 9 2H3.5A1.5 1.5 0 0 0 2 3.5V9a1.5 1.5 0 0 0 1.5 1.5H5.5"/></svg>'
  var CHECK_ICON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 8.5 6.5 12 13 4.5"/></svg>'
  var S = { workspaces: [], ws: null, sessions: [], session: null, messages: [], perms: [], statuses: {}, mode: "list", raw: {}, rendered: "" }

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
  function api(path, opts) {
    opts = opts || {}
    return fetch("/api" + path, {
      method: opts.method || "GET",
      headers: { "content-type": "application/json" },
      body: opts.body,
      credentials: "same-origin",
      cache: "no-store",
    }).then(function (r) {
      return r.text().then(function (t) {
        var data
        try { data = t ? JSON.parse(t) : null } catch (e) { data = t }
        if (!r.ok) throw new Error((data && (data.error || data.message)) || r.status)
        return data
      })
    })
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

  function renderList() {
    S.mode = "list"
    el("list").hidden = false
    el("chat").hidden = true
    document.querySelector("footer").hidden = true
    el("back").hidden = !(S.ws)
    el("title").textContent = S.ws ? S.ws.name : "OpenCode"

    if (!S.ws) {
      var html = '<div class="hint">Рабочие области</div>'
      S.workspaces.forEach(function (w, i) {
        html += '<button class="card" data-ws="' + i + '"><div class="name">' + esc(w.name) + '</div><div class="path">' + esc(w.directory) + '</div></button>'
      })
      if (!S.workspaces.length) html += '<div class="empty">Нет рабочих областей</div>'
      el("list").innerHTML = html
      Array.prototype.forEach.call(el("list").querySelectorAll("[data-ws]"), function (b) {
        b.onclick = function () { openWorkspace(+b.getAttribute("data-ws")) }
      })
      return
    }

    var out = '<div class="hint">' + esc(S.ws.name) + " · задачи</div>"
    S.sessions.forEach(function (s) {
      var st = S.statuses[s.id]
      var busy = st && st.type && st.type !== "idle"
      out += '<button class="card" data-ses="' + esc(s.id) + '"><div class="name">' + (busy ? '<span class="dot busy"></span>' : "") + esc(s.title || "Без названия") + '</div><div class="path">' + esc(ago(s.time && s.time.updated)) + '</div></button>'
    })
    if (!S.sessions.length) out += '<div class="empty">Задач нет</div>'
    el("list").innerHTML = out
    Array.prototype.forEach.call(el("list").querySelectorAll("[data-ses]"), function (b) {
      b.onclick = function () { openSession(b.getAttribute("data-ses")) }
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
    return [S.session && S.session.id, S.messages.length, parts, tail, st && st.type].join("|")
  }

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

  function renderChat(force) {
    S.mode = "chat"
    el("list").hidden = true
    el("chat").hidden = false
    document.querySelector("footer").hidden = false
    el("back").hidden = false
    el("title").textContent = (S.session && S.session.title) || "Задача"

    var st = S.session && S.statuses[S.session.id]
    var busy = st && st.type && st.type !== "idle"
    el("statusline").textContent = busy ? "Агент работает..." : ""
    el("abort").hidden = !busy

    renderPerms()

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
      list.forEach(function (m) { out += messageHtml(m) })
      if (S.messages.length > LIMIT) out = '<div class="more">Показаны последние ' + LIMIT + "</div>" + out
      container.innerHTML = out || '<div class="empty">Сообщений пока нет</div>'
      bindCopies(container)
    }

    if (stick) view.scrollTop = view.scrollHeight
    else if (view.scrollTop !== prevTop) view.scrollTop = prevTop
  }

  function renderPerms() {
    if (!S.session) { el("perms").innerHTML = ""; return }
    var list = S.perms.filter(function (p) { return p.sessionID === S.session.id })
    if (!list.length) { el("perms").innerHTML = ""; return }
    el("perms").innerHTML = list.map(function (p) {
      return '<div class="perm"><div class="perm-t">Запрос доступа: ' + esc(p.permission) + '</div><div class="perm-p">' + esc((p.patterns || []).join(", ")) + '</div><div class="perm-b">' +
        '<button data-perm="' + esc(p.id) + '" data-reply="once">Разрешить</button>' +
        '<button data-perm="' + esc(p.id) + '" data-reply="always">Всегда</button>' +
        '<button data-perm="' + esc(p.id) + '" data-reply="reject" class="danger">Отклонить</button>' +
        "</div></div>"
    }).join("")
    Array.prototype.forEach.call(el("perms").querySelectorAll("[data-perm]"), function (b) {
      b.onclick = function () {
        b.disabled = true
        api("/permission/" + encodeURIComponent(b.getAttribute("data-perm")) + "/reply" + q(), {
          method: "POST",
          body: JSON.stringify({ reply: b.getAttribute("data-reply") }),
        }).then(function () { return loadChat() }).catch(function (e) { fail(e); b.disabled = false })
      }
    })
  }

  function openWorkspace(index) {
    S.ws = S.workspaces[index]
    S.session = null
    S.sessions = []
    S.rendered = ""
    history.pushState({ level: "tasks" }, "")
    renderList()
    loadSessions()
  }

  function openSession(id) {
    S.session = S.sessions.filter(function (s) { return s.id === id })[0] || { id: id }
    S.rendered = ""
    history.pushState({ level: "chat" }, "")
    renderChat(true)
    loadChat()
  }

  function goBack() {
    if (S.mode === "chat") {
      S.session = null
      S.rendered = ""
      renderList()
      loadSessions()
      return
    }
    if (S.ws) {
      S.ws = null
      S.sessions = []
      renderList()
    }
  }

  function loadMeta() {
    return api("/meta").then(function (d) {
      S.workspaces = (d && d.workspaces) || []
      renderList()
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
      renderList()
    }).catch(fail)
  }

  function loadChat() {
    if (!S.session) return Promise.resolve()
    var base = "/session/" + encodeURIComponent(S.session.id)
    return api(base + "/message" + q("limit=" + LIMIT)).then(function (d) {
      S.messages = d || []
      return api("/session/status" + q())
    }).then(function (st) {
      S.statuses = st || {}
      return api("/permission" + q())
    }).then(function (p) {
      S.perms = p || []
      renderChat(false)
    }).catch(fail)
  }

  function send() {
    var text = el("input").value.trim()
    if (!text || !S.session) return
    el("input").value = ""
    el("input").style.height = "auto"
    S.forceBottom = true
    api("/session/" + encodeURIComponent(S.session.id) + "/prompt_async" + q(), {
      method: "POST",
      body: JSON.stringify({ parts: [{ type: "text", text: text }] }),
    }).then(function () { return loadChat() }).catch(function (e) { fail(e); el("input").value = text })
  }

  function abort() {
    if (!S.session) return
    api("/session/" + encodeURIComponent(S.session.id) + "/abort" + q(), { method: "POST", body: "{}" })
      .then(function () { return loadChat() })
      .catch(fail)
  }

  setInterval(function () {
    if (S.mode === "chat") loadChat()
    else if (S.ws) loadSessions()
  }, 3000)

  el("back").onclick = function () {
    if (history.state && history.state.level) history.back()
    else goBack()
  }
  window.addEventListener("popstate", function () { goBack() })
  document.addEventListener("gesturestart", function (e) { e.preventDefault() })
  document.addEventListener("gesturechange", function (e) { e.preventDefault() })
  document.addEventListener("dblclick", function (e) { e.preventDefault() }, { passive: false })
  el("reload").onclick = function () {
    if (S.mode === "chat") { S.rendered = ""; loadChat() }
    else if (S.ws) loadSessions()
    else loadMeta()
  }
  el("send").onclick = send
  el("abort").onclick = abort
  el("input").addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() }
  })
  el("input").addEventListener("input", function () {
    var t = el("input")
    t.style.height = "auto"
    t.style.height = Math.min(120, t.scrollHeight) + "px"
  })

  loadMeta()
})()
</script>
</body>
</html>`
