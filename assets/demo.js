/* ============================================================
   LVGL 组件演示 —— 公共脚本
   零依赖、可直接 file:// 打开（不使用 fetch / 模块导入）
   ============================================================ */

/* ---------- 组件清单（与 examples/widgets 目录一一对应） ----------
   group 按《LVGL_VS_UILITE需求_已刷新.xls》「组件」sheet 分类列排布；
   freq / rate / rank 取自 xls「使用频率」列与「组件优先级」sheet（未收录者缺省）；
   use = xls「美的使用」列为"是"（美的项目在用）；tob = xls「策略」列为 ToB */
var LV_WIDGETS = [
  /* ---- 基础与文本 ---- */
  { id: "label",       name: "Label 标签",       group: "基础与文本", ready: true, desc: "文本显示、长文本、样式",    freq: "极高频", rate: "~93%", rank: 1,  use: true },
  { id: "button",      name: "Button 按钮",      group: "基础与文本", ready: true, desc: "可点击、可勾选、可禁用",    freq: "极高频", rate: "~90%", rank: 2 },
  { id: "imagebutton", name: "Image Button",     group: "基础与文本", ready: true, desc: "四态图片按钮、可勾选",      freq: "低频",   rate: "~12%", rank: 25 },
  { id: "led",         name: "LED 指示灯",       group: "基础与文本", ready: true, desc: "亮度、颜色、呼吸灯",        freq: "低频",   rate: "~10%", rank: 26 },
  { id: "line",        name: "Line 线条",        group: "基础与文本", ready: true, desc: "折线坐标、y 翻转、圆头",    freq: "低频",   rate: "~8%",  rank: 27, use: true, tob: true },
  { id: "arclabel",    name: "Arc Label",        group: "基础与文本", ready: true, desc: "弧形文字、方向、角度",      freq: "低频",   rate: "~3%",  rank: 32 },
  /* ---- 进度与数值 ---- */
  { id: "bar",         name: "Bar 进度条",       group: "进度与数值", ready: true, desc: "单值/区间、动画过渡",       freq: "极高频", rate: "~80%", rank: 5,  use: true, tob: true },
  { id: "slider",      name: "Slider 滑块",      group: "进度与数值", ready: true, desc: "拖动取值、区间滑动",        freq: "极高频", rate: "~82%", rank: 4 },
  { id: "arc",         name: "Arc 圆弧",         group: "进度与数值", ready: true, desc: "角度、范围、拖动",          freq: "高频",   rate: "~42%", rank: 14 },
  { id: "spinner",     name: "Spinner 加载",     group: "进度与数值", ready: true, desc: "循环旋转、速度/方向",       freq: "中频",   rate: "~30%", rank: 17 },
  { id: "scale",       name: "Scale 刻度",       group: "进度与数值", ready: true, desc: "线性/圆形刻度、区间、指针", freq: "中频",   rate: "~18%", rank: 22 },
  /* ---- 选择与开关 ---- */
  { id: "switch",      name: "Switch 开关",      group: "选择与开关", ready: true, desc: "二态切换、动画",            freq: "极高频", rate: "~80%", rank: 6,  use: true, tob: true },
  { id: "checkbox",    name: "Checkbox 复选框",  group: "选择与开关", ready: true, desc: "勾选/取消、禁用、动画",     freq: "高频",   rate: "~70%", rank: 7,  use: true, tob: true },
  { id: "dropdown",    name: "Dropdown 下拉",    group: "选择与开关", ready: true, desc: "展开列表、方向、选项",      freq: "高频",   rate: "~65%", rank: 8,  use: true, tob: true },
  { id: "roller",      name: "Roller 滚轮",      group: "选择与开关", ready: true, desc: "滚轮选择、3D 效果",         freq: "高频",   rate: "~55%", rank: 9,  use: true, tob: true },
  { id: "spinbox",     name: "Spinbox 数字框",   group: "选择与开关", ready: true, desc: "步进、范围、数字格式",      freq: "中频",   rate: "~32%", rank: 16 },
  /* ---- 文本输入 ---- */
  { id: "textarea",    name: "Text Area 输入框", group: "文本输入", ready: true, desc: "输入、密码、单行、长度限制",  freq: "高频",   rate: "~55%", rank: 10 },
  { id: "keyboard",    name: "Keyboard 键盘",    group: "文本输入", ready: true, desc: "QWERTY、多模式、popover",     freq: "高频",   rate: "~50%", rank: 11, tob: true },
  { id: "span",        name: "Span 富文本",      group: "文本输入", ready: true, desc: "富文本、溢出模式、滚动",      freq: "低频",   rate: "~6%",  rank: 28 },
  /* ---- 导航&容器 ---- */
  { id: "list",        name: "List 列表",        group: "导航&容器", ready: true, desc: "列表项、图标、滚动" },
  { id: "menu",        name: "Menu 菜单",        group: "导航&容器", ready: true, desc: "侧栏+子页导航、返回" },
  { id: "msgbox",      name: "Msgbox 弹窗",      group: "导航&容器", ready: true, desc: "标题/正文/按钮、遮罩",       freq: "高频",   rate: "~45%", rank: 13, tob: true },
  { id: "tabview",     name: "Tabview 标签页",   group: "导航&容器", ready: true, desc: "多标签、四向标签栏",         freq: "高频",   rate: "~48%", rank: 12 },
  { id: "tileview",    name: "Tileview 平铺",    group: "导航&容器", ready: true, desc: "2D 平铺、拖动吸附",          freq: "中频",   rate: "~25%", rank: 19 },
  { id: "win",         name: "Win 窗口",         group: "导航&容器", ready: true, desc: "标题栏按钮、拖动、关闭",     use: true, tob: true },
  { id: "calendar",    name: "Calendar 日历",    group: "导航&容器", ready: true, desc: "月视图、今天/高亮、中文",    freq: "中频",   rate: "~16%", rank: 23, tob: true },
  { id: "animimg",     name: "Anim Image",       group: "导航&容器", ready: true, desc: "帧序列动画、循环次数",       freq: "中频",   rate: "~15%", rank: 24 },
  { id: "canvas",      name: "Canvas 画布",      group: "导航&容器", ready: true, desc: "像素画布、绘图层、清屏",     freq: "中频",   rate: "~22%", rank: 20, tob: true },
  /* ---- 数据展示 ---- */
  { id: "image",       name: "Image 图片",       group: "数据展示", ready: true, desc: "旋转、缩放、轴心、重着色",    freq: "极高频", rate: "~85%", rank: 3,  use: true },
  { id: "chart",       name: "Chart 图表",       group: "数据展示", ready: true, desc: "折线/柱状、动态刷新",         freq: "高频",   rate: "~40%", rank: 15 },
  { id: "table",       name: "Table 表格",       group: "数据展示", ready: true, desc: "行列、单元格、选中、列宽",    freq: "中频",   rate: "~28%", rank: 18 },
  { id: "buttonmatrix", name: "Button Matrix",   group: "数据展示", ready: true, desc: "矩阵按键、单选、禁用",        freq: "中频",   rate: "~20%", rank: 21 },
  /* ---- 扩展控件 ---- */
  { id: "qrcode",      name: "QR Code",          group: "扩展控件", ready: true, desc: "二维码图案、静区、配色",      freq: "低频",   rate: "~3.5%", rank: 31 },
  { id: "lottie",      name: "Lottie 动画",      group: "扩展控件", ready: true, desc: "矢量动画、播放速度",          freq: "低频",   rate: "~4%",  rank: 30, tob: true },
  { id: "barcode",     name: "Barcode 条形码",   group: "扩展控件", ready: true, desc: "条码生成、缩放、方向",        tob: true },
  { id: "object",      name: "Base Object 基类", group: "扩展控件", ready: true, desc: "基类对象、样式、拖动" }
];

var LV_LAYOUTS = [
  { id: "flex", name: "Flex 弹性布局", group: "布局", ready: true, desc: "行/列、对齐、换行" },
  { id: "grid", name: "Grid 网格布局", group: "布局", ready: true, desc: "行列模板、跨格" }
];

var LV_STYLES = [
  { id: "style-basic", name: "样式基础", group: "样式", ready: true, desc: "背景/边框/圆角/阴影" },
  { id: "style-states", name: "状态与过渡", group: "样式", ready: true, desc: "默认/按下/勾选/禁用" }
];

/* ---------- 主题 ---------- */
function lvGetTheme() {
  /* 支持 ?theme=dark 直接分享深色版本 */
  var q = location.search.match(/[?&]theme=(dark|light)/);
  if (q) return q[1];
  try {
    return localStorage.getItem("lv-demo-theme") || "light";
  } catch (e) {
    return "light";
  }
}

function lvSetTheme(t) {
  try {
    localStorage.setItem("lv-demo-theme", t);
  } catch (e) {
    /* file:// 下某些浏览器禁用 storage，忽略即可 */
  }
  document.documentElement.setAttribute("data-theme", t);
  var btn = document.getElementById("lv-theme-toggle");
  if (btn) btn.textContent = t === "dark" ? "浅色主题" : "深色主题";
  window.dispatchEvent(new CustomEvent("lv-theme-change", { detail: t }));
}

function lvToggleTheme() {
  lvSetTheme(lvGetTheme() === "dark" ? "light" : "dark");
}

/* ---------- 页面渲染 ---------- */
var LVPage = {
  render: function (opts) {
    lvSetTheme(lvGetTheme());

    var topbar = document.getElementById("topbar");
    if (topbar) {
      topbar.innerHTML =
        '<a class="lv-back" href="../index.html">← 返回画廊</a>' +
        '<div><h1 class="lv-topbar__title">' + opts.title + "</h1>" +
        '<p class="lv-topbar__sub">' + (opts.sub || "") + "</p></div>" +
        '<div class="lv-topbar__spacer"></div>' +
        '<button class="lv-theme-btn" id="lv-theme-toggle" onclick="lvToggleTheme()"></button>';
      var t = lvGetTheme();
      document.getElementById("lv-theme-toggle").textContent =
        t === "dark" ? "浅色主题" : "深色主题";
    }

    var notes = document.getElementById("notes");
    if (notes && opts.notes) {
      notes.innerHTML = opts.notes
        .map(function (n) {
          return (
            '<div class="lv-note"><h3 class="lv-note__title">' + n.title + "</h3><ul>" +
            n.items.map(function (i) { return "<li>" + i + "</li>"; }).join("") +
            "</ul></div>"
          );
        })
        .join("");
    }
  }
};

/* ---------- 画廊首页 ---------- */
function lvRenderGallery() {
  lvSetTheme(lvGetTheme());

  var btn = document.getElementById("lv-theme-toggle");
  if (btn) btn.textContent = lvGetTheme() === "dark" ? "浅色主题" : "深色主题";

  function group(list) {
    var map = {};
    list.forEach(function (w) {
      (map[w.group] = map[w.group] || []).push(w);
    });
    return map;
  }

  function card(w, section) {
    var href = section + "/" + w.id + ".html";
    var cls = "lv-card-item" + (w.ready ? "" : " is-todo");
    var tag = w.ready ? '<span class="lv-badge lv-badge--ok">可演示</span>'
                      : '<span class="lv-badge">待补</span>';
    /* 优先级徽标：取自需求表「使用频率」列与「组件优先级」排名 */
    var prio = "";
    if (w.freq) {
      var pc = w.freq === "极高频" ? "p1" : w.freq === "高频" ? "p2"
             : w.freq === "中频" ? "p3" : "p4";
      var tip = "需求表使用频率：" + w.freq +
        (w.rank ? "；优先级排名 #" + w.rank + "，估算使用率 " + w.rate : "");
      prio = '<span class="lv-prio ' + pc + '" title="' + tip + '">' +
        w.freq + (w.rank ? " · #" + w.rank + " " + w.rate : "") + "</span>";
    }
    /* 项目标注：需求表「美的使用」列为"是"；ToB 标注：「策略」列为 ToB */
    if (w.use) {
      prio += '<span class="lv-prio lv-prio--use" title="需求表「美的使用」：是（美的项目在用）">项目</span>';
    }
    if (w.tob) {
      prio += '<span class="lv-prio lv-prio--tob" title="需求表「策略」：ToB 标准">ToB</span>';
    }
    var inner =
      '<div class="lv-card-item__head"><span class="lv-card-item__name">' + w.name + "</span>" + tag + "</div>" +
      '<p class="lv-card-item__desc">' + (w.desc || "&nbsp;") + "</p>" + prio;
    return w.ready
      ? '<a class="' + cls + '" href="' + href + '">' + inner + "</a>"
      : '<div class="' + cls + '">' + inner + "</div>";
  }

  function sectionBlock(title, list, key) {
    var g = group(list);
    return Object.keys(g)
      .map(function (name) {
        return (
          '<h2 class="lv-group-title">' + title + " · " + name + "</h2>" +
          '<div class="lv-grid">' +
          g[name].map(function (w) { return card(w, key); }).join("") +
          "</div>"
        );
      })
      .join("");
  }

  var host = document.getElementById("gallery");
  if (host) {
    host.innerHTML =
      sectionBlock("组件", LV_WIDGETS, "widgets") +
      sectionBlock("布局", LV_LAYOUTS, "layouts") +
      sectionBlock("样式", LV_STYLES, "styles");
  }
}
