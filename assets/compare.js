/* ============================================================
   LVGL vs ArkUI lite 对比层（页面加载后自动挂载）
   布局：左列 LVGL 演示 + 左侧操作；右列 ArkUI lite 演示 + 右侧操作；
         最下方为差异对照
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

  function mount(){
    var key = location.pathname.split("/").pop().replace(/\.html?$/i, "");
    var DATA = window.LV_COMPARE_DATA || {};
    var D = DATA[key];
    if(!D) return;

    var wrap = q(".wrap");
    var stage = q(".stage");
    if(!wrap || !stage) return;

    var header = q("header", wrap);
    if(header){
      header.appendChild(el("p", "cmp-lead",
        "左侧为 <b>LVGL 复刻演示</b>，右侧为 <b>ArkUI lite（OpenHarmony small UI_Lite）</b> 对应组件。" +
        "左右两侧各自独立操作，页面最下方为差异对照。"));
    }

    /* ---------- 先记录需要搬进左列的 LVGL 操作区 ---------- */
    var footer = q("footer", wrap);
    var code = q("pre.code", wrap);
    var movers = [];
    var cur = stage.nextSibling;
    while(cur && cur !== footer){
      if(cur.nodeType === 1){
        var cls = " " + (cur.className || "") + " ";
        if(cls.indexOf(" panel ") >= 0 || cls.indexOf(" actions ") >= 0 ||
           cls.indexOf(" status ") >= 0 || cur === code){
          movers.push(cur);
        }
      }
      cur = cur.nextSibling;
    }

    /* ---------- 双列 ---------- */
    var grid = el("div", "cmp-grid");
    stage.parentNode.insertBefore(grid, stage);

    var leftCol = el("div", "cmp-col cmp-col--lv");
    var rightCol = el("div", "cmp-col cmp-col--ui");
    grid.appendChild(leftCol);
    grid.appendChild(rightCol);

    leftCol.appendChild(colHead("LVGL 演示", "lv", D.lv || key));
    leftCol.appendChild(stage);
    movers.forEach(function(n){ leftCol.appendChild(n); });

    /* ---------- 右列：演示 ---------- */
    rightCol.appendChild(colHead("ArkUI lite 演示", "ui",
      D.level === "none" ? "无对应组件" : D.ui));

    var side = el("section", "cmp-side");
    rightCol.appendChild(side);

    var head = el("div", "cmp-head");
    head.appendChild(el("span", "cmp-tag", "ArkUI lite"));
    head.appendChild(el("b", null, D.level === "none" ? "无对应组件" : D.ui));
    head.appendChild(el("span", "cmp-lv " + D.level,
      D.level === "full" ? "能力对齐" : D.level === "partial" ? "部分对齐" : "无此能力"));
    side.appendChild(head);

    var demo = el("div", "cmp-demo");
    side.appendChild(demo);

    var api = {};
    if(D.level === "none"){
      demo.appendChild(noneCard(D));
    }else{
      api = (DEMOS[D.demo] || DEMOS.none)(demo, D) || {};
      if(D.gaps && D.gaps.length){
        var g = el("div", "cmp-gaps");
        g.appendChild(el("div", "cmp-gaps-t", "右侧无法演示的能力"));
        D.gaps.forEach(function(x){ g.appendChild(el("span", "cmp-gap", "✗ " + x)); });
        side.appendChild(g);
      }
    }

    if(D.apis && D.apis.length){
      side.appendChild(el("div", "cmp-apis", "API：" + D.apis.join(" · ")));
    }
    if(D.note) side.appendChild(el("div", "cmp-note", D.note));

    /* ---------- 右列：独立操作 ---------- */
    var ctrl = el("section", "panel cmp-ctrl");
    buildControls(ctrl, D, api);
    rightCol.appendChild(ctrl);

    /* ---------- 最下方：差异对照 ---------- */
    var diff = buildDiff(D);
    if(footer) wrap.insertBefore(diff, footer);
    else wrap.appendChild(diff);

    if(footer){
      footer.appendChild(el("div", "cmp-src",
        "对比依据：foundation/arkui/ui_lite/interfaces/kits/components · lvgl/src/widgets"));
    }
  }

  function colHead(title, kind, sub){
    var h = el("div", "cmp-colhead");
    h.appendChild(el("span", "cmp-dot " + kind));
    h.appendChild(el("b", null, title));
    if(sub) h.appendChild(el("span", "cmp-colsub", sub));
    return h;
  }

  /* ================= 差异对照 ================= */
  function buildDiff(D){
    var panel = el("section", "panel cmp-diff");
    panel.appendChild(el("h2", null, "差异对照：LVGL " + (D.lv || "") + " / ArkUI lite " +
      (D.level === "none" ? "无对应组件" : D.ui)));

    var chips = el("div", "cmp-chips");
    D.diffs.forEach(function(r){
      var txt = r[3] === "none" ? "仅 LVGL 具备" : r[3] === "part" ? "部分对齐" : "双方具备";
      chips.appendChild(el("span", "cmp-chip " + r[3],
        '<span class="k">' + r[0] + "</span>" + txt));
    });
    panel.appendChild(chips);

    var tWrap = el("div", "tbl-wrap");
    var table = el("table", "cmp-table");
    table.innerHTML =
      "<thead><tr><th>能力</th><th>LVGL " + (D.lv || "") + "</th><th>ArkUI lite " +
      (D.level === "none" ? "（无）" : D.ui) + "</th><th>判定</th></tr></thead><tbody></tbody>";
    var tbody = q("tbody", table);
    D.diffs.forEach(function(r){
      var tr = el("tr");
      tr.innerHTML =
        "<td>" + r[0] + "</td><td>" + r[1] + "</td><td>" + r[2] + "</td>" +
        '<td class="res ' + r[3] + '">' +
        (r[3] === "none" ? "✗ 无" : r[3] === "part" ? "△ 部分" : "✓ 有") + "</td>";
      tbody.appendChild(tr);
    });
    tWrap.appendChild(table);
    panel.appendChild(tWrap);

    if(D.points && D.points.length){
      var ul = el("ul", "cmp-points");
      D.points.forEach(function(p){ ul.appendChild(el("li", null, p)); });
      panel.appendChild(ul);
    }
    return panel;
  }

  /* ================= 右侧操作区 ================= */
  function fieldWrap(labelText, apiText){
    var f = el("div", "field wide");
    f.appendChild(el("label", null, labelText + '<span class="api">' + apiText + "</span>"));
    return f;
  }
  function segField(labelText, apiText, opts, cb, active){
    var f = fieldWrap(labelText, apiText);
    var s = el("div", "seg");
    opts.forEach(function(o, i){
      var b = el("button", i === (active || 0) ? "active" : "", o.t);
      b.type = "button";
      b.onclick = function(){
        Array.prototype.forEach.call(s.children, function(x){ x.className = ""; });
        b.className = "active";
        cb(o.v);
      };
      s.appendChild(b);
    });
    f.appendChild(s);
    return f;
  }
  function rangeField(labelText, apiText, min, max, val, unit, cb){
    var f = fieldWrap(labelText, apiText);
    var out = el("output", null, val + unit);
    q("label", f).appendChild(out);
    var inp = el("input");
    inp.type = "range";
    inp.min = min;
    inp.max = max;
    inp.value = val;
    inp.oninput = function(){
      var v = Number(inp.value);
      out.textContent = v + unit;
      cb(v);
    };
    f.appendChild(inp);
    return f;
  }
  function textField(labelText, apiText, val, cb){
    var f = fieldWrap(labelText, apiText);
    var inp = el("input");
    inp.type = "text";
    inp.value = val;
    inp.oninput = function(){ cb(inp.value); };
    f.appendChild(inp);
    return f;
  }

  function buildControls(host, D, api){
    host.appendChild(el("h2", null, "ArkUI lite 操作（独立于左侧）"));
    if(D.level === "none"){
      host.appendChild(el("p", "cmp-ctrl-none", "ArkUI lite 没有对应组件，本页没有可操作项。"));
      return;
    }
    var fields = controlsFor(D.demo, api);
    if(!fields.length){
      host.appendChild(el("p", "cmp-ctrl-none", "该组件没有额外可调参数。"));
      return;
    }
    var g = el("div", "grid");
    fields.forEach(function(f){ g.appendChild(f); });
    host.appendChild(g);
  }

  function controlsFor(demo, api){
    switch(demo){
      case "button": return [
        segField("状态 state", "SetStyleForState(key, value, state)",
          [{ t: "RELEASED", v: "released" }, { t: "PRESSED", v: "pressed" }, { t: "INACTIVE", v: "inactive" }],
          api.set, 0)
      ];
      case "imagebutton": return [
        segField("图源 src", "SetImageSrc(default, pressed)",
          [{ t: "默认图", v: "default" }, { t: "按下图", v: "pressed" }], api.set, 0)
      ];
      case "label": return [
        rangeField("字号 font", "SetFont(name, size)", 12, 28, 17, " px", api.setSize)
      ];
      case "span": return [
        segField("样式 span", "SetForegroundColorSpan / SetBackgroundColorSpan",
          [{ t: "普通", v: "normal" }, { t: "强调", v: "accent" }], api.setStyle, 1)
      ];
      case "checkbox": return [
        segField("状态 state", "SetState(UICheckBoxState)",
          [{ t: "选中", v: true }, { t: "未选中", v: false }], api.set, 0)
      ];
      case "toggle": return [
        segField("状态 state", "SetState(true / false)",
          [{ t: "开", v: true }, { t: "关", v: false }], api.set, 0)
      ];
      case "slider": return [
        rangeField("数值 value", "SetValue()", 0, 100, 62, "", api.setValue)
      ];
      case "progress": return [
        rangeField("进度 value", "SetValue()", 0, 100, 62, " %", api.setValue)
      ];
      case "image": return [
        segField("缩放 resize", "SetResizeMode(mode)",
          [{ t: "STRETCH", v: "stretch" }, { t: "CONTAIN", v: "contain" }, { t: "COVER", v: "cover" }],
          api.setMode, 1)
      ];
      case "edittext": return [
        textField("文本 text", "SetText(const char*)", "UIEditText", api.setText)
      ];
      case "chart": return [
        segField("数据 series", "AddPoints(points, count)",
          [{ t: "数据 A", v: 0 }, { t: "数据 B", v: 1 }], api.setSeries, 0)
      ];
      case "list": return [
        segField("选中项 select", "SetSelectPosition(index)",
          [{ t: "第 1 项", v: 0 }, { t: "第 2 项", v: 1 }, { t: "第 3 项", v: 2 }], api.setSel, 1)
      ];
      case "picker": return [
        segField("选中项 select", "SetSelectIndex(index)",
          [{ t: "北京", v: 0 }, { t: "上海", v: 1 }, { t: "广州", v: 2 }], api.setSel, 1)
      ];
      case "qrcode": return [
        textField("内容 value", "SetQrcodeInfo(val)", "OpenHarmony", api.setText)
      ];
      case "imageanim": return [
        segField("播放 play", "SetRepeat / SetTimeOfUpdate",
          [{ t: "播放", v: true }, { t: "暂停", v: false }], api.setPlaying, 0)
      ];
      case "dialog": return [
        segField("按钮 button", "SetButton(DialogButtonType, text, listener)",
          [{ t: "取消", v: "cancel" }, { t: "确定", v: "ok" }], api.click, 1)
      ];
      case "canvas": return [
        segField("图元 primitive", "SetDrawLinePath / SetArcParamInfo",
          [{ t: "全部", v: "all" }, { t: "直线", v: "line" }, { t: "圆弧", v: "arc" }, { t: "矩形", v: "rect" }],
          api.draw, 0)
      ];
      case "arclabel": return [
        rangeField("结束角度 angle", "SetArcTextAngle(start, end)", 200, 340, 292, "°", api.setAngle)
      ];
      case "view": return [
        rangeField("宽度 width", "SetWidth()", 120, 260, 190, " px", api.setWidth)
      ];
      default: return [];
    }
  }

  /* ================= 右侧组件示意 ================= */
  function noneCard(d){
    var box = el("div", "cmp-none");
    box.appendChild(el("div", "cmp-none-x", "✗"));
    box.appendChild(el("div", "cmp-none-t", "ArkUI lite 无此能力"));
    box.appendChild(el("div", "cmp-none-s", "没有与 LVGL 对应的组件，右侧无法演示"));
    if(d.alt) box.appendChild(el("div", "cmp-none-alt", "<b>最接近的实现：</b>" + d.alt));
    return box;
  }

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

  mount();
})();
