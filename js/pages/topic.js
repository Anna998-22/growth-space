/* =========================================================================
 * 成长空间 · 单个探索入口
 * -------------------------------------------------------------------------
 * 这一页的顺序是刻意的：先「被听见」，再「可以往哪走」。
 *
 * 用户点进来是因为有一个具体的感受，不是来买东西的。
 * 所以先把那句话还给他，再给方向，最后一定要留一个「今天什么都不做也行」的出口。
 *
 * 【没有】任何诊断、评估、人格类型、严重程度判断。
 * ========================================================================= */
(function () {
  "use strict";
  window.Pages = window.Pages || {};

  function render(params) {
    var t = params && params.id ? TOPICS.byId(params.id) : null;
    if (!t) {
      return '<div class="empty">' + UI.icon("compass", 30) +
        "<b>没有找到这个入口</b><p>回探索页看看别的方向。</p>" +
        '<button class="btn ghost" data-go="explore" type="button">去探索</button></div>';
    }
    /* 看过就记一笔。刻意不写进 journal —— 浏览入口不算成长活动，
       不该影响连续天数。 */
    Store.markExplored(t.id);

    var h = [];
    h.push('<div class="card" style="border-color:var(--brand-line)">' +
      '<span class="tc-ic" style="display:block;color:var(--brand);margin-bottom:10px">' +
      UI.icon(t.icon, 26) + "</span>" +
      "<h3>" + UI.esc(t.name) + "</h3>" +
      '<p class="state-text">' + UI.esc(t.echo) + "</p>" +
      '<p class="small muted" style="margin-top:12px">' +
      "这里是很多人在某个阶段都会有过的感受。它不代表你有什么问题。</p>" +
      "</div>");

    h.push('<div class="sec-head"><h2>如果想往前看一看</h2></div>');
    h.push('<p class="sec-note">这两节可能和此刻的你有关。不用一次看完。</p>');
    h.push(Widgets.lessonList(t.courses));

    h.push('<div class="coming-card" style="margin-top:6px">' +
      "<p><b>今天什么都不想做，也可以。</b></p>" +
      '<p class="muted small">把这一页关掉，去喝杯水、走一走，也是照顾自己的一种方式。</p>' +
      "</div>");

    h.push('<div class="btnrow" style="margin-top:16px">' +
      '<button class="btn ghost" data-go="explore" type="button">看看别的方向</button></div>');

    h.push('<p class="small muted" style="margin:16px 2px 0;line-height:1.8">' +
      "如果你正经历持续的困扰，找信任的人聊一聊，会比任何网页都更有帮助。</p>");

    return h.join("");
  }

  function bind(v) {
    Widgets.bindGo(v);
    Widgets.bindLessonRows(v);
    Widgets.bindFav(v, function () { Router.render("topic", Router.current().params); });
  }

  window.Pages.topic = {
    hideTab: true,
    title: function (p) {
      var t = TOPICS.byId(p.id);
      return t ? t.name : "探索";
    },
    render: render, bind: bind
  };
})();
