/* ============================================================
   LVGL vs ArkUI lite 双栏对比模板 · 公共脚本
   依赖：先加载 compare-data.js
   功能：
   - LV2.mountRight()：把 D.demo 对应的 ud-* 演示挂进 #udemo，api 存到 LV2.api
     （level=none 时渲染「无对应组件」卡片）
   - 自动渲染 #diff 差异对照（汇总 chips + 判定着色表格 + 关键结论）
   - 自动填充 #ugaps（右列右上角红色「ArkUI lite 无法表达」，数据源 D.gaps）
   - 自动填充 #lgaps（左列左上角灰色「LVGL 不可演示」，数据源 window.LV_PAGE_LVGAPS）
   ============================================================ */
(function(){
  "use strict";

  function el(tag, cls, html){
    var e = document.createElement(tag);
    if(cls) e.className = cls;
    if(html != null) e.innerHTML = html;
    return e;
  }
  function q(s, r){ return (r || document).querySelector(s); }

  var key = location.pathname.split("/").pop().replace(/\.html?$/i, "");
  var D = (window.LV_COMPARE_DATA || {})[key] || null;

  /* ================= 工具 ================= */
  function fitCv(cv, w, h){
    var dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    cv.style.width = w + "px";
    cv.style.height = h + "px";
    var c = cv.getContext("2d");
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    return c;
  }

  function svgPic(){
    return '<svg width="64" height="44" viewBox="0 0 64 44" fill="none">' +
      '<rect x="1" y="1" width="62" height="42" rx="6" stroke="#a9b8cc" stroke-width="2"/>' +
      '<circle cx="19" cy="15" r="5" fill="#c3d2e6"/>' +
      '<path d="M6 36l15-13 9 8 9-11 18 16H6z" fill="#c3d2e6"/></svg>';
  }

  function noneCard(d){
    var box = el("div", "cmp-none");
    box.appendChild(el("div", "cmp-none-x", "✗"));
    box.appendChild(el("div", "cmp-none-t", "ArkUI lite 无此能力"));
    box.appendChild(el("div", "cmp-none-s", "没有与 LVGL 对应的组件，右侧无法演示"));
    if(d.alt) box.appendChild(el("div", "cmp-none-alt", "<b>最接近的实现：</b>" + d.alt));
    return box;
  }

  /* ================= 右列 ud-* 演示渲染器 ================= */
  var DEMOS = {

    none: function(box, d){ box.appendChild(noneCard(d)); },

    button: function(box){
      var b = el("div", "ud-btn", "Button");
      box.appendChild(b);
      box.appendChild(el("div", "ud-sub", "RELEASED / PRESSED / INACTIVE · 三态互斥"));
      function set(mode){
        b.classList.remove("press", "inactive");
        if(mode === "pressed") b.classList.add("press");
        if(mode === "inactive") b.classList.add("inactive");
      }
      b.addEventListener("pointerdown", function(){
        if(!b.classList.contains("inactive")) b.classList.add("press");
      });
      ["pointerup", "pointerleave", "pointercancel"].forEach(function(ev){
        b.addEventListener(ev, function(){ b.classList.remove("press"); });
      });
      return { set: set };
    },

    imagebutton: function(box){
      var b = el("div", "ud-imgbtn", svgPic());
      box.appendChild(b);
      box.appendChild(el("div", "ud-sub", "SetImageSrc(默认图, 按下图) · 仅两态"));
      function set(mode){ b.classList.toggle("press", mode === "pressed"); }
      b.addEventListener("pointerdown", function(){ b.classList.add("press"); });
      ["pointerup", "pointerleave", "pointercancel"].forEach(function(ev){
        b.addEventListener(ev, function(){ b.classList.remove("press"); });
      });
      return { set: set };
    },

    label: function(box){
      var t = el("div", "ud-label", "Label text");
      box.appendChild(t);
      box.appendChild(el("div", "ud-sub", "UILabel · SetText / SetLineBreakMode / SetFont"));
      return { setSize: function(v){ t.style.fontSize = v + "px"; } };
    },

    span: function(box){
      var t = el("div", "ud-rich",
        '<span class="c">Rich</span> <span class="b">Span</span> text');
      box.appendChild(t);
      box.appendChild(el("div", "ud-sub", "UILabel + SpannableString（颜色 / 字号 / 背景 Span）"));
      return {
        setStyle: function(mode){
          var b = t.querySelector(".b");
          b.style.background = mode === "accent" ? "#ffd34d" : "#ffe08a";
          t.querySelector(".c").style.color = mode === "accent" ? "#007dff" : "#1c2128";
        }
      };
    },

    checkbox: function(box){
      var c = el("div", "ud-check on",
        '<span class="box"><svg width="14" height="11" viewBox="0 0 14 11">' +
        '<path d="M1 5.5L5 9.5L13 1.5" stroke="#fff" stroke-width="2.4" fill="none" ' +
        'stroke-linecap="round" stroke-linejoin="round"/></svg></span><span>Check</span>');
      box.appendChild(c);
      box.appendChild(el("div", "ud-sub", "UICheckBox · SELECTED / UNSELECTED"));
      c.addEventListener("click", function(){ c.classList.toggle("on"); });
      return { set: function(on){ c.classList.toggle("on", !!on); } };
    },

    toggle: function(box){
      var t = el("div", "ud-toggle on", '<span class="knob"></span>');
      box.appendChild(t);
      box.appendChild(el("div", "ud-sub", "UIToggleButton · SetState(true/false)"));
      t.addEventListener("click", function(){ t.classList.toggle("on"); });
      return { set: function(on){ t.classList.toggle("on", !!on); } };
    },

    slider: function(box){
      var s = el("div", "ud-slider",
        '<div class="track"><div class="fill"></div></div><div class="knob"></div>');
      box.appendChild(s);
      box.appendChild(el("div", "ud-sub", "UISlider · 单滑块，无区间/刻度"));
      var fill = q(".fill", s), knob = q(".knob", s);
      return {
        setValue: function(v){
          fill.style.width = v + "%";
          knob.style.left = "calc(" + v + "% - 9px)";
        }
      };
    },

    progress: function(box){
      var p = el("div", "ud-progress", "<i></i>");
      box.appendChild(p);
      box.appendChild(el("div", "ud-sub", "UIBoxProgress · 单向填充"));
      var bar = q("i", p);
      return { setValue: function(v){ bar.style.width = v + "%"; } };
    },

    image: function(box){
      var wrapImg = el("div", "ud-image", svgPic());
      box.appendChild(wrapImg);
      box.appendChild(el("div", "ud-sub", "UIImageView · SetSrc / SetResizeMode"));
      var svg = q("svg", wrapImg);
      svg.setAttribute("width", "100%");
      svg.setAttribute("height", "100%");
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      return {
        setMode: function(m){
          svg.setAttribute("preserveAspectRatio",
            m === "stretch" ? "none" : m === "cover" ? "xMidYMid slice" : "xMidYMid meet");
        }
      };
    },

    edittext: function(box){
      var e = el("div", "ud-edit", '<span class="txt">UIEditText</span><span class="caret"></span>');
      box.appendChild(e);
      box.appendChild(el("div", "ud-sub", "UIEditText · 单行输入为主"));
      var txt = q(".txt", e);
      return {
        setText: function(s){
          txt.textContent = s || "请输入内容";
          txt.className = s ? "txt" : "ph txt";
        }
      };
    },

    chart: function(box){
      var cv = el("canvas");
      box.appendChild(cv);
      box.appendChild(el("div", "ud-sub", "UIChart · AddPoints + 折线/填充"));
      var c = fitCv(cv, 230, 120);
      var sets = [
        [10, 78, 46, 92, 34, 110, 22, 130, 60, 148, 44],
        [26, 48, 92, 64, 118, 52, 86, 120, 40, 96, 66]
      ];
      function draw(i){
        var pts = sets[i] || sets[0];
        var w = 230, h = 120, pad = 8, max = 160;
        function X(k){ return pad + k * (w - pad * 2) / (pts.length - 1); }
        function Y(v){ return h - pad - v / max * (h - pad * 2); }
        c.clearRect(0, 0, w, h);
        var grad = c.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, "rgba(0,125,255,.28)");
        grad.addColorStop(1, "rgba(0,125,255,0)");
        c.beginPath();
        c.moveTo(X(0), Y(pts[0]));
        for(var k = 1; k < pts.length; k++) c.lineTo(X(k), Y(pts[k]));
        c.lineTo(X(pts.length - 1), h - pad);
        c.lineTo(X(0), h - pad);
        c.closePath();
        c.fillStyle = grad;
        c.fill();
        c.beginPath();
        c.moveTo(X(0), Y(pts[0]));
        for(var j = 1; j < pts.length; j++) c.lineTo(X(j), Y(pts[j]));
        c.strokeStyle = "#007dff";
        c.lineWidth = 2;
        c.lineJoin = "round";
        c.stroke();
        c.fillStyle = "#007dff";
        c.beginPath();
        c.arc(X(pts.length - 1), Y(pts[pts.length - 1]), 3.5, 0, Math.PI * 2);
        c.fill();
      }
      draw(0);
      return { setSeries: draw };
    },

    list: function(box){
      var l = el("div", "ud-list");
      ["Item 1", "Item 2", "Item 3", "Item 4"].forEach(function(t, i){
        l.appendChild(el("div", "row" + (i === 1 ? " sel" : ""), t));
      });
      box.appendChild(l);
      box.appendChild(el("div", "ud-sub", "UIList + AbstractAdapter"));
      return {
        setSel: function(i){
          Array.prototype.forEach.call(l.children, function(row, k){
            row.classList.toggle("sel", k === i);
          });
        }
      };
    },

    picker: function(box){
      var p = el("div", "ud-picker");
      box.appendChild(p);
      box.appendChild(el("div", "ud-sub", "UIPicker · 单列滚轮"));
      var opts = ["北京", "上海", "广州", "深圳"];
      function setSel(i){
        i = Math.max(0, Math.min(opts.length - 1, i));
        p.innerHTML = "";
        [opts[(i + opts.length - 1) % opts.length], opts[i], opts[(i + 1) % opts.length]]
          .forEach(function(t, k){
            p.appendChild(el("div", "it" + (k === 1 ? " mid" : ""), t));
          });
      }
      setSel(1);
      return { setSel: setSel };
    },

    qrcode: function(box){
      var cv = el("canvas");
      box.appendChild(cv);
      box.appendChild(el("div", "ud-sub", "UIQRCode · SetQrcodeInfo"));
      var c = fitCv(cv, 126, 126);
      function draw(text){
        var seed = 7;
        for(var i = 0; i < String(text).length; i++) seed = (seed * 31 + String(text).charCodeAt(i)) & 0x7fffffff;
        function rnd(){ seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
        var n = 21, s = 6;
        c.fillStyle = "#fff";
        c.fillRect(0, 0, 126, 126);
        c.fillStyle = "#111";
        for(var y = 0; y < n; y++){
          for(var x = 0; x < n; x++){
            if(rnd() > 0.52) c.fillRect(x * s, y * s, s, s);
          }
        }
        [[0, 0], [n - 7, 0], [0, n - 7]].forEach(function(p){
          c.fillStyle = "#fff";
          c.fillRect(p[0] * s, p[1] * s, 7 * s, 7 * s);
          c.fillStyle = "#111";
          c.fillRect(p[0] * s, p[1] * s, 7 * s, 7 * s);
          c.fillStyle = "#fff";
          c.fillRect((p[0] + 1) * s, (p[1] + 1) * s, 5 * s, 5 * s);
          c.fillStyle = "#111";
          c.fillRect((p[0] + 2) * s, (p[1] + 2) * s, 3 * s, 3 * s);
        });
      }
      draw("OpenHarmony");
      return { setText: draw };
    },

    imageanim: function(box){
      var cv = el("canvas");
      box.appendChild(cv);
      box.appendChild(el("div", "ud-sub", "UIImageAnimator · 预制帧序列"));
      var c = fitCv(cv, 170, 100);
      var frames = 0, timer = null;
      function frame(){
        var f = frames % 3;
        c.clearRect(0, 0, 170, 100);
        c.fillStyle = "#eef3fb";
        c.fillRect(0, 0, 170, 100);
        c.fillStyle = "#007dff";
        if(f === 0){ c.beginPath(); c.arc(85, 50, 22, 0, Math.PI * 2); c.fill(); }
        else if(f === 1){ c.fillRect(64, 29, 42, 42); }
        else { c.beginPath(); c.moveTo(85, 27); c.lineTo(108, 71); c.lineTo(62, 71); c.closePath(); c.fill(); }
        frames++;
      }
      frame();
      function play(){ if(!timer) timer = setInterval(frame, 420); }
      function pause(){ if(timer){ clearInterval(timer); timer = null; } }
      play();
      return {
        setPlaying: function(on){ on ? play() : pause(); }
      };
    },

    dialog: function(box){
      var msg = el("div", "ud-sub", "");
      var d = el("div", "ud-dialog",
        '<div class="t">提示</div><div class="c">UIDialog：固定标题 + 正文 + 按钮，内容区不可自定义。</div>' +
        '<div class="b"><span>取消</span><span>确定</span></div>');
      box.appendChild(d);
      box.appendChild(msg);
      var btns = d.querySelectorAll(".b span");
      function click(which){
        Array.prototype.forEach.call(btns, function(s){ s.style.fontWeight = "400"; });
        var i = which === "ok" ? 1 : 0;
        btns[i].style.fontWeight = "700";
        msg.textContent = "触发按钮：" + (which === "ok" ? "确定" : "取消");
      }
      btns[0].onclick = function(){ click("cancel"); };
      btns[1].onclick = function(){ click("ok"); };
      return { click: click };
    },

    canvas: function(box){
      var cv = el("canvas");
      box.appendChild(cv);
      box.appendChild(el("div", "ud-sub", "UICanvas · 有限图元（线 / 弧 / 矩形）"));
      var c = fitCv(cv, 190, 120);
      function draw(which){
        c.clearRect(0, 0, 190, 120);
        c.fillStyle = "#fafbfd";
        c.fillRect(0, 0, 190, 120);
        if(which === "all" || which === "line"){
          c.strokeStyle = "#007dff";
          c.lineWidth = 2;
          c.beginPath(); c.moveTo(16, 92); c.lineTo(60, 40); c.lineTo(104, 74); c.lineTo(150, 26); c.stroke();
        }
        if(which === "all" || which === "arc"){
          c.strokeStyle = "#f0a020";
          c.lineWidth = 2;
          c.beginPath(); c.arc(150, 84, 20, Math.PI, Math.PI * 1.6); c.stroke();
        }
        if(which === "all" || which === "rect"){
          c.strokeStyle = "#1f9d66";
          c.lineWidth = 2;
          c.strokeRect(24, 20, 34, 24);
        }
      }
      draw("all");
      return { draw: draw };
    },

    arclabel: function(box){
      var cv = el("canvas");
      box.appendChild(cv);
      box.appendChild(el("div", "ud-sub", "UIArcLabel · SetArcTextAngle / Radius"));
      var c = fitCv(cv, 190, 130);
      function draw(endDeg){
        var text = "ARC LABEL TEXT";
        var cx = 95, cy = 92, r = 62;
        var start = Math.PI * 1.12;
        var end = Math.PI * (endDeg / 180);
        c.clearRect(0, 0, 190, 130);
        c.fillStyle = "#1c2128";
        c.font = "600 13px -apple-system, 'Microsoft YaHei', sans-serif";
        c.textAlign = "center";
        c.textBaseline = "middle";
        for(var i = 0; i < text.length; i++){
          var a = start + (end - start) * i / Math.max(1, text.length - 1);
          c.save();
          c.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
          c.rotate(a + Math.PI / 2);
          c.fillText(text[i], 0, 0);
          c.restore();
        }
      }
      draw(292);
      return { setAngle: draw };
    },

    view: function(box){
      var v = el("div", "ud-view", "UIView（基础容器）");
      box.appendChild(v);
      box.appendChild(el("div", "ud-sub", "UIView · SetPosition / SetSize / Add"));
      return { setWidth: function(w){ v.style.width = w + "px"; } };
    }
  };

  /* ================= 挂载右列演示 ================= */
  var LV2 = { key: key, D: D, api: {}, fitCv: fitCv, svgPic: svgPic, noneCard: noneCard };

  LV2.mountRight = function(boxId){
    var box = document.getElementById(boxId || "udemo");
    if(!box || !D) return {};
    var api = {};
    if(D.level === "none"){
      box.appendChild(noneCard(D));
    }else{
      api = (DEMOS[D.demo] || DEMOS.none)(box, D) || {};
    }
    LV2.api = api;
    return api;
  };

  /* ================= 差异对照 ================= */
  LV2.renderDiff = function(hostId){
    var host = document.getElementById(hostId || "diff");
    if(!D || !host) return;

    var uiName = D.level === "none" ? "无对应组件" : D.ui;
    host.appendChild(el("h2", null, "差异对照：" + (D.lv || key) + " / " + uiName));
    host.appendChild(el("div", "cmp-diff-sub",
      "判定说明：<b>✓ 双方具备</b>（能力可对齐）&nbsp;·&nbsp; <b>△ 部分对齐</b>（右侧能做但有限制）&nbsp;·&nbsp; <b>✗ 仅 LVGL 具备</b>（ArkUI lite 无此能力）"));

    var nOk = 0, nPart = 0, nNone = 0;
    D.diffs.forEach(function(r){
      if(r[3] === "ok") nOk++;
      else if(r[3] === "part") nPart++;
      else nNone++;
    });
    var chips = el("div", "cmp-chips");
    chips.appendChild(el("span", "cmp-chip ok", "✓ 双方具备 " + nOk + " 项"));
    chips.appendChild(el("span", "cmp-chip part", "△ 部分对齐 " + nPart + " 项"));
    chips.appendChild(el("span", "cmp-chip none", "✗ 仅 LVGL 具备 " + nNone + " 项"));
    host.appendChild(chips);

    var tWrap = el("div", "tbl-wrap");
    var table = el("table", "cmp-table");
    table.innerHTML =
      "<thead><tr><th>能力</th><th>LVGL " + (D.lv || key) + "</th><th>ArkUI lite " +
      uiName + "</th><th>判定</th></tr></thead><tbody></tbody>";
    var tbody = table.querySelector("tbody");
    D.diffs.forEach(function(r){
      var tr = el("tr", "row-" + r[3]);
      var verdict = r[3] === "ok" ? "✓ 双方具备" : r[3] === "part" ? "△ 部分对齐" : "✗ 无此能力";
      tr.innerHTML = "<td>" + r[0] + "</td><td>" + r[1] + "</td><td>" + r[2] +
        '</td><td class="res ' + r[3] + '">' + verdict + "</td>";
      tbody.appendChild(tr);
    });
    tWrap.appendChild(table);
    host.appendChild(tWrap);

    if(D.points && D.points.length){
      var box = el("div", "cmp-points");
      box.appendChild(el("div", "cmp-points-t", "关键结论"));
      var ul = el("ul");
      D.points.forEach(function(p){ ul.appendChild(el("li", null, p)); });
      box.appendChild(ul);
      host.appendChild(box);
    }
  };

  /* ================= 舞台角标 ================= */
  LV2.fillGaps = function(){
    /* 右列右上角：ArkUI lite 无法表达（数据源 D.gaps） */
    var ugaps = document.getElementById("ugaps");
    if(ugaps && D && D.gaps && D.gaps.length){
      ugaps.appendChild(el("div", "ui-gaps-t", "ArkUI lite 无法表达"));
      D.gaps.forEach(function(x){ ugaps.appendChild(el("span", "ui-gap", "✗ " + x)); });
    }
    /* 左列左上角：LVGL 不可演示（页面自定义 window.LV_PAGE_LVGAPS） */
    var lgaps = document.getElementById("lgaps");
    var lvGaps = window.LV_PAGE_LVGAPS || [];
    if(lgaps && lvGaps.length){
      lgaps.appendChild(el("div", "lv-gaps-t", "LVGL 不可演示"));
      lvGaps.forEach(function(x){ lgaps.appendChild(el("span", "lv-gap", "— " + x)); });
    }
  };

  LV2.init = function(){
    if(document.getElementById("udemo")) LV2.mountRight("udemo");
    LV2.renderDiff("diff");
    LV2.fillGaps();
  };

  window.LV2 = LV2;
  LV2.init();
})();
