/* =========================================================================
 * 成长空间 · 探索
 * -------------------------------------------------------------------------
 * 三块内容自上而下，从「此刻的我」走到「可以去的方向」：
 *   1. 需求入口   —— 用户带着一个具体感受来，先被听见，再谈下一步
 *   2. 9 区地图   —— 长期的方向感，双层体系里的上层（4 大门类仍在准备）
 *   3. 轻量课程   —— 用户自己产生需求之后的下一步，不是入口的终点
 *
 * 入口文案刻意不出现任何医学判断、人格类型、觉醒等级。
 * ========================================================================= */
(function () {
  "use strict";
  window.Pages = window.Pages || {};

  function render() {
    var st = Store.stats();
    var explored = Store.settings().explored;
    var h = [];

    /* ---- 1. 需求入口 ----
       下面两块都有 sec-head，这一块原本只有一行副标题，
       卡片就直接贴上来了，读起来像页面开头漏了个标题。 */
    h.push('<div class="sec-head"><h2>' + UI.esc(TOPICS.heading) + "</h2></div>");
    h.push('<p class="sec-note">' + UI.esc(TOPICS.sub) + "</p>");
    h.push('<div class="topic-grid">');
    for (var i = 0; i < TOPICS.list.length; i++) {
      var t = TOPICS.list[i];
      var seen = explored.indexOf(t.id) !== -1;
      h.push('<button class="topic-card' + (seen ? " seen" : "") + '" data-topic="' + t.id + '" type="button">' +
        '<span class="tc-ic">' + UI.icon(t.icon, 22) + "</span>" +
        "<b>" + UI.esc(t.name) + "</b>" +
        '<span class="tc-sub">' + (seen ? "看过了" : "点进去看看") + "</span>" +
        "</button>");
    }
    h.push("</div>");

    /* ---- 2. 9 区地图 ---- */
    h.push('<div class="sec-head"><h2>九个成长方向</h2>' +
      '<span class="small muted">' + st.coursesDone + " / " + st.coursesTotal + " 节</span></div>");
    h.push('<p class="sec-note">第一阶段先专注中央区。其余方向正在准备，会陆续开放。</p>');
    h.push(ZoneMap.html());

    /* ---- 3. 轻量课程 ---- */
    h.push('<div class="sec-head"><h2>可以开始的课</h2>' +
      '<span class="small muted">' + st.coursesDone + " / " + st.coursesTotal + "</span></div>");
    if (st.favCount) {
      h.push('<p class="sec-note">收藏了 ' + st.favCount + " 节，在最上面。带 ★ 的就是。</p>");
    }
    h.push(Widgets.lessonList(orderedCourseIds()));

    h.push('<div class="coming-card"><p><b>还有更多方向在准备中</b></p>' +
      '<p class="muted small">不用急着全部走完。先挑一个此刻最想看的，就很好了。</p></div>');

    h.push('<p class="small muted" style="margin:16px 2px 0;line-height:1.8">' +
      UI.esc(TOPICS.footNote) + "</p>");

    return h.join("");
  }

  /* 收藏的课排前面，其余保持原顺序 */
  function orderedCourseIds() {
    var cs = window.COURSES || [], favs = Store.favorites(), out = [], i;
    for (i = 0; i < cs.length; i++) if (favs.indexOf(cs[i].id) !== -1) out.push(cs[i].id);
    for (i = 0; i < cs.length; i++) if (out.indexOf(cs[i].id) === -1) out.push(cs[i].id);
    return out;
  }

  function bind(v) {
    ZoneMap.bind(v);
    Widgets.bindGo(v);
    Widgets.bindLessonRows(v);
    Widgets.bindFav(v, function () { Router.render("explore", {}); });
  }

  /* 右栏：收藏。空的时候不放空卡片，直接给一句话。 */
  function rail() {
    var favs = Store.favorites();
    var h = [];
    h.push('<div class="rail-card">');
    h.push("<h4>" + UI.icon("star", 15) + "我收藏的</h4>");
    if (!favs.length) {
      h.push('<p class="rail-note">还没有收藏。课程行右边的星星，点一下就会出现在这里。</p>');
    } else {
      h.push(Widgets.lessonList(favs));
    }
    h.push("</div>");

    h.push('<div class="rail-card">');
    h.push("<h4>" + UI.icon("compass", 15) + "看过哪些方向</h4>");
    var explored = Store.settings().explored;
    h.push('<p class="rail-note">' +
      (explored.length ? explored.length + " / " + TOPICS.list.length + " 个入口看过了" :
        "还没有点开过任何入口。") + "</p>");
    h.push("</div>");
    return h.join("");
  }

  function bindRail(el) {
    Widgets.bindLessonRows(el);
    Widgets.bindFav(el, function () { Router.render("explore", {}); });
  }

  window.Pages.explore = {
    title: "探索",
    render: render, bind: bind,
    rail: rail, bindRail: bindRail
  };
})();
