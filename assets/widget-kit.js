/* ============================================================
   LVGL 组件演示 —— 公共绘图 / 导出工具
   零依赖、可直接 file:// 打开（除 GIF 编码外不联网）
   ============================================================ */
window.LVKit = (function () {
  "use strict";

  var FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
  var MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

  /* LVGL v10 默认浅色主题里最常用的颜色 */
  var theme = {
    bg: "#ffffff",
    card: "#ffffff",
    border: "#d6d9df",
    track: "#e3e6ea",
    primary: "#2b7de9",
    primaryDark: "#1f6fd0",
    text: "#1c2128",
    textMuted: "#5b6470",
    textFaint: "#8a929c",
    green: "#1f9d66",
    red: "#e04b4b",
    orange: "#e6a23c",
    gray: "#b8bfc9"
  };

  /* ---------- 数值 ---------- */
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(k) { return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
  function easeOut(k) { return 1 - Math.pow(1 - k, 3); }
  function rad(d) { return d * Math.PI / 180; }
  function deg(r) { return r * 180 / Math.PI; }
  function normDeg(d) { return ((d % 360) + 360) % 360; }

  /* ---------- 颜色 ---------- */
  function hexToRgb(h) {
    h = String(h).replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
  }
  function toHex(n) {
    var s = Math.round(clamp(n, 0, 255)).toString(16);
    return s.length < 2 ? "0" + s : s;
  }
  function rgbToHex(r, g, b) { return "#" + toHex(r) + toHex(g) + toHex(b); }
  function mix(a, b, t) {
    var A = hexToRgb(a), B = hexToRgb(b);
    return rgbToHex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t));
  }
  function alpha(c, a) {
    var A = hexToRgb(c);
    return "rgba(" + A[0] + "," + A[1] + "," + A[2] + "," + a + ")";
  }
  function shade(c, k) { return k >= 0 ? mix(c, "#ffffff", k) : mix(c, "#000000", -k); }
  function hexCode(c) { return "0x" + String(c).replace("#", ""); }

  /* ---------- 图形 ---------- */
  function roundRectPath(c, x, y, w, h, r) {
    r = Math.min(r == null ? 0 : r, w / 2, h / 2);
    if (r < 0) r = 0;
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  /* 通用盒子：背景 / 边框 / 阴影 / 圆角，参数对齐 LVGL 样式属性 */
  function box(c, x, y, w, h, o) {
    o = o || {};
    var r = o.radius == null ? 0 : o.radius;
    if (o.shadow) {
      c.save();
      c.shadowColor = o.shadow;
      c.shadowBlur = o.shadowBlur == null ? 12 : o.shadowBlur;
      c.shadowOffsetY = o.shadowY == null ? 4 : o.shadowY;
      c.shadowOffsetX = o.shadowX || 0;
      c.fillStyle = o.bg || "#ffffff";
      roundRectPath(c, x, y, w, h, r);
      c.fill();
      c.restore();
    } else if (o.bg) {
      c.fillStyle = o.bg;
      roundRectPath(c, x, y, w, h, r);
      c.fill();
    }
    if (o.borderWidth) {
      c.save();
      c.strokeStyle = o.border || theme.border;
      c.lineWidth = o.borderWidth;
      c.setLineDash(o.dash || []);
      roundRectPath(c, x + o.borderWidth / 2, y + o.borderWidth / 2, w - o.borderWidth, h - o.borderWidth, Math.max(0, r - o.borderWidth / 2));
      c.stroke();
      c.restore();
    }
  }

  function text(c, str, x, y, o) {
    o = o || {};
    c.save();
    c.font = (o.weight || 400) + " " + (o.size || 14) + "px " + (o.mono ? MONO : FONT);
    c.fillStyle = o.color || theme.text;
    c.textAlign = o.align || "left";
    c.textBaseline = o.baseline || "middle";
    if (o.alpha != null) c.globalAlpha = o.alpha;
    c.fillText(String(str), x, y);
    c.restore();
  }

  function measure(c, str, o) {
    o = o || {};
    c.save();
    c.font = (o.weight || 400) + " " + (o.size || 14) + "px " + (o.mono ? MONO : FONT);
    var w = c.measureText(String(str)).width;
    c.restore();
    return w;
  }

  /* 把长文本按宽度折行，返回行数组（中文逐字宽度也能正确处理） */
  function wrap(c, str, maxW, o) {
    o = o || {};
    var lines = [];
    var line = "";
    String(str).split("\n").forEach(function (para) {
      for (var i = 0; i < para.length; i++) {
        var ch = para[i];
        if (measure(c, line + ch, o) > maxW && line) {
          lines.push(line);
          line = ch;
        } else {
          line += ch;
        }
      }
      lines.push(line);
      line = "";
    });
    return lines;
  }

  function ellipse(c, x, y, rx, ry) {
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  }

  /* 5x7 点阵图标：让演示页无需字体图标也能画出箭头 / 对勾等 */
  var ICONS = {
    check: ["00001", "00011", "00110", "11100", "01100", "00100", "00000"],
    close: ["10001", "11011", "01110", "00100", "01110", "11011", "10001"],
    plus: ["00100", "00100", "11111", "00100", "00100", "00000", "00000"],
    minus: ["00000", "00000", "11111", "00000", "00000", "00000", "00000"],
    left: ["00100", "01000", "10000", "10000", "10000", "01000", "00100"],
    right: ["00100", "00010", "00001", "00001", "00001", "00010", "00100"],
    up: ["00000", "00100", "01110", "10101", "00100", "00100", "00000"],
    down: ["00000", "00100", "00100", "10101", "01110", "00100", "00000"],
    search: ["01110", "10001", "10001", "10001", "01110", "00100", "00010"],
    home: ["00100", "01110", "11111", "01110", "01110", "11111", "00000"],
    gear: ["01010", "11111", "11011", "00100", "11011", "11111", "01010"],
    play: ["10000", "11000", "11100", "11110", "11100", "11000", "10000"],
    pause: ["11011", "11011", "11011", "11011", "11011", "11011", "11011"],
    wifi: ["01110", "10001", "00100", "01010", "00000", "00100", "00000"],
    battery: ["11111", "10001", "10001", "10001", "10001", "10001", "11111"],
    volume: ["00100", "01100", "11100", "11111", "11100", "01100", "00100"],
    bell: ["00100", "01110", "01110", "01110", "11111", "00100", "01110"],
    user: ["01110", "01110", "00100", "11111", "00100", "01010", "10001"],
    trash: ["00100", "11111", "01010", "01010", "01010", "01110", "11111"],
    folder: ["11110", "10000", "11110", "10001", "10001", "10001", "11110"],
    file: ["11110", "10010", "10010", "10010", "10010", "10011", "11110"]
  };

  function icon(c, name, x, y, size, color) {
    var g = ICONS[name];
    if (!g) return;
    var px = size / 7;
    c.save();
    c.fillStyle = color || theme.text;
    for (var r = 0; r < 7; r++) {
      for (var col = 0; col < 5; col++) {
        if (g[r][col] === "1") c.fillRect(x + col * px, y + r * px, px + 0.4, px + 0.4);
      }
    }
    c.restore();
  }

  /* ---------- 画布 ---------- */
  function view(canvas) {
    var ctx = canvas.getContext("2d");
    var o = {
      canvas: canvas,
      ctx: ctx,
      w: canvas.clientWidth || canvas.width,
      h: canvas.clientHeight || canvas.height,
      dpr: window.devicePixelRatio || 1
    };
    o.resize = function (w, h) {
      o.w = w;
      o.h = h;
      o.dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(w * o.dpr);
      canvas.height = Math.round(h * o.dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(o.dpr, 0, 0, o.dpr, 0, 0);
    };
    o.resize(o.w, o.h);
    return o;
  }

  function run(draw) {
    function loop(now) {
      draw(now);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  /* ---------- 面板 / 状态 ---------- */
  function status(msg, ok) {
    var el = document.getElementById("status");
    if (!el) return;
    el.textContent = msg;
    el.className = "status" + (ok ? " ok" : "");
  }

  function setText(id, txt) {
    var el = document.getElementById(id);
    if (el) el.textContent = txt;
  }

  function bindRange(id, fmt, cb) {
    var el = document.getElementById(id);
    var out = document.getElementById("o-" + id);
    function apply() {
      var v = Number(el.value);
      if (out) out.textContent = fmt ? fmt(v) : v;
      if (cb) cb(v);
    }
    el.addEventListener("input", apply);
    apply();
    return el;
  }

  function bindCheck(id, cb) {
    var el = document.getElementById(id);
    el.addEventListener("change", function () { cb(el.checked); });
    return el;
  }

  function bindSeg(id, cb) {
    var host = document.getElementById(id);
    var btns = host.querySelectorAll("button");
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener("click", function () {
        Array.prototype.forEach.call(btns, function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        cb(b.dataset.val != null ? b.dataset.val : b.textContent);
      });
    });
    return host;
  }

  /* ---------- C 代码着色 ---------- */
  function cm(s) { return '<span class="cm">' + s + "</span>"; }
  function fn(s) { return '<span class="fn">' + s + "</span>"; }
  function num(s) { return '<span class="num">' + s + "</span>"; }

  function code(lines) {
    var el = document.getElementById("code");
    if (el) el.innerHTML = lines.join("\n");
  }

  /* ---------- 下载 ---------- */
  function download(blob, name) {
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  }

  function exportPng(canvas, name) {
    canvas.toBlob(function (blob) {
      download(blob, name);
      status("PNG 已保存（" + canvas.width + "×" + canvas.height + "）", true);
    }, "image/png");
  }

  /* ---------- GIF 导出（gif.js，需联网） ---------- */
  var GIF_SRC = "https://fastly.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js";
  var gifLib = null;

  function loadGif() {
    if (gifLib) return Promise.resolve(gifLib);
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = GIF_SRC;
      s.onload = function () { gifLib = window.GIF; resolve(gifLib); };
      s.onerror = function () { reject(new Error("gif.js 加载失败（需联网），可改用 WebM 或 PNG")); };
      document.head.appendChild(s);
    });
  }

  /* gif.js 的 worker 必须与页面同源：file:// 下直接用 CDN 地址 new Worker
     会抛 SecurityError 导致导出卡死，故用 blob 同源 worker 包裹 importScripts 加载 */
  function gifWorkerScript() {
    return URL.createObjectURL(new Blob(
      ['importScripts("https://fastly.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js");'],
      { type: "text/javascript" }));
  }

  /* opt: {name,w,h,fps,duration,frame(ctx,t),before,after,onDone} */
  function exportGif(opt) {
    var fps = opt.fps || 20;
    var frames = Math.max(2, Math.round((opt.duration || 2000) / 1000 * fps));
    status("加载 GIF 编码器…");
    loadGif().then(function (GIF) {
      var gif = new GIF({ workers: 2, quality: 10, width: opt.w, height: opt.h, workerScript: gifWorkerScript() });
      var off = document.createElement("canvas");
      off.width = opt.w;
      off.height = opt.h;
      var octx = off.getContext("2d");
      var prev = opt.before ? opt.before() : null;
      var i = 0;
      function step() {
        if (i < frames) {
          opt.frame(octx, i / fps * 1000);
          gif.addFrame(off, { delay: Math.round(1000 / fps), copy: true });
          status("渲染帧 " + (i + 1) + "/" + frames);
          i++;
          setTimeout(step, 0);
        } else {
          gif.on("finished", function (blob) {
            if (opt.after) opt.after(prev);
            download(blob, opt.name);
            status("GIF 已保存：" + frames + " 帧 / " + fps + "fps", true);
            if (opt.onDone) opt.onDone();
          });
          gif.on("progress", function (p) { status("编码 GIF " + Math.round(p * 100) + "%"); });
          gif.on("abort", function () {
            status("GIF 编码被中止，可改用 WebM 或 PNG");
            if (opt.onError) opt.onError();
          });
          try {
            gif.render();
          } catch (err) {
            status("GIF 编码启动失败：" + err.message + "，可改用 WebM 或 PNG");
            if (opt.onError) opt.onError();
          }
        }
      }
      step();
    }).catch(function (err) {
      status(err.message);
      if (opt.onError) opt.onError();
    });
  }

  /* ---------- WebM 录制（浏览器原生） ---------- */
  function exportWebm(opt) {
    var canvas = opt.canvas;
    if (!canvas.captureStream || typeof MediaRecorder === "undefined") {
      status("当前浏览器不支持 MediaRecorder，请用 Chrome / Edge");
      if (opt.onError) opt.onError();
      return;
    }
    var duration = opt.duration || 2000;
    var mime = "";
    ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].some(function (m) {
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) { mime = m; return true; }
      return false;
    });
    var prev = opt.before ? opt.before() : null;
    var stream = canvas.captureStream(30);
    var rec;
    try {
      rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    } catch (e) {
      status("无法创建 MediaRecorder：" + e.message);
      if (opt.onError) opt.onError();
      return;
    }
    var chunks = [];
    rec.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data); };
    rec.onstop = function () {
      if (opt.after) opt.after(prev);
      download(new Blob(chunks, { type: "video/webm" }), opt.name);
      status("WebM 已保存（" + (duration / 1000).toFixed(1) + " 秒）", true);
      if (opt.onDone) opt.onDone();
    };
    status("录制中，约 " + (duration / 1000).toFixed(1) + " 秒…");
    rec.start();
    setTimeout(function () { rec.stop(); }, duration);
  }

  return {
    theme: theme,
    FONT: FONT,
    MONO: MONO,
    clamp: clamp,
    lerp: lerp,
    ease: ease,
    easeOut: easeOut,
    rad: rad,
    deg: deg,
    normDeg: normDeg,
    hexToRgb: hexToRgb,
    rgbToHex: rgbToHex,
    mix: mix,
    alpha: alpha,
    shade: shade,
    hexCode: hexCode,
    roundRectPath: roundRectPath,
    box: box,
    text: text,
    measure: measure,
    wrap: wrap,
    ellipse: ellipse,
    icon: icon,
    view: view,
    run: run,
    status: status,
    setText: setText,
    bindRange: bindRange,
    bindCheck: bindCheck,
    bindSeg: bindSeg,
    cm: cm,
    fn: fn,
    num: num,
    code: code,
    download: download,
    exportPng: exportPng,
    exportGif: exportGif,
    exportWebm: exportWebm
  };
})();
