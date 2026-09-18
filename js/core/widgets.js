/* =========================================================================
 * 成长空间 · 共享渲染组件
 * -------------------------------------------------------------------------
 * 一次抽取、多处复用：课程行、时间轴、心情曲线。
 * 「成长轨迹」用纵向时间轴，首页用横向——是同一份数据、两种排布，
 * 不是两份要同步维护的代码。
 * ========================================================================= */
(function () {
  "use strict";

  /* ---------------------------------------------------------------------
   * 课程行
   * ------------------------------------------------------------------- */
  function lessonRow(c, opts) {
    opts = opts || {};
    var done = Store.isDone(c.id);
    var started = Store.courseState(c.id) === "started";
    var label = done ? "已完成" : started ? "继续" : "开始";
    var fav = Store.isFav(c.id);
    return '<div class="lesson-row' + (done ? " done" : "") + '" data-go-lesson="' + c.id + '" role="button" tabindex="0">' +
      '<span class="lr-no">' + UI.courseNo(c.order) + "</span>" +
      '<div class="lr-text"><b>' + UI.esc(c.title) + "</b>" +
      '<span class="muted small">预计 ' + c.minutes + " 分钟" + (done ? " · 已完成" : "") + "</span></div>" +
      (opts.showFav === false ? "" :
        '<button class="lr-fav' + (fav ? " on" : "") + '" data-fav="' + c.id + '" ' +
        'aria-label="' + (fav ? "取消收藏" : "收藏") + '" title="' + (fav ? "取消收藏" : "收藏") + '">' +
        UI.icon("star", 16) + "</button>") +
      '<span class="lr-cta">' + label + " " + UI.icon("chevron", 14) + "</span></div>";
  }

  /* 课程 id 列表 -> 课程行列表 */
  function lessonList(ids) {
    var h = [];
    for (var i = 0; i < ids.length; i++) {
      var c = (window.Course && Course.byId) ? Course.byId(ids[i]) : null;
      if (c) h.push(lessonRow(c));
    }
    return h.join("");
  }

  /* ---------------------------------------------------------------------
   * 时间轴
   * items: [{ date, day, title, quote, kind, refId, ts }]
   * opts.layout: "v" 纵向（成长轨迹页/手机） | "h" 横向（首页宽屏）
   * ------------------------------------------------------------------- */
  function timeline(items, opts) {
    opts = opts || {};
    if (!items || !items.length) return "";
    var layout = opts.layout === "h" ? "h" : "v";
    var h = ['<ol class="tl tl-' + layout + '">'];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      h.push('<li class="tl-item' + (it.kind ? " k-" + it.kind : "") + '"' +
        (it.refId ? ' data-record="' + UI.esc(it.refId) + '" role="button" tabindex="0"' : "") + ">" +
        '<span class="tl-dot" aria-hidden="true"></span>' +
        '<span class="tl-date">' + UI.esc(it.day || UI.dotDate(it.date).slice(5)) + "</span>" +
        '<b class="tl-title">' + UI.esc(it.title) + "</b>" +
        (it.quote ? '<p class="tl-quote">' + UI.esc(it.quote) + "</p>" : "") +
        "</li>");
    }
    h.push("</ol>");
    /* 横向时间轴必须自带滚动容器 —— 否则会把桌面栅格撑爆，整页出现横向滚动条 */
    return layout === "h" ? '<div class="tl-scroll">' + h.join("") + "</div>" : h.join("");
  }

  /* ---------------------------------------------------------------------
   * 心情曲线（近 N 天）
   * 手写 SVG，不引入任何图表库：file:// + 微信分发场景下 CDN 是死路。
   * 缺数据的日子断开、不连线。stroke 用 CSS 变量，换色板时自动跟随。
   * ------------------------------------------------------------------- */
  function moodSvg(series, opts) {
    opts = opts || {};
    var W = 300, H = opts.height || 84, PAD = 8;
    if (!series || series.length < 2) return "";
    var segs = [], seg = [], dots = [], i;
    var last = series.length - 1;

    for (i = 0; i < series.length; i++) {
      var s = series[i].score;
      if (!s) {
        /* 没记录的日子断开 —— 但线段至少要有两个点才画 */
        if (seg.length > 1) segs.push(seg.join(" "));
        seg = [];
        continue;
      }
      var x = Math.round(i * (W / last));
      var y = Math.round(H - PAD - ((s - 1) / 4) * (H - PAD * 2));
      seg.push(x + "," + y);
      /* 每个记录点都留一个圆点。
         只画线不画点的话，三三两两的短线段看起来就是几道游离的斜杠，
         读不出「这是我留下的记录」—— 点才是这条曲线的锚。 */
      dots.push('<circle cx="' + x + '" cy="' + y + '" r="2.6" fill="currentColor"/>');
    }
    if (seg.length > 1) segs.push(seg.join(" "));
    if (!dots.length) return "";

    var out = ['<svg class="mood-curve" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" aria-hidden="true">'];
    /* 底线：给悬浮的圆点一个参照，否则整条曲线像是飘在卡片中间 */
    out.push('<line x1="0" y1="' + (H - PAD) + '" x2="' + W + '" y2="' + (H - PAD) +
      '" stroke="currentColor" stroke-width="1" opacity=".16"/>');
    for (i = 0; i < segs.length; i++) {
      out.push('<polyline points="' + segs[i] + '" fill="none" stroke="currentColor" ' +
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity=".5"/>');
    }
    out.push(dots.join(""));
    out.push("</svg>");
    return out.join("");
  }

  /* 心情曲线下方的日期刻度（只显示首尾与中间） */
  function moodAxis(series) {
    if (!series || !series.length) return "";
    var idx = [0, Math.floor((series.length - 1) / 2), series.length - 1];
    var h = ['<div class="mood-axis">'];
    for (var i = 0; i < 3; i++) {
      h.push("<span>" + UI.dotDate(series[idx[i]].date).slice(5) + "</span>");
    }
    h.push("</div>");
    return h.join("");
  }

  /* ---------------------------------------------------------------------
   * 事件绑定（统一入口，避免每个页面各写一份）
   * ------------------------------------------------------------------- */
  function bindLessonRows(root) {
    var rows = UI.$all("[data-go-lesson]", root);
    for (var i = 0; i < rows.length; i++) (function (b) {
      b.addEventListener("click", function (e) {
        /* 收藏按钮在课程行内部，别把点击一起吞掉 */
        if (e.target && e.target.closest && e.target.closest("[data-fav]")) return;
        var id = b.getAttribute("data-go-lesson");
        Store.markStarted(id);
        Router.navigate("lesson", { id: id });
      });
    })(rows[i]);
  }

  function bindFav(root, onDone) {
    var btns = UI.$all("[data-fav]", root);
    for (var i = 0; i < btns.length; i++) (function (b) {
      b.addEventListener("click", function (e) {
        e.stopPropagation();
        var id = b.getAttribute("data-fav");
        var now = Store.toggleFav(id);
        b.classList.toggle("on", now);
        var lab = now ? "取消收藏" : "收藏";
        b.setAttribute("aria-label", lab);
        b.setAttribute("title", lab);
        UI.toast(now ? "已收藏" : "已取消收藏");
        if (onDone) onDone(now);
      });
    })(btns[i]);
  }

  function bindFields(root) {
    var f = UI.$all("[data-field]", root);
    for (var i = 0; i < f.length; i++) (function (el) {
      el.addEventListener("input", function () {
        el.setAttribute("data-value", el.value);
      });
    })(f[i]);
  }

  /* 通用「跳到某页 / 某记录 / 某主题」 */
  function bindGo(root) {
    var g = UI.$all("[data-go]", root);
    for (var i = 0; i < g.length; i++) (function (b) {
      b.addEventListener("click", function () {
        Router.navigate(b.getAttribute("data-go"));
      });
    })(g[i]);

    var r = UI.$all("[data-record]", root);
    for (var j = 0; j < r.length; j++) (function (b) {
      b.addEventListener("click", function () {
        Router.navigate("record", { id: b.getAttribute("data-record") });
      });
    })(r[j]);

    var t = UI.$all("[data-topic]", root);
    for (var k = 0; k < t.length; k++) (function (b) {
      b.addEventListener("click", function () {
        Router.navigate("topic", { id: b.getAttribute("data-topic") });
      });
    })(t[k]);
  }

  /* 心情五档：score 只用来画曲线的高低，不是打分、不做评价。
     label 是给用户看的词，中性、不带褒贬。 */
  /* label 进数据与 aria（「心情 · 还算平静」），short 只给窄栏按钮用。
     右栏一张卡片 262px 放 5 个按钮，每个约 47px —— 4 个字必定折行。 */
  var MOODS = [
    { id: "m1", score: 1, label: "很低落", short: "低落", icon: "mood1" },
    { id: "m2", score: 2, label: "有点沉", short: "有点沉", icon: "mood2" },
    { id: "m3", score: 3, label: "还算平静", short: "平静", icon: "mood3" },
    { id: "m4", score: 4, label: "还不错", short: "还不错", icon: "mood4" },
    { id: "m5", score: 5, label: "挺好的", short: "挺好", icon: "mood5" }
  ];
  function moodById(id) {
    for (var i = 0; i < MOODS.length; i++) if (MOODS[i].id === id) return MOODS[i];
    return null;
  }

  window.Widgets = {
    lessonRow: lessonRow, lessonList: lessonList,
    timeline: timeline, moodSvg: moodSvg, moodAxis: moodAxis,
    bindLessonRows: bindLessonRows, bindFav: bindFav,
    bindFields: bindFields, bindGo: bindGo,
    MOODS: MOODS, moodById: moodById
  };
  /* 兼容旧引用（course.js / route.js 曾用全局函数） */
  window.bindLessonRows = bindLessonRows;
})();
