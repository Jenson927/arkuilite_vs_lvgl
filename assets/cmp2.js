/* ============================================================
   LVGL vs ArkUI lite 双栏对比模板 · 公共脚本（v2）
   依赖：先加载 compare-data.js
   右列演示全部按 foundation/arkui/ui_lite 最新源码的真实参数渲染：
   - 颜色 / 圆角 / 线宽：foundation/graphic/graphic_utils_lite/frameworks/style.cpp
   - 动效时长与曲线：各组件 .cpp 内的 constexpr 常量
   页面若提供 <div id="upanel"></div>，本脚本会自动生成参数面板并实时刷新
   实时 C++ 代码（#ucode）；未提供时仍用兼容 setter 的老页面不受影响。
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

  var TEXT = "#1c2128";          // 浅底上的默认文字色

  /* ================= 通用工具 ================= */
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

  function rr(c, x, y, w, h, r){
    r = Math.max(0, Math.min(r, Math.min(w, h) / 2));
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function rgba(hex, opa){
    var s = String(hex || "#000000").replace("#", "");
    if(s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    var n = parseInt(s, 16);
    return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + opa + ")";
  }

  function hx(hex){ return "0x" + String(hex || "#000000").replace("#", "").toUpperCase(); }

  function screen(c, w, h){
    /* 只清空画布、不再画白色圆角底框：右列与左列 LVGL 舞台一致，
       组件自身有背景就由组件自己画，没有就不额外加框 */
    c.clearRect(0, 0, w, h);
  }

  function txt(c, s, x, y, size, color, align){
    c.font = "600 " + size + "px -apple-system, 'Microsoft YaHei', sans-serif";
    c.fillStyle = color || TEXT;
    c.textAlign = align || "center";
    c.textBaseline = "middle";
    c.fillText(s, x, y);
  }

  function hint(c, s, w, h){
    txt(c, s, w / 2, h - 14, 11, "#8b939d");
  }

  /* cubic-bezier 求值（与 ArkUI lite 的 Interpolation::GetBezierY 同型） */
  function bezier(x1, y1, x2, y2){
    function A(a, b){ return 1.0 - 3.0 * b + 3.0 * a; }
    function B(a, b){ return 3.0 * b - 6.0 * a; }
    function C(a){ return 3.0 * a; }
    function calc(a, b, t){ return ((A(a, b) * t + B(a, b)) * t + C(a)) * t; }
    function slope(a, b, t){ return 3.0 * A(a, b) * t * t + 2.0 * B(a, b) * t + C(a); }
    return function(x){
      if(x <= 0) return 0;
      if(x >= 1) return 1;
      var t = x;
      for(var i = 0; i < 6; i++){
        var s = slope(x1, x2, t);
        if(Math.abs(s) < 1e-6) break;
        t -= (calc(x1, x2, t) - x) / s;
      }
      return calc(y1, y2, t);
    };
  }

  function mk(box, w, h){
    var cv = el("canvas");
    box.appendChild(cv);
    return { cv: cv, c: fitCv(cv, w, h), w: w, h: h };
  }

  /* ================= 兼容旧接口 ================= */
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
    box.appendChild(el("div", "cmp-none-s", "没有与 " + (d.leftLabel || "LVGL") + " 对应的组件，右侧无法演示"));
    if(d.alt) box.appendChild(el("div", "cmp-none-alt", "<b>最接近的实现：</b>" + d.alt));
    return box;
  }

  /* ================= 右列演示定义 =================
     每个 demo：{ controls:[…], defaults:{…}, create(box,state)->{render(state)}, code(state), note }
     controls 类型：range / color / text / seg / check / multi / button
     ============================================== */
  var DEMOS = {};

  /* 画布内交互（如拖动 UISlider）需要把新值写回参数面板并刷新生成的代码 */
  var panelRefs = {};
  var activeApply = null;
  function syncPanel(k, val){
    var r = panelRefs[k];
    if(!r) return;
    if(r.input && r.input.type === "range") r.input.value = val;
    if(r.out) r.out.textContent = String(val) + (r.unit || "");
  }
  function refreshRight(){ if(activeApply) activeApply(); }

  DEMOS.none = {
    controls: [],
    create: function(box, d){ box.appendChild(noneCard(d)); return { render: function(){} }; }
  };

  /* ---------- UIButton ---------- */
  DEMOS.button = {
    defaults: { state: "released", w: 140, h: 48, radius: 200, bg: "#007dff",
      pressBg: "#1996ff", inactiveBg: "#617e9d", anim: true, mask: true,
      text: "Button", fontSize: 16, textColor: "#ffffff", auto: false },
    controls: [
      { k: "text", t: "text", wide: true, label: "文字 text（挂在 UILabel 上）", def: "Button",
        api: "UIButton 不画文字：new UILabel() → SetText(const char*) → btn->Add(label)" },
      { k: "state", t: "seg", wide: true, label: "按钮状态 state", def: "released",
        api: "RELEASED / PRESSED / INACTIVE（互斥）· Disable() / Enable()",
        opts: [["released", "RELEASED"], ["pressed", "PRESSED"], ["inactive", "INACTIVE"]] },
      { k: "w", t: "range", label: "宽度 width", api: "SetWidth(int16_t)", min: 80, max: 260, def: 140, unit: " px" },
      { k: "h", t: "range", label: "高度 height", api: "SetHeight(int16_t)", min: 24, max: 96, def: 48, unit: " px" },
      { k: "radius", t: "range", label: "圆角 borderRadius", api: "SetStyle(STYLE_BORDER_RADIUS)：默认 200，被引擎收敛到短边一半", min: 0, max: 100, def: 200 },
      { k: "fontSize", t: "range", label: "字号 fontSize", api: "label->SetFont(DEFAULT_VECTOR_FONT_FILENAME, size)：UILabel 默认 16", min: 10, max: 28, def: 16, unit: " px" },
      { k: "textColor", t: "color", label: "文字色 textColor", api: "label->SetStyle(STYLE_TEXT_COLOR, …)：UILabel 默认白", def: "#ffffff" },
      { k: "bg", t: "color", label: "背景色 released", api: "SetStyleForState(STYLE_BACKGROUND_COLOR, …, RELEASED)", def: "#007dff" },
      { k: "pressBg", t: "color", label: "按下色 pressed", api: "…, PRESSED", def: "#1996ff" },
      { k: "inactiveBg", t: "color", label: "禁用色 inactive", api: "…, INACTIVE", def: "#617e9d" },
      { k: "anim", t: "check", label: "按压缩放动画", api: "EnableButtonAnimation(bool)：1.0→0.8 / 150ms，恢复 200ms，bezier(.2,0,.2,1)", def: true, text: "开启" },
      { k: "mask", t: "check", label: "按下白色蒙层", api: "ButtonAnimator::DrawMask：白色 alpha 25/255", def: true, text: "开启" },
      { k: "auto", t: "check", label: "自动演示", api: "约 0.7 s 按住 / 0.5 s 松开循环：直接观察缩放与白色蒙层", def: false, text: "自动按下 → 松开" }
    ],
    create: function(box, state){
      var v = mk(box, 300, 180);
      var scale = 1, raf = null, pressedNow = false;
      var autoRaf = null, autoPhase = 0, autoT0 = 0;

      function draw(){
        var s = state, c = v.c, W = v.w, H = v.h;
        screen(c, W, H);
        var pressed = s.state === "pressed" || pressedNow;
        var bg = pressed ? s.pressBg : s.state === "inactive" ? s.inactiveBg : s.bg;
        /* 没有动画帧在跑时，缩放直接跟随最终状态 */
        if(!raf) scale = pressed ? 0.8 : 1;
        c.save();
        c.translate(W / 2, H / 2);
        c.scale(scale, scale);
        rr(c, -s.w / 2, -s.h / 2, s.w, s.h, s.radius);
        c.fillStyle = bg;
        c.fill();
        /* PRESSED 时 OnPostDraw 叠一层白色蒙层：alpha 25/255 */
        if(pressed && s.mask){
          c.fillStyle = "rgba(255,255,255," + (25 / 255) + ")";
          c.fill();
        }
        /* 文字来自挂载的 UILabel 子控件：默认白字、ELLIPSIS、随按钮一起缩放 */
        c.save();
        c.beginPath();
        rr(c, -s.w / 2, -s.h / 2, s.w, s.h, s.radius);
        c.clip();
        c.font = s.fontSize + "px -apple-system, 'Microsoft YaHei', sans-serif";
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.fillStyle = s.textColor;
        var label = String(s.text);
        var maxW = Math.max(0, s.w - 12);
        if(c.measureText(label).width > maxW){
          var n = label.length - 1;
          while(n > 0 && c.measureText(label.slice(0, n) + "…").width > maxW) n--;
          label = n > 0 ? label.slice(0, n) + "…" : "";
        }
        c.fillText(label, 0, 0);
        c.restore();
        c.restore();
        hint(c, "文字由 UILabel 绘制 · 按住缩放 0.8 + 蒙层 α25", W, H);
      }

      function animateTo(target, dur){
        if(raf) cancelAnimationFrame(raf);
        var s0 = scale, t0 = performance.now(), ease = bezier(0.2, 0, 0.2, 1);
        function step(now){
          var p = Math.min(1, (now - t0) / dur);
          scale = s0 + (target - s0) * ease(p);
          draw();
          raf = p < 1 ? requestAnimationFrame(step) : null;
        }
        raf = requestAnimationFrame(step);
      }
      function press(){
        pressedNow = true;
        if(state.anim) animateTo(0.8, 150); else { scale = 0.8; draw(); }
      }
      function release(){
        pressedNow = false;
        if(state.anim) animateTo(1, 200); else { scale = 1; draw(); }
      }

      /* 自动演示：按住 0.7 s → 松开 0.5 s 循环，让缩放与蒙层无需手动长按也能看到 */
      function autoTick(now){
        if(!state.auto){ autoRaf = null; return; }
        var el = now - autoT0;
        if(autoPhase === 0){
          autoPhase = 1; autoT0 = now; press();
        }else if(autoPhase === 1 && el > 700){
          autoPhase = 2; autoT0 = now; release();
        }else if(autoPhase === 2 && el > 500){
          autoPhase = 1; autoT0 = now; press();
        }
        autoRaf = requestAnimationFrame(autoTick);
      }
      function ensureAuto(){
        if(state.auto && !autoRaf){
          autoPhase = 0;
          autoRaf = requestAnimationFrame(autoTick);
        }else if(!state.auto && autoRaf){
          cancelAnimationFrame(autoRaf);
          autoRaf = null; autoPhase = 0;
          if(pressedNow) release();
        }
      }

      function render(s){ ensureAuto(); draw(); }

      v.cv.style.cursor = "pointer";
      v.cv.addEventListener("pointerdown", function(){
        if(state.state === "inactive") return;
        press();
      });
      function up(){ if(pressedNow) release(); }
      v.cv.addEventListener("pointerup", up);
      v.cv.addEventListener("pointerleave", up);
      return { render: render };
    },
    code: function(s){
      var L = [];
      L.push('<span class="cm">/* 由页面参数实时生成（ui_button.cpp / style.cpp） */</span>');
      L.push('UIButton *btn = <span class="fn">new</span> UIButton();');
      L.push('btn-&gt;<span class="fn">SetPosition</span>(70, 66);');
      L.push('btn-&gt;<span class="fn">SetWidth</span>(<span class="num">' + s.w + '</span>);  btn-&gt;<span class="fn">SetHeight</span>(<span class="num">' + s.h + '</span>);');
      L.push('btn-&gt;<span class="fn">SetStyleForState</span>(STYLE_BORDER_RADIUS, <span class="num">' + s.radius + '</span>, UIButton::RELEASED);');
      L.push('btn-&gt;<span class="fn">SetStyleForState</span>(STYLE_BACKGROUND_COLOR, Color::<span class="fn">GetColorFromRGB</span>(' + rgbArgs(s.bg) + ').full, UIButton::RELEASED);');
      L.push('btn-&gt;<span class="fn">SetStyleForState</span>(STYLE_BACKGROUND_COLOR, Color::<span class="fn">GetColorFromRGB</span>(' + rgbArgs(s.pressBg) + ').full, UIButton::PRESSED);');
      L.push('btn-&gt;<span class="fn">SetStyleForState</span>(STYLE_BACKGROUND_COLOR, Color::<span class="fn">GetColorFromRGB</span>(' + rgbArgs(s.inactiveBg) + ').full, UIButton::INACTIVE);');
      if(!s.anim) L.push('btn-&gt;<span class="fn">EnableButtonAnimation</span>(false);  <span class="cm">// 默认 true：按下 0.8 / 150ms，松开 200ms</span>');
      if(s.state === "inactive") L.push('btn-&gt;<span class="fn">Disable</span>();  <span class="cm">// = SetState(INACTIVE) 且不可点击</span>');
      L.push('');
      L.push('<span class="cm">/* UIButton 只画背景与图片，不绘制文字：挂一个 UILabel 子控件 */</span>');
      L.push('UILabel *label = <span class="fn">new</span> UILabel();');
      L.push('label-&gt;<span class="fn">SetText</span>("' + esc(s.text) + '");');
      L.push('label-&gt;<span class="fn">SetFont</span>(DEFAULT_VECTOR_FONT_FILENAME, <span class="num">' + s.fontSize + '</span>);');
      L.push('label-&gt;<span class="fn">SetStyle</span>(STYLE_TEXT_COLOR, Color::<span class="fn">GetColorFromRGB</span>(' + rgbArgs(s.textColor) + ').full);');
      L.push('label-&gt;<span class="fn">SetAlign</span>(TEXT_ALIGNMENT_CENTER, TEXT_ALIGNMENT_CENTER);');
      L.push('<span class="cm">/* 位置要自己算：按按钮尺寸居中摆放，缩放由按钮统一变换 */</span>');
      L.push('label-&gt;<span class="fn">SetPosition</span>((<span class="num">' + s.w + '</span> - label-&gt;<span class="fn">GetWidth</span>()) / 2, (<span class="num">' + s.h + '</span> - label-&gt;<span class="fn">GetHeight</span>()) / 2);');
      L.push('btn-&gt;<span class="fn">Add</span>(label);');
      return L;
    }
  };

  /* ---------- UIButton + SetImageSrc ---------- */
  DEMOS.imagebutton = {
    defaults: { w: 132, h: 66, imgX: 0, imgY: 0, pressed: false, anim: true, radius: 200 },
    controls: [
      { k: "pressed", t: "check", label: "按下态（切换触发图）", api: "SetImageSrc(default, triggered)：仅两态", def: false, text: "PRESSED" },
      { k: "w", t: "range", label: "宽度 width", api: "SetWidth(int16_t)", min: 80, max: 220, def: 132, unit: " px" },
      { k: "h", t: "range", label: "高度 height", api: "SetHeight(int16_t)", min: 40, max: 120, def: 66, unit: " px" },
      { k: "imgX", t: "range", label: "图片偏移 imgX", api: "SetImagePosition(x, y)", min: 0, max: 80, def: 0, unit: " px" },
      { k: "imgY", t: "range", label: "图片偏移 imgY", api: "SetImagePosition(x, y)", min: 0, max: 40, def: 0, unit: " px" },
      { k: "radius", t: "range", label: "圆角 borderRadius", api: "SetStyleForState(STYLE_BORDER_RADIUS, …)", min: 0, max: 100, def: 200 }
    ],
    create: function(box, state){
      var v = mk(box, 300, 180), timer = null, scale = 1, holding = false;
      var IMG_W = 132, IMG_H = 66;   /* 图片资源原始尺寸，默认与按钮同尺寸 */

      /* 一张现成的“按钮图”资源：胶囊底 + 白色圆 + 播放/暂停图形 */
      function artwork(c, x, y, pressed){
        var g = c.createLinearGradient(0, y, 0, y + IMG_H);
        g.addColorStop(0, pressed ? "#24b47e" : "#3a8df0");
        g.addColorStop(1, pressed ? "#1f9d66" : "#2b7de9");
        rr(c, x, y, IMG_W, IMG_H, IMG_H / 2);
        c.fillStyle = g;
        c.fill();
        var mx = x + IMG_W / 2, my = y + IMG_H / 2;
        c.fillStyle = "rgba(255,255,255,0.92)";
        c.beginPath(); c.arc(mx, my, 16, 0, Math.PI * 2); c.fill();
        c.fillStyle = pressed ? "#1f9d66" : "#2b7de9";
        if(pressed){
          rr(c, mx - 9, my - 10, 6, 20, 3); c.fill();
          rr(c, mx + 3, my - 10, 6, 20, 3); c.fill();
        }else{
          c.beginPath();
          c.moveTo(mx - 6, my - 9);
          c.lineTo(mx - 6, my + 9);
          c.lineTo(mx + 10, my);
          c.closePath(); c.fill();
        }
      }

      function render(s){
        var c = v.c, W = v.w, H = v.h;
        screen(c, W, H);
        var pressed = s.pressed || holding;
        var sc = s.anim ? scale : (pressed ? 0.8 : 1);
        var bx = -s.w / 2, by = -s.h / 2;
        c.save();
        c.translate(W / 2, H / 2);
        c.scale(sc, sc);
        /* ① 按钮本体：OnDraw 先 DrawRect（背景 + 边框） */
        rr(c, bx, by, s.w, s.h, s.radius);
        c.fillStyle = "rgba(28,33,40,0.04)";
        c.fill();
        c.strokeStyle = "rgba(28,33,40,0.18)";
        c.lineWidth = 1;
        c.stroke();
        /* ② 图片：按资源原尺寸画在内容区左上角 + SetImagePosition 偏移，超出按钮的部分被裁掉 */
        c.save();
        c.beginPath();
        rr(c, bx, by, s.w, s.h, Math.min(s.radius, s.w / 2, s.h / 2));
        c.clip();
        artwork(c, bx + s.imgX, by + s.imgY, pressed);
        c.restore();
        /* ③ PRESSED 时叠加白色蒙层（ButtonAnimator::DrawMask，α25/255） */
        if(pressed){
          rr(c, bx, by, s.w, s.h, s.radius);
          c.fillStyle = "rgba(255,255,255," + (25 / 255) + ")";
          c.fill();
        }
        c.restore();
        hint(c, "图片原尺寸 " + IMG_W + "×" + IMG_H + "、不缩放 · 改宽高会留白/裁切", W, H);
      }
      function animate(to, dur){
        if(timer) cancelAnimationFrame(timer);
        var s0 = scale, t0 = performance.now(), ease = bezier(0.2, 0, 0.2, 1);
        function step(now){
          var p = Math.min(1, (now - t0) / dur);
          scale = s0 + (to - s0) * ease(p);
          render(state);
          timer = p < 1 ? requestAnimationFrame(step) : null;
        }
        timer = requestAnimationFrame(step);
      }
      function down(){
        holding = true;
        if(state.anim) animate(0.8, 150); else { scale = 0.8; render(state); }
      }
      function up(){
        if(!holding) return;
        holding = false;
        if(state.anim) animate(1, 200); else { scale = 1; render(state); }
      }
      v.cv.style.cursor = "pointer";
      v.cv.addEventListener("pointerdown", down);
      v.cv.addEventListener("pointerup", up);
      v.cv.addEventListener("pointerleave", up);
      return { render: render };
    },
    code: function(s){
      var L = [];
      L.push('<span class="cm">/* ui_button.cpp：SetImageSrc 只支持默认 / 按下两张图 */</span>');
      L.push('UIButton *btn = <span class="fn">new</span> UIButton();');
      L.push('btn-&gt;<span class="fn">SetPosition</span>(74, 57);');
      L.push('btn-&gt;<span class="fn">SetWidth</span>(<span class="num">' + s.w + '</span>);  btn-&gt;<span class="fn">SetHeight</span>(<span class="num">' + s.h + '</span>);');
      L.push('btn-&gt;<span class="fn">SetImageSrc</span>("/res/default.png", "/res/triggered.png");');
      L.push('btn-&gt;<span class="fn">SetImagePosition</span>(<span class="num">' + s.imgX + '</span>, <span class="num">' + s.imgY + '</span>);');
      L.push('<span class="cm">/* 图片不缩放 / 不居中；无 checked / focused 态 */</span>');
      return L;
    }
  };

  /* ---------- UILabel ---------- */
  DEMOS.label = {
    defaults: { text: "Label text 跑马灯：文本超出宽度时向左循环滚动", size: 16, color: "#1c2128",
      w: 220, h: 60, mode: "marquee", align: "left", rollSpeed: 35, lineSpace: 2 },
    controls: [
      { k: "text", t: "text", wide: true, label: "文本 text", api: "SetText(const char*)", def: "Label text 跑马灯：文本超出宽度时向左循环滚动" },
      { k: "size", t: "range", label: "字号 font size", api: "SetFont(name, size) / SetFontId()：默认 16", min: 10, max: 32, def: 16, unit: " px" },
      { k: "color", t: "color", label: "文字色 text color", api: "SetStyle(STYLE_TEXT_COLOR)：源码默认白（本页白底改用深色）", def: "#1c2128" },
      { k: "w", t: "range", label: "宽度 width", api: "SetWidth(int16_t)", min: 80, max: 280, def: 220, unit: " px" },
      { k: "h", t: "range", label: "高度 height", api: "SetHeight(int16_t)", min: 24, max: 120, def: 60, unit: " px" },
      { k: "mode", t: "seg", wide: true, label: "换行模式 line break mode", def: "marquee",
        api: "SetLineBreakMode()：源码默认 ELLIPSIS；本页默认 MARQUEE 以便直接观察跑马灯",
        opts: [["ellipsis", "ELLIPSIS"], ["wrap", "WRAP"], ["adapt", "ADAPT"], ["stretch", "STRETCH"], ["marquee", "MARQUEE"], ["clip", "CLIP"]] },
      { k: "align", t: "seg", wide: true, label: "对齐 align", api: "SetStyle(STYLE_TEXT_ALIGN)", def: "left",
        opts: [["left", "LEFT"], ["center", "CENTER"], ["right", "RIGHT"]] },
      { k: "rollSpeed", t: "range", label: "跑马灯速度", api: "SetRollSpeed(px/s)：默认 35；仅当文本宽度 > 控件宽度才滚动（RemeasureForMarquee）", min: 10, max: 120, def: 35, unit: " px/s" }
    ],
    create: function(box, state){
      var v = mk(box, 300, 180), offset = 0, last = 0, wait = 50, raf = 0;
      function layout(s){
        var c = v.c;
        c.font = s.size + "px -apple-system, 'Microsoft YaHei', sans-serif";
        var chars = String(s.text).split("");
        var lines = [], cur = "";
        if(s.mode === "wrap" || s.mode === "adapt"){
          chars.forEach(function(ch){
            if(c.measureText(cur + ch).width > s.w && cur){ lines.push(cur); cur = ch; }
            else cur += ch;
          });
          lines.push(cur);
        }else{
          lines.push(String(s.text));
        }
        return lines;
      }
      function measure(c, s){ c.font = s.size + "px -apple-system, 'Microsoft YaHei', sans-serif"; return c.measureText(String(s.text)).width; }
      function render(s){
        var c = v.c, W = v.w, H = v.h;
        /* 不画画布外框：文字直接落在舞台白底上，与左侧 LVGL 舞台一致，避免多一圈矩形干扰对比 */
        c.clearRect(0, 0, W, H);
        c.save();
        c.beginPath();
        c.rect(W / 2 - s.w / 2, H / 2 - s.h / 2, s.w, s.h);
        c.clip();
        c.fillStyle = s.color;
        c.textBaseline = "top";
        c.textAlign = s.align === "center" ? "center" : s.align === "right" ? "right" : "left";
        var x = s.align === "center" ? W / 2 : s.align === "right" ? W / 2 + s.w / 2 : W / 2 - s.w / 2;
        var lines = layout(s), lh = s.size + s.lineSpace;
        c.font = s.size + "px -apple-system, 'Microsoft YaHei', sans-serif";
        if(s.mode === "ellipsis"){
          var line = lines[0], tw = c.measureText(line).width;
          if(tw > s.w){
            var out = "";
            for(var i = 0; i < line.length; i++){
              if(c.measureText(out + line[i] + "…").width > s.w) break;
              out += line[i];
            }
            line = out + "…";
          }
          c.fillText(line, x, H / 2 - s.h / 2 + 2);
        }else if(s.mode === "marquee"){
          var tw2 = measure(c, s);
          var ox = tw2 > s.w ? -offset : 0;
          c.fillText(s.text, x + ox, H / 2 - s.h / 2 + 2);
        }else{
          lines.forEach(function(line, i){
            if(i * lh > s.h - s.size) return;
            var t = line;
            if(s.mode === "clip" && c.measureText(t).width > s.w){ t = t; }
            c.fillText(t, x, H / 2 - s.h / 2 + 2 + i * lh);
          });
        }
        c.restore();
        c.strokeStyle = "rgba(28,33,40,0.2)";
        c.setLineDash([3, 3]);
        c.lineWidth = 1;
        c.strokeRect(W / 2 - s.w / 2 + .5, H / 2 - s.h / 2 + .5, s.w - 1, s.h - 1);
        c.setLineDash([]);
        var twNow = measure(c, s);
        hint(c, s.mode === "marquee"
          ? "跑马灯：文本 " + Math.round(twNow) + " px / 控件 " + s.w + " px（大于才滚动，RemeasureForMarquee）"
          : "虚线框 = SetWidth/SetHeight 后的可见区域", W, H);
      }
      /* 与 ui_label.cpp 的 LabelAnimator 同型：每帧按 speed(px/s) 推进，
         起始先等 50 帧；回绕公式 ((offsetX_ - labelX_) % (textX_ + labelX_)) + labelX_ */
      function loop(now){
        var s = state;
        var dt = last ? now - last : 0;
        last = now;
        if(s.mode === "marquee"){
          var c = v.c;
          c.font = s.size + "px -apple-system, 'Microsoft YaHei', sans-serif";
          var tw = c.measureText(String(s.text)).width;
          if(tw > s.w){
            if(wait > 0){
              wait--;
            }else if(dt > 0){
              offset += s.rollSpeed * dt / 1000;
              offset = ((offset + s.w) % (tw + s.w)) - s.w;
            }
          }else{
            offset = 0;
          }
          render(s);
        }else{
          wait = 50;
          offset = 0;
        }
        raf = requestAnimationFrame(loop);
      }
      raf = requestAnimationFrame(loop);
      return { render: render };
    },
    code: function(s){
      var L = [];
      L.push('<span class="cm">/* ui_label.cpp / style.cpp：默认 16px 白色、透明底 */</span>');
      L.push('UILabel *label = <span class="fn">new</span> UILabel();');
      L.push('label-&gt;<span class="fn">SetPosition</span>(40, 60);');
      L.push('label-&gt;<span class="fn">SetWidth</span>(<span class="num">' + s.w + '</span>);  label-&gt;<span class="fn">SetHeight</span>(<span class="num">' + s.h + '</span>);');
      L.push('label-&gt;<span class="fn">SetFont</span>("SourceHanSans", <span class="num">' + s.size + '</span>);');
      L.push('label-&gt;<span class="fn">SetText</span>("' + esc(s.text) + '");');
      L.push('label-&gt;<span class="fn">SetLineBreakMode</span>(UILabel::' + s.mode.toUpperCase() + ');');
      if(s.mode === "marquee") L.push('label-&gt;<span class="fn">SetRollSpeed</span>(<span class="num">' + s.rollSpeed + '</span>);  <span class="cm">// px/s</span>');
      L.push('label-&gt;<span class="fn">SetStyle</span>(STYLE_TEXT_COLOR, Color::<span class="fn">GetColorFromRGB</span>(' + rgbArgs(s.color) + ').full);');
      return L;
    }
  };

  /* ---------- UILabel + SpannableString ---------- */
  DEMOS.span = {
    defaults: { size: 18, on: true, bgSpan: true },
    controls: [
      { k: "on", t: "check", label: "启用 Span", api: "需编译宏 ENABLE_SPANNABLE_STRING=1（graphic_config.h 默认 0）", def: true, text: "SpannableString" },
      { k: "size", t: "range", label: "基础字号", api: "SetFont(name, size)", min: 12, max: 28, def: 18, unit: " px" },
      { k: "bgSpan", t: "check", label: "背景 Span", api: "SetBackgroundColorSpan / SetForegroundColorSpan", def: true, text: "开启" }
    ],
    create: function(box, state){
      var v = mk(box, 300, 180);
      function render(s){
        var c = v.c, W = v.w, H = v.h;
        screen(c, W, H);
        if(!s.on){
          txt(c, "ENABLE_SPANNABLE_STRING = 0", W / 2, H / 2 - 8, 14, "#ff9a9a");
          txt(c, "默认构建只支持纯文本 SetText(char*)", W / 2, H / 2 + 18, 12, "#9aa3ad");
          return;
        }
        var parts = [["Rich", "#45a5ff", 1.35], ["Span", "#1c2128", 1.0], [" 富文本", "#c98a00", 1.0]];
        c.textBaseline = "middle";
        var widths = [], total = 0;
        parts.forEach(function(p){
          c.font = (s.size * p[2]) + "px -apple-system, 'Microsoft YaHei', sans-serif";
          var w = c.measureText(p[0]).width;
          widths.push(w); total += w;
        });
        var x = W / 2 - total / 2;
        parts.forEach(function(p, i){
          c.font = (s.size * p[2]) + "px -apple-system, 'Microsoft YaHei', sans-serif";
          if(i === 2 && s.bgSpan){
            c.fillStyle = "rgba(255,211,77,0.22)";
            c.fillRect(x - 3, H / 2 - s.size * 0.7, widths[i] + 6, s.size * 1.4);
          }
          c.fillStyle = p[1];
          c.textAlign = "left";
          c.fillText(p[0], x, H / 2);
          x += widths[i];
        });
        hint(c, "颜色 / 字号 / 背景 Span（编译开关控制）", W, H);
      }
      return { render: render };
    },
    code: function(s){
      var L = [];
      L.push('<span class="cm">/* 需 ENABLE_SPANNABLE_STRING=1；默认构建为 0 */</span>');
      if(!s.on){ L.push('<span class="cm">/* 当前宏为 0：只能 label-&gt;SetText("纯文本"); */</span>'); return L; }
      L.push('UILabel *label = <span class="fn">new</span> UILabel();');
      L.push('SpannableString *ss = <span class="fn">new</span> SpannableString("RichSpan 富文本");');
      L.push('ss-&gt;<span class="fn">SetForegroundColorSpan</span>(0, 4, Color::<span class="fn">GetColorFromRGB</span>(0x45, 0xa5, 0xff));');
      L.push('ss-&gt;<span class="fn">SetRelativeSizeSpan</span>(0, 4, 1.35f);');
      if(s.bgSpan) L.push('ss-&gt;<span class="fn">SetBackgroundColorSpan</span>(9, 12, Color::<span class="fn">GetColorFromRGB</span>(0xff, 0xd3, 0x4d));');
      L.push('label-&gt;<span class="fn">SetText</span>(ss);');
      return L;
    }
  };

  /* ---------- UICheckBox ---------- */
  DEMOS.checkbox = {
    defaults: { on: true, size: 56, color: "#1f71ff", anim: true, anon: 0 },
    controls: [
      { k: "on", t: "check", label: "选中状态", api: "SetState(SELECTED / UNSELECTED, needAnimater)", def: true, text: "SELECTED" },
      { k: "size", t: "range", label: "控件尺寸", api: "SetWidth/SetHeight：内置图默认 56×56", min: 24, max: 96, def: 56, unit: " px" },
      { k: "color", t: "color", label: "选中色", api: "SetSelectedStateColor()：默认 #1F71FF", def: "#1f71ff" },
      { k: "anim", t: "check", label: "切换动画", api: "setState(state, true)：200ms，bezier(.33,0)-(0.67,1)", def: true, text: "开启" }
    ],
    create: function(box, state){
      var v = mk(box, 300, 180), opa = state.on ? 1 : 0, raf = null;
      function draw(s){
        var c = v.c, W = v.w, H = v.h;
        screen(c, W, H);
        var s0 = s.size, x = W / 2 - s0 / 2, y = H / 2 - s0 / 2 - 6;
        var lw = Math.max(1, s0 / 22), r = 4 * lw;
        if(opa > 0.01){
          c.fillStyle = rgba(s.color, opa);
          rr(c, x, y, s0, s0, r);
          c.fill();
        }
        if(opa < 0.99){
          c.strokeStyle = rgba("#1c2128", 168 / 255);
          c.lineWidth = lw;
          rr(c, x + lw / 2, y + lw / 2, s0 - lw, s0 - lw, r);
          c.stroke();
        }
        if(opa > 0.01){
          c.save();
          c.globalAlpha = opa;
          c.strokeStyle = "#ffffff";
          c.lineWidth = lw * 2;
          c.lineCap = "round";
          c.lineJoin = "round";
          c.beginPath();
          c.moveTo(x + s0 * 0.22, y + s0 * 0.5);
          c.lineTo(x + s0 * 0.42, y + s0 * 0.7);
          c.lineTo(x + s0 * 0.8, y + s0 * 0.32);
          c.stroke();
          c.restore();
        }
        hint(c, "默认构建使用内置 56×56 图片；矢量绘制在宏关闭时生效", W, H);
      }
      function animateTo(target){
        if(raf) cancelAnimationFrame(raf);
        var from = opa, t0 = performance.now(), ease = bezier(0.33, 0, 0.67, 1);
        function step(now){
          var p = Math.min(1, (now - t0) / 200);
          opa = from + (target - from) * ease(p);
          draw(state);
          if(p < 1) raf = requestAnimationFrame(step);
        }
        raf = requestAnimationFrame(step);
      }
      function render(s){
        if(s.anim){ animateTo(s.on ? 1 : 0); } else { opa = s.on ? 1 : 0; draw(s); }
      }
      v.cv.addEventListener("click", function(){ state.on = !state.on; render(state); });
      return { render: render };
    },
    code: function(s){
      var L = [];
      L.push('<span class="cm">/* ui_checkbox.cpp：默认 56×56 内置图，200ms 动画 */</span>');
      L.push('UICheckBox *cb = <span class="fn">new</span> UICheckBox();');
      L.push('cb-&gt;<span class="fn">SetPosition</span>(122, 62);');
      L.push('cb-&gt;<span class="fn">SetWidth</span>(<span class="num">' + s.size + '</span>);  cb-&gt;<span class="fn">SetHeight</span>(<span class="num">' + s.size + '</span>);');
      L.push('cb-&gt;<span class="fn">SetSelectedStateColor</span>(Color::<span class="fn">GetColorFromRGB</span>(' + rgbArgs(s.color) + ').full);');
      L.push('cb-&gt;<span class="fn">SetState</span>(UICheckBox::' + (s.on ? "SELECTED" : "UNSELECTED") + ', ' + (s.anim ? "true" : "false") + ');');
      L.push('<span class="cm">/* 无半选态、无内置文字；文字需另挂 UILabel */</span>');
      return L;
    }
  };

  /* ---------- UIToggleButton ---------- */
  DEMOS.toggle = {
    defaults: { on: true, w: 64, h: 32, color: "#1f71ff", anim: true, rtl: false },
    controls: [
      { k: "on", t: "check", label: "开关状态", api: "SetState(bool)：两态", def: true, text: "ON" },
      { k: "w", t: "range", label: "宽度 width", api: "SetWidth：默认 32（源码 TOGGLE_BTN_WIDTH）", min: 40, max: 120, def: 64, unit: " px" },
      { k: "h", t: "range", label: "高度 height", api: "SetHeight：默认 23 = 2×11+1", min: 20, max: 56, def: 32, unit: " px" },
      { k: "color", t: "color", label: "选中色", api: "SetSelectedStateColor()：默认 #1F71FF", def: "#1f71ff" },
      { k: "anim", t: "check", label: "切换动画", api: "150ms，bezier(.2,0)-(.2,1)", def: true, text: "开启" },
      { k: "rtl", t: "check", label: "RTL 反向", api: "EnableRtl(bool)", def: false, text: "开启" }
    ],
    create: function(box, state){
      var v = mk(box, 300, 180), t = state.on ? 1 : 0, raf = null;
      function draw(s){
        var c = v.c, W = v.w, H = v.h;
        screen(c, W, H);
        var x = W / 2 - s.w / 2, y = H / 2 - s.h / 2 - 6;
        var r = s.h / 2;
        var bg = t < 0.5 ? rgba("#1c2128", 97 / 255) : rgba(s.color, 0.06 + 0.94 * t);
        rr(c, x, y, s.w, s.h, r);
        c.fillStyle = bg;
        c.fill();
        var knobR = r - 2;
        var left = x + r, right = x + s.w - r;
        var cx = s.rtl ? (right - (right - left) * t) : (left + (right - left) * t);
        c.beginPath();
        c.arc(cx, y + r, knobR, 0, Math.PI * 2);
        c.fillStyle = "#ffffff";
        c.fill();
        hint(c, "纯矢量绘制：圆角矩形 32×23 + 白圆半径 9（=11−2）", W, H);
      }
      function animateTo(target){
        if(raf) cancelAnimationFrame(raf);
        var from = t, t0 = performance.now(), ease = bezier(0.2, 0, 0.2, 1);
        function step(now){
          var p = Math.min(1, (now - t0) / 150);
          t = from + (target - from) * ease(p);
          draw(state);
          if(p < 1) raf = requestAnimationFrame(step);
        }
        raf = requestAnimationFrame(step);
      }
      function render(s){ if(s.anim) animateTo(s.on ? 1 : 0); else { t = s.on ? 1 : 0; draw(s); } }
      v.cv.addEventListener("click", function(){ state.on = !state.on; render(state); });
      return { render: render };
    },
    code: function(s){
      var L = [];
      L.push('<span class="cm">/* ui_toggle_button.cpp：矢量圆角矩形 + 白圆，150ms 动画 */</span>');
      L.push('UIToggleButton *toggle = <span class="fn">new</span> UIToggleButton();');
      L.push('toggle-&gt;<span class="fn">SetPosition</span>(118, 68);');
      L.push('toggle-&gt;<span class="fn">SetWidth</span>(<span class="num">' + s.w + '</span>);  toggle-&gt;<span class="fn">SetHeight</span>(<span class="num">' + s.h + '</span>);');
      L.push('toggle-&gt;<span class="fn">SetSelectedStateColor</span>(Color::<span class="fn">GetColorFromRGB</span>(' + rgbArgs(s.color) + ').full);');
      if(s.rtl) L.push('toggle-&gt;<span class="fn">EnableRtl</span>(true);');
      L.push('toggle-&gt;<span class="fn">SetState</span>(' + (s.on ? "true" : "false") + ');');
      L.push('<span class="cm">/* 无轨道/滑块分离样式，无禁用叠加态 */</span>');
      return L;
    }
  };

  /* ---------- UISlider ---------- */
  DEMOS.slider = {
    defaults: { value: 62, min: 0, max: 100, dir: "ltr", w: 240, h: 24,
      track: "#e3e6ea", fill: "#007dff", knobW: 0, knob: "#007dff", radius: 0 },
    controls: [
      { k: "value", t: "range", label: "当前值 value", api: "SetValue(int32_t)：即时跳变，无过渡动画", min: 0, max: 100, def: 62 },
      { k: "max", t: "range", label: "范围上限 rangeMax", api: "SetRange(rangeMax, rangeMin)", min: 10, max: 200, def: 100 },
      { k: "dir", t: "seg", wide: true, label: "方向 direction", def: "ltr",
        api: "SetDirection()：DIR_LEFT_TO_RIGHT / RIGHT_TO_LEFT / TOP_TO_BOTTOM / BOTTOM_TO_TOP",
        opts: [["ltr", "左→右"], ["rtl", "右→左"], ["ttb", "上→下"], ["btt", "下→上"]] },
      { k: "w", t: "range", label: "宽度 width", api: "SetWidth(int16_t)", min: 80, max: 260, def: 240, unit: " px" },
      { k: "h", t: "range", label: "高度 height", api: "SetHeight(int16_t)", min: 8, max: 60, def: 24, unit: " px" },
      { k: "knobW", t: "range", label: "滑块宽度 knobWidth", api: "SetKnobWidth()：默认 0 → 不绘制滑块", min: 0, max: 40, def: 0, unit: " px" },
      { k: "radius", t: "range", label: "轨道圆角", api: "SetSliderRadius() → STYLE_BORDER_RADIUS：默认 0", min: 0, max: 30, def: 0 },
      { k: "track", t: "color", label: "轨道色 background", api: "SetBackgroundStyle(STYLE_BACKGROUND_COLOR)：源码默认黑（白底改用浅灰便于观看）", def: "#e3e6ea" },
      { k: "fill", t: "color", label: "填充色 foreground", api: "SetForegroundStyle(STYLE_BACKGROUND_COLOR)：源码默认白（白底改用蓝色便于观看）", def: "#007dff" },
      { k: "knob", t: "color", label: "滑块色 knob", api: "SetKnobStyle(STYLE_BACKGROUND_COLOR)", def: "#007dff" }
    ],
    create: function(box, state){
      var v = mk(box, 300, 180);

      /* 轨道几何：与 render 保持一致 */
      function geom(s){
        var horiz = s.dir === "ltr" || s.dir === "rtl";
        var tw = horiz ? s.w : s.h, th = horiz ? s.h : s.w;
        return { horiz: horiz, tw: tw, th: th, x: v.w / 2 - tw / 2, y: v.h / 2 - th / 2 - 6 };
      }

      function render(s){
        var c = v.c, W = v.w, H = v.h;
        screen(c, W, H);
        var g = geom(s);
        var tw = g.tw, th = g.th, x = g.x, y = g.y;
        var p = Math.max(0, Math.min(1, s.value / Math.max(1, s.max)));
        c.fillStyle = s.track;
        rr(c, x, y, tw, th, s.radius);
        c.fill();
        c.save();
        rr(c, x, y, tw, th, s.radius);
        c.clip();
        c.fillStyle = s.fill;
        if(s.dir === "ltr") c.fillRect(x, y, tw * p, th);
        else if(s.dir === "rtl") c.fillRect(x + tw * (1 - p), y, tw * p, th);
        else if(s.dir === "ttb") c.fillRect(x, y, tw, th * p);
        else c.fillRect(x, y + th * (1 - p), tw, th * p);
        c.restore();
        if(s.knobW > 0){
          var half = s.knobW / 2;
          var kx = s.dir === "ltr" ? x + tw * p : s.dir === "rtl" ? x + tw * (1 - p) : x + tw / 2;
          var ky = s.dir === "ttb" ? y + th * p : s.dir === "btt" ? y + th * (1 - p) : y + th / 2;
          c.beginPath();
          c.arc(kx, ky, half, 0, Math.PI * 2);
          c.fillStyle = s.knob;
          c.fill();
        }
        hint(c, s.knobW === 0 ? "knobWidth 默认 0：UISlider 不绘制滑块" : "滑块为 knobWidth 见方的圆（SetKnobRadius 控制）", W, H);
        v.cv.style.cursor = (s.dir === "ltr" || s.dir === "rtl") ? "ew-resize" : "ns-resize";
      }

      /* ui_slider.cpp：OnClickEvent / OnDragEvent / OnDragEndEvent 都按触点位置改值 */
      var dragging = false;
      function updateFromPointer(e){
        var g = geom(state);
        var r = v.cv.getBoundingClientRect();
        var px = (e.clientX - r.left) - g.x;
        var py = (e.clientY - r.top) - g.y;
        var p;
        if(state.dir === "ltr") p = px / g.tw;
        else if(state.dir === "rtl") p = 1 - px / g.tw;
        else if(state.dir === "ttb") p = py / g.th;
        else p = 1 - py / g.th;
        p = Math.max(0, Math.min(1, p));
        var val = Math.round(Math.max(state.min, Math.min(state.max, state.min + p * (state.max - state.min))));
        state.value = val;
        syncPanel("value", val);
        refreshRight();
      }

      v.cv.style.cursor = state.dir === "ltr" || state.dir === "rtl" ? "ew-resize" : "ns-resize";
      v.cv.style.touchAction = "none";
      v.cv.addEventListener("pointerdown", function(e){
        dragging = true;
        v.cv.setPointerCapture(e.pointerId);
        updateFromPointer(e);
      });
      v.cv.addEventListener("pointermove", function(e){
        if(dragging) updateFromPointer(e);
      });
      v.cv.addEventListener("pointerup", function(){ dragging = false; });
      v.cv.addEventListener("pointercancel", function(){ dragging = false; });

      return { render: render };
    },
    code: function(s){
      var L = [];
      L.push('<span class="cm">/* ui_slider.cpp / ui_abstract_progress.cpp / style.cpp */</span>');
      L.push('UISlider *slider = <span class="fn">new</span> UISlider();');
      L.push('slider-&gt;<span class="fn">SetPosition</span>(30, 78);');
      L.push('slider-&gt;<span class="fn">SetWidth</span>(<span class="num">' + s.w + '</span>);  slider-&gt;<span class="fn">SetHeight</span>(<span class="num">' + s.h + '</span>);');
      L.push('slider-&gt;<span class="fn">SetRange</span>(<span class="num">' + s.max + '</span>, <span class="num">' + s.min + '</span>);');
      L.push('slider-&gt;<span class="fn">SetValue</span>(<span class="num">' + s.value + '</span>);  <span class="cm">// 即时生效，无动画</span>');
      L.push('slider-&gt;<span class="fn">SetDirection</span>(' + ({ ltr: "Direction::DIR_LEFT_TO_RIGHT", rtl: "Direction::DIR_RIGHT_TO_LEFT", ttb: "Direction::DIR_TOP_TO_BOTTOM", btt: "Direction::DIR_BOTTOM_TO_TOP" })[s.dir] + ');');
      if(s.knobW > 0) L.push('slider-&gt;<span class="fn">SetKnobWidth</span>(<span class="num">' + s.knobW + '</span>);  <span class="cm">// 默认 0 → 不画滑块</span>');
      if(s.radius > 0) L.push('slider-&gt;<span class="fn">SetSliderRadius</span>(<span class="num">' + s.radius + '</span>);');
      L.push('slider-&gt;<span class="fn">SetBackgroundStyle</span>(STYLE_BACKGROUND_COLOR, Color::<span class="fn">GetColorFromRGB</span>(' + rgbArgs(s.track) + ').full);');
      L.push('slider-&gt;<span class="fn">SetForegroundStyle</span>(STYLE_BACKGROUND_COLOR, Color::<span class="fn">GetColorFromRGB</span>(' + rgbArgs(s.fill) + ').full);');
      L.push('<span class="cm">/* 交互：OnClickEvent / OnDragEvent / OnDragEndEvent 按触点位置更新 value */</span>');
      L.push('<span class="cm">/* 无刻度、无双滑块、无过渡动画 */</span>');
      return L;
    }
  };

  /* ---------- UIBoxProgress ---------- */
  DEMOS.progress = {
    defaults: { value: 62, max: 100, min: 0, dir: "ltr", w: 240, h: 16,
      track: "#e3e6ea", fill: "#007dff", cap: false, radius: 0 },
    controls: [
      { k: "value", t: "range", label: "当前值 value", api: "SetValue(int32_t)：单向填充，无动画", min: 0, max: 100, def: 62 },
      { k: "max", t: "range", label: "范围上限 rangeMax", api: "SetRange(rangeMax, rangeMin)", min: 10, max: 200, def: 100 },
      { k: "dir", t: "seg", wide: true, label: "方向 direction", def: "ltr",
        api: "SetDirection()：四方向（决定填充从哪一侧开始）",
        opts: [["ltr", "左→右"], ["rtl", "右→左"], ["ttb", "上→下"], ["btt", "下→上"]] },
      { k: "w", t: "range", label: "宽度 width", api: "SetWidth(int16_t)", min: 80, max: 260, def: 240, unit: " px" },
      { k: "h", t: "range", label: "进度厚度 height", api: "SetHeight(int16_t)", min: 4, max: 48, def: 16, unit: " px" },
      { k: "track", t: "color", label: "底槽色 background", api: "SetBackgroundStyle(STYLE_BACKGROUND_COLOR)：源码默认黑（白底改用浅灰便于观看）", def: "#e3e6ea" },
      { k: "fill", t: "color", label: "填充色 foreground", api: "SetForegroundStyle(STYLE_BACKGROUND_COLOR)：源码默认白（白底改用蓝色便于观看）", def: "#007dff" },
      { k: "cap", t: "check", label: "圆头 CAP_ROUND", api: "SetForegroundStyle(STYLE_LINE_CAP, CapType::CAP_ROUND)：圆角 = (厚度+1)/2", def: false, text: "开启" },
      { k: "radius", t: "range", label: "矩形圆角 borderRadius", api: "SetForegroundStyle(STYLE_BORDER_RADIUS)：默认 0", min: 0, max: 24, def: 0 }
    ],
    create: function(box, state){
      var v = mk(box, 300, 180);
      function render(s){
        var c = v.c, W = v.w, H = v.h;
        screen(c, W, H);
        var horiz = s.dir === "ltr" || s.dir === "rtl";
        var tw = horiz ? s.w : s.h, th = horiz ? s.h : s.w;
        var x = W / 2 - tw / 2, y = H / 2 - th / 2 - 6;
        var p = Math.max(0, Math.min(1, s.value / Math.max(1, s.max)));
        var r = s.cap ? (Math.min(tw, th) + 1) / 2 : s.radius;
        c.fillStyle = s.track;
        rr(c, x, y, tw, th, s.radius);
        c.fill();
        c.save();
        rr(c, x, y, tw, th, r);
        c.clip();
        c.fillStyle = s.fill;
        if(s.dir === "ltr") c.fillRect(x, y, tw * p, th);
        else if(s.dir === "rtl") c.fillRect(x + tw * (1 - p), y, tw * p, th);
        else if(s.dir === "ttb") c.fillRect(x, y, tw, th * p);
        else c.fillRect(x, y + th * (1 - p), tw, th * p);
        c.restore();
        hint(c, "无模式 / 起点值 / 过渡动画；圆头仅在 CAP_ROUND 时生效", W, H);
      }
      return { render: render };
    },
    code: function(s){
      var L = [];
      L.push('<span class="cm">/* ui_box_progress.cpp / style.cpp：底槽默认黑、前景默认白 */</span>');
      L.push('UIBoxProgress *bar = <span class="fn">new</span> UIBoxProgress();');
      L.push('bar-&gt;<span class="fn">SetPosition</span>(30, 82);');
      L.push('bar-&gt;<span class="fn">SetWidth</span>(<span class="num">' + s.w + '</span>);  bar-&gt;<span class="fn">SetHeight</span>(<span class="num">' + s.h + '</span>);');
      L.push('bar-&gt;<span class="fn">SetRange</span>(<span class="num">' + s.max + '</span>, <span class="num">' + s.min + '</span>);');
      L.push('bar-&gt;<span class="fn">SetValue</span>(<span class="num">' + s.value + '</span>);');
      L.push('bar-&gt;<span class="fn">SetDirection</span>(' + ({ ltr: "Direction::DIR_LEFT_TO_RIGHT", rtl: "Direction::DIR_RIGHT_TO_LEFT", ttb: "Direction::DIR_TOP_TO_BOTTOM", btt: "Direction::DIR_BOTTOM_TO_TOP" })[s.dir] + ');');
      L.push('bar-&gt;<span class="fn">SetBackgroundStyle</span>(STYLE_BACKGROUND_COLOR, Color::<span class="fn">GetColorFromRGB</span>(' + rgbArgs(s.track) + ').full);');
      L.push('bar-&gt;<span class="fn">SetForegroundStyle</span>(STYLE_BACKGROUND_COLOR, Color::<span class="fn">GetColorFromRGB</span>(' + rgbArgs(s.fill) + ').full);');
      if(s.cap) L.push('bar-&gt;<span class="fn">SetForegroundStyle</span>(STYLE_LINE_CAP, CapType::CAP_ROUND);');
      if(s.radius > 0) L.push('bar-&gt;<span class="fn">SetForegroundStyle</span>(STYLE_BORDER_RADIUS, <span class="num">' + s.radius + '</span>);');
      return L;
    }
  };

  function rgbArgs(hex){
    var s = String(hex || "#000000").replace("#", "");
    var n = parseInt(s, 16);
    return "0x" + ("0" + ((n >> 16) & 255).toString(16)).slice(-2) + ", 0x" +
      ("0" + ((n >> 8) & 255).toString(16)).slice(-2) + ", 0x" + ("0" + (n & 255).toString(16)).slice(-2);
  }
  function esc(s){ return String(s).replace(/"/g, "&quot;").replace(/</g, "&lt;"); }

  /* ---------- UICircleProgress ---------- */
  DEMOS.circleprogress = {
    defaults: { value: 70, max: 100, start: 0, end: 360, radius: 62, lineW: 8,
      fg: "#45a5ff", bg: "#3a3a3a", cap: true },
    controls: [
      { k: "value", t: "range", label: "当前值 value", api: "SetValue(int32_t)", min: 0, max: 100, def: 70 },
      { k: "max", t: "range", label: "范围上限 rangeMax", api: "SetRange(rangeMax, rangeMin)", min: 10, max: 200, def: 100 },
      { k: "start", t: "range", label: "起始角 startAngle", api: "SetStartAngle()：0° 在 12 点方向，顺时针为正", min: -180, max: 270, def: 0, unit: "°" },
      { k: "end", t: "range", label: "结束角 endAngle", api: "SetEndAngle()：默认 360（整圈）", min: -90, max: 360, def: 360, unit: "°" },
      { k: "radius", t: "range", label: "半径 radius", api: "SetRadius()：默认 0，必须显式设置否则不绘制", min: 16, max: 90, def: 62, unit: " px" },
      { k: "lineW", t: "range", label: "环宽 lineWidth", api: "SetForegroundStyle(STYLE_LINE_WIDTH)：默认 2", min: 1, max: 28, def: 8, unit: " px" },
      { k: "fg", t: "color", label: "前景色", api: "SetForegroundStyle(STYLE_LINE_COLOR)：默认 #45A5FF", def: "#45a5ff" },
      { k: "cap", t: "check", label: "圆头 CAP_ROUND", api: "SetForegroundStyle(STYLE_LINE_CAP, CapType::CAP_ROUND)", def: true, text: "开启" }
    ],
    create: function(box, state){
      var v = mk(box, 300, 180);
      function arcPath(c, cx, cy, r, a0, a1){
        c.beginPath();
        c.arc(cx, cy, r, (a0 - 90) * Math.PI / 180, (a1 - 90) * Math.PI / 180, false);
        c.stroke();
      }
      function render(s){
        var c = v.c, W = v.w;
        screen(c, W, v.h);
        var cx = W / 2, cy = 84;
        c.lineCap = s.cap ? "round" : "butt";
        c.lineWidth = s.lineW;
        c.strokeStyle = s.bg;
        arcPath(c, cx, cy, s.radius, s.start, s.end);
        c.strokeStyle = s.fg;
        var p = Math.max(0, Math.min(1, s.value / Math.max(1, s.max)));
        arcPath(c, cx, cy, s.radius, s.start, s.start + (s.end - s.start) * p);
        hint(c, "0° 在 12 点、顺时针；圆心由 SetCenterPosition 决定（默认左上角）", W, v.h);
      }
      return { render: render };
    },
    code: function(s){
      var L = [];
      L.push('<span class="cm">/* ui_circle_progress.cpp：0° 在 12 点、顺时针；半径必须显式设置 */</span>');
      L.push('UICircleProgress *cp = <span class="fn">new</span> UICircleProgress();');
      L.push('cp-&gt;<span class="fn">SetPosition</span>(88, 20);');
      L.push('cp-&gt;<span class="fn">SetRadius</span>(<span class="num">' + s.radius + '</span>);');
      L.push('cp-&gt;<span class="fn">SetStartAngle</span>(<span class="num">' + s.start + '</span>);  cp-&gt;<span class="fn">SetEndAngle</span>(<span class="num">' + s.end + '</span>);');
      L.push('cp-&gt;<span class="fn">SetRange</span>(<span class="num">' + s.max + '</span>, 0);');
      L.push('cp-&gt;<span class="fn">SetValue</span>(<span class="num">' + s.value + '</span>);');
      L.push('cp-&gt;<span class="fn">SetForegroundStyle</span>(STYLE_LINE_WIDTH, <span class="num">' + s.lineW + '</span>);');
      L.push('cp-&gt;<span class="fn">SetForegroundStyle</span>(STYLE_LINE_COLOR, Color::<span class="fn">GetColorFromRGB</span>(' + rgbArgs(s.fg) + ').full);');
      if(s.cap) L.push('cp-&gt;<span class="fn">SetForegroundStyle</span>(STYLE_LINE_CAP, CapType::CAP_ROUND);');
      L.push('<span class="cm">/* 无多段进度、无动画、无文字 */</span>');
      return L;
    }
  };

  /* ---------- UIImageView ---------- */
  DEMOS.image = {
    defaults: { mode: "contain", rotate: 0, scale: 1, opa: 1, w: 180, h: 100 },
    controls: [
      { k: "mode", t: "seg", wide: true, label: "缩放模式 resizeMode", def: "contain",
        api: "SetResizeMode()：NONE 默认 / COVER / CONTAIN / FILL / CENTER / SCALE_DOWN",
        opts: [["none", "NONE"], ["cover", "COVER"], ["contain", "CONTAIN"], ["fill", "FILL"], ["center", "CENTER"], ["down", "SCALE_DOWN"]] },
      { k: "w", t: "range", label: "控件宽 width", api: "SetWidth(int16_t)", min: 60, max: 240, def: 180, unit: " px" },
      { k: "h", t: "range", label: "控件高 height", api: "SetHeight(int16_t)", min: 50, max: 150, def: 100, unit: " px" },
      { k: "rotate", t: "range", label: "旋转 rotate", api: "UIView::Rotate(angle, pivot)：非 UIImageView 属性", min: -180, max: 180, def: 0, unit: "°" },
      { k: "scale", t: "range", label: "缩放 scale", api: "UIView::Scale(...)", min: 0.5, max: 2, step: 0.05, def: 1 },
      { k: "opa", t: "range", label: "不透明度 opa", api: "SetOpaScale(0~255)", min: 0.1, max: 1, step: 0.05, def: 1 }
    ],
    create: function(box, state){
      var v = mk(box, 300, 180);
      var SW = 160, SH = 90;
      function scene(c, x, y, w, h){
        c.save();
        c.beginPath(); c.rect(x, y, w, h); c.clip();
        var g = c.createLinearGradient(x, y, x, y + h);
        g.addColorStop(0, "#7fb2ff"); g.addColorStop(1, "#d9ecff");
        c.fillStyle = g; c.fillRect(x, y, w, h);
        c.fillStyle = "#ffd166";
        c.beginPath(); c.arc(x + w * 0.78, y + h * 0.26, Math.min(w, h) * 0.11, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#4c9a6a";
        c.beginPath(); c.moveTo(x, y + h); c.lineTo(x + w * .28, y + h * .42); c.lineTo(x + w * .52, y + h); c.closePath(); c.fill();
        c.fillStyle = "#2f7d55";
        c.beginPath(); c.moveTo(x + w * .34, y + h); c.lineTo(x + w * .62, y + h * .3); c.lineTo(x + w * .92, y + h); c.closePath(); c.fill();
        c.restore();
      }
      function render(s){
        var c = v.c, W = v.w, H = v.h;
        screen(c, W, H);
        var x = W / 2 - s.w / 2, y = H / 2 - s.h / 2 - 6;
        c.save();
        c.globalAlpha = s.opa;
        c.translate(x + s.w / 2, y + s.h / 2);
        c.rotate(s.rotate * Math.PI / 180);
        c.scale(s.scale, s.scale);
        var bx = -s.w / 2, by = -s.h / 2;
        var dw = SW, dh = SH, dx = bx + (s.w - SW) / 2, dy = by + (s.h - SH) / 2;
        if(s.mode === "fill"){ dw = s.w; dh = s.h; dx = bx; dy = by; }
        else if(s.mode === "cover" || s.mode === "contain"){
          var k = s.mode === "cover" ? Math.max(s.w / SW, s.h / SH) : Math.min(s.w / SW, s.h / SH);
          dw = SW * k; dh = SH * k; dx = bx + (s.w - dw) / 2; dy = by + (s.h - dh) / 2;
        }else if(s.mode === "down"){
          var k2 = Math.min(1, Math.min(s.w / SW, s.h / SH));
          dw = SW * k2; dh = SH * k2; dx = bx + (s.w - dw) / 2; dy = by + (s.h - dh) / 2;
        }
        c.save();
        c.beginPath(); c.rect(bx, by, s.w, s.h); c.clip();
        scene(c, dx, dy, dw, dh);
        c.restore();
        c.strokeStyle = "rgba(28,33,40,0.2)";
        c.lineWidth = 1;
        c.strokeRect(bx + .5, by + .5, s.w - 1, s.h - 1);
        c.restore();
        hint(c, "NONE 按原尺寸居中；COVER/CONTAIN/FILL/CENTER/SCALE_DOWN 六种模式", W, H);
      }
      return { render: render };
    },
    code: function(s){
      var MODE = { none: "ImageResizeMode::NONE", cover: "ImageResizeMode::COVER", contain: "ImageResizeMode::CONTAIN",
        fill: "ImageResizeMode::FILL", center: "ImageResizeMode::CENTER", down: "ImageResizeMode::SCALE_DOWN" };
      var L = [];
      L.push('<span class="cm">/* ui_image_view.h：六种 resizeMode，默认 NONE；GIF 需 ENABLE_GIF=1（默认 0） */</span>');
      L.push('UIImageView *img = <span class="fn">new</span> UIImageView();');
      L.push('img-&gt;<span class="fn">SetPosition</span>(60, 60);');
      L.push('img-&gt;<span class="fn">SetWidth</span>(<span class="num">' + s.w + '</span>);  img-&gt;<span class="fn">SetHeight</span>(<span class="num">' + s.h + '</span>);');
      L.push('img-&gt;<span class="fn">SetSrc</span>("/res/scene.png");');
      L.push('img-&gt;<span class="fn">SetResizeMode</span>(' + MODE[s.mode] + ');');
      if(s.rotate) L.push('img-&gt;<span class="fn">Rotate</span>(<span class="num">' + s.rotate + '</span>, Vector2&lt;float&gt;({0.5f, 0.5f}));  <span class="cm">// UIView 变换</span>');
      if(s.scale !== 1) L.push('img-&gt;<span class="fn">Scale</span>(Vector2&lt;float&gt;({' + s.scale.toFixed(2) + 'f, ' + s.scale.toFixed(2) + 'f}), Vector2&lt;float&gt;({0.5f, 0.5f}));');
      if(s.opa !== 1) L.push('img-&gt;<span class="fn">SetOpaScale</span>(<span class="num">' + Math.round(s.opa * 255) + '</span>);');
      return L;
    }
  };

  /* ---------- UIEditText ---------- */
  DEMOS.edittext = {
    defaults: { text: "", placeholder: "请输入内容", type: "text", maxLen: 4096, focus: true, size: 16, w: 220 },
    controls: [
      { k: "text", t: "text", wide: true, label: "文本 text", api: "SetText(const char*) / GetText()", def: "" },
      { k: "placeholder", t: "text", label: "占位符 placeholder", api: "SetPlaceholder()：灰字，超出省略号", def: "请输入内容" },
      { k: "type", t: "seg", label: "输入类型 inputType", api: "SetInputType()：仅 TEXT_TYPE / PASSWORD_TYPE", def: "text",
        opts: [["text", "TEXT"], ["password", "PASSWORD"]] },
      { k: "maxLen", t: "range", label: "最大长度 maxLength", api: "SetMaxLength()：上限 4096", min: 1, max: 64, def: 32, unit: " 字符" },
      { k: "size", t: "range", label: "字号 font size", api: "SetFont(name, size)：默认 16", min: 12, max: 28, def: 16, unit: " px" },
      { k: "w", t: "range", label: "宽度 width", api: "SetWidth(int16_t)", min: 120, max: 260, def: 220, unit: " px" },
      { k: "focus", t: "check", label: "获得焦点", api: "Focus() / Blur()：仅焦点态绘制光标", def: true, text: "开启" }
    ],
    create: function(box, state){
      var wrap = el("div", "ud-screen ud-screen--pad");
      var input = el("input", "ud-edit-input");
      wrap.appendChild(input);
      box.appendChild(wrap);
      input.addEventListener("input", function(){
        if(input.value.length > state.maxLen) input.value = input.value.slice(0, state.maxLen);
        state.text = input.value;
      });
      function render(s){
        input.style.width = s.w + "px";
        input.style.fontSize = s.size + "px";
        input.type = s.type === "password" ? "password" : "text";
        input.maxLength = s.maxLen;
        input.placeholder = s.placeholder;
        if(document.activeElement !== input && input.value !== s.text) input.value = s.text;
        input.style.caretColor = "#1c2128";
        if(s.focus && document.activeElement !== input) input.focus();
        if(!s.focus && document.activeElement === input) input.blur();
      }
      return { render: render };
    },
    code: function(s){
      var L = [];
      L.push('<span class="cm">/* ui_edit_text.cpp / style.cpp：透明底、白边 2px、圆角 5、光标 650ms 闪烁 */</span>');
      L.push('UIEditText *edit = <span class="fn">new</span> UIEditText();');
      L.push('edit-&gt;<span class="fn">SetPosition</span>(40, 70);');
      L.push('edit-&gt;<span class="fn">SetWidth</span>(<span class="num">' + s.w + '</span>);  edit-&gt;<span class="fn">SetHeight</span>(38);');
      L.push('edit-&gt;<span class="fn">SetFont</span>("SourceHanSans", <span class="num">' + s.size + '</span>);');
      L.push('edit-&gt;<span class="fn">SetPlaceholder</span>("' + esc(s.placeholder) + '");');
      L.push('edit-&gt;<span class="fn">SetInputType</span>(UIEditText::' + (s.type === "password" ? "PASSWORD_TYPE" : "TEXT_TYPE") + ');');
      L.push('edit-&gt;<span class="fn">SetMaxLength</span>(<span class="num">' + s.maxLen + '</span>);');
      if(s.focus) L.push('edit-&gt;<span class="fn">Focus</span>();');
      L.push('<span class="cm">/* 单行输入；无多行 / 自动换行 / 数字键盘 */</span>');
      return L;
    }
  };

  /* ---------- UIChart ---------- */
  DEMOS.chart = {
    defaults: { smooth: true, gradient: true, axis: true, markNum: 5, line: "#2b7de9",
      fill: "#2b7de9", count: 10, h: 110 },
    controls: [
      { k: "smooth", t: "check", label: "平滑曲线 EnableSmooth", api: "SetSmooth()：默认关闭", def: true, text: "开启" },
      { k: "gradient", t: "check", label: "渐变填充 EnableGradient", api: "EnableGradient()：默认关闭", def: true, text: "开启" },
      { k: "axis", t: "check", label: "坐标轴", api: "GetXAxis().SetMarkNum()：轴只有线，没有刻度文字", def: true, text: "显示" },
      { k: "markNum", t: "range", label: "刻度段数 markNum", api: "SetMarkNum()：默认 5", min: 2, max: 10, def: 5 },
      { k: "count", t: "range", label: "数据点数", api: "AddPoints(const Point*, uint16_t)：单序列上限 512", min: 5, max: 24, def: 10 },
      { k: "line", t: "color", label: "折线色", api: "SetLineColor()：源码默认白（白底改用蓝色便于观看）", def: "#2b7de9" },
      { k: "fill", t: "color", label: "填充色", api: "SetFillColor()：源码默认白（白底改用蓝色便于观看）", def: "#2b7de9" }
    ],
    create: function(box, state){
      var v = mk(box, 300, 180);
      function series(count){
        var arr = [], seed = 3;
        for(var i = 0; i < count; i++){
          seed = (seed * 1103515245 + 12345) & 0x7fffffff;
          arr.push(0.15 + (seed % 1000) / 1200);
        }
        return arr;
      }
      function render(s){
        var c = v.c, W = v.w, H = v.h;
        screen(c, W, H);
        var padL = 34, padR = 16, padT = 28, padB = 34;
        var gw = W - padL - padR, gh = s.h;
        var y0 = H / 2 - gh / 2 - 2;
        var pts = series(s.count);
        function X(i){ return padL + gw * i / Math.max(1, s.count - 1); }
        function Y(vv){ return y0 + gh - vv * gh; }
        if(s.axis){
          c.strokeStyle = "rgba(28,33,40,0.75)";
          c.lineWidth = 1;
          c.beginPath();
          c.moveTo(padL + .5, y0); c.lineTo(padL + .5, y0 + gh);
          c.moveTo(padL, y0 + gh - .5); c.lineTo(padL + gw, y0 + gh - .5);
          c.stroke();
          c.strokeStyle = "rgba(28,33,40,0.4)";
          for(var k = 0; k <= s.markNum; k++){
            var ty = y0 + gh * k / s.markNum;
            c.beginPath(); c.moveTo(padL - 3, ty); c.lineTo(padL, ty); c.stroke();
            var tx = padL + gw * k / s.markNum;
            c.beginPath(); c.moveTo(tx, y0 + gh); c.lineTo(tx, y0 + gh + 3); c.stroke();
          }
        }
        if(s.gradient){
          c.beginPath();
          c.moveTo(X(0), Y(pts[0]));
          for(var i = 1; i < pts.length; i++) c.lineTo(X(i), Y(pts[i]));
          c.lineTo(X(pts.length - 1), y0 + gh);
          c.lineTo(X(0), y0 + gh);
          c.closePath();
          var g = c.createLinearGradient(0, y0, 0, y0 + gh);
          g.addColorStop(0, rgba(s.fill, 0.35));
          g.addColorStop(1, rgba(s.fill, 0.02));
          c.fillStyle = g;
          c.fill();
        }
        c.strokeStyle = s.line;
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(X(0), Y(pts[0]));
        for(var j = 1; j < pts.length; j++){
          if(s.smooth){
            var x0 = X(j - 1), y0v = Y(pts[j - 1]), x1 = X(j), y1v = Y(pts[j]);
            var mx = (x0 + x1) / 2;
            c.bezierCurveTo(mx, y0v, mx, y1v, x1, y1v);
          }else c.lineTo(X(j), Y(pts[j]));
        }
        c.stroke();
        for(var n = 0; n < pts.length; n++){
          c.beginPath();
          c.arc(X(n), Y(pts[n]), 5, 0, Math.PI * 2);
          c.fillStyle = "#ffffff";
          c.fill();
          c.strokeStyle = s.line;
          c.stroke();
        }
        hint(c, "UIChart 有坐标轴线与刻度线，但没有刻度数字 / 图例", W, H);
      }
      return { render: render };
    },
    code: function(s){
      var L = [];
      L.push('<span class="cm">/* ui_chart.cpp / ui_axis.cpp：点半径 5、线宽 1、单序列上限 512 点 */</span>');
      L.push('UIChartPolyline *chart = <span class="fn">new</span> UIChartPolyline();');
      L.push('chart-&gt;<span class="fn">SetPosition</span>(30, 60);');
      L.push('chart-&gt;<span class="fn">SetWidth</span>(240);  chart-&gt;<span class="fn">SetHeight</span>(<span class="num">' + s.h + '</span>);');
      L.push('chart-&gt;<span class="fn">SetMaxDataCount</span>(<span class="num">' + s.count + '</span>);');
      L.push('UIChartDataSerial *ds = <span class="fn">new</span> UIChartDataSerial();');
      L.push('ds-&gt;<span class="fn">SetMaxDataCount</span>(<span class="num">' + s.count + '</span>);');
      L.push('ds-&gt;<span class="fn">AddPoints</span>(points, <span class="num">' + s.count + '</span>);');
      L.push('ds-&gt;<span class="fn">SetLineColor</span>(Color::<span class="fn">GetColorFromRGB</span>(' + rgbArgs(s.line) + ').full);');
      L.push('ds-&gt;<span class="fn">SetFillColor</span>(Color::<span class="fn">GetColorFromRGB</span>(' + rgbArgs(s.fill) + ').full);');
      if(s.smooth) L.push('ds-&gt;<span class="fn">EnableSmooth</span>(true);');
      if(s.gradient) L.push('ds-&gt;<span class="fn">EnableGradient</span>(true);');
      if(s.axis) L.push('chart-&gt;<span class="fn">GetXAxis</span>().<span class="fn">SetMarkNum</span>(<span class="num">' + s.markNum + '</span>);  <span class="cm">// 无刻度文字</span>');
      L.push('chart-&gt;<span class="fn">AddDataSerial</span>(ds);');
      return L;
    }
  };

  /* ---------- UIList ---------- */
  DEMOS.list = {
    defaults: { dir: "v", itemH: 40, count: 6, selected: 1, bar: false, loop: false, highlight: true },
    controls: [
      { k: "dir", t: "seg", label: "方向", api: "UIList(direction)：VERTICAL（0）/ HORIZONTAL（1）", def: "v",
        opts: [["v", "垂直"], ["h", "水平"]] },
      { k: "itemH", t: "range", label: "item 高度", api: "item 高度由子 View 决定（非统一设置）", min: 28, max: 64, def: 40, unit: " px" },
      { k: "count", t: "range", label: "item 数量", api: "SetAdapter(AbstractAdapter*)", min: 3, max: 12, def: 6 },
      { k: "selected", t: "range", label: "选中项", api: "OnItemSelected 回调：无默认高亮", min: 0, max: 11, def: 1 },
      { k: "bar", t: "check", label: "滚动条 visible", api: "SetYScrollBarVisible()：默认隐藏，宽 4px", def: false, text: "显示" },
      { k: "loop", t: "check", label: "循环 loop", api: "SetLoopState(bool)", def: false, text: "开启" },
      { k: "highlight", t: "check", label: "应用层自绘选中高亮", api: "UIList 本身不画选中态", def: true, text: "开启" }
    ],
    create: function(box, state){
      var wrap = el("div", "ud-screen");
      var list = el("div", "ud-listbox");
      wrap.appendChild(list);
      box.appendChild(wrap);
      var offset = 0;
      list.addEventListener("wheel", function(e){
        e.preventDefault();
        offset = Math.max(0, Math.min(Math.max(0, state.count * state.itemH - 150), offset + e.deltaY));
        render(state);
      }, { passive: false });
      function render(s){
        var horizontal = s.dir === "h";
        list.style.width = horizontal ? "260px" : "180px";
        list.style.height = "150px";
        list.style.flexDirection = horizontal ? "row" : "column";
        list.innerHTML = "";
        var inner = el("div", "ud-listbox__inner");
        inner.style.transform = horizontal ? "translateX(" + (-offset) + "px)" : "translateY(" + (-offset) + "px)";
        inner.style.flexDirection = horizontal ? "row" : "column";
        for(var i = 0; i < s.count; i++){
          var row = el("div", "ud-row" + (s.highlight && i === s.selected ? " sel" : ""));
          row.style.height = s.itemH + "px";
          row.style.width = horizontal ? "120px" : "100%";
          row.textContent = "Item " + (i + 1);
          inner.appendChild(row);
        }
        list.appendChild(inner);
        if(s.bar){
          var bar = el("div", "ud-scrollbar");
          var thumb = el("div", "ud-scrollbar__thumb");
          var total = s.count * s.itemH;
          var ratio = Math.min(1, 150 / total);
          thumb.style.height = Math.max(10, 150 * ratio) + "px";
          thumb.style.top = (150 - Math.max(10, 150 * ratio)) * (offset / Math.max(1, total - 150)) + "px";
          bar.appendChild(thumb);
          list.appendChild(bar);
        }
      }
      return { render: render };
    },
    code: function(s){
      var L = [];
      L.push('<span class="cm">/* ui_list.cpp：item 高度由子 View 决定；滚动条默认隐藏、宽 4px */</span>');
      L.push('UIList *list = <span class="fn">new</span> UIList(' + (s.dir === "h" ? "UIList::HORIZONTAL" : "UIList::VERTICAL") + ');');
      L.push('list-&gt;<span class="fn">SetPosition</span>(60, 50);');
      L.push('list-&gt;<span class="fn">SetWidth</span>(180);  list-&gt;<span class="fn">SetHeight</span>(150);');
      L.push('list-&gt;<span class="fn">SetAdapter</span>(adapter);');
      if(s.loop) L.push('list-&gt;<span class="fn">SetLoopState</span>(true);');
      if(s.bar) L.push('list-&gt;<span class="fn">SetYScrollBarVisible</span>(true);');
      L.push('list-&gt;<span class="fn">ScrollTo</span>(<span class="num">' + s.selected + '</span>);');
      L.push('<span class="cm">/* 选中态没有默认视觉，只能在 OnItemSelected 里自绘 */</span>');
      return L;
    }
  };

  /* ---------- UIPicker ---------- */
  DEMOS.picker = {
    defaults: { selected: 1, itemH: 40, loop: false, hl: 18, base: 16, hlColor: "#45a5ff", baseColor: "#8a8a8a" },
    controls: [
      { k: "selected", t: "range", label: "选中项", api: "SetSelected(uint16_t) / GetSelected()", min: 0, max: 5, def: 1 },
      { k: "itemH", t: "range", label: "item 高度", api: "SetItemHeight()：默认 0，必须显式设置", min: 24, max: 64, def: 40, unit: " px" },
      { k: "loop", t: "check", label: "循环 loop", api: "SetLoopState(bool)：默认 false", def: false, text: "开启" },
      { k: "base", t: "range", label: "背景字号", api: "SetBackgroundFont()：默认 16", min: 12, max: 24, def: 16, unit: " px" },
      { k: "hl", t: "range", label: "高亮字号", api: "SetHighlightFont()：默认 18", min: 12, max: 28, def: 18, unit: " px" },
      { k: "hlColor", t: "color", label: "高亮文字色", api: "SetTextColor()：默认 #45A5FF", def: "#45a5ff" },
      { k: "baseColor", t: "color", label: "背景文字色", api: "默认 Color::Gray()", def: "#8a8a8a" }
    ],
    create: function(box, state){
      var wrap = el("div", "ud-screen");
      var pick = el("div", "ud-pickbox");
      wrap.appendChild(pick);
      box.appendChild(wrap);
      var vals = ["北京", "上海", "广州", "深圳", "杭州", "成都"];
      function render(s){
        pick.innerHTML = "";
        pick.style.height = (s.itemH * 3) + "px";
        for(var k = -1; k <= 1; k++){
          var i = s.selected + k;
          if(i < 0) i = s.loop ? vals.length - 1 : 0;
          if(i >= vals.length) i = s.loop ? 0 : vals.length - 1;
          var it = el("div", "ud-pick" + (k === 0 ? " mid" : ""), vals[i]);
          it.style.height = s.itemH + "px";
          it.style.fontSize = (k === 0 ? s.hl : s.base) + "px";
          it.style.color = k === 0 ? s.hlColor : s.baseColor;
          pick.appendChild(it);
        }
      }
      return { render: render };
    },
    code: function(s){
      var L = [];
      L.push('<span class="cm">/* ui_picker.cpp：高亮只改文字色/字号，没有高亮背景条 */</span>');
      L.push('UIPicker *picker = <span class="fn">new</span> UIPicker();');
      L.push('picker-&gt;<span class="fn">SetPosition</span>(70, 50);');
      L.push('picker-&gt;<span class="fn">SetWidth</span>(140);  picker-&gt;<span class="fn">SetHeight</span>(' + (s.itemH * 3) + ');');
      L.push('picker-&gt;<span class="fn">SetValues</span>(values, 6);');
      L.push('picker-&gt;<span class="fn">SetItemHeight</span>(<span class="num">' + s.itemH + '</span>);');
      L.push('picker-&gt;<span class="fn">SetBackgroundFont</span>("SourceHanSans", <span class="num">' + s.base + '</span>);');
      L.push('picker-&gt;<span class="fn">SetHighlightFont</span>("SourceHanSans", <span class="num">' + s.hl + '</span>);');
      L.push('picker-&gt;<span class="fn">SetTextColor</span>(Color::<span class="fn">Gray</span>().full, Color::<span class="fn">GetColorFromRGB</span>(' + rgbArgs(s.hlColor) + ').full);');
      if(s.loop) L.push('picker-&gt;<span class="fn">SetLoopState</span>(true);');
      L.push('picker-&gt;<span class="fn">SetSelected</span>(<span class="num">' + s.selected + '</span>);');
      return L;
    }
  };

  /* ---------- UIQRCode ---------- */
  DEMOS.qrcode = {
    defaults: { text: "OpenHarmony", size: 126, fg: "#000000", bg: "#ffffff" },
    controls: [
      { k: "text", t: "text", wide: true, label: "内容 text", api: "SetQrcodeInfo(val, bg, fg)：上限 2048 字节", def: "OpenHarmony" },
      { k: "size", t: "range", label: "边长 size", api: "SetWidth/SetHeight：模块整数倍缩放并居中", min: 60, max: 180, def: 126, unit: " px" },
      { k: "fg", t: "color", label: "前景色 qrColor", api: "SetQrcodeInfo(…, qrColor)：默认黑", def: "#000000" },
      { k: "bg", t: "color", label: "背景色 backgroundColor", api: "默认白", def: "#ffffff" }
    ],
    create: function(box, state){
      var v = mk(box, 300, 180);
      function modules(len){
        if(len <= 17) return 21;
        if(len <= 32) return 25;
        if(len <= 53) return 29;
        if(len <= 78) return 33;
        return 41;
      }
      function render(s){
        var c = v.c, W = v.w, H = v.h;
        screen(c, W, H);
        var n = modules(String(s.text).length);
        var scale = Math.floor(s.size / n);
        var side = scale * n;
        var ox = Math.round(W / 2 - side / 2), oy = Math.round(H / 2 - side / 2 - 6);
        c.fillStyle = s.bg;
        c.fillRect(ox, oy, side, side);
        var seed = 7;
        for(var i = 0; i < String(s.text).length; i++) seed = (seed * 31 + String(s.text).charCodeAt(i)) & 0x7fffffff;
        function rnd(){ seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
        c.fillStyle = s.fg;
        for(var y = 0; y < n; y++){
          for(var x = 0; x < n; x++){
            var finder = (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
            if(finder) continue;
            if(rnd() > 0.5) c.fillRect(ox + x * scale, oy + y * scale, scale, scale);
          }
        }
        [[0, 0], [n - 7, 0], [0, n - 7]].forEach(function(p){
          c.fillStyle = s.fg;
          c.fillRect(ox + p[0] * scale, oy + p[1] * scale, 7 * scale, 7 * scale);
          c.fillStyle = s.bg;
          c.fillRect(ox + (p[0] + 1) * scale, oy + (p[1] + 1) * scale, 5 * scale, 5 * scale);
          c.fillStyle = s.fg;
          c.fillRect(ox + (p[0] + 2) * scale, oy + (p[1] + 2) * scale, 3 * scale, 3 * scale);
        });
        hint(c, "模块数 " + n + "（版本随内容变化）· 缩放取整数倍 · 无静区", W, H);
      }
      return { render: render };
    },
    code: function(s){
      var L = [];
      L.push('<span class="cm">/* ui_qrcode.cpp：模块整数倍缩放、无静区、ECC 固定 MEDIUM */</span>');
      L.push('UIQRCode *qr = <span class="fn">new</span> UIQRCode();');
      L.push('qr-&gt;<span class="fn">SetPosition</span>(90, 30);');
      L.push('qr-&gt;<span class="fn">SetWidth</span>(<span class="num">' + s.size + '</span>);  qr-&gt;<span class="fn">SetHeight</span>(<span class="num">' + s.size + '</span>);');
      L.push('qr-&gt;<span class="fn">SetQrcodeInfo</span>("' + esc(s.text) + '",');
      L.push('    Color::<span class="fn">GetColorFromRGB</span>(' + rgbArgs(s.bg) + ').full,');
      L.push('    Color::<span class="fn">GetColorFromRGB</span>(' + rgbArgs(s.fg) + ').full);');
      return L;
    }
  };

  /* ---------- UIImageAnimator ---------- */
  DEMOS.imageanim = {
    defaults: { interval: 16, frames: 4, repeat: true, playing: true, fill: true },
    controls: [
      { k: "playing", t: "check", label: "播放", api: "Start() / Pause() / Resume() / Stop()", def: true, text: "播放中" },
      { k: "interval", t: "range", label: "帧间隔 timeOfUpdate", api: "SetTimeOfUpdate(ms)：默认 16ms", min: 16, max: 400, def: 16, unit: " ms" },
      { k: "frames", t: "range", label: "帧数", api: "SetImageAnimatorSrc(arr, num)：num 为 uint8", min: 2, max: 8, def: 4 },
      { k: "repeat", t: "check", label: "循环 repeat", api: "SetRepeat(bool)：默认 true", def: true, text: "开启" },
      { k: "fill", t: "check", label: "fillMode 停在末帧", api: "SetFillMode(bool)：Stop() 时回末帧", def: true, text: "开启" }
    ],
    create: function(box, state){
      var v = mk(box, 300, 180), idx = 0, last = performance.now(), raf = 0;
      function drawFrame(i, s){
        var c = v.c, W = v.w, H = v.h;
        screen(c, W, H);
        var cx = W / 2, cy = H / 2 - 6, R = 34;
        c.save();
        c.translate(cx, cy);
        c.rotate((i / s.frames) * Math.PI * 2);
        c.fillStyle = "rgba(0,125,255,0.18)";
        c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#45a5ff";
        c.beginPath(); c.arc(R * 0.55, 0, 12, 0, Math.PI * 2); c.fill();
        c.restore();
        txt(c, "frame " + (i + 1) + " / " + s.frames, W / 2, H - 34, 12, "#c8ced6");
      }
      function loop(now){
        var s = state;
        if(s.playing && now - last >= s.interval){
          last = now;
          idx++;
          if(idx >= s.frames) idx = s.repeat ? 0 : s.frames - 1;
        }
        drawFrame(idx, s);
        raf = requestAnimationFrame(loop);
      }
      raf = requestAnimationFrame(loop);
      return { render: function(s){ drawFrame(idx, s); } };
    },
    code: function(s){
      var L = [];
      L.push('<span class="cm">/* ui_image_animator.cpp：默认 16ms/帧、无限循环、fillMode=true */</span>');
      L.push('UIImageAnimatorView *anim = <span class="fn">new</span> UIImageAnimatorView();');
      L.push('anim-&gt;<span class="fn">SetPosition</span>(90, 40);');
      L.push('anim-&gt;<span class="fn">SetWidth</span>(120);  anim-&gt;<span class="fn">SetHeight</span>(100);');
      L.push('anim-&gt;<span class="fn">SetImageAnimatorSrc</span>(frames, <span class="num">' + s.frames + '</span>, <span class="num">' + s.interval + '</span>);');
      L.push('anim-&gt;<span class="fn">SetRepeat</span>(' + (s.repeat ? "true" : "false") + ');');
      L.push('anim-&gt;<span class="fn">SetFillMode</span>(' + (s.fill ? "true" : "false") + ');');
      if(s.playing) L.push('anim-&gt;<span class="fn">Start</span>();');
      return L;
    }
  };

  /* ---------- UIDialog ---------- */
  DEMOS.dialog = {
    defaults: { title: "提示", text: "UIDialog：白底、无圆角、无阴影，按钮等宽平分。", buttons: 2, autoCancel: false, color: "#007dff" },
    controls: [
      { k: "title", t: "text", label: "标题 title", api: "SetTitle(const char*)：20px，黑 90%", def: "提示" },
      { k: "text", t: "text", wide: true, label: "正文 text", api: "SetText(const char*)：16px，黑 90%", def: "UIDialog：白底、无圆角、无阴影，按钮等宽平分。" },
      { k: "buttons", t: "seg", label: "按钮数量", api: "SetButton(LEFT / MID / RIGHT)", def: "2",
        opts: [["1", "1 个"], ["2", "2 个"], ["3", "3 个"]] },
      { k: "autoCancel", t: "check", label: "点窗外关闭", api: "EnableAutoCancel(bool)：默认 false，无遮罩变暗", def: false, text: "开启" },
      { k: "color", t: "color", label: "按钮文字色", api: "SetButtonColor()：默认蓝", def: "#007dff" }
    ],
    create: function(box, state){
      var wrap = el("div", "ud-screen");
      var dlg = el("div", "ud-dlg");
      wrap.appendChild(dlg);
      box.appendChild(wrap);
      var last = "";
      function render(s){
        dlg.innerHTML = "";
        var n = Number(s.buttons);
        dlg.appendChild(el("div", "ud-dlg__title", esc(s.title)));
        dlg.appendChild(el("div", "ud-dlg__text", esc(s.text)));
        var bar = el("div", "ud-dlg__bar");
        var names = n === 1 ? ["确定"] : n === 2 ? ["取消", "确定"] : ["取消", "稍后", "确定"];
        names.forEach(function(nm){
          var b = el("span", "ud-dlg__btn", nm);
          b.style.color = s.color;
          b.addEventListener("click", function(){ last = "触发按钮：" + nm; tip.textContent = last; });
          bar.appendChild(b);
        });
        dlg.appendChild(bar);
        if(!dlg.dataset.bound){
          dlg.dataset.bound = "1";
          wrap.addEventListener("click", function(e){
            if(!state.autoCancel) return;
            if(!dlg.contains(e.target)){ dlg.style.visibility = "hidden"; }
          });
        }
        dlg.style.visibility = "visible";
      }
      var tip = el("div", "ud-dlg__tip", "点击按钮触发 SetButton 回调");
      wrap.appendChild(tip);
      return { render: render, click: function(which){
        last = "触发按钮：" + (which === "ok" ? "确定" : "取消");
        tip.textContent = last;
      } };
    },
    code: function(s){
      var n = Number(s.buttons);
      var L = [];
      L.push('<span class="cm">/* ui_dialog.cpp：白底无圆角无阴影，按钮等宽，无半透明遮罩 */</span>');
      L.push('UIDialog *dlg = <span class="fn">new</span> UIDialog();');
      L.push('dlg-&gt;<span class="fn">SetTitle</span>("' + esc(s.title) + '");');
      L.push('dlg-&gt;<span class="fn">SetText</span>("' + esc(s.text) + '");');
      if(n >= 1) L.push('dlg-&gt;<span class="fn">SetButton</span>(UIDialog::DialogButtonType::BUTTON_LEFT, "' + (n === 1 ? "确定" : "取消") + '", &amp;listener);');
      if(n === 3) L.push('dlg-&gt;<span class="fn">SetButton</span>(UIDialog::DialogButtonType::BUTTON_MID, "稍后", &amp;listener);');
      if(n >= 2) L.push('dlg-&gt;<span class="fn">SetButton</span>(UIDialog::DialogButtonType::BUTTON_RIGHT, "确定", &amp;listener);');
      L.push('dlg-&gt;<span class="fn">SetButtonColor</span>(UIDialog::DialogButtonType::BUTTON_RIGHT, Color::<span class="fn">GetColorFromRGB</span>(' + rgbArgs(s.color) + ').full);');
      if(s.autoCancel) L.push('dlg-&gt;<span class="fn">EnableAutoCancel</span>(true);');
      L.push('dlg-&gt;<span class="fn">Show</span>();');
      return L;
    }
  };

  /* ---------- UICanvas ---------- */
  DEMOS.canvas = {
    defaults: { which: "all", lineW: 2, stroke: "#45a5ff", fill: "#ff9f43", text: true },
    controls: [
      { k: "which", t: "seg", wide: true, label: "图元", api: "UICanvas：DrawLine / DrawCurve / DrawRect / DrawCircle / DrawSector / DrawArc / DrawPath / StrokeText",
        def: "all", opts: [["all", "全部"], ["line", "线+曲线"], ["rect", "矩形"], ["circle", "圆/扇"], ["path", "路径"], ["text", "文字"]] },
      { k: "lineW", t: "range", label: "线宽 strokeWidth", api: "Paint::SetStrokeWidth()：贝塞尔最大 3", min: 1, max: 3, def: 2, unit: " px" },
      { k: "stroke", t: "color", label: "描边色", api: "Paint::SetStrokeColor()", def: "#45a5ff" },
      { k: "fill", t: "color", label: "填充色", api: "Paint::SetFillColor()", def: "#ff9f43" },
      { k: "text", t: "check", label: "填充文字 StrokeText", api: "只有填充文字，无换行", def: true, text: "显示" }
    ],
    create: function(box, state){
      var v = mk(box, 300, 180);
      function render(s){
        var c = v.c, W = v.w, H = v.h;
        screen(c, W, H);
        c.lineWidth = s.lineW;
        c.lineCap = "round";
        var all = s.which === "all";
        if(all || s.which === "line"){
          c.strokeStyle = s.stroke;
          c.beginPath(); c.moveTo(28, 124); c.lineTo(64, 84); c.lineTo(100, 106); c.stroke();
          c.beginPath(); c.moveTo(28, 146);
          c.bezierCurveTo(72, 118, 112, 152, 152, 134); c.stroke();
        }
        if(all || s.which === "rect"){
          c.strokeStyle = s.stroke;
          c.strokeRect(180, 24, 58, 40);
          c.fillStyle = rgba(s.fill, 0.5);
          c.fillRect(180, 84, 58, 40);
        }
        if(all || s.which === "circle"){
          c.strokeStyle = s.stroke;
          c.beginPath(); c.arc(264, 44, 20, 0, Math.PI * 2); c.stroke();
          c.fillStyle = rgba(s.fill, 0.6);
          c.beginPath(); c.moveTo(262, 124); c.arc(262, 124, 22, -Math.PI * 0.75, Math.PI * 0.25); c.closePath(); c.fill();
        }
        if(all || s.which === "path"){
          c.strokeStyle = s.fill;
          c.beginPath(); c.moveTo(26, 54); c.lineTo(58, 26); c.arcTo(78, 42, 60, 58, 8); c.lineTo(26, 54); c.stroke();
        }
        if((all || s.which === "text") && s.text){
          c.fillStyle = s.stroke;
          c.font = "600 14px -apple-system, 'Microsoft YaHei', sans-serif";
          c.textAlign = "center";
          c.fillText("StrokeText", 126, 52);
        }
        hint(c, "抗锯齿恒定开启；曲线线宽上限 3；无渐变 / 裁剪栈", W, H);
      }
      return { render: render };
    },
    code: function(s){
      var L = [];
      L.push('<span class="cm">/* ui_canvas.h：图元齐全，抗锯齿恒开，曲线 lineWidth 上限 3 */</span>');
      L.push('UICanvas *canvas = <span class="fn">new</span> UICanvas();');
      L.push('canvas-&gt;<span class="fn">SetPosition</span>(0, 0);');
      L.push('canvas-&gt;<span class="fn">SetWidth</span>(300);  canvas-&gt;<span class="fn">SetHeight</span>(180);');
      L.push('Paint paint;');
      L.push('paint.<span class="fn">SetStrokeWidth</span>(<span class="num">' + s.lineW + '</span>);');
      L.push('paint.<span class="fn">SetStrokeColor</span>(Color::<span class="fn">GetColorFromRGB</span>(' + rgbArgs(s.stroke) + ').full);');
      L.push('paint.<span class="fn">SetFillColor</span>(Color::<span class="fn">GetColorFromRGB</span>(' + rgbArgs(s.fill) + ').full);');
      if(s.which === "all" || s.which === "line") L.push('canvas-&gt;<span class="fn">DrawLine</span>({28, 124}, {64, 84}, paint);');
      if(s.which === "all" || s.which === "rect") L.push('canvas-&gt;<span class="fn">StrokeRect</span>({180, 24}, 40, 58, paint);');
      if(s.which === "all" || s.which === "circle") L.push('canvas-&gt;<span class="fn">DrawCircle</span>({264, 44}, 20, paint);');
      if(s.which === "all" || s.which === "path") L.push('canvas-&gt;<span class="fn">DrawPath</span>(paint);');
      if(s.text) L.push('canvas-&gt;<span class="fn">StrokeText</span>("StrokeText", {96, 44}, fontStyle, paint);');
      return L;
    }
  };

  /* ---------- UIArcLabel ---------- */
  DEMOS.arclabel = {
    defaults: { text: "ARC LABEL", radius: 70, start: 200, end: 340, orient: "inside", align: "center", size: 14, roll: false, speed: 10 },
    controls: [
      { k: "text", t: "text", wide: true, label: "文本 text", api: "SetText(const char*)", def: "ARC LABEL" },
      { k: "radius", t: "range", label: "半径 radius", api: "SetArcTextRadius()：默认 0，必须显式设置", min: 30, max: 100, def: 70, unit: " px" },
      { k: "start", t: "range", label: "起始角", api: "SetArcTextAngle(start, end)：0° 在 12 点、顺时针", min: -180, max: 270, def: 200, unit: "°" },
      { k: "end", t: "range", label: "结束角", api: "SetArcTextAngle(start, end)", min: -90, max: 360, def: 340, unit: "°" },
      { k: "orient", t: "seg", label: "朝向", api: "SetArcTextOrientation()：INSIDE / OUTSIDE", def: "inside",
        opts: [["inside", "INSIDE"], ["outside", "OUTSIDE"]] },
      { k: "align", t: "seg", label: "对齐", api: "SetAlign()：LEFT / CENTER / RIGHT；仅当实际弧长 < 弧长上限时才产生位移（源码 OnMeasureArcTextInfo）", def: "center",
        opts: [["left", "LEFT"], ["center", "CENTER"], ["right", "RIGHT"]] },
      { k: "size", t: "range", label: "字号", api: "SetFont(name, size)：默认 16", min: 10, max: 24, def: 14, unit: " px" },
      { k: "roll", t: "check", label: "滚动 Start()", api: "Start() / SetRollSpeed(deg/s) / SetRollCount()", def: false, text: "开启" },
      { k: "speed", t: "range", label: "滚动速度", api: "SetRollSpeed()：默认 10°/s", min: 2, max: 60, def: 10, unit: " °/s" }
    ],
    create: function(box, state){
      var v = mk(box, 300, 180), offset = 0, last = performance.now(), raf = 0;
      function render(s){
        var c = v.c, W = v.w, H = v.h;
        screen(c, W, H);
        if(!s.radius){
          txt(c, "radius 未设置（默认 0）：不绘制", W / 2, H / 2, 13, "#ff9a9a");
          return;
        }
        var cx = W / 2, cy = H / 2 + 6;
        var start = s.start + (s.roll ? offset : 0);
        var end = s.end + (s.roll ? offset : 0);
        var text = String(s.text).split("");
        c.font = "600 " + s.size + "px -apple-system, 'Microsoft YaHei', sans-serif";
        c.fillStyle = "#1c2128";
        c.textAlign = "center";
        c.textBaseline = "middle";

        /* 源码 OnMeasureArcTextInfo：maxLength = π·r·arcAngle/180；
           只有实际弧长 < maxLength 时才按 align 补 gap（CENTER 补一半、RIGHT 补全部），
           然后逐字按累积字宽换算角度——文字短于弧长时三种对齐才会明显错位 */
        var dirSign = end >= start ? 1 : -1;
        var arcAngle = Math.abs(end - start);
        var maxLen = Math.PI * s.radius * arcAngle / 180;
        var widths = [], total = 0;
        text.forEach(function(ch){ var w = c.measureText(ch).width; widths.push(w); total += w; });
        var perPx = total < maxLen ? arcAngle / maxLen : arcAngle / Math.max(1, total);
        var gapPx = Math.max(0, maxLen - total);
        var shiftPx = s.align === "center" ? gapPx / 2 : s.align === "right" ? gapPx : 0;
        var base = start + dirSign * shiftPx * perPx;
        var r = s.orient === "inside" ? s.radius - s.size / 2 : s.radius + s.size / 2;
        var acc = 0;
        text.forEach(function(ch, i){
          var mid = acc + widths[i] / 2;
          var a = (base + dirSign * mid * perPx - 90) * Math.PI / 180;
          c.save();
          c.translate(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
          c.rotate(a + Math.PI / 2);
          c.fillText(ch, 0, 0);
          c.restore();
          acc += widths[i];
        });
        c.strokeStyle = "rgba(28,33,40,0.18)";
        c.setLineDash([3, 3]);
        c.beginPath(); c.arc(cx, cy, s.radius, 0, Math.PI * 2); c.stroke();
        c.setLineDash([]);
        hint(c, total < maxLen ? "文本短于弧长 → 对齐生效（LEFT/CENTER/RIGHT）" : "文本已占满弧长 → 三种对齐重合", W, H);
      }
      function loop(now){
        var s = state;
        if(s.roll){
          var dt = now - last; last = now;
          offset = (offset + s.speed * dt / 1000) % 360;
          render(s);
        }
        raf = requestAnimationFrame(loop);
      }
      raf = requestAnimationFrame(loop);
      return { render: render };
    },
    code: function(s){
      var L = [];
      L.push('<span class="cm">/* ui_arc_label.cpp：默认为 0°，必须显式设置半径与角度 */</span>');
      L.push('UIArcLabel *arc = <span class="fn">new</span> UIArcLabel();');
      L.push('arc-&gt;<span class="fn">SetPosition</span>(60, 20);');
      L.push('arc-&gt;<span class="fn">SetArcTextCenter</span>(90, 100);');
      L.push('arc-&gt;<span class="fn">SetArcTextRadius</span>(<span class="num">' + s.radius + '</span>);');
      L.push('arc-&gt;<span class="fn">SetArcTextAngle</span>(<span class="num">' + s.start + '</span>, <span class="num">' + s.end + '</span>);');
      L.push('arc-&gt;<span class="fn">SetArcTextOrientation</span>(UIArcLabel::' + s.orient.toUpperCase() + ');');
      L.push('arc-&gt;<span class="fn">SetAlign</span>(' + s.align.toUpperCase() + ');');
      L.push('arc-&gt;<span class="fn">SetFont</span>("SourceHanSans", <span class="num">' + s.size + '</span>);');
      L.push('arc-&gt;<span class="fn">SetText</span>("' + esc(s.text) + '");');
      if(s.roll) L.push('arc-&gt;<span class="fn">SetRollSpeed</span>(<span class="num">' + s.speed + '</span>);  arc-&gt;<span class="fn">Start</span>();');
      return L;
    }
  };

  /* ---------- UIView / Base Object ---------- */
  DEMOS.view = {
    defaults: { x: 0, y: 0, w: 180, h: 100, bg: "#007dff", radius: 0, borderW: 0, border: "#ffffff", opa: 1, rotate: 0, scale: 1 },
    controls: [
      { k: "w", t: "range", label: "宽度 width", api: "SetWidth(int16_t) / Resize()", min: 40, max: 260, def: 180, unit: " px" },
      { k: "h", t: "range", label: "高度 height", api: "SetHeight(int16_t)", min: 30, max: 140, def: 100, unit: " px" },
      { k: "x", t: "range", label: "x 坐标", api: "SetX(int16_t) / SetPosition(x, y)", min: -60, max: 60, def: 0, unit: " px" },
      { k: "y", t: "range", label: "y 坐标", api: "SetY(int16_t)", min: -40, max: 40, def: 0, unit: " px" },
      { k: "bg", t: "color", label: "背景色 bg", api: "SetStyle(STYLE_BACKGROUND_COLOR)：默认黑", def: "#007dff" },
      { k: "radius", t: "range", label: "圆角 borderRadius", api: "SetStyle(STYLE_BORDER_RADIUS)", min: 0, max: 60, def: 0 },
      { k: "borderW", t: "range", label: "边框宽", api: "SetStyle(STYLE_BORDER_WIDTH)", min: 0, max: 8, def: 0, unit: " px" },
      { k: "opa", t: "range", label: "不透明度", api: "SetOpaScale(0~255)", min: 0.1, max: 1, step: 0.05, def: 1 },
      { k: "rotate", t: "range", label: "旋转", api: "Rotate(angle, pivot)", min: -180, max: 180, def: 0, unit: "°" },
      { k: "scale", t: "range", label: "缩放", api: "Scale(Vector2<float>, pivot)", min: 0.5, max: 1.8, step: 0.05, def: 1 }
    ],
    create: function(box, state){
      var v = mk(box, 300, 180);
      function render(s){
        var c = v.c, W = v.w, H = v.h;
        screen(c, W, H);
        c.save();
        c.globalAlpha = s.opa;
        c.translate(W / 2 + s.x, H / 2 + s.y);
        c.rotate(s.rotate * Math.PI / 180);
        c.scale(s.scale, s.scale);
        rr(c, -s.w / 2, -s.h / 2, s.w, s.h, s.radius);
        c.fillStyle = s.bg;
        c.fill();
        if(s.borderW > 0){
          c.strokeStyle = s.border;
          c.lineWidth = s.borderW;
          c.stroke();
        }
        c.restore();
        hint(c, "UIView：矩形 / 圆角 / 边框 / 透明度 / 变换，全部来自 Style 与 TransformMap", W, H);
      }
      return { render: render };
    },
    code: function(s){
      var L = [];
      L.push('<span class="cm">/* ui_view.h：基础属性 + Style + 变换，和 lv_obj 能力最接近 */</span>');
      L.push('UIView *view = <span class="fn">new</span> UIView();');
      L.push('view-&gt;<span class="fn">SetPosition</span>(<span class="num">' + (60 + s.x) + '</span>, <span class="num">' + (40 + s.y) + '</span>);');
      L.push('view-&gt;<span class="fn">SetWidth</span>(<span class="num">' + s.w + '</span>);  view-&gt;<span class="fn">SetHeight</span>(<span class="num">' + s.h + '</span>);');
      L.push('view-&gt;<span class="fn">SetStyle</span>(STYLE_BACKGROUND_COLOR, Color::<span class="fn">GetColorFromRGB</span>(' + rgbArgs(s.bg) + ').full);');
      if(s.radius) L.push('view-&gt;<span class="fn">SetStyle</span>(STYLE_BORDER_RADIUS, <span class="num">' + s.radius + '</span>);');
      if(s.borderW) L.push('view-&gt;<span class="fn">SetStyle</span>(STYLE_BORDER_WIDTH, <span class="num">' + s.borderW + '</span>);');
      if(s.opa !== 1) L.push('view-&gt;<span class="fn">SetOpaScale</span>(<span class="num">' + Math.round(s.opa * 255) + '</span>);');
      if(s.rotate) L.push('view-&gt;<span class="fn">Rotate</span>(<span class="num">' + s.rotate + '</span>, Vector2&lt;float&gt;({0.5f, 0.5f}));');
      if(s.scale !== 1) L.push('view-&gt;<span class="fn">Scale</span>(Vector2&lt;float&gt;({' + s.scale.toFixed(2) + 'f, ' + s.scale.toFixed(2) + 'f}), Vector2&lt;float&gt;({0.5f, 0.5f}));');
      return L;
    }
  };

  /* ---------- lv_line → UICanvas 折线 ---------- */
  DEMOS.line = {
    defaults: { count: 6, lineW: 2, color: "#45a5ff", closed: false, flip: true },
    controls: [
      { k: "count", t: "range", label: "坐标点数", api: "UICanvas::DrawLine / DrawPath（无点数组对象）", min: 3, max: 10, def: 6 },
      { k: "lineW", t: "range", label: "线宽", api: "Paint::SetStrokeWidth()", min: 1, max: 6, def: 2, unit: " px" },
      { k: "color", t: "color", label: "线条色", api: "Paint::SetStrokeColor()", def: "#45a5ff" },
      { k: "flip", t: "check", label: "y 轴翻转", api: "lv_line：y=0 在底部；UICanvas 的 y 向下", def: true, text: "开启" },
      { k: "closed", t: "check", label: "闭合", api: "DrawPath + ClosePath", def: false, text: "闭合" }
    ],
    create: function(box, state){
      var v = mk(box, 300, 180);
      function render(s){
        var c = v.c, W = v.w, H = v.h;
        screen(c, W, H);
        var pts = [], n = s.count;
        for(var i = 0; i < n; i++){
          var x = 30 + (W - 60) * i / (n - 1);
          var y = 40 + (H - 90) * (0.5 + 0.45 * Math.sin(i * 1.1 + 0.6));
          pts.push([x, s.flip ? H - y - 10 : y]);
        }
        c.strokeStyle = s.color;
        c.lineWidth = s.lineW;
        c.lineJoin = "round";
        c.beginPath();
        c.moveTo(pts[0][0], pts[0][1]);
        for(var k = 1; k < pts.length; k++) c.lineTo(pts[k][0], pts[k][1]);
        if(s.closed) c.closePath();
        c.stroke();
        if(s.closed){
          c.fillStyle = rgba(s.color, 0.18);
          c.fill();
        }
        pts.forEach(function(p){
          c.beginPath(); c.arc(p[0], p[1], 3, 0, Math.PI * 2);
          c.fillStyle = s.color; c.fill();
        });
        hint(c, "UICanvas 只有绘制原语，没有「点数组 + 自动连线」的 Line 控件", W, H);
      }
      return { render: render };
    },
    code: function(s){
      var L = [];
      L.push('<span class="cm">/* 无 lv_line 对应控件，只能逐段 DrawLine 到 UICanvas */</span>');
      L.push('UICanvas *canvas = <span class="fn">new</span> UICanvas();');
      L.push('canvas-&gt;<span class="fn">SetWidth</span>(300);  canvas-&gt;<span class="fn">SetHeight</span>(180);');
      L.push('Paint paint;');
      L.push('paint.<span class="fn">SetStrokeWidth</span>(<span class="num">' + s.lineW + '</span>);');
      L.push('paint.<span class="fn">SetStrokeColor</span>(Color::<span class="fn">GetColorFromRGB</span>(' + rgbArgs(s.color) + ').full);');
      L.push('canvas-&gt;<span class="fn">BeginPath</span>();');
      L.push('canvas-&gt;<span class="fn">MoveTo</span>({30, 150});  canvas-&gt;<span class="fn">LineTo</span>({90, 60});  <span class="cm">/* …逐点 */</span>');
      if(s.closed) L.push('canvas-&gt;<span class="fn">ClosePath</span>();');
      L.push('canvas-&gt;<span class="fn">DrawPath</span>(paint);');
      L.push('<span class="cm">/* 无 y 翻转语义，需调用方自行换算 */</span>');
      return L;
    }
  };

  /* ---------- lv_led → UIView 圆形近似 ---------- */
  DEMOS.led = {
    defaults: { color: "#ff7a45", size: 42, opa: 1, breath: true },
    controls: [
      { k: "color", t: "color", label: "颜色", api: "UIView::SetStyle(STYLE_BACKGROUND_COLOR)", def: "#ff7a45" },
      { k: "size", t: "range", label: "直径", api: "SetWidth/SetHeight + STYLE_BORDER_RADIUS", min: 16, max: 90, def: 42, unit: " px" },
      { k: "opa", t: "range", label: "亮度（透明度）", api: "SetOpaScale(0~255)", min: 0.1, max: 1, step: 0.05, def: 1 },
      { k: "breath", t: "check", label: "呼吸效果", api: "应用层 Animation（无内建 LED 组件）", def: true, text: "开启" }
    ],
    create: function(box, state){
      var v = mk(box, 300, 180), t0 = performance.now(), raf = 0;
      function render(s){
        var c = v.c, W = v.w, H = v.h;
        screen(c, W, H);
        var k = 1;
        if(s.breath) k = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin((performance.now() - t0) / 500));
        c.beginPath();
        c.arc(W / 2, H / 2 - 6, s.size / 2, 0, Math.PI * 2);
        c.fillStyle = rgba(s.color, s.opa * k);
        c.fill();
        hint(c, "无 LED 控件：用 UIView + 圆角 + 透明度近似，呼吸需应用层动画", W, H);
      }
      function loop(){ render(state); raf = requestAnimationFrame(loop); }
      raf = requestAnimationFrame(loop);
      return { render: render };
    },
    code: function(s){
      var L = [];
      L.push('<span class="cm">/* ArkUI lite 没有 LED 组件，用 UIView 画圆近似 */</span>');
      L.push('UIView *led = <span class="fn">new</span> UIView();');
      L.push('led-&gt;<span class="fn">SetPosition</span>(129, 63);');
      L.push('led-&gt;<span class="fn">SetWidth</span>(<span class="num">' + s.size + '</span>);  led-&gt;<span class="fn">SetHeight</span>(<span class="num">' + s.size + '</span>);');
      L.push('led-&gt;<span class="fn">SetStyle</span>(STYLE_BACKGROUND_COLOR, Color::<span class="fn">GetColorFromRGB</span>(' + rgbArgs(s.color) + ').full);');
      L.push('led-&gt;<span class="fn">SetStyle</span>(STYLE_BORDER_RADIUS, <span class="num">' + (s.size / 2) + '</span>);');
      L.push('led-&gt;<span class="fn">SetOpaScale</span>(<span class="num">' + Math.round(s.opa * 255) + '</span>);');
      return L;
    }
  };

  /* ---------- lv_spinner → 应用层帧动画 ---------- */
  DEMOS.spinner = {
    defaults: { speed: 360, size: 44, lineW: 4, color: "#45a5ff", cw: true },
    controls: [
      { k: "speed", t: "range", label: "转速", api: "无内建 Spinner：用 UIImageAnimator 帧序列或应用层绘制", min: 60, max: 1080, def: 360, unit: " °/s" },
      { k: "size", t: "range", label: "直径", api: "UICircleProgress::SetRadius()", min: 20, max: 80, def: 44, unit: " px" },
      { k: "lineW", t: "range", label: "线宽", api: "STYLE_LINE_WIDTH", min: 2, max: 12, def: 4, unit: " px" },
      { k: "color", t: "color", label: "颜色", api: "STYLE_LINE_COLOR", def: "#45a5ff" },
      { k: "cw", t: "check", label: "顺时针", api: "角度增量方向", def: true, text: "顺时针" }
    ],
    create: function(box, state){
      var v = mk(box, 300, 180), ang = 0, last = performance.now(), raf = 0;
      function render(s){
        var c = v.c, W = v.w, H = v.h;
        screen(c, W, H);
        var cx = W / 2, cy = H / 2 - 6;
        c.lineWidth = s.lineW;
        c.lineCap = "round";
        c.strokeStyle = "rgba(255,255,255,0.12)";
        c.beginPath(); c.arc(cx, cy, s.size / 2, 0, Math.PI * 2); c.stroke();
        c.strokeStyle = s.color;
        c.beginPath();
        c.arc(cx, cy, s.size / 2, ang, ang + Math.PI * 0.55);
        c.stroke();
        hint(c, "无 Spinner 控件：常见做法是 UIImageAnimator 帧序列或应用层自绘", W, H);
      }
      function loop(now){
        var dt = now - last; last = now;
        ang += (state.speed * Math.PI / 180) * dt / 1000 * (state.cw ? 1 : -1);
        render(state);
        raf = requestAnimationFrame(loop);
      }
      raf = requestAnimationFrame(loop);
      return { render: render };
    },
    code: function(s){
      var L = [];
      L.push('<span class="cm">/* 无 lv_spinner 对应；UIImageAnimator 播旋转帧序列是官方做法 */</span>');
      L.push('UIImageAnimatorView *spinner = <span class="fn">new</span> UIImageAnimatorView();');
      L.push('spinner-&gt;<span class="fn">SetPosition</span>(128, 62);');
      L.push('spinner-&gt;<span class="fn">SetWidth</span>(<span class="num">' + s.size + '</span>);  spinner-&gt;<span class="fn">SetHeight</span>(<span class="num">' + s.size + '</span>);');
      L.push('spinner-&gt;<span class="fn">SetImageAnimatorSrc</span>(frames, 12, 16);');
      L.push('spinner-&gt;<span class="fn">Start</span>();');
      return L;
    }
  };

  /* ---------- lv_scale → UIAxis ---------- */
  DEMOS.scale = {
    defaults: { markNum: 5, h: "h", tickLen: 6, color: "#ffffff", labels: false },
    controls: [
      { k: "markNum", t: "range", label: "刻度段数 markNum", api: "UIAxis::SetMarkNum()：默认 5", min: 2, max: 12, def: 5 },
      { k: "h", t: "seg", label: "方向", api: "UIXAxis / UIYAxis", def: "h", opts: [["h", "水平"], ["v", "垂直"]] },
      { k: "tickLen", t: "range", label: "刻度线长", api: "ui_axis.cpp：默认 1px", min: 1, max: 12, def: 6, unit: " px" },
      { k: "color", t: "color", label: "轴线颜色", api: "SetLineColor()：默认白", def: "#ffffff" },
      { k: "labels", t: "check", label: "刻度文字", api: "UIAxis 不绘制刻度文字（缺口）", def: false, text: "尝试显示" }
    ],
    create: function(box, state){
      var v = mk(box, 300, 180);
      function render(s){
        var c = v.c, W = v.w, H = v.h;
        screen(c, W, H);
        c.strokeStyle = s.color;
        c.lineWidth = 1;
        var len = 220;
        if(s.h === "h"){
          var x0 = (W - len) / 2, y = H / 2;
          c.beginPath(); c.moveTo(x0, y + .5); c.lineTo(x0 + len, y + .5); c.stroke();
          for(var i = 0; i <= s.markNum; i++){
            var x = x0 + len * i / s.markNum;
            c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + s.tickLen); c.stroke();
            if(s.labels) txt(c, String(i * 20), x, y + s.tickLen + 12, 10, s.color);
          }
        }else{
          var y0 = (H - len) / 2, xx = W / 2;
          c.beginPath(); c.moveTo(xx + .5, y0); c.lineTo(xx + .5, y0 + len); c.stroke();
          for(var k = 0; k <= s.markNum; k++){
            var yy = y0 + len * k / s.markNum;
            c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx - s.tickLen, yy); c.stroke();
            if(s.labels) txt(c, String(k * 20), xx - s.tickLen - 14, yy, 10, s.color);
          }
        }
        if(s.labels) hint(c, "UIAxis 本身不画文字：这里只是演示「如果应用层自己补」", W, H);
        else hint(c, "UIAxis：只有轴线与刻度线，没有刻度数字 / 标签", W, H);
      }
      return { render: render };
    },
    code: function(s){
      var L = [];
      L.push('<span class="cm">/* UIAxis 是 UIViewGroup 派生的轴视图，只画线、不画文字 */</span>');
      L.push((s.h === "h" ? "UIXAxis" : "UIYAxis") + " axis;");
      L.push('axis.<span class="fn">SetPosition</span>(40, 90);');
      L.push('axis.<span class="fn">SetWidth</span>(220);  axis.<span class="fn">SetHeight</span>(24);');
      L.push('axis.<span class="fn">SetMarkNum</span>(<span class="num">' + s.markNum + '</span>);');
      L.push('axis.<span class="fn">SetLineColor</span>(Color::<span class="fn">GetColorFromRGB</span>(' + rgbArgs(s.color) + ').full);');
      L.push('<span class="cm">/* 无刻度文字 → 不能完整替代 lv_scale */</span>');
      return L;
    }
  };

  /* ---------- lv_tileview → UISwipeView ---------- */
  DEMOS.tileview = {
    defaults: { page: 0, pages: 3, dir: "h", loop: false, time: 300 },
    controls: [
      { k: "page", t: "range", label: "当前页 page", api: "SetCurrentPage(index, animator)", min: 0, max: 2, def: 0 },
      { k: "pages", t: "range", label: "页数", api: "Add 子 View", min: 2, max: 5, def: 3 },
      { k: "dir", t: "seg", label: "方向", api: "UISwipeView(direction)：默认 HORIZONTAL", def: "h",
        opts: [["h", "水平"], ["v", "垂直"]] },
      { k: "loop", t: "check", label: "循环", api: "SetLoopState(bool)", def: false, text: "开启" },
      { k: "time", t: "range", label: "切页时长", api: "SetAnimatorTime(ms)", min: 100, max: 800, def: 300, unit: " ms" }
    ],
    create: function(box, state){
      var wrap = el("div", "ud-screen");
      var swipe = el("div", "ud-swipe");
      var track = el("div", "ud-swipe__track");
      swipe.appendChild(track);
      wrap.appendChild(swipe);
      var dots = el("div", "ud-dots");
      wrap.appendChild(dots);
      box.appendChild(wrap);
      var cur = 0;
      function render(s){
        track.innerHTML = "";
        for(var i = 0; i < s.pages; i++){
          var p = el("div", "ud-swipe__page", "Page " + (i + 1));
          p.style.background = ["#007dff", "#1f9d66", "#b06bd8", "#e88b2f", "#2f9de8"][i % 5];
          track.appendChild(p);
        }
        track.style.flexDirection = s.dir === "h" ? "row" : "column";
        track.style.transition = "transform " + s.time + "ms cubic-bezier(.2,0,.2,1)";
        track.style.transform = s.dir === "h"
          ? "translateX(" + (-s.page * 260) + "px)"
          : "translateY(" + (-s.page * 140) + "px)";
        dots.innerHTML = "";
        for(var k = 0; k < s.pages; k++){
          dots.appendChild(el("span", "ud-dot" + (k === s.page ? " on" : "")));
        }
      }
      return { render: render };
    },
    code: function(s){
      var L = [];
      L.push('<span class="cm">/* ui_swipe_view.h：单轴分页、带吸附动画；无滚动条 */</span>');
      L.push('UISwipeView *swipe = <span class="fn">new</span> UISwipeView(' + (s.dir === "h" ? "UISwipeView::HORIZONTAL" : "UISwipeView::VERTICAL") + ');');
      L.push('swipe-&gt;<span class="fn">SetPosition</span>(20, 30);');
      L.push('swipe-&gt;<span class="fn">SetWidth</span>(260);  swipe-&gt;<span class="fn">SetHeight</span>(140);');
      L.push('swipe-&gt;<span class="fn">SetAnimatorTime</span>(<span class="num">' + s.time + '</span>);');
      if(s.loop) L.push('swipe-&gt;<span class="fn">SetLoopState</span>(true);');
      L.push('swipe-&gt;<span class="fn">Add</span>(page1);  swipe-&gt;<span class="fn">Add</span>(page2);');
      L.push('swipe-&gt;<span class="fn">SetCurrentPage</span>(<span class="num">' + s.page + '</span>, true);');
      return L;
    }
  };

  /* ================= 参数面板 ================= */
  function buildPanel(pdef, state, apply){
    var host = document.getElementById("upanel");
    if(!host || !pdef.controls) return;
    host.className = "grid";
    host.innerHTML = "";
    panelRefs = {};

    pdef.controls.forEach(function(cf){
      var field = el("div", "field" + (cf.wide ? " wide" : ""));
      var label = el("label");
      label.appendChild(document.createTextNode(cf.label));
      var out = null;
      if(cf.t === "range"){
        out = el("output", null, String(state[cf.k]) + (cf.unit || ""));
        label.appendChild(out);
      }
      if(cf.api) label.appendChild(el("span", "api", cf.api));
      field.appendChild(label);

      if(cf.t === "range"){
        var inp = el("input");
        inp.type = "range";
        inp.min = cf.min; inp.max = cf.max;
        inp.step = cf.step || 1;
        inp.value = state[cf.k];
        inp.addEventListener("input", function(){
          state[cf.k] = Number(inp.value);
          if(out) out.textContent = state[cf.k] + (cf.unit || "");
          apply();
        });
        field.appendChild(inp);
        panelRefs[cf.k] = { input: inp, out: out, unit: cf.unit || "" };
      }else if(cf.t === "color"){
        var ci = el("input");
        ci.type = "color";
        ci.value = state[cf.k];
        ci.addEventListener("input", function(){ state[cf.k] = ci.value; apply(); });
        field.appendChild(ci);
      }else if(cf.t === "text"){
        var ti = el("input");
        ti.type = "text";
        ti.value = state[cf.k];
        ti.addEventListener("input", function(){ state[cf.k] = ti.value; apply(); });
        field.appendChild(ti);
      }else if(cf.t === "check"){
        var wrapc = el("div", "check");
        var cb = el("input");
        cb.type = "checkbox";
        cb.checked = !!state[cf.k];
        cb.addEventListener("change", function(){ state[cf.k] = cb.checked; apply(); });
        wrapc.appendChild(cb);
        wrapc.appendChild(el("span", null, cf.text || cf.label));
        field.appendChild(wrapc);
      }else if(cf.t === "seg"){
        var seg = el("div", "seg");
        cf.opts.forEach(function(o){
          var b = el("button", state[cf.k] === o[0] ? "active" : "", o[1]);
          b.type = "button";
          b.addEventListener("click", function(){
            state[cf.k] = o[0];
            Array.prototype.forEach.call(seg.children, function(x){ x.className = ""; });
            b.className = "active";
            apply();
          });
          seg.appendChild(b);
        });
        field.appendChild(seg);
      }
      host.appendChild(field);
    });
  }

  /* ================= 挂载右列演示 ================= */
  var LV2 = { key: key, D: D, api: {}, fitCv: fitCv, svgPic: svgPic, noneCard: noneCard, helpers: {
    el: el, rr: rr, rgba: rgba, screen: screen, txt: txt, hint: hint, mk: mk, bezier: bezier
  }};

  var LEGACY = {
    setValue: "value", set: "on", setSize: "size", setText: "text", setMode: "mode",
    setSeries: "count", setSel: "selected", setAngle: "end", setAlign: "align",
    setPlaying: "playing", setStyle: "on", draw: "which", setWidth: "w"
  };

  LV2.mountRight = function(boxId){
    var box = document.getElementById(boxId || "udemo");
    if(!box || !D) return {};
    if(D.level === "none"){
      box.appendChild(noneCard(D));
      var ucNone = document.getElementById("ucode");
      if(ucNone){
        ucNone.innerHTML = '<span class="cm">/* ArkUI lite 无对应组件，没有组件级代码可生成；' +
          '如确需该能力，只能在 UIView::OnDraw() 中自绘 */</span>';
      }
      LV2.api = {};
      return {};
    }
    var pdef = DEMOS[D.demo] || DEMOS.none;
    var state = JSON.parse(JSON.stringify(pdef.defaults || {}));
    /* 传入的 state 必须是同一份可变对象：demo 内部的闭包与动画帧都引用它 */
    var demo = pdef.create(box, state);
    var hasPanel = !!document.getElementById("upanel");

    function apply(){
      demo.render(state);
      var uc = document.getElementById("ucode");
      if(uc && hasPanel && pdef.code) uc.innerHTML = pdef.code(state).join("\n");
    }

    buildPanel(pdef, state, apply);
    activeApply = apply;
    apply();

    var api = { state: state, update: function(patch){
      for(var k in patch) if(Object.prototype.hasOwnProperty.call(patch, k)) state[k] = patch[k];
      apply();
    }};
    Object.keys(LEGACY).forEach(function(name){
      api[name] = function(v){ state[LEGACY[name]] = v; apply(); };
    });
    api.click = function(which){ if(demo.click) demo.click(which); };
    LV2.api = api;
    return api;
  };

  /* ================= 差异对照 ================= */
  LV2.renderDiff = function(hostId){
    var host = document.getElementById(hostId || "diff");
    if(!D || !host) return;

    var uiName = D.level === "none" ? "无对应组件" : D.ui;
    /* 左列对比对象默认 LVGL；个别页面（如 toast）左列可能是标准 ArkUI */
    var leftName = D.leftLabel || "LVGL";
    host.appendChild(el("h2", null, "差异对照：" + (D.lv || key) + " / " + uiName));
    host.appendChild(el("div", "cmp-diff-sub",
      "判定说明：<b>✓ 双方具备</b>（能力可对齐）&nbsp;·&nbsp; <b>△ 部分对齐</b>（右侧能做但有限制）&nbsp;·&nbsp; <b>✗ 仅 " + leftName + " 具备</b>（ArkUI lite 无此能力）"));

    var nOk = 0, nPart = 0, nNone = 0;
    (D.diffs || []).forEach(function(r){
      if(r[3] === "ok") nOk++;
      else if(r[3] === "part") nPart++;
      else nNone++;
    });
    var chips = el("div", "cmp-chips");
    chips.appendChild(el("span", "cmp-chip ok", "✓ 双方具备 " + nOk + " 项"));
    chips.appendChild(el("span", "cmp-chip part", "△ 部分对齐 " + nPart + " 项"));
    chips.appendChild(el("span", "cmp-chip none", "✗ 仅 " + leftName + " 具备 " + nNone + " 项"));
    host.appendChild(chips);

    var tWrap = el("div", "tbl-wrap");
    var table = el("table", "cmp-table");
    table.innerHTML =
      "<thead><tr><th>能力</th><th>" + leftName + " " + (D.lv || key) + "</th><th>ArkUI lite " +
      uiName + "</th><th>判定</th></tr></thead><tbody></tbody>";
    var tbody = table.querySelector("tbody");
    (D.diffs || []).forEach(function(r){
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
    var ugaps = document.getElementById("ugaps");
    if(ugaps && D && D.gaps && D.gaps.length){
      ugaps.appendChild(el("div", "ui-gaps-t", "ArkUI lite 无法表达"));
      D.gaps.forEach(function(x){ ugaps.appendChild(el("span", "ui-gap", "✗ " + x)); });
    }
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
