/* =========================================================================
 * 练习（Tab）：今日练习 + 全部练习 + 练习记录历史
 * ========================================================================= */
(function () {
  "use strict";
  window.Pages = window.Pages || {};

  Pages.practice = {
    title: "练习",
    render: function () {
      var st = Store.stats();
      var recId = Store.nextCourseId();
      var rec = recId ? Course.byId(recId) : null;
      var h = [];
      h.push('<p class="page-intro">练习跟着课程走：读完一节，再做一次小练习。练习会自动记入你的成长记录。</p>');

      if (rec) {
        h.push('<section class="card today-practice">' +
          '<div class="card-head"><span class="label">今日练习</span><span class="muted">第 ' + rec.order + ' 节 · ' + rec.minutes + ' 分钟</span></div>' +
          '<h3>' + UI.esc(rec.practice.title) + '</h3>' +
          '<ol class="steps">');
        var steps = rec.practice.steps;
        for (var s = 0; s < steps.length; s++) h.push('<li>' + UI.esc(steps[s]) + '</li>');
        h.push('</ol><button class="btn primary wide" data-go-lesson="' + rec.id + '">去做这节练习</button></section>');
      } else {
        h.push('<section class="card done-card"><h3>第一阶段练习都完成啦</h3>' +
          '<p>随时可以回来重做任一节练习，或到档案里回顾之前的记录。</p></section>');
      }

      /* 全部练习 */
      h.push('<section class="card"><div class="card-head"><span class="label">全部练习</span></div>');
      var cs = COURSES;
      for (var i = 0; i < cs.length; i++) {
        var c = cs[i];
        var practiced = Store.isDone(c.id);
        h.push('<div class="lesson-row ' + (practiced ? "done" : "") + '" data-go-lesson="' + c.id + '" role="button">' +
          '<div class="lr-main"><div class="lr-text"><b>' + UI.esc(c.practice.title) + '</b>' +
          '<span class="muted small">' + UI.esc(c.title) + (practiced ? " · 已完成 ✓" : "") + '</span></div></div>' +
          '<span class="lr-cta">' + (practiced ? "重做 →" : "去练 →") + '</span></div>');
      }
      h.push('</section>');

      /* 历史 */
      var arr = Store.practices();
      h.push('<section class="card"><div class="card-head"><span class="label">练习记录</span><span class="muted">共 ' + arr.length + ' 次</span></div>');
      if (!arr.length) {
        h.push('<p class="muted small">还没有练习记录。完成第一节课后，这里会出现你的第一次练习。</p>');
      } else {
        h.push('<ul class="timeline">');
        for (var k = 0; k < Math.min(arr.length, 30); k++) {
          var it = arr[k];
          h.push('<li><span class="tl-date">' + UI.friendlyDate(it.date) + '</span>' +
            '<div class="tl-main"><b>' + UI.esc(courseTitleOf(it.courseId)) + '</b>' +
            (it.note ? '<p class="note">' + UI.esc(it.note) + '</p>' : '<p class="note muted">·</p>') +
            '</div></li>');
        }
        h.push('</ul>');
      }
      h.push('</section>');
      return h.join("");
    },
    bind: function (v) {
      var els = UI.$all("[data-go-lesson]", v);
      for (var i = 0; i < els.length; i++) (function (b) {
        b.addEventListener("click", function () {
          var id = b.getAttribute("data-go-lesson");
          Store.markStarted(id);
          Router.navigate("lesson", { id: id });
        });
      })(els[i]);
    }
  };

  function courseTitleOf(id) {
    var c = Course.byId(id);
    return c ? "《" + c.title + "》" : "练习";
  }
})();
