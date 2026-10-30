/* ============================================================
   LVGL 组件 → ArkUI lite 能力对照数据
   level: full 能力对齐 / partial 有组件但能力缺失 / none 无对应组件
   ============================================================ */
window.LV_COMPARE_DATA = {

  /* ---------------- 基础交互 ---------------- */
  button: {
    lv: "lv_button", ui: "UIButton", level: "partial", demo: "button",
    apis: ["SetStyleForState()", "SetImageSrc()", "EnableButtonAnimation()"],
    note: "三态互斥；没有 checked / focused / 阴影，文字需自己挂 UILabel 子控件。",
    gaps: ["CHECKED 勾选态", "FOCUSED 焦点描边", "状态位叠加", "shadow 投影", "子内容自动布局"],
    diffs: [
      ["状态种类", "DEFAULT / PRESSED / CHECKED / FOCUSED / DISABLED，可叠加", "RELEASED / PRESSED / INACTIVE，互斥", "part"],
      ["每状态样式", "LV_STATE_xxx 选择器", "SetStyleForState(key, value, state)", "ok"],
      ["焦点态", "焦点描边 + 组内方向键/编码器导航", "仅 SetFocusable + 焦点回调", "part"],
      ["文字/内容", "按钮即容器，图标与多行文字自动布局", "无内置文字，需 Add(new UILabel) 手动 SetPosition", "none"],
      ["图片", "任意图片对象，可按状态配多套", "SetImageSrc 仅默认 / 按下两态", "part"],
      ["按下动效", "无内置，需要自己写", "内置缩放 0.8 + 白色 25/255 蒙层", "ok"],
      ["阴影", "shadow_width / offset / opa", "Style 无阴影字段", "none"],
      ["独立编译", "LV_USE_BUTTON 宏", "随 libui 整体编译", "none"]
    ],
    points: [
      "<b>状态可叠加：</b>LVGL 勾选 + 聚焦能同时生效；UIButton 只有三个互斥状态，选中/焦点必须应用层自造。",
      "<b>按钮是不是容器：</b>LVGL 可直接放图标和多行文字；UIButton 只画背景与图片。",
      "<b>动效互补：</b>UIButton 内置按压缩放与蒙层，lv_button 需要自行实现。"
    ]
  },

  label: {
    lv: "lv_label", ui: "UILabel", level: "partial", demo: "label",
    apis: ["SetText()", "SetLineBreakMode()", "SetText(SpannableString*)", "SetRollSpeed()"],
    note: "支持 SpannableString 富文本；没有内容自适应尺寸与文字渐变。",
    gaps: ["LV_SIZE_CONTENT 自动尺寸", "文字渐变/阴影描边", "任意换行与省略组合"],
    diffs: [
      ["文本", "任意 UTF-8 + 任意字体", "SetText + SetFont / SetFontId", "ok"],
      ["富文本", "span 混排", "SpannableString + 多种 Span", "ok"],
      ["自动尺寸", "LV_SIZE_CONTENT", "需手动测量与布局", "none"],
      ["长文本", "wrap / dot / scroll / roll", "SetLineBreakMode + 滚动", "part"],
      ["文字渐变/阴影", "支持", "无", "none"],
      ["字间距/行高", "可配", "Style lineSpace / letterSpace", "ok"]
    ],
    points: [
      "<b>富文本已具备：</b>UILabel 可用 SpannableString 做颜色/字号/背景 Span。",
      "<b>自动尺寸缺失：</b>LVGL 设 LV_SIZE_CONTENT 即可，UILabel 需要自己测量后 SetSize。"
    ]
  },

  checkbox: {
    lv: "lv_checkbox", ui: "UICheckBox", level: "partial", demo: "checkbox",
    apis: ["SetState()", "SetOnChangeListener()", "SetSelectedStateColor()"],
    note: "两态 + 选中色；文字要另挂 UILabel，没有半选与状态位叠加。",
    gaps: ["indeterminate 半选", "状态位叠加", "内置文字"],
    diffs: [
      ["状态", "CHECKED / UNCHECKED + DISABLED 叠加", "SELECTED / UNSELECTED", "part"],
      ["半选", "支持", "无", "none"],
      ["文字", "可内置 label", "需自挂 UILabel", "part"],
      ["图源/颜色", "任意图片或符号", "SetImages / SetSelectedStateColor", "ok"],
      ["切换动画", "无内置", "内置动画（DEFAULT_ANIMATION）", "ok"]
    ],
    points: [
      "<b>右侧多一个能力：</b>UICheckBox 自带切换动画，lv_checkbox 需要自己加。",
      "<b>右侧少的能力：</b>半选状态、检查态与禁用态叠加都无法表达。"
    ]
  },

  switch: {
    lv: "lv_switch", ui: "UIToggleButton", level: "partial", demo: "toggle",
    apis: ["SetImages()", "SetState()", "GetState()"],
    note: "两张整图切换；没有轨道/滑块分离样式与自定义过渡曲线。",
    gaps: ["轨道/滑块分离样式", "禁用/按下状态叠加", "自定义过渡动画"],
    diffs: [
      ["开关", "lv_switch", "UIToggleButton", "ok"],
      ["状态", "ON / OFF + 每状态独立样式", "SetState 两态", "part"],
      ["外观", "轨道与滑块分别设样式", "两张整图切换", "none"],
      ["动画", "可配过渡曲线", "内置切换动画", "ok"],
      ["尺寸自适应", "支持", "需固定图片尺寸", "none"]
    ],
    points: [
      "<b>实现方式不同：</b>LVGL 分开画轨道和滑块，UI_Lite 直接切换两张图片。",
      "<b>因此右侧无法做：</b>轨道颜色、滑块阴影、按下/禁用叠加态。"
    ]
  },

  slider: {
    lv: "lv_slider", ui: "UISlider", level: "partial", demo: "slider",
    apis: ["SetRange()", "SetValue()", "SetKnobColor()", "SetSliderColor()", "SetKnobRadius()"],
    note: "只有单滑块；没有区间选择、刻度与数值动画。",
    gaps: ["双滑块与区间选择", "刻度与数值标签", "数值过渡动画"],
    diffs: [
      ["范围/值", "任意 min / max，可反向", "SetRange / SetValue", "ok"],
      ["双滑块", "支持 range 模式", "无", "none"],
      ["刻度/标签", "支持 ticks + 文本", "无", "none"],
      ["外观", "轨道/滑块/图片", "SetSliderColor / SetKnobImage / SetKnobRadius", "ok"],
      ["数值动画", "可配 transition", "无（即时跳变）", "none"],
      ["方向", "水平/垂直 + RTL", "水平/垂直（受限）", "part"]
    ],
    points: [
      "<b>右侧只能单值：</b>LVGL 可拖两个滑块取区间，UISlider 只有一个 knob。",
      "<b>外观可对齐：</b>轨道与滑块颜色、圆角、图片两边都能配。"
    ]
  },

  bar: {
    lv: "lv_bar", ui: "UIBoxProgress", level: "partial", demo: "progress",
    apis: ["SetValue()", "SetRange()", "SetDirection()", "SetBackgroundStyle()", "SetForegroundStyle()"],
    note: "只有单向填充；没有模式、起点值、指示器与数值动画。",
    gaps: ["SYMMETRICAL / RANGE 模式", "起点值与反向填充", "数值过渡动画", "可拖动指示器"],
    diffs: [
      ["进度模式", "NORMAL / SYMMETRICAL / RANGE", "仅单向填充", "none"],
      ["起点/方向", "start_value + 反向填充", "SetDirection 只能改方向", "part"],
      ["数值动画", "可配 transition", "无", "none"],
      ["指示器", "可拖动 indicator", "无", "none"],
      ["样式", "底槽/填充独立样式 + 渐变", "SetBackgroundStyle / SetForegroundStyle", "part"],
      ["圆角", "任意", "随控件高度，圆角受限", "part"]
    ],
    points: [
      "<b>最明显的缺口：</b>对称进度与区间进度在 UI_Lite 无法表达。",
      "<b>基础能力可用：</b>底槽、填充色、方向、圆角都能配置。"
    ]
  },

  textarea: {
    lv: "lv_textarea", ui: "UIEditText", level: "partial", demo: "edittext",
    apis: ["SetText()", "SetPlaceholder()", "SetMaxLength()", "SetInputType()", "SetOnChangeListener()"],
    note: "以单行输入为主；多行滚动与选中/剪贴板能力弱。",
    gaps: ["多行编辑与滚动", "选中 / 复制粘贴", "占位符富样式"],
    diffs: [
      ["输入", "多行文本 + 光标", "UIEditText（以单行为主）", "part"],
      ["占位符", "支持", "SetPlaceholder", "ok"],
      ["长度限制", "可配", "SetMaxLength", "ok"],
      ["输入类型", "文本/数字/密码等", "SetInputType", "ok"],
      ["多行滚动", "支持", "支持有限", "part"],
      ["选中/剪贴板", "完整支持", "未完整实现", "none"]
    ],
    points: [
      "<b>右侧可用：</b>占位符、长度限制、输入类型与光标都具备。",
      "<b>右侧缺失：</b>多行滚动、选区、复制粘贴与富文本编辑。"
    ]
  },

  /* ---------------- 列表 / 容器 ---------------- */
  list: {
    lv: "lv_list", ui: "UIList", level: "partial", demo: "list",
    apis: ["SetAdapter()", "SetLoopState()", "SetSelectPosition()", "SetYScrollBarVisible()"],
    note: "只是滚动容器，列表项要自建 Adapter；没有内置按钮/文本/分组项。",
    gaps: ["内置按钮/文本/分组项", "动态增删与动画", "列表项样式复用"],
    diffs: [
      ["容器", "lv_list + 任意子对象", "UIList + AbstractAdapter", "ok"],
      ["内置项类型", "按钮/文本/分组", "需自建子控件与适配器", "none"],
      ["滚动/回弹", "支持", "支持", "ok"],
      ["增删动画", "支持", "无", "none"],
      ["滚动条", "可配", "SetYScrollBarVisible + 样式", "ok"]
    ],
    points: [
      "<b>左侧开箱即用：</b>lv_list_add_button 一行就能加一个可点击项。",
      "<b>右侧要自己写：</b>Adapter、ViewHolder、子控件布局都需要实现。"
    ]
  },

  object: {
    lv: "lv_obj", ui: "UIView", level: "full", demo: "view",
    apis: ["SetPosition()", "SetSize()", "SetStyle()", "Add()"],
    note: "基础对象能力基本对齐，差异主要在样式系统与布局。",
    gaps: ["flex / grid 布局（需开宏）", "任意样式属性", "事件冒泡细节"],
    diffs: [
      ["基础对象", "lv_obj", "UIView", "ok"],
      ["定位/尺寸", "像素 / 百分比 / 内容", "SetPosition / SetSize + 百分比接口", "part"],
      ["子对象", "Add / Remove", "Add / Remove", "ok"],
      ["布局", "flex / grid", "FlexLayout / GridLayout（需宏开启）", "part"],
      ["样式", "任意属性 + 状态选择器", "Style 固定字段集合", "part"]
    ],
    points: [
      "<b>对齐度最高的一对：</b>两边都是所有控件的基类，位置/尺寸/子对象一致。",
      "<b>差异集中在样式：</b>LVGL 可按状态设任意属性，UIView 的 Style 字段是固定的。"
    ]
  },

  /* ---------------- 图形 / 图片 ---------------- */
  image: {
    lv: "lv_image", ui: "UIImageView", level: "partial", demo: "image",
    apis: ["SetSrc()", "SetResizeMode()", "SetBlurLevel()", "SetTransformAlgorithm()"],
    note: "静态图片显示；没有旋转/缩放变换与九宫格拉伸。",
    gaps: ["旋转/缩放与锚点", "九宫格 / 三段拉伸", "图片对象复用"],
    diffs: [
      ["载入", "任意图片源", "SetSrc 资源路径或 ImageInfo", "ok"],
      ["缩放模式", "STRETCH / CONTAIN / COVER", "SetResizeMode 多种模式", "ok"],
      ["变换", "旋转/缩放/锚点", "无", "none"],
      ["九宫格", "支持", "无", "none"],
      ["模糊/边缘", "无", "SetBlurLevel / SetEdgeSmoothRadius", "ok"],
      ["透明度/混合", "支持", "Style 透明度", "part"]
    ],
    points: [
      "<b>右侧多出的能力：</b>UIImageView 自带模糊与边缘平滑，LVGL 需要叠加效果。",
      "<b>右侧缺失：</b>旋转缩放、九宫格拉伸这类图片变换能力。"
    ]
  },

  imagebutton: {
    lv: "lv_imagebutton", ui: "UIButton + SetImageSrc", level: "partial", demo: "imagebutton",
    apis: ["SetImageSrc()", "SetStyleForState()"],
    note: "仅默认/按下两态图；没有禁用态图与选中态图。",
    gaps: ["禁用态图源", "选中/勾选态图源", "多状态图叠加"],
    diffs: [
      ["图源数量", "任意状态多套", "默认 / 按下两态", "part"],
      ["禁用态", "支持", "无（禁用只改样式）", "none"],
      ["选中态", "支持", "无", "none"],
      ["缩放动画", "无内置", "内置按压缩放", "ok"],
      ["文字", "可叠加", "需 UILabel", "part"]
    ],
    points: [
      "<b>核心差距：</b>LVGL 能把「禁用图 / 选中图」也配进去，UIButton 只有两张。",
      "<b>反向优势：</b>UIButton 按下时自带缩放与蒙层。"
    ]
  },

  animimg: {
    lv: "lv_animimg", ui: "UIImageAnimator", level: "partial", demo: "imageanim",
    apis: ["SetImageAnimatorSrc()", "SetTimeOfUpdate()", "SetRepeatTimes()", "SetReverse()"],
    note: "按预制帧序列播放；没有变换与动态绘制插值。",
    gaps: ["缩放/旋转/位移变换", "自定义播放区间", "运行时生成帧"],
    diffs: [
      ["帧源", "任意图片对象数组", "SetImageAnimatorSrc 预制帧序列", "ok"],
      ["播放控制", "start / stop + 区间", "SetRepeatTimes / SetReverse / SetFillMode", "part"],
      ["变换", "支持 transform", "无", "none"],
      ["帧率", "按 tick 可变", "SetTimeOfUpdate / SetTimeOfPause", "ok"],
      ["播放事件", "READY / COMPLETED 等", "SetAnimatorStopListener", "part"]
    ],
    points: [
      "<b>右侧能播序列帧：</b>循环、反向、暂停、填充模式都有对应接口。",
      "<b>右侧缺变换：</b>不能边播放边缩放/旋转。"
    ]
  },

  canvas: {
    lv: "lv_canvas", ui: "UICanvas", level: "partial", demo: "canvas",
    apis: ["SetStartPosition()", "SetDrawLinePath()", "SetArcParamInfo()"],
    note: "只能画少量图元，没有图层、混合模式与图片变换。",
    gaps: ["图层与混合模式", "任意路径 / 贝塞尔曲线", "图片绘制与变换"],
    diffs: [
      ["绘制能力", "任意路径/矩形/圆弧/图片", "直线/圆弧/矩形等有限图元", "part"],
      ["图层", "多图层 + 混合模式", "无", "none"],
      ["变换", "旋转/缩放", "无", "none"],
      ["文本", "支持", "无直接文本绘制（叠 UILabel）", "part"],
      ["刷新", "invalidate 指定区域", "Invalidate 同步刷新", "ok"]
    ],
    points: [
      "<b>能力边界：</b>UICanvas 只提供线、弧、矩形等基础图元。",
      "<b>扩展做法：</b>复杂图形要在 UIView::OnDraw 里直接用底层绘制接口自绘。"
    ]
  },

  chart: {
    lv: "lv_chart", ui: "UIChart", level: "partial", demo: "chart",
    apis: ["AddPoints()", "SetLineColor()", "SetFillColor()", "SetMaxDataCount()"],
    note: "以折线 + 填充为主；没有坐标轴、刻度标签与多序列样式。",
    gaps: ["坐标轴刻度与标签", "多序列/多图表类型", "数据更新动画"],
    diffs: [
      ["图表类型", "折线/柱状/散点等", "折线 + 填充", "part"],
      ["数据点", "任意序列", "AddPoints + SetMaxDataCount", "ok"],
      ["坐标轴", "刻度/标签/网格", "需自绘", "none"],
      ["平滑曲线", "支持", "有限（smooth 数据接口）", "part"],
      ["动画", "支持", "无", "none"]
    ],
    points: [
      "<b>右侧够用：</b>折线、填充、渐变、首尾点样式都能配。",
      "<b>右侧要自绘：</b>坐标轴、刻度文字、图例与多序列叠加。"
    ]
  },

  qrcode: {
    lv: "lv_qrcode", ui: "UIQRCode", level: "partial", demo: "qrcode",
    apis: ["SetQrcodeInfo()", "SetWidth()", "SetHeight()"],
    note: "二维码已具备；纠错级别、边距、内嵌 Logo 等可配项少。",
    gaps: ["纠错级别与边距", "内嵌 Logo", "多版本容量控制"],
    diffs: [
      ["二维码", "lv_qrcode", "UIQRCode", "ok"],
      ["内容/颜色", "可配", "SetQrcodeInfo(val, bg, qrColor)", "ok"],
      ["纠错级别", "支持", "无", "none"],
      ["Logo / 边距", "支持", "无", "none"]
    ],
    points: [
      "<b>核心能力对齐：</b>都能把字符串渲染成二维码并配前景/背景色。",
      "<b>细节差距：</b>纠错级别与 Logo 叠加需要额外处理。"
    ]
  },

  arclabel: {
    lv: "lv_arclabel", ui: "UIArcLabel", level: "partial", demo: "arclabel",
    apis: ["SetText()", "SetArcTextRadius()", "SetArcTextAngle()", "SetArcTextOrientation()"],
    note: "弧形文字已具备；逐字独立样式与镜像方向支持有限。",
    gaps: ["逐字独立样式/间距", "任意方向与镜像", "文字渐变"],
    diffs: [
      ["弧形文字", "lv_arclabel", "UIArcLabel", "ok"],
      ["半径/角度", "可配", "SetArcTextRadius / SetArcTextAngle", "ok"],
      ["方向", "上/下弧 + 镜像", "SetArcTextOrientation", "part"],
      ["逐字样式", "span 级独立样式", "以整体 Style 为主", "part"],
      ["滚动", "可配", "SetRollCount / SetRollSpeed", "ok"]
    ],
    points: [
      "<b>对齐度高：</b>半径、起止角度、朝向、滚动都有对应接口。",
      "<b>差异：</b>LVGL 能给每个字符单独上样式，UIArcLabel 以整体样式为主。"
    ]
  },

  /* ---------------- 选择 / 弹层 ---------------- */
  roller: {
    lv: "lv_roller", ui: "UIPicker", level: "partial", demo: "picker",
    apis: ["SetSelectIndex()", "SetTextColor()", "SetLoopState()", "SetTextFormatter()"],
    note: "单列滚轮已具备；多列联动与可见项数配置缺失。",
    gaps: ["多列联动", "可见项数与缩放渐变", "选项自定义绘制"],
    diffs: [
      ["滚轮", "lv_roller", "UIPicker", "ok"],
      ["选项", "字符串数组", "Add + SetTextFormatter", "ok"],
      ["多列", "支持", "无（需多个 Picker 联动）", "none"],
      ["循环", "支持", "SetLoopState", "ok"],
      ["选中回调", "支持", "Picker 监听", "ok"]
    ],
    points: [
      "<b>右侧可用：</b>选中项、循环滚动、字体/颜色、文本格式化。",
      "<b>右侧缺失：</b>多列级联（如年-月-日）需要自己组合多个 UIPicker。"
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
    apis: ["SetTitle()", "SetText()", "SetButton()", "SetOnCancelListener()"],
    note: "固定标题 + 正文 + 按钮；内容区不可自定义，也没有开关动画。",
    gaps: ["自定义内容区", "打开/关闭动画", "自动关闭与遮罩样式"],
    diffs: [
      ["标题/正文", "可配", "SetTitle / SetText", "ok"],
      ["按钮", "任意数量/自定义", "SetButton(DialogButtonType, ...) 类型有限", "part"],
      ["自定义内容", "支持", "无", "none"],
      ["动画", "支持", "无", "none"],
      ["模态遮罩", "可配", "有默认遮罩", "part"]
    ],
    points: [
      "<b>右侧是固定模板：</b>标题、正文、最多两个按钮，布局不可改。",
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
    gaps: ["标签栏与内容联动", "标签样式与滚动", "页面切换动画"],
    diffs: [
      ["组件", "lv_tabview", "无对应组件", "none"],
      ["标签栏", "内置", "需 ToggleButton 组合", "none"],
      ["页面容器", "内置换页", "UISwipeView 可近似", "part"],
      ["切换动画", "支持", "UISwipeView 滑动", "part"]
    ]
  },

  tileview: {
    lv: "lv_tileview", ui: "无", level: "none", demo: "none",
    alt: "UISwipeView 只能单轴整页滑动，二维磁贴与斜向切换无法直接实现。",
    gaps: ["二维磁贴与行列", "磁贴切换动画", "循环与边界"],
    diffs: [
      ["组件", "lv_tileview", "无对应组件", "none"],
      ["二维网格", "支持", "UISwipeView 单轴", "none"],
      ["磁贴动画", "支持", "有限", "part"]
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
      ["长按/高亮", "支持", "无", "none"],
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
    alt: "UICircleProgress 只能显示只读圆环进度；背景弧/指示弧分离、旋钮拖拽、对称模式都没有。",
    gaps: ["弧形拖拽调节", "背景弧/指示弧分离样式", "对称/反向模式"],
    diffs: [
      ["组件", "lv_arc", "无对应组件", "none"],
      ["拖拽调值", "支持", "无（UICircleProgress 只读）", "none"],
      ["角度范围", "任意起止 + 背景弧", "SetStartAngle / SetEndAngle（只读显示）", "part"],
      ["外观", "弧宽/圆角/渐变/阴影", "仅颜色与图片", "part"],
      ["事件", "VALUE_CHANGED", "无", "none"]
    ],
    points: [
      "<b>注意区分：</b>UICircleProgress 是进度展示，不是可交互的弧形滑块。",
      "<b>要做旋钮：</b>需要自己在 UIView::OnDraw 里画弧并处理拖动角度。"
    ]
  },

  scale: {
    lv: "lv_scale", ui: "无", level: "none", demo: "none",
    alt: "UILabel + 自绘刻线；刻度排布、区间角度、指针联动都没有现成组件。",
    gaps: ["刻度/标签自动排布", "区间与角度", "指针联动"],
    diffs: [
      ["组件", "lv_scale", "无对应组件", "none"],
      ["刻度", "自动排布", "需自绘", "none"],
      ["指针", "可联动", "无", "none"]
    ]
  },

  line: {
    lv: "lv_line", ui: "无", level: "none", demo: "none",
    alt: "在 UIView::OnDraw 中直接用绘制接口画折线；虚线、圆角连接需要自己做。",
    gaps: ["任意点集连线", "虚线/圆角连接", "自动尺寸"],
    diffs: [
      ["组件", "lv_line", "无对应组件", "none"],
      ["折线", "任意点集", "需 OnDraw 自绘", "none"],
      ["样式", "宽度/虚线/圆角", "自绘可控", "part"]
    ]
  },

  led: {
    lv: "lv_led", ui: "无", level: "none", demo: "none",
    alt: "UIView 自绘圆点，或用 UILabel + 自定义字体；亮度、闪烁、点阵字符都没有。",
    gaps: ["点阵字符渲染", "亮度/闪烁", "多字符滚动"],
    diffs: [
      ["组件", "lv_led", "无对应组件", "none"],
      ["点阵/亮度", "支持", "无", "none"],
      ["闪烁", "支持", "无", "none"]
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
    alt: "UICircleProgress + 定时器自绘旋转弧；不定长旋转动画没有现成实现。",
    gaps: ["不定长旋转动画", "弧长/速度可配", "中心文字"],
    diffs: [
      ["组件", "lv_spinner", "无对应组件", "none"],
      ["动画", "内置旋转弧", "需自绘 + 定时器", "none"],
      ["样式", "弧宽/颜色/速度", "无", "none"]
    ]
  },

  span: {
    lv: "lv_span", ui: "UILabel + SpannableString", level: "partial", demo: "span",
    apis: ["SetText(SpannableString*)", "SetForegroundColorSpan()", "SetAbsoluteSizeSpan()", "SetBackgroundColorSpan()"],
    note: "富文本可用 SpannableString 实现；行内图片与逐字变换缺失。",
    gaps: ["行内图片/图标", "逐字旋转/位移", "任意段落样式"],
    diffs: [
      ["富文本", "lv_span 混排", "SpannableString + Span", "ok"],
      ["颜色/字号/背景", "支持", "ForegroundColor / AbsoluteSize / BackgroundColor Span", "ok"],
      ["行内图片", "支持", "无", "none"],
      ["逐字变换", "支持", "无", "none"],
      ["自动换行", "支持", "UILabel 换行", "part"]
    ],
    points: [
      "<b>可对齐的部分：</b>颜色、字号、背景色都能通过 Span 实现。",
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
  }
};
