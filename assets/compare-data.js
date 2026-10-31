/* ============================================================
   LVGL 组件 → ArkUI lite 能力对照数据
   level: full 能力对齐 / partial 有组件但能力缺失 / none 无对应组件
   demo : 对应 assets/cmp2.js 中 DEMOS 的键（页面存在 #upanel 时自动挂载并生成代码）
   事实来源：foundation/arkui/ui_lite（头文件 + frameworks/components/*.cpp）
             foundation/graphic/graphic_utils_lite/frameworks/style.cpp
             foundation/graphic/graphic_utils_lite/interfaces/innerkits/graphic_config.h
   ============================================================ */
window.LV_COMPARE_DATA = {

  /* ---------------- 基础交互 ---------------- */
  button: {
    lv: "lv_button", ui: "UIButton", level: "partial", demo: "button",
    apis: ["SetStyleForState()", "SetImageSrc()", "EnableButtonAnimation()", "SetState()"],
    note: "三态互斥（RELEASED / PRESSED / INACTIVE）；没有 checked / focused / 阴影，文字需自己 Add(new UILabel)。",
    gaps: ["CHECKED 勾选态", "FOCUSED 焦点描边", "状态叠加", "shadow 投影", "内置文字布局"],
    diffs: [
      ["状态种类", "DEFAULT / PRESSED / CHECKED / FOCUSED / DISABLED，可叠加", "RELEASED / PRESSED / INACTIVE，三态互斥", "part"],
      ["每状态样式", "LV_STATE_xxx 选择器", "SetStyleForState(key, value, state)", "ok"],
      ["焦点态", "焦点描边 + 组内方向键/编码器导航", "仅 SetFocusable + 焦点回调，无焦点描边", "part"],
      ["文字/内容", "按钮即容器，图标与多行文字自动布局", "完全不画文字，需 Add(new UILabel) 手动 SetPosition", "none"],
      ["图片", "任意图片对象，可按状态配多套", "SetImageSrc 仅默认 / 按下两态", "part"],
      ["按下动效", "无内置，需要自己写", "内置缩放 1.0→0.8（150ms）+ 白色蒙层 α25/255", "ok"],
      ["阴影", "shadow_width / offset / opa", "Style 无阴影字段", "none"],
      ["圆角", "任意", "STYLE_BORDER_RADIUS 默认 200，绘制时收敛到短边一半", "part"]
    ],
    points: [
      "<b>状态可叠加：</b>LVGL 勾选 + 聚焦能同时生效；UIButton 只有三个互斥状态，选中/焦点必须应用层自造。",
      "<b>按钮不是容器：</b>UIButton 只画背景与图片，文字必须挂 UILabel 子控件，位置要自己算。",
      "<b>动效互补：</b>UIButton 内置按压缩放（SHRINK_SCALE 0.8 / 150ms）与白色蒙层，lv_button 需要自行实现。"
    ]
  },

  label: {
    lv: "lv_label", ui: "UILabel", level: "partial", demo: "label",
    apis: ["SetText()", "SetLineBreakMode()", "SetFont()", "SetRollSpeed()", "SetText(SpannableString*)"],
    note: "默认 16px 白字、透明底、ELLIPSIS 省略；6 种断行模式；MARQUEE 跑马灯仅在文本宽度 > 控件宽度时滚动，速度 SetRollSpeed(px/s)、默认 35，起始先等 50 帧；富文本需开 ENABLE_SPANNABLE_STRING（默认 0）。",
    gaps: ["LV_SIZE_CONTENT 自动尺寸", "文字渐变/阴影/描边（限 2px）", "行内图片"],
    diffs: [
      ["文本", "任意 UTF-8 + 任意字体", "SetText + SetFont(name, size) / SetFontId", "ok"],
      ["富文本", "span 混排", "SpannableString + Span（需 ENABLE_SPANNABLE_STRING=1，默认关闭）", "part"],
      ["自动尺寸", "LV_SIZE_CONTENT", "需手动 SetWidth / SetHeight", "none"],
      ["长文本", "wrap / dot / scroll / roll", "SetLineBreakMode 6 种 + SetRollSpeed（默认 35px/s）", "part"],
      ["文字渐变/阴影", "支持", "无渐变；描边上限 2px", "none"],
      ["字间距/行高", "可配", "Style lineSpace / letterSpace / lineHeight", "ok"]
    ],
    points: [
      "<b>富文本要开宏：</b>SpannableString 在 <code>ENABLE_SPANNABLE_STRING</code> 关闭（默认 0）时不可用。",
      "<b>自动尺寸缺失：</b>LVGL 设 LV_SIZE_CONTENT 即可，UILabel 需要自己测量后 SetSize。",
      "<b>默认外观：</b>16px 白字 + 省略号断行，深色底上才有对比。"
    ]
  },

  checkbox: {
    lv: "lv_checkbox", ui: "UICheckBox", level: "partial", demo: "checkbox",
    apis: ["SetState()", "SetOnChangeListener()", "SetSelectedStateColor()", "SetImages()"],
    note: "默认绘制内置 56×56 矢量图（ENABLE_DEFAULT_CHECKBOX_IMAGE=1）；两态 + 切换动画，文字要另挂 UILabel。",
    gaps: ["indeterminate 半选", "状态叠加", "内置文字"],
    diffs: [
      ["状态", "CHECKED / UNCHECKED + DISABLED 叠加", "SELECTED / UNSELECTED（SetState）", "part"],
      ["半选", "支持", "无", "none"],
      ["文字", "可内置 label", "需自挂 UILabel", "none"],
      ["外观", "任意图片或符号", "默认矢量勾选框（bw=22·min/46、勾线宽 bw/22、圆角 4×线宽）", "ok"],
      ["切换动画", "无内置", "内置 200ms，Bezier(0.33,0)-(0.67,1)", "ok"],
      ["选中色", "样式选择器", "SetSelectedStateColor()，默认 #1f71ff", "ok"]
    ],
    points: [
      "<b>右侧多一个能力：</b>UICheckBox 自带 200ms 勾选动画，lv_checkbox 需要自己加。",
      "<b>右侧少的能力：</b>半选状态、检查态与禁用态叠加都无法表达。",
      "<b>默认不画图：</b>关闭 ENABLE_DEFAULT_CHECKBOX_IMAGE 后只能靠 SetImages 传图。"
    ]
  },

  switch: {
    lv: "lv_switch", ui: "UIToggleButton", level: "partial", demo: "toggle",
    apis: ["SetState()", "GetState()", "EnableRtl()"],
    note: "纯矢量自绘：32×23 圆角矩形（圆角 11）+ 白圆滑块（半径 9），选中色 #1f71ff，无图片接口。",
    gaps: ["轨道/滑块独立样式", "禁用/按下叠加态", "自定义过渡曲线"],
    diffs: [
      ["开关", "lv_switch", "UIToggleButton", "ok"],
      ["状态", "ON / OFF + 每状态独立样式", "SetState(bool) 两态", "part"],
      ["外观", "轨道与滑块分别设样式/图片", "矢量自绘固定几何：32×23、圆角 11、滑块半径 9", "none"],
      ["颜色", "轨道/滑块任意色", "选中 #1f71ff，未选中白色 α97", "part"],
      ["动画", "可配过渡曲线", "内置 150ms，Bezier(0.2,0)-(0.2,1)", "part"],
      ["尺寸", "自适应 + 可拉伸", "按短边等比缩放（DEFAULT_HOT 基准）", "part"]
    ],
    points: [
      "<b>实现方式不同：</b>LVGL 分开画轨道和滑块并可分别上样式；UIToggleButton 是固定几何的矢量自绘。",
      "<b>因此右侧无法做：</b>轨道颜色独立配置、滑块阴影、按下/禁用叠加态、自定义贝塞尔曲线。",
      "<b>反向优势：</b>矢量绘制不依赖图片资源，任意分辨率都清晰。"
    ]
  },

  slider: {
    lv: "lv_slider", ui: "UISlider", level: "partial", demo: "slider",
    apis: ["SetRange()", "SetValue()", "SetKnobWidth()", "SetKnobColor()", "SetSliderColor()"],
    note: "只支持单值拖动；knobWidth 默认 0（不画滑块），轨道默认黑底白填充，支持四方向与旋转编码器。",
    gaps: ["双滑块与区间选择", "刻度与数值标签", "数值过渡动画"],
    diffs: [
      ["范围/值", "任意 min / max，可反向", "SetRange / SetValue", "ok"],
      ["双滑块", "支持 range 模式", "无", "none"],
      ["刻度/标签", "支持 ticks + 文本", "无", "none"],
      ["外观", "轨道/滑块/图片", "SetSliderColor + SetKnobColor / SetKnobImage / SetKnobRadius", "ok"],
      ["默认外观", "主题色轨道 + 圆形 knob", "轨道取 backgroundStyle（默认黑）、填充取 foregroundStyle（默认白）；knob 默认宽 0 不绘制", "part"],
      ["数值动画", "可配 transition", "无（拖动即时跟随）", "none"],
      ["方向", "水平/垂直 + RTL", "水平/垂直（SetDirection）+ SetRotateFactor 编码器", "ok"]
    ],
    points: [
      "<b>右侧只能单值：</b>LVGL 可拖两个滑块取区间，UISlider 只有一个 knob。",
      "<b>默认看不到滑块：</b>knobWidth_ 默认为 0，必须显式 SetKnobWidth 才会绘制圆形滑块。",
      "<b>外观可对齐：</b>轨道与滑块颜色、圆角、图片两边都能配。"
    ]
  },

  bar: {
    lv: "lv_bar", ui: "UIBoxProgress", level: "partial", demo: "progress",
    apis: ["SetValue()", "SetRange()", "SetDirection()", "SetBackgroundStyle()", "SetForegroundStyle()"],
    note: "只有单向填充（SetDirection 只能整体翻转方向）；底槽默认黑、前景默认白（style.cpp brightStyle_），没有起点值 / 反向填充、没有数值过渡动画，也没有可拖动的指示器。",
    gaps: ["SYMMETRICAL / RANGE 模式", "起点值与反向填充", "数值过渡动画", "可拖动指示器"],
    diffs: [
      ["进度模式", "NORMAL / SYMMETRICAL / RANGE", "仅单向填充", "none"],
      ["起点/方向", "start_value + 反向填充", "SetDirection 只能改方向，无起点值", "part"],
      ["数值动画", "可配 transition", "无", "none"],
      ["指示器", "可拖动 indicator", "无", "none"],
      ["样式", "底槽/填充独立样式 + 渐变", "SetBackgroundStyle / SetForegroundStyle（默认黑底 / 白条）", "ok"],
      ["圆角", "任意", "CAP_ROUND 时圆角=(厚度+1)/2，其余情况直角", "part"]
    ],
    points: [
      "<b>最明显的缺口：</b>对称进度与区间进度在 UI_Lite 无法表达。",
      "<b>默认不是蓝色：</b>前景取 brightStyle_ 的白色底，0x45A5FF 只是 lineColor，不填充。",
      "<b>基础能力可用：</b>底槽、填充色、方向、端帽圆角都能配置。"
    ]
  },

  textarea: {
    lv: "lv_textarea", ui: "UIEditText", level: "partial", demo: "edittext",
    apis: ["SetText()", "SetPlaceholder()", "SetMaxLength()", "SetInputType()", "SetOnChangeListener()"],
    note: "严格单行输入：透明底 + 白边 2px + 圆角 5，光标白 2px、闪烁 650ms；仅 TEXT / PASSWORD 两种类型。",
    gaps: ["多行编辑与滚动", "选中 / 复制粘贴", "数字键盘与输入过滤", "占位符富样式"],
    diffs: [
      ["输入", "多行文本 + 光标", "UIEditText 单行（无换行、无多行滚动）", "part"],
      ["占位符", "支持", "SetPlaceholder()，超长省略号", "ok"],
      ["长度限制", "可配", "SetMaxLength()，上限 4096", "ok"],
      ["输入类型", "文本/数字/密码/自定义", "SetInputType() 仅 TEXT_TYPE / PASSWORD_TYPE", "part"],
      ["选中/剪贴板", "完整支持", "未实现", "none"],
      ["光标样式", "可配", "白色 2px，650ms 闪烁，仅焦点态绘制", "part"]
    ],
    points: [
      "<b>右侧可用：</b>占位符、长度上限、文本/密码类型与光标闪烁都具备。",
      "<b>右侧缺失：</b>多行（UIEditText 根本没有多行模式）、选区、复制粘贴、数字键盘。",
      "<b>外观固定：</b>边框 2px 白、圆角 5 都是源码常量，没有公开样式接口。"
    ]
  },

  /* ---------------- 列表 / 容器 ---------------- */
  list: {
    lv: "lv_list", ui: "UIList", level: "partial", demo: "list",
    apis: ["SetAdapter()", "SetLoopState()", "SetSelectPosition()", "SetYScrollBarVisible()"],
    note: "只是滚动容器：item 高度由子 View 决定，滚动条默认隐藏，选中态没有任何默认视觉。",
    gaps: ["内置按钮/文本/分组项", "默认选中高亮", "增删动画"],
    diffs: [
      ["容器", "lv_list + 任意子对象", "UIList + AbstractAdapter", "ok"],
      ["内置项类型", "按钮/文本/分组", "需自建子控件与 Adapter", "none"],
      ["滚动/回弹", "支持", "支持（AbstractScroll）", "ok"],
      ["增删动画", "支持", "无", "none"],
      ["滚动条", "可配", "SetYScrollBarVisible，默认隐藏；底 #7f7f7f α128、拇指白 α168", "ok"],
      ["选中态", "LV_STATE_CHECKED 高亮", "无默认视觉，只能 OnItemSelected 里自绘", "none"]
    ],
    points: [
      "<b>左侧开箱即用：</b>lv_list_add_button 一行就能加一个可点击项。",
      "<b>右侧要自己写：</b>Adapter、子控件布局、选中高亮都需要实现。",
      "<b>item 高度由子 View 决定：</b>UIList 不提供统一行高接口。"
    ]
  },

  object: {
    lv: "lv_obj", ui: "UIView", level: "full", demo: "view",
    apis: ["SetPosition()", "SetSize()", "SetStyle()", "Add()", "Rotate()", "Scale()"],
    note: "基础对象能力基本对齐：位置、尺寸、子控件、旋转缩放；差异在样式系统与布局宏。",
    gaps: ["flex / grid 布局（需开宏）", "任意样式属性", "事件冒泡细节"],
    diffs: [
      ["基础对象", "lv_obj", "UIView", "ok"],
      ["定位/尺寸", "像素 / 百分比 / 内容", "SetPosition / SetSize + 百分比接口", "part"],
      ["子对象", "Add / Remove", "Add / Remove", "ok"],
      ["布局", "flex / grid", "FlexLayout / GridLayout（需开宏）", "part"],
      ["样式", "任意属性 + 状态选择器", "Style 固定字段集合（21 个 key）", "part"],
      ["变换", "transform 旋转/缩放", "Rotate(angle, pivot) / Scale(factor, pivot)", "ok"]
    ],
    points: [
      "<b>对齐度最高的一对：</b>两边都是所有控件的基类，位置/尺寸/子控件一致。",
      "<b>差异集中在样式：</b>LVGL 可按状态设任意属性，UIView 的 Style 字段是固定的。"
    ]
  },

  /* ---------------- 图形 / 图片 ---------------- */
  image: {
    lv: "lv_image", ui: "UIImageView", level: "partial", demo: "image",
    apis: ["SetSrc()", "SetResizeMode()", "SetBlurLevel()", "SetTransformAlgorithm()", "Rotate()", "Scale()"],
    note: "6 种 resizeMode（默认 NONE）；旋转/缩放继承 UIView::Rotate/Scale；GIF 需 ENABLE_GIF=1（默认 0）。",
    gaps: ["九宫格 / 三段拉伸", "图片对象复用", "GIF 默认关闭"],
    diffs: [
      ["载入", "任意图片源", "SetSrc(path) / SetSrc(ImageInfo*)", "ok"],
      ["缩放模式", "STRETCH / CONTAIN / COVER", "SetResizeMode：NONE / COVER / CONTAIN / FILL / CENTER / SCALE_DOWN", "ok"],
      ["变换", "旋转/缩放/锚点", "继承 UIView::Rotate / Scale（带 pivot）", "ok"],
      ["九宫格", "支持", "无", "none"],
      ["模糊/边缘", "无", "SetBlurLevel / SetEdgeSmoothRadius / SetTransformAlgorithm", "ok"],
      ["GIF", "支持", "需 ENABLE_GIF=1，默认关闭", "part"]
    ],
    points: [
      "<b>右侧多出的能力：</b>UIImageView 自带模糊、边缘平滑与缩放算法选择。",
      "<b>右侧缺失：</b>九宫格拉伸与图片对象复用。",
      "<b>GIF 默认不可用：</b>需在编译期打开 ENABLE_GIF。"
    ]
  },

  imagebutton: {
    lv: "lv_imagebutton", ui: "UIButton + SetImageSrc", level: "partial", demo: "imagebutton",
    apis: ["SetImageSrc()", "SetStyleForState()"],
    note: "LVGL 六态各一张图：RELEASED / PRESSED / CHECKED_RELEASED / CHECKED_PRESSED / DISABLED / CHECKED_DISABLED；ArkUI lite 仅默认/按下两态图，没有禁用态与选中态图，按下附带 0.8 缩放 + 白色蒙层，图片按原尺寸画在内容区左上角、不缩放不居中。",
    gaps: ["禁用态图源", "选中/勾选态图源", "多状态图叠加"],
    diffs: [
      ["图源数量", "任意状态多套", "默认 / 按下两态", "part"],
      ["禁用态", "支持", "无（INACTIVE 只改背景样式）", "none"],
      ["选中态", "支持", "无", "none"],
      ["缩放动画", "无内置", "内置 0.8 缩放 + α25 蒙层", "ok"],
      ["文字", "可叠加", "需另挂 UILabel", "none"]
    ],
    points: [
      "<b>核心差距：</b>LVGL 能把「禁用图 / 选中图」也配进去，UIButton 只有两张。",
      "<b>反向优势：</b>UIButton 按下时自带缩放与蒙层。"
    ]
  },

  animimg: {
    lv: "lv_animimg", ui: "UIImageAnimatorView", level: "partial", demo: "imageanim",
    apis: ["SetImageAnimatorSrc()", "SetTimeOfUpdate()", "SetRepeatTimes()", "SetReverse()", "SetFillMode()"],
    note: "按预制帧序列播放，默认 16ms/帧、无限循环、fillMode=true；没有变换与运行时插值。",
    gaps: ["缩放/旋转/位移变换", "自定义播放区间", "运行时生成帧"],
    diffs: [
      ["帧源", "任意图片对象数组", "SetImageAnimatorSrc(ImageAnimatorInfo[], n, time)", "ok"],
      ["播放控制", "start / stop + 区间", "Start / Stop / Pause / Resume", "ok"],
      ["循环/反向", "支持", "SetRepeat / SetRepeatTimes / SetReverse", "ok"],
      ["变换", "支持 transform", "无", "none"],
      ["帧率", "按 tick 可变", "SetTimeOfUpdate / SetTimeOfPause", "ok"],
      ["播放事件", "READY / COMPLETED 等", "SetAnimatorStopListener", "part"]
    ],
    points: [
      "<b>右侧能播序列帧：</b>循环、反向、暂停、填充模式、帧间隔都有对应接口。",
      "<b>右侧缺变换：</b>不能边播放边缩放/旋转，也不能在运行时生成帧。"
    ]
  },

  canvas: {
    lv: "lv_canvas", ui: "UICanvas", level: "partial", demo: "canvas",
    apis: ["DrawLine()", "DrawCurve()", "DrawRect()", "DrawCircle()", "DrawPath()", "StrokeText()"],
    note: "线/贝塞尔/矩形/圆/扇形/弧/图片/路径/文字都有；抗锯齿恒定开启，贝塞尔线宽上限 3。",
    gaps: ["图层与混合模式", "图层裁剪栈", "渐变填充"],
    diffs: [
      ["绘制能力", "任意路径/矩形/圆弧/图片/文字", "DrawLine / DrawCurve / DrawRect / DrawCircle / DrawSector / DrawArc / DrawPath / StrokeText", "ok"],
      ["图层", "多图层 + 混合模式", "无独立图层，Save(paint) 只临时保存", "none"],
      ["变换", "旋转/缩放", "无画布级变换（需在 UIView::Rotate 层做）", "none"],
      ["文本", "支持", "StrokeText(text, point, fontStyle, paint) 仅描边文字", "part"],
      ["渐变填充", "bg_grad（线性 / 径向）", "无", "none"],
      ["抗锯齿", "可配", "恒定开启", "part"],
      ["刷新", "invalidate 指定区域", "Clear / Invalidate 同步刷新", "ok"]
    ],
    points: [
      "<b>图元完备：</b>UICanvas 覆盖线、曲线、矩形、圆、扇、弧、图片、路径与描边文字。",
      "<b>限制在图层与线宽：</b>没有混合模式与裁剪栈；贝塞尔线宽最大 3。",
      "<b>复杂图形：</b>可在 UIView::OnDraw 里直接用底层绘制接口自绘。"
    ]
  },

  chart: {
    lv: "lv_chart", ui: "UIChart", level: "partial", demo: "chart",
    apis: ["AddPoints()", "SetLineColor()", "SetFillColor()", "SetMaxDataCount()", "EnableSmooth()", "EnableGradient()"],
    note: "折线（含平滑/渐变填充）与柱状；自带 X/Y 轴轴线与刻度线，但没有刻度文字。",
    gaps: ["刻度文字与轴标签", "多序列叠加样式", "数据更新动画", "图例"],
    diffs: [
      ["图表类型", "折线/柱状/散点等", "UIChartPolyline 折线 + UIChartPillar 柱状", "part"],
      ["数据点", "任意序列", "AddPoints + SetMaxDataCount（上限 512）", "ok"],
      ["坐标轴", "刻度 + 标签 + 网格", "自带 X/Y 轴线与刻度线，无刻度文字", "part"],
      ["平滑曲线", "支持", "EnableSmooth()，默认关闭", "ok"],
      ["渐变填充", "支持", "EnableGradient() + SetGradientOpacity，默认关闭", "ok"],
      ["动画", "支持", "无过渡动画", "none"]
    ],
    points: [
      "<b>右侧够用：</b>折线、柱状、平滑、渐变填充、首尾点样式都能配。",
      "<b>右侧要自绘：</b>坐标轴刻度文字、图例与多序列叠加标签。",
      "<b>上限 512 点：</b>MAX_POINTS_COUNT 是编译期常量。"
    ]
  },

  qrcode: {
    lv: "lv_qrcode", ui: "UIQRCode", level: "partial", demo: "qrcode",
    apis: ["SetQrcodeInfo()", "SetWidth()", "SetHeight()"],
    note: "二维码已具备：模块数 21+4(v−1)，整数倍缩放并居中，无静区；前景/背景色可配。",
    gaps: ["静区（quiet zone）", "内嵌 Logo", "按版本控制容量"],
    diffs: [
      ["二维码", "lv_qrcode", "UIQRCode", "ok"],
      ["内容/颜色", "可配", "SetQrcodeInfo(val, bgColor, qrColor)", "ok"],
      ["纠错级别", "编码器内部固定，无公开接口", "无", "ok"],
      ["静区 quiet zone", "lv_qrcode_set_quiet_zone()", "无（模块整数倍缩放后居中）", "none"],
      ["内嵌 Logo", "可叠放 lv_image 子对象", "需叠放子控件", "part"],
      ["容量", "按版本", "字符串上限 2048 字节", "part"]
    ],
    points: [
      "<b>核心能力对齐：</b>都能把字符串渲染成二维码并配前景/背景色。",
      "<b>都没有静区与 Logo：</b>二维码周围需要自己留白，否则贴边影响识别。",
      "<b>渲染规则：</b>模块整数倍缩放 + 居中，因此实际边长会被取整，不会模糊插值。"
    ]
  },

  arclabel: {
    lv: "lv_arclabel", ui: "UIArcLabel", level: "partial", demo: "arclabel",
    apis: ["SetText()", "SetArcTextRadius()", "SetArcTextAngle()", "SetArcTextOrientation()", "SetRollSpeed()"],
    note: "弧形文字已具备；radius 默认 0（不绘制），起止角默认 0/0，必须显式设置。",
    gaps: ["逐字独立样式/间距", "任意方向与镜像", "文字渐变"],
    diffs: [
      ["弧形文字", "lv_arclabel", "UIArcLabel", "ok"],
      ["半径/角度", "可配", "SetArcTextRadius / SetArcTextAngle(start, end)", "ok"],
      ["方向", "上/下弧 + 镜像", "SetArcTextOrientation(INSIDE / OUTSIDE)", "part"],
      ["逐字样式", "span 级独立样式", "以整体 Style 为主", "part"],
      ["滚动", "可配", "SetRollCount / SetRollSpeed（默认 10°/s）", "ok"],
      ["默认可见性", "立即可见", "radius 默认 0，不设置半径不会绘制", "part"]
    ],
    points: [
      "<b>对齐度高：</b>半径、起止角度、朝向、滚动都有对应接口。",
      "<b>必须显式设半径：</b>radius 默认 0，忘记 SetArcTextRadius 就什么都看不到。",
      "<b>差异：</b>LVGL 能给每个字符单独上样式，UIArcLabel 以整体样式为主。"
    ]
  },

  /* ---------------- 选择 / 弹层 ---------------- */
  roller: {
    lv: "lv_roller", ui: "UIPicker", level: "partial", demo: "picker",
    apis: ["SetSelected()", "SetTextColor()", "SetLoopState()", "SetItemHeight()", "SetTextFormatter()"],
    note: "单列滚轮：高亮只改字号（18）与文字色（#45a5ff），没有高亮背景条；itemHeight 必须显式设置。",
    gaps: ["高亮背景条", "可见项数的显式配置", "选项自定义绘制"],
    diffs: [
      ["滚轮", "lv_roller", "UIPicker", "ok"],
      ["选项", "字符串数组", "SetValues(const char*[], count) / SetValues(start, end)", "ok"],
      ["高亮样式", "高亮背景 + 文字样式", "仅高亮字号 18 与文字色 #45a5ff，无背景条", "part"],
      ["循环", "支持", "SetLoopState(bool)，默认 false", "ok"],
      ["选中回调", "支持", "RegisterSelectedListener / SetSelectView", "ok"],
      ["物理参数", "无", "SetReboundSize / SetAutoAlignTime / SetDragACCLevel 等可调", "ok"]
    ],
    points: [
      "<b>右侧可用：</b>选中项、循环滚动、字体/颜色、文本格式化、回弹与吸附参数。",
      "<b>注意默认值：</b>SetItemHeight 默认 0，不设置会导致所有选项挤在一起；loop 默认关闭。",
      "<b>高亮靠文字：</b>没有高亮背景条，与 lv_roller 的高亮栏视觉不同。"
    ]
  },

  dropdown: {
    lv: "lv_dropdown", ui: "无", level: "none", demo: "none",
    alt: "UIButton + UIList 手动拼装：按钮负责展开，列表放在根节点或弹层里，选中后自己回填文字。",
    gaps: ["展开/收起与层级", "选项列表与滚动", "选中回填与事件"],
    diffs: [
      ["组件", "lv_dropdown", "无对应组件", "none"],
      ["展开列表", "内置", "需 Button + List 自拼", "none"],
      ["选中回填", "内置", "需自己维护", "none"],
      ["键盘操作", "支持", "无", "none"]
    ]
  },

  msgbox: {
    lv: "lv_msgbox", ui: "UIDialog", level: "partial", demo: "dialog",
    apis: ["SetTitle()", "SetText()", "SetButton()", "SetButtonColor()", "EnableAutoCancel()"],
    note: "白底、无圆角、无阴影、无遮罩变暗；标题 20px / 正文 16px，最多三个按钮且等宽平分。",
    gaps: ["自定义内容区", "打开/关闭动画", "遮罩样式与变暗"],
    diffs: [
      ["标题/正文", "可配", "SetTitle / SetText（20px / 16px，黑 α230）", "ok"],
      ["按钮", "任意数量/自定义", "SetButton(LEFT / MID / RIGHT)，最多 3 个，等宽平分", "part"],
      ["自定义内容", "支持", "无（固定标题+正文模板）", "none"],
      ["动画", "支持", "无", "none"],
      ["模态遮罩", "可配", "无半透明遮罩变暗；EnableAutoCancel 默认 false", "none"],
      ["外观", "可圆角/阴影", "白底直角、无阴影（Style 无阴影字段）", "part"]
    ],
    points: [
      "<b>右侧是固定模板：</b>标题、正文、最多三个等宽按钮，布局不可改。",
      "<b>没有遮罩变暗：</b>点窗外关闭要显式 EnableAutoCancel(true)，且背景不会变暗。",
      "<b>左侧更灵活：</b>msgbox 可以塞任意子控件（输入框、列表、图片）。"
    ]
  },

  menu: {
    lv: "lv_menu", ui: "无", level: "none", demo: "none",
    alt: "UIButton + UIList + 自建弹层容器；子菜单层级、对齐翻转都要自己实现。",
    gaps: ["弹出层与页面/根节点", "子菜单与层级", "对齐与自动翻转"],
    diffs: [
      ["组件", "lv_menu", "无对应组件", "none"],
      ["弹出层", "内置 root/page", "需自建", "none"],
      ["子菜单", "支持", "无", "none"],
      ["键盘/编码器", "支持", "无", "none"]
    ]
  },

  tabview: {
    lv: "lv_tabview", ui: "无", level: "none", demo: "none",
    alt: "UISwipeView 负责翻页 + UIToggleButton 做标签栏，两者联动需要自己写。",
    gaps: ["标签栏与内容联动", "标签样式与滚动", "切换动画曲线"],
    diffs: [
      ["组件", "lv_tabview", "无对应组件", "none"],
      ["标签栏", "内置", "需 ToggleButton 组合", "none"],
      ["页面容器", "内置换页", "UISwipeView 可近似", "part"],
      ["切换动画", "支持", "UISwipeView 滑动 + SetAnimatorTime", "part"]
    ]
  },

  tileview: {
    lv: "lv_tileview", ui: "无", level: "none", demo: "none",
    alt: "UISwipeView 只有单轴分页；二维磁贴（行列）与斜向切换没有对应实现。",
    gaps: ["二维磁贴与行列", "斜向切换", "磁贴间独立滚动"],
    diffs: [
      ["组件", "lv_tileview", "无对应组件", "none"],
      ["二维磁贴", "行列 (x, y)", "无", "none"],
      ["斜向切换", "支持", "无", "none"],
      ["单轴分页", "支持", "UISwipeView 只能单轴近似", "part"],
      ["循环", "支持", "UISwipeView::SetLoopState", "part"]
    ]
  },

  win: {
    lv: "lv_win", ui: "无", level: "none", demo: "none",
    alt: "UIViewGroup 只能当容器；标题栏、关闭按钮、拖拽与层级都要自绘实现。",
    gaps: ["标题栏与关闭按钮", "窗口层级与拖拽", "内容区裁剪"],
    diffs: [
      ["组件", "lv_win", "无对应组件", "none"],
      ["标题栏", "内置", "需自绘", "none"],
      ["拖拽/层级", "支持", "无", "none"],
      ["内容裁剪", "支持", "UIViewGroup 可裁剪", "part"]
    ]
  },

  calendar: {
    lv: "lv_calendar", ui: "无", level: "none", demo: "none",
    alt: "UIPicker / UIDigitalClock 只能选值或显示时间，没有月历网格与日期选择。",
    gaps: ["月历网格", "日期范围/高亮日期", "月份切换与事件"],
    diffs: [
      ["组件", "lv_calendar", "无对应组件", "none"],
      ["日期网格", "自动生成", "无", "none"],
      ["头/箭头", "可配", "无", "none"],
      ["高亮日期", "支持", "无", "none"]
    ]
  },

  keyboard: {
    lv: "lv_keyboard", ui: "无", level: "none", demo: "none",
    alt: "没有软键盘控件；按键需用 UIButton 自绘并自己维护布局、高亮与焦点联动。",
    gaps: ["键盘布局与映射", "按键高亮/长按", "输入焦点联动"],
    diffs: [
      ["组件", "lv_keyboard", "无对应组件", "none"],
      ["按键布局", "内置多布局", "需自绘", "none"],
      ["长按/高亮", "支持", "UIRepeatButton 可做长按连发", "part"],
      ["焦点联动", "与 textarea 联动", "需自己做", "none"]
    ]
  },

  spinbox: {
    lv: "lv_spinbox", ui: "无", level: "none", demo: "none",
    alt: "两个 UIButton + UILabel 组合；长按连发可用 UIRepeatButton 近似，格式化与循环要自己写。",
    gaps: ["步进值与循环", "长按连续步进", "数值格式化"],
    diffs: [
      ["组件", "lv_spinbox", "无对应组件", "none"],
      ["步进按钮", "内置", "需组合", "none"],
      ["长按连发", "支持", "UIRepeatButton 可近似", "part"],
      ["数值格式化", "支持", "需自己做", "none"]
    ]
  },

  buttonmatrix: {
    lv: "lv_buttonmatrix", ui: "无", level: "none", demo: "none",
    alt: "多个 UIButton 手动 SetPosition 排成网格；矩阵比例、映射表、行列样式都没有。",
    gaps: ["矩阵布局与映射表", "按钮宽高比例", "行列级样式"],
    diffs: [
      ["组件", "lv_buttonmatrix", "无对应组件", "none"],
      ["布局", "行列 + 比例自动排版", "需手动 SetPosition", "none"],
      ["映射表", "文本/控制符映射", "无", "none"],
      ["样式", "按键/行列独立样式", "仅单按钮样式", "part"]
    ]
  },

  table: {
    lv: "lv_table", ui: "无", level: "none", demo: "none",
    alt: "UIViewGroup + UILabel 手工排布；行列尺寸、单元格合并、双向滚动都要自己实现。",
    gaps: ["单元格合并", "行列尺寸与双向滚动", "单元格样式复用"],
    diffs: [
      ["组件", "lv_table", "无对应组件", "none"],
      ["网格", "行列自动排布", "需手动布局", "none"],
      ["合并单元格", "支持", "无", "none"],
      ["滚动", "双向", "UIList 单方向", "part"]
    ]
  },

  /* ---------------- 其它图形 ---------------- */
  arc: {
    lv: "lv_arc", ui: "无", level: "none", demo: "none",
    alt: "UICircleProgress 只能显示只读圆环进度，不能拖动改值，也没有背景弧/指示弧分离与对称模式。",
    gaps: ["弧形拖拽调节", "背景弧/指示弧分离样式", "对称/反向模式", "弧端旋钮"],
    diffs: [
      ["组件", "lv_arc", "无对应组件", "none"],
      ["拖拽调值", "支持", "无", "none"],
      ["弧角范围", "任意起止角 + 背景弧", "无", "none"],
      ["外观", "弧宽/圆角/渐变/阴影", "无", "none"],
      ["事件", "VALUE_CHANGED", "无", "none"]
    ]
  },

  scale: {
    lv: "lv_scale", ui: "无", level: "none", demo: "none",
    alt: "UIAxis 只是 UIChart 的轴，只有轴线与刻度线、没有刻度文字，也没有环形刻度与指针联动。",
    gaps: ["刻度文字与标签", "环形/扇区刻度", "指针联动"],
    diffs: [
      ["组件", "lv_scale", "无对应组件", "none"],
      ["刻度线", "自动排布", "无", "none"],
      ["刻度文字", "支持", "无", "none"],
      ["环形/扇区刻度", "支持", "无", "none"],
      ["指针联动", "支持", "无", "none"]
    ]
  },

  line: {
    lv: "lv_line", ui: "无", level: "none", demo: "none",
    alt: "没有折线控件；只能用 UICanvas 的路径接口逐点连线，虚线、连接样式与自动尺寸都要自写。",
    gaps: ["虚线样式", "圆角连接细节", "自动尺寸"],
    diffs: [
      ["组件", "lv_line", "无对应组件", "none"],
      ["折线绘制", "任意点集", "无（只能 UICanvas 逐点画）", "none"],
      ["虚线", "支持", "无", "none"],
      ["圆角连接", "可配", "无", "none"],
      ["自动尺寸", "按点集计算", "无", "none"]
    ]
  },

  led: {
    lv: "lv_led", ui: "无", level: "none", demo: "none",
    alt: "没有 LED 控件；只能用 UICanvas::DrawCircle 画一个圆点，亮度、闪烁与点阵字符需自绘。",
    gaps: ["点阵字符渲染", "亮度/闪烁", "多字符滚动"],
    diffs: [
      ["组件", "lv_led", "无对应组件", "none"],
      ["圆形指示", "支持", "无（只能自绘圆）", "none"],
      ["亮度", "0~255 可调", "无", "none"],
      ["闪烁 / 点阵字符", "支持", "无", "none"]
    ]
  },

  barcode: {
    lv: "lv_barcode", ui: "无", level: "none", demo: "none",
    alt: "UI_Lite 只有 UIQRCode（二维码），没有一维条码的编码与绘制能力。",
    gaps: ["一维条码绘制", "编码类型（Code128 / EAN 等）", "条码下方文本"],
    diffs: [
      ["组件", "lv_barcode", "无对应组件", "none"],
      ["编码", "多种一维码", "无", "none"],
      ["绘制", "条码 + 文本", "UIQRCode 仅二维矩阵", "none"],
      ["尺寸", "模块宽度可配", "无", "none"]
    ]
  },

  spinner: {
    lv: "lv_spinner", ui: "无", level: "none", demo: "none",
    alt: "没有旋转加载组件；只能用 UICircleProgress 改起止角 + 定时器自己驱动，或播 UIImageAnimator 帧序列。",
    gaps: ["不定长旋转动画", "弧长/速度可配", "中心文字"],
    diffs: [
      ["组件", "lv_spinner", "无对应组件", "none"],
      ["旋转动画", "内置", "无", "none"],
      ["弧长/速度", "可配", "无", "none"],
      ["中心文字", "可配", "无", "none"]
    ]
  },

  span: {
    lv: "lv_span", ui: "UILabel + SpannableString", level: "partial", demo: "span",
    apis: ["SetText(SpannableString*)", "SetForegroundColorSpan()", "SetAbsoluteSizeSpan()", "SetBackgroundColorSpan()"],
    note: "富文本需 ENABLE_SPANNABLE_STRING=1（默认 0）；行内图片与逐字变换缺失。",
    gaps: ["行内图片/图标", "逐字旋转/位移", "任意段落样式"],
    diffs: [
      ["富文本", "lv_span 混排", "SpannableString + Span（需开宏，默认关闭）", "part"],
      ["颜色/字号/背景", "支持", "ForegroundColor / AbsoluteSize / BackgroundColor Span", "ok"],
      ["行内图片", "支持", "无", "none"],
      ["逐字变换", "支持", "无", "none"],
      ["自动换行", "支持", "UILabel 换行", "part"]
    ],
    points: [
      "<b>可对齐的部分：</b>颜色、字号、背景色都能通过 Span 实现。",
      "<b>前提条件：</b>必须在编译期打开 ENABLE_SPANNABLE_STRING，否则 Span 相关接口不生效。",
      "<b>无法对齐：</b>LVGL span 可以在文字中间插图片、逐字旋转，UILabel 做不到。"
    ]
  },

  lottie: {
    lv: "lv_lottie", ui: "无", level: "none", demo: "none",
    alt: "只能用 UIImageAnimator 播放位图序列；JSON 矢量动画引擎不存在。",
    gaps: ["JSON 矢量动画", "路径/蒙版/表达式", "矢量缩放不失真"],
    diffs: [
      ["组件", "lv_lottie", "无对应组件", "none"],
      ["格式", "Lottie JSON 矢量", "无（UIImageAnimator 仅位图帧）", "none"],
      ["缩放", "矢量无损", "位图放大会失真", "none"]
    ]
  },

  toast: {
    leftLabel: "ArkUI standard",
    lv: "promptAction.showToast", ui: "无", level: "none", demo: "none",
    alt: "ArkUI lite 没有 Toast 组件，也没有 overlay 顶层图层、安全区与键盘避让；同样效果只能在 UIView::OnDraw() 里自绘，计时、层级与动画都得自己实现。",
    gaps: ["Toast 组件与自动消失", "底部安全区定位", "淡入淡出 + 位移动画", "顶层 overlay 图层"],
    diffs: [
      ["Toast 组件", "ToastPattern + OverlayManager，duration 到点自动关闭", "无对应组件", "none"],
      ["文案与时长", "message + duration（SHORT 1500 / LONG 10000 ms，也可传具体毫秒）", "无", "none"],
      ["位置", "bottom 支持 vp / 百分比，自动避让安全区与键盘", "无（无安全区 / 键盘避让）", "none"],
      ["动画", "100 ms 透明度 0↔1 + 15 vp 垂直位移，cubic-bezier(0.2, 0, 0.1, 1)", "无", "none"],
      ["层级", "挂在窗口 overlay；showMode 支持 DEFAULT / TOP_MOST / SYSTEM_TOP_MOST", "无 overlay 机制", "none"],
      ["主题样式", "圆角 24 vp、最大宽 400 vp、单行、高度上限为屏高 65%", "无", "none"],
      ["无障碍", "PAGE_OPEN / PAGE_CLOSE 事件自动上报，读屏可播报", "无读屏播报", "none"]
    ],
    points: [
      "<b>标准实现：</b>ace_engine 的 OverlayManager::OpenToastAnimation / PopToast 以 100 ms 时长、cubic-bezier(0.2, 0, 0.1, 1) 曲线做透明度 0↔1 与 15 vp 垂直位移，ToastPattern 负责按 bottom / 安全区 / 键盘位置重算偏移。",
      "<b>标准参数：</b>应用侧只需 promptAction.showToast({ message, duration, bottom, showMode })；duration 默认 -1 由系统取默认值，bottom 支持 vp 与百分比，showMode 决定挂在默认 overlay 还是系统级顶层窗口。",
      "<b>标准样式：</b>主题默认圆角 24 vp、最大宽度 400 vp、单行文本，高度超过屏高 65% 时截断。",
      "<b>lite 现状：</b>既没有 Toast 组件，也没有 overlay 层、安全区 / 键盘避让与无障碍播报；同样效果只能自绘 UIView，并自己实现计时销毁与顶层管理。"
    ]
  },

  flex: {
    lv: "lv_obj + flex", ui: "FlexLayout", level: "partial", demo: "flex",
    apis: ["SetLayoutDirection()", "SetMajorAxisAlign()", "SetSecondaryAxisAlign()", "SetFlexWrap()", "SetAlignContent()", "SetRowGap()", "SetColumnGap()", "UIView::SetFlexGrow()"],
    note: "FlexLayout 基线（GRAPHIC_ENABLE_FLEX_LAYOUT_ENHANCEMENT=0）只有主/交叉轴对齐 + wrap + 方向，无 gap、无 align-content、无 flex-grow/shrink/basis；开启增强宏后补齐 gap（px/百分比）、align-content 五种、以及 UIView 子项的 flex-grow/shrink/basis/min/max/aspect-ratio/align-self/position-type。无 order、无 align-content space-evenly/around。",
    gaps: ["order 顺序重排", "align-content space-around / space-evenly", "基线无 gap / grow / basis（需开宏）"],
    diffs: [
      ["主轴方向", "row / row-reverse / column / column-reverse / wrap 组合", "LAYOUT_HOR / HOR_R / VER / VER_R + SetFlexWrap(NOWRAP/WRAP)", "ok"],
      ["主轴对齐", "start / center / end / between / around / evenly", "SetMajorAxisAlign：START / END / CENTER / EVENLY / AROUND / BETWEEN", "ok"],
      ["交叉轴对齐", "start / center / end / stretch / baseline", "SetSecondaryAxisAlign：START / END / CENTER / STRETCH（无 baseline）", "part"],
      ["换行", "nowrap / wrap / wrap-reverse", "SetFlexWrap(NOWRAP / WRAP)（无 wrap-reverse）", "part"],
      ["多行分布", "start / center / end / between / around / evenly / stretch", "SetAlignContent：START / CENTER / END / STRETCH / BETWEEN（增强宏；无 around / evenly）", "part"],
      ["gap 间距", "row-gap / column-gap 任意", "SetRowGap / SetColumnGap / SetGap（px）+ Percent 版本（增强宏）", "part"],
      ["flex-grow", "任意权重", "UIView::SetFlexGrow(uint16_t)（增强宏）", "part"],
      ["flex-shrink / basis", "支持", "SetFlexShrink / SetFlexBasis（增强宏）", "part"],
      ["min/max 约束", "min-width/max-width 等", "SetMinWidth / SetMaxWidth / SetMinHeight / SetMaxHeight（增强宏）", "part"],
      ["aspect-ratio", "支持", "SetAspectRatio(uint16_t)（增强宏）", "part"],
      ["align-self", "每项覆盖父级对齐", "SetAlignSelf（增强宏，仅 AUTO/STRETCH 两值）", "part"],
      ["position", "static / relative / absolute / sticky", "SetPositionType：STATIC / RELATIVE / ABSOLUTE（增强宏；无 sticky）", "part"],
      ["order", "整数重排", "无", "none"],
      ["JS 声明式", "—", "ace_engine_lite div 组件：flex-direction / justify-content / align-items / flex-wrap / align-content / gap", "ok"]
    ],
    points: [
      "<b>基线 vs 增强：</b>默认构建（<code>GRAPHIC_ENABLE_FLEX_LAYOUT_ENHANCEMENT=0</code>）只有对齐与换行，gap / grow / basis / align-content 都没有；要打开 <code>ui_lite_enable_flex_layout_config</code> 才补齐，这是产品裁剪时最容易踩的坑。",
      "<b>无 order：</b>LVGL 靠 flex_order 任意重排子项，FlexLayout 只能按 DOM 顺序排，要换序得改 Add() 顺序。",
      "<b>align-content 缺两档：</b>即使开宏也只有 start/center/end/stretch/between，没有 around/evenly。",
      "<b>JS 层等价：</b>ace_engine_lite 的 div 组件把这些 C++ 能力映射成 flex-direction / justify-content / align-items / flex-wrap / align-content / gap 样式，是实际应用开发的入口。"
    ]
  },

  grid: {
    lv: "lv_obj + grid", ui: "GridLayout", level: "partial", demo: "grid",
    apis: ["SetRows()", "SetCols()", "SetLayoutDirection()", "LayoutChildren()"],
    note: "GridLayout 只做等分网格：SetRows/SetCols 把容器均分，每个单元格居中摆放子项（含 margin）。无 fr/px 列模板、无 gap、无 colspan/rowspan、无 cell align、无 grid-area；当 rows*cols < 子项数时直接 RemoveAll() 不布局。",
    gaps: ["fr / px 列行模板", "gap 间距", "colspan / rowspan 跨格", "单元格对齐", "grid-area 命名区域"],
    diffs: [
      ["行列定义", "lv_grid_dsc_array：fr / px / content 模板", "SetRows(n) / SetCols(n)：纯等分", "none"],
      ["单元格跨度", "lv_obj_set_grid_cell(x, col, col_span, row, row_span)", "无，每格一个子项", "none"],
      ["间距", "pad_row / pad_column", "无", "none"],
      ["单元格对齐", "STRETCH / START / CENTER / END", "固定居中（按子项 margin 居中）", "part"],
      ["方向", "按行 / 按列填充", "SetLayoutDirection(LAYOUT_HOR / VER)", "ok"],
      ["溢出处理", "自动换行 / 隐藏", "rows*cols < 子项数 → RemoveAll() 全部不布局", "none"],
      ["JS 声明式", "—", "ace_engine_lite 无 grid 组件，只能用 div + flex-wrap 模拟", "none"]
    ],
    points: [
      "<b>能力差距最大的一对：</b>GridLayout 是等分网格，LVGL 的 fr/px 模板、跨格、gap 全都没有。",
      "<b>溢出即全空：</b>子项数超过 rows*cols 时直接 RemoveAll()，不会自动加行也不会裁剪，应用层必须自己保证格子够用。",
      "<b>无 grid DSL：</b>ace_engine_lite 也没有 grid 组件，要做网格只能用 div + flex-wrap + 固定子项宽度凑。",
      "<b>仍可覆盖：</b>纯等分的图标墙、九宫格、固定行列的卡片矩阵。"
    ]
  },

  "style-basic": {
    lv: "lv_style_t", ui: "UIView + Style", level: "partial", demo: "stylebasic",
    apis: ["SetStyle(key, value)", "SetOpaScale()", "Rotate()", "Scale()", "SetWidth()", "SetHeight()"],
    note: "Style 是固定字段集合（背景色/背景透明度/圆角/边框色宽透明度/padding/margin/文字/线条/渐变），没有 shadow、没有 outline；transform 不在 Style 里，走 UIView::Rotate/Scale/Translate/Shear 方法。默认 bg=黑、bgOpa=255、borderRadius=0、borderWidth=0、textColor=白、font=16、lineWidth=2。",
    gaps: ["shadow 阴影", "outline 外描边", "背景渐变（需开宏）", "任意自定义样式属性"],
    diffs: [
      ["尺寸", "lv_style_set_size / width / height", "SetWidth / SetHeight（不在 Style 里）", "ok"],
      ["背景色", "bg_color + bg_opa", "STYLE_BACKGROUND_COLOR + STYLE_BACKGROUND_OPA（默认黑 / OPAQUE）", "ok"],
      ["圆角", "radius 任意", "STYLE_BORDER_RADIUS（默认 0）", "ok"],
      ["边框", "border_width / color / opa / side", "STYLE_BORDER_WIDTH / COLOR / OPA（无 side，四边同款）", "part"],
      ["内边距", "pad_left/right/top/bottom/all", "STYLE_PADDING_LEFT/RIGHT/TOP/BOTTOM", "ok"],
      ["整体透明度", "opa", "SetOpaScale(0~255)（独立于 bgOpa）", "ok"],
      ["阴影", "shadow_width / color / offset / opa", "无", "none"],
      ["outline", "outline_width / color / pad / opa", "无", "none"],
      ["背景渐变", "linear / radial 任意", "STYLE_GRADIENT_BACKGROUND_COLOR / RADIAL（需 GRAPHIC_ENABLE_COMPONENT_GRADIENT_FLAG）", "part"],
      ["旋转", "transform_rotation（0.1°）", "UIView::Rotate(angle, pivot)（int16_t 角度 + 锚点）", "ok"],
      ["缩放", "transform_scale（256=1倍）", "UIView::Scale(Vector2<float>, pivot)", "ok"],
      ["变换锚点", "transform-origin 任意", "pivot 参数显式传入（默认视图中心 0.5,0.5）", "ok"],
      ["样式复用", "lv_style_t 多对象共享 + 本地覆盖", "Style 对象可拷贝赋值，但 UIView 持有自己的 style_ 副本", "part"],
      ["状态选择器", "LV_STATE_xxx 选择器", "无（仅 UIButton 三态用 SetStyleForState）", "part"]
    ],
    points: [
      "<b>最大缺口：</b>Style 没有 shadow 也没有 outline，LVGL 那套阴影 + 外描边在 lite 侧只能自绘或放弃。",
      "<b>transform 不在 Style 里：</b>旋转 / 缩放 / 平移是 UIView 的方法，不通过 SetStyle 设置，与 LVGL 把 transform 放进 style 的模型不同。",
      "<b>渐变要开宏：</b>linear / radial 渐变需要 <code>GRAPHIC_ENABLE_COMPONENT_GRADIENT_FLAG</code>，默认构建没有。",
      "<b>边框无 side：</b>只能四边同款，不能只画某几条边。",
      "<b>样式复用：</b>Style 可以拷贝赋值，但每个 UIView 持有自己的 style_ 副本，不像 lv_style_t 那样多对象共享同一份。"
    ]
  },

  "style-states": {
    lv: "lv_style_t + LV_STATE_*", ui: "UIView + UIButton ButtonState", level: "partial", demo: "stylestates",
    apis: ["SetState()", "SetStyleForState()", "EnableButtonAnimation()", "SetFocusable()", "SetOpaScale()"],
    note: "UIView 本身没有状态机，只有 visible/touchable/draggable/focusable 几个布尔标志；只有 UIButton 有 RELEASED/PRESSED/INACTIVE 三态且互斥，用 SetStyleForState 配每态样式。无 hover 态、无 checked 态、无 focus 描边样式、无 style transition（按下动画是 ButtonAnimator 写死的缩放+蒙层，不是样式过渡）。",
    gaps: ["HOVERED 悬停态", "CHECKED 勾选态", "FOCUSED 焦点描边样式", "状态可叠加", "style transition 样式过渡"],
    diffs: [
      ["状态种类", "DEFAULT/PRESSED/CHECKED/FOCUSED/DISABLED/HOVERED 等，可叠加", "UIView 无状态机；UIButton 仅 RELEASED/PRESSED/INACTIVE 互斥", "part"],
      ["每状态样式", "lv_style_set_*(style, value, LV_STATE_xxx)", "SetStyleForState(key, value, ButtonState)", "part"],
      ["状态叠加", "add_state 可同时多个", "三态互斥，SetState 只取一个", "none"],
      ["悬停 HOVERED", "支持", "无（无鼠标 hover 概念）", "none"],
      ["勾选 CHECKED", "支持 + CHECKED 独立样式", "无（UICheckBox 用 SELECTED/UNSELECTED 两值，非按钮状态机）", "part"],
      ["禁用 DISABLED", "支持 + 独立样式", "UIButton::INACTIVE（仅背景色不同，无 disabled 样式选择器）", "part"],
      ["焦点 FOCUSED", "焦点描边 + 样式选择器", "SetFocusable + OnFocusListener 回调，无焦点描边样式", "part"],
      ["样式过渡", "lv_style_transition_dsc：指定属性 + 时长 + 曲线", "无 style transition；UIButton 按下动画是写死的缩放 0.8/150ms + 白色蒙层 α25", "none"],
      ["过渡属性白名单", "任意 LV_STYLE_*", "无过渡机制", "none"],
      ["过渡曲线", "lv_anim_path_ease_out 等 7 + 自定义", "写死 bezier(0.2,0,0.2,1)，不可配", "none"],
      ["过渡时长", "可配", "按下 150ms / 松开 200ms 写死", "none"],
      ["可点击", "LV_OBJ_FLAG_CLICKABLE", "SetTouchable(bool)", "ok"],
      ["可勾选", "LV_OBJ_FLAG_CHECKABLE", "UICheckBox / UIToggleButton 独立组件，非通用 flag", "part"]
    ],
    points: [
      "<b>状态机只在 UIButton：</b>UIView 本身没有状态概念，要按状态切样式只能用 UIButton 的三态，且互斥不能叠加。",
      "<b>无 hover：</b>lite 设备模型里没有鼠标悬停，整个 UI_Lite 没有 HOVERED 概念。",
      "<b>过渡不是样式：</b>LVGL 的 lv_style_transition_dsc 是声明式样式过渡，lite 侧只有 UIButton 写死的按下缩放 + 蒙层动画，不能指定属性 / 时长 / 曲线。",
      "<b>焦点只能听回调：</b>SetFocusable + OnFocusListener 能拿到焦点变化，但没有焦点描边样式，要画描边得自己在 OnDraw 里加。",
      "<b>CHECKED 走另一条路：</b>勾选态不在 ButtonState 里，要用 UICheckBox（SELECTED/UNSELECTED）或 UIToggleButton，不是给任意按钮加 checked。"
    ]
  },

  animation: {
    lv: "lv_anim", ui: "CSS animation / transition", level: "partial", demo: "animation",
    apis: ["lv_anim_init()", "lv_anim_set_path_cb()", "lv_anim_timeline_add()", "lv_anim_pause()", "lv_obj_set_style_transition()"],
    note: "ArkUI lite 分两档：默认构建只有 CSS animation 极小子集（两帧关键帧 + 7 类属性 + 4 种缓动，无 transition）；开启 FEATURE_TRANSITION_ANIMATOR / FEATURE_PATH_ANIMATOR / FEATURE_ELEMENT_TRANSITION 与页面转场开关后，可用多段关键帧（≤8 段）、scale、offset-path 路径动画、显式 startTransition() 与页面 / 共享元素转场，但这些开关默认全部关闭。LVGL 是通用动画引擎：任意变量 + 逐帧回调 + 时间轴编排 + 反向往复 + 暂停恢复 + 完成回调。",
    gaps: ["并行时间轴 / seek", "反向 / 暂停 / 回调", "skew / 轴心", "缓动仅 4 种", "不能驱动任意变量"],
    diffs: [
      ["动画声明", "lv_anim_t：任意变量 + exec_cb 逐帧写值", "CSS animation 字符串 + 属性白名单；元素过渡另需显式 startTransition()", "part"],
      ["可动画属性", "任意样式与自定义变量", "基线 7 类（translateX/Y、rotate、width、height、opacity、backgroundColor）；增强多段每段最多 5 个并行，含 scale", "part"],
      ["关键帧", "逐帧插值，可自由定义路径", "基线只取首尾两帧；增强按 0%~100% 多段解析，最多 8 段", "part"],
      ["缓动曲线", "7 种内置 + 24 个贝塞尔预设 + 自定义贝塞尔", "linear / ease-in / ease-out / ease-in-out（ease 退化为匀速），增强后仍是这 4 种", "part"],
      ["多属性同步", "多个 anim 并行，或一个 custom_exec_cb 改多属性", "增强每段最多 5 个并行属性；backgroundColor 只能单段整段渐变", "part"],
      ["时间轴编排", "lv_anim_timeline：串行 / 并行 / 按进度 seek", "无时间轴，只能各写一段动画加延迟硬凑", "none"],
      ["反向 / 往复", "reverse_duration / reverse_delay 原生倒放", "无 animation-direction，只能手写反向关键帧", "none"],
      ["暂停 / 恢复", "lv_anim_pause / resume / pause_for", "无 animation-play-state", "none"],
      ["开始/完成回调", "start_cb / completed_cb / deleted_cb", "无（仅 image-animator 有 onstop）", "none"],
      ["状态驱动过渡", "LV_STYLE_TRANSITION 状态变化自动补间", "基线无 transition；增强有 transition-*，但必须显式 startTransition()，不会随状态自动补间", "part"],
      ["变换能力", "scale / skew / pivot 全支持，可组合", "基线仅 translate + rotate；增强加 scale，仍无 skew / transform-origin", "part"],
      ["路径动画", "exec_cb 内按贝塞尔取点（无 offset-path 语法）", "基线无；增强 offset-path / offset-distance 0%~100% / offset-rotate（≤32 采样点）", "part"],
      ["元素进出场", "任意属性动画自行组合", "增强 element-transition：fade / slide 四向 / scale / shared-element", "part"],
      ["页面切换转场", "无内置页面栈与转场", "router.replace({ animation })：fade / scale / slide 四向 / slide-over 四向，默认 300ms、上限 5000ms", "ok"],
      ["共享元素过渡", "需自行计算起止矩形并做两段动画", "增强 shared-element + sharedStartRect / sharedEndRect", "ok"],
      ["帧动画", "lv_animimg 可循环、可反向", "image-animator 循环 / 反向 / 停留，但帧间隔统一", "part"],
      ["驱动方式", "用户 tick + 定时器，默认 33ms（约 30fps）", "16ms 软件任务（约 60fps），无 vsync", "ok"],
      ["可编程性", "可查询运行中的动画并随时删除、改目标值", "无 @ohos.animator / requestAnimationFrame；元素过渡也要显式调用", "none"]
    ],
    points: [
      "<b>先分清两档：</b>默认构建的编译期开关全部关闭，能力仍是两帧关键帧 + 7 类属性 + 4 种缓动；页面上「增强能力开启」演示的是开启 <code>FEATURE_TRANSITION_ANIMATOR</code> 等开关后的行为，不能当作产品默认能力。",
      "<b>增强后补上的：</b>多段关键帧（≤8 段、每段 5 个并行属性）、scale、offset-path 路径动画、显式元素过渡，以及 fade / scale / slide 四向 / slide-over 四向的页面转场与共享元素过渡。",
      "<b>增强后仍在的短板：</b>没有并行时间轴与 seek、没有反向 / 暂停 / 完成回调、没有 skew 与 transform-origin、缓动仍只有 4 种，也不能像 lv_anim 那样驱动任意变量。",
      "<b>仍可覆盖：</b>位移、旋转、透明度、尺寸、背景色这类轻量反馈，image-animator 帧动画，以及增强后的路径动效与页面转场。"
    ]
  }
};
