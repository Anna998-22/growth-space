/* =========================================================================
 * 成长空间 · 首页
 * -------------------------------------------------------------------------
 * 这一版首页的主线不是课程，是四件事：
 *   看见自己 → 留一句话 → 看见变化 → 知道下一步能去哪
 * 所以第一屏最重要的入口是「最近的你，还好吗？」（15 题），
 * 而不是任何一节课程。课程只在用户自己产生需求之后才出现。
 *
 * 侧栏三块（今日小记 / 我的心情 / 近期学习）在手机上没有右栏，
 * 会以内联卡片出现在正文末尾 —— 同一份 HTML、同一个绑定函数，
 * 只渲染两遍，不维护两份代码。
 * ========================================================================= */
(function () {
  "use strict";

  /* ---------------------------------------------------------------------
   * 侧栏三块
   * ------------------------------------------------------------------- */
  function sideHtml() {
    var h = [];
    var today = Store.todayEntry("note");
    var moodToday = Store.todayEntry("mood");
    var curMood = moodToday && moodToday.meta ? moodToday.meta.moodId : "";
    var series = Store.moodSeries(14);
    var hasMood = false;
    for (var k = 0; k < series.length; k++) if (series[k].score) hasMood = true;
    var curve = hasMood ? Widgets.moodSvg(series) : "";

    /* 今日小记 */
    h.push('<div class="rail-card note-box">');
    h.push("<h4>" + UI.icon("pen", 15) + "今日小记</h4>");
    h.push('<textarea data-field="dailyNote" placeholder="今天有什么想留下的？一句就好。">' +
      UI.esc(today ? today.note : "") + "</textarea>");
    h.push('<div class="note-foot">' +
      '<span class="note-hint">' +
      (today ? "今天已记下 · " + UI.friendlyTime(today.ts) : "只存在你自己的浏览器里") +
      "</span>" +
      '<button class="btn ghost" data-save-note="1" type="button">保存</button>' +
      "</div>");
    h.push("</div>");

    /* 我的心情 */
    h.push('<div class="rail-card">');
    h.push("<h4>" + UI.icon("heart", 15) + "我的心情</h4>");
    if (curve) {
      h.push('<div class="mood-wrap">' + curve + "</div>" + Widgets.moodAxis(series));
    } else {
      h.push('<div class="mood-empty">还没有记录。<br>选一个此刻最接近的，曲线会从这里开始。</div>');
    }
    h.push('<div class="mood-pick">');
    for (var i = 0; i < Widgets.MOODS.length; i++) {
      var m = Widgets.MOODS[i];
      h.push('<button class="mood-btn' + (m.id === curMood ? " on" : "") + '"' +
        ' data-mood="' + m.id + '" type="button"' +
        ' aria-label="' + m.label + '" title="' + m.label + '">' +
        UI.icon(m.icon, 22) + "<span>" + m.short + "</span></button>");
    }
    h.push("</div>");
    h.push('<p class="rail-note">' + (hasMood ? "近 14 天。没有记录的日子会断开，不连线。" : "不是打分，只是给此刻的自己留个标记。") + "</p>");
    h.push("</div>");

    /* 近期学习 */
    var st = Store.stats();
    var pct = st.coursesTotal ? Math.round(st.coursesDone / st.coursesTotal * 100) : 0;
    var nextId = Store.nextCourseId();
    var next = nextId && window.Course ? Course.byId(nextId) : null;
    h.push('<div class="rail-card">');
    h.push("<h4>" + UI.icon("book", 15) + "近期学习</h4>");
    h.push('<div class="bar"><i style="width:' + pct + '%"></i></div>');
    h.push('<p class="rail-note">已走过 ' + st.coursesDone + " / " + st.coursesTotal +
      " 节 · 连续 " + st.streak + " 天</p>");
    /* 右栏只有 262px，容不下收藏星标 —— 收藏在「探索」页里做，
       这里只留一条「接着去哪」的线索 */
    h.push(next ? Widgets.lessonRow(next, { showFav: false }) : '<p class="rail-quiet">五节都走完了。<br>新的方向正在展开。</p>');
    h.push("</div>");

    return h.join("");
  }

  function bindSide(root) {
    /* 今日小记：只写当天的同一条，改主意重写不会留下两条 */
    var btn = UI.$("[data-save-note]", root);
    var ta = UI.$('[data-field="dailyNote"]', root);
    if (btn && ta) {
      btn.addEventListener("click", function () {
        var txt = ta.value.replace(/^\s+|\s+$/g, "");
        if (!txt) { UI.toast("写一句就好"); ta.focus(); return; }
        Store.saveDailyNote(txt);
        UI.toast("已经记下了");
        Router.render("home", {});
      });
    }

    /* 心情：点一下即存，立刻重绘曲线 */
    var moodBtns = UI.$all("[data-mood]", root);
    for (var i = 0; i < moodBtns.length; i++) (function (b) {
      b.addEventListener("click", function () {
        var m = Widgets.moodById(b.getAttribute("data-mood"));
        if (!m) return;
        var again = Store.todayEntry("mood") && Store.todayEntry("mood").meta.moodId === m.id;
        Store.saveMood(m.id, m.score, m.label);
        UI.toast(again ? "今天的心情改好了" : "记下了：" + m.label);
        Router.render("home", {});
      });
    })(moodBtns[i]);

    Widgets.bindLessonRows(root);
    Widgets.bindFav(root);
  }

  /* ---------------------------------------------------------------------
   * 正文
   * ------------------------------------------------------------------- */
  function render() {
    var p = Store.getProfile() || {};
    var nick = p.nickname || "";
    var first = Store.firstRecord();
    var st = Store.stats();
    var h = [];

    /* 问候 */
    h.push('<div class="home-head">' +
      "<div><h1>" + (nick ? "你好，" + UI.esc(nick) : "你好") + "</h1>" +
      '<p class="sub">每一次的停留，都是在靠近更真实的自己。</p></div>' +
      '<div class="home-date"><b>' + UI.dotDate(UI.today()) + "</b>" +
      UI.weekday(UI.today()) + "</div>" +
      "</div>");

    /* 15 题入口 —— 首页最重要的一块 */
    h.push('<div class="invite' + (first ? " done" : "") + '">' +
      '<span class="inv-art" aria-hidden="true"></span><div class="invite-inner">');
    if (!first) {
      h.push('<p class="inv-kicker">第一次认识自己</p>');
      h.push("<h2>" + UI.esc(QUESTIONNAIRE.intro.title) + "</h2>");
      h.push('<p class="inv-sub">' + UI.esc(QUESTIONNAIRE.intro.subtitle) + "</p>");
      h.push('<p class="inv-note">' + UI.textLines(QUESTIONNAIRE.intro.note) + "</p>");
      h.push('<p class="inv-meta">' + UI.esc(QUESTIONNAIRE.intro.meta) + "</p>");
      h.push('<button class="btn primary" data-go="questionnaire" type="button">' +
        "开始探索 " + UI.icon("arrow", 17) + "</button>");
    } else {
      h.push('<p class="inv-kicker">你已经留下了</p>');
      h.push("<h2>" + UI.esc(first.note || "第一次认识自己") + "</h2>");
      h.push('<p class="inv-sub">' + UI.esc(first.meta && first.meta.record ? first.meta.record.quote : "") + "</p>");
      h.push('<p class="inv-meta">' + UI.dotDate(first.date) + " 写下 · 那时候的你</p>");
      h.push('<button class="btn ghost" data-record="' + first.id + '" type="button">' +
        "回看这一份 " + UI.icon("arrow", 17) + "</button>");
      h.push('<p class="inv-note">想重新认识一次，也可以再来一遍。</p>');
      h.push('<button class="link small" data-go="questionnaire" type="button">重新做一次 →</button>');
    }
    h.push("</div></div>");

    /* 最近的成长记录 */
    /* maxMood:2 —— 摘要里最多两条心情，其余位置让给小记、课程、画像。
       心情是背景，不是「我做过的事」；「成长轨迹」页仍是完整的。
       见 store.js timelineItems 上的说明。 */
    var items = Store.timelineItems(8, { maxMood: 2 });
    h.push('<div class="sec-head"><h2>最近的成长记录</h2>' +
      (items.length ? '<button class="link small" data-go="trace" type="button">全部 →</button>' : "") +
      "</div>");
    if (!items.length) {
      h.push('<div class="empty">' + UI.icon("sprout", 30) +
        "<b>这里还很安静</b>" +
        "<p>完成一次认识自己，或者写一句今天的自己，<br>你的轨迹就会从这里长出来。</p>" +
        '<button class="btn ghost" data-go="notes" type="button">去看看记录</button>' +
        /* 空白页最劝退的是「不知道该拿它干嘛」。给一条能立刻看到
           用起来是什么样子的路 —— 数据是假的，但页面是真的。 */
        '<p class="empty-alt">还不确定的话，' +
        '<button class="link small" data-demo="1" type="button">先看看示例</button></p>' +
        "</div>");
    } else {
      h.push(Widgets.timeline(items, { layout: "h" }));
    }

    /* 此刻可以探索的方向 */
    h.push('<div class="sec-head"><h2>' + UI.esc(TOPICS.heading) + "</h2></div>");
    h.push('<p class="sec-note">' + UI.esc(TOPICS.sub) + "</p>");
    h.push('<div class="topic-grid">');
    var explored = Store.settings().explored;
    for (var i = 0; i < TOPICS.list.length; i++) {
      var t = TOPICS.list[i];
      var seen = explored.indexOf(t.id) !== -1;
      h.push('<button class="topic-card' + (seen ? " seen" : "") + '"' +
        ' data-topic="' + t.id + '" type="button">' +
        '<span class="tc-ic">' + UI.icon(t.icon, 22) + "</span>" +
        "<b>" + UI.esc(t.name) + "</b>" +
        '<span class="tc-sub">' + (seen ? "看过了" : "点进去看看") + "</span>" +
        "</button>");
    }
    h.push("</div>");

    /* 收尾：不催促，只说明 */
    h.push('<div class="rail-quiet">成长不是一条要赶完的路。<br>今天只走了一小步，也算数。</div>');

    /* 手机端没有右栏，把侧栏内容内联在正文末尾；
       ≥1180px 时这段由 CSS 隐藏，改由 #rail2 显示 */
    h.push('<div class="rail-mobile">' + sideHtml() + "</div>");

    return h.join("");
  }

  function bind(viewEl) {
    Widgets.bindGo(viewEl);
    bindSide(UI.$(".rail-mobile", viewEl) || viewEl);
  }

  /* 宽屏右栏：同一份 sideHtml() */
  function rail() {
    return '<div class="rail-inline">' + sideHtml() + "</div>";
  }
  function bindRail(railEl) { bindSide(railEl); }

  window.Pages = window.Pages || {};
  window.Pages.home = {
    title: "首页",
    render: render, bind: bind,
    rail: rail, bindRail: bindRail
  };
})();
