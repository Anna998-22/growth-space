/* =========================================================================
 * 课程（Tab）：第一阶段课程列表
 * ========================================================================= */
(function () {
  "use strict";
  window.Pages = window.Pages || {};

  Pages.course = {
    title: "课程",
    render: function () {
      var st = Store.stats();
      var cs = COURSES;
      var pct = st.coursesTotal ? Math.round(st.coursesDone / st.coursesTotal * 100) : 0;
      var h = [];
      h.push('<p class="page-intro">第一阶段 · 中央区「自我认知与反应」。5 节小课，每节 6–8 分钟，按顺序一节一节来就好。</p>');
      h.push('<div class="bar mini"><i style="width:' + pct + '%"></i></div>');
      h.push('<p class="muted small center">' + st.coursesDone + ' / ' + st.coursesTotal + ' 节已完成</p>');
      for (var i = 0; i < cs.length; i++) {
        var c = cs[i], done = Store.isDone(c.id);
        var mark = done ? "done" : (Store.courseState(c.id) === "started" ? "doing" : "");
        var label = done ? "已完成" : Store.courseState(c.id) === "started" ? "继续 →" : "开始 →";
        h.push('<div class="lesson-row ' + mark + '" data-go-lesson="' + c.id + '" role="button">' +
          '<div class="lr-main"><span class="lr-no">0' + c.order + '</span>' +
          '<div class="lr-text"><b>' + UI.esc(c.title) + '</b>' +
          '<span class="muted small">预计 ' + c.minutes + ' 分钟' + (done ? " · 已完成 ✓" : "") + '</span></div></div>' +
          '<span class="lr-cta">' + label + '</span></div>');
      }
      return h.join("");
    },
    bind: function (v) { window.bindLessonRows(v); }
  };
})();
