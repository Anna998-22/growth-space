/* =========================================================================
 * 成长路线（9 区 3×3 空间地图） + 区域详情
 * ========================================================================= */
(function () {
  "use strict";
  window.Pages = window.Pages || {};

  function zoneStatusText(r) {
    if (r.status === "live") return "可学习";
    return "即将开放";
  }

  Pages.route = {
    title: "成长路线",
    render: function () {
      var st = Store.stats();
      var cells = [], R = GData.regions;
      for (var i = 0; i < R.length; i++) {
        var r = R[i], live = r.status === "live";
        var count = "";
        if (live) {
          var total = (Course.ofRegion(r.id)).length;
          var done = 0, c;
          for (var j = 0; j < total; j++) { c = Course.ofRegion(r.id)[j]; if (Store.isDone(c.id)) done++; }
          count = '<span class="zc-count">' + done + ' / ' + total + '</span>';
        }
        cells.push('<a class="zone-cell' + (live ? " live" : "") + '" style="grid-row:' + r.pos.r + ';grid-column:' + r.pos.c +
          '" data-zone="' + r.id + '"><span class="zc-name">' + UI.esc(r.name) + '</span>' +
          count +
          '<span class="zc-status' + (live ? " ok" : "") + '">' + zoneStatusText(r) + '</span></a>');
      }
      return '<p class="page-intro">9 个成长方向。第一阶段先专注中央区「自我认知与反应」，其余方向正在准备，会陆续开放。</p>' +
        '<div class="zonemap">' + cells.join("") + '</div>' +
        '<p class="muted small center">总进度：' + st.coursesDone + ' / ' + st.coursesTotal + ' 节</p>';
    },
    bind: function (v) {
      var els = UI.$all(".zone-cell", v);
      for (var i = 0; i < els.length; i++) (function (b) {
        b.addEventListener("click", function () {
          Router.navigate("zone", { id: b.getAttribute("data-zone") });
        });
      })(els[i]);
    }
  };

  Pages.zone = {
    hideTab: true,
    title: function (p) {
      var r = GData.regionById(p.id); return r ? r.name : "成长方向";
    },
    render: function (p) {
      var r = GData.regionById(p.id);
      if (!r) return '<p>没有这个区域。</p>';
      var h = [];
      h.push('<section class="card">' +
        '<div class="zone-head"><h2>' + UI.esc(r.name) + '</h2>' +
        '<span class="tag ' + r.status + '">' + zoneStatusText(r) + '</span></div>' +
        '<p class="sub">' + UI.esc(r.intro) + '</p></section>');

      /* 子主题模块 */
      h.push('<section class="mods"><div class="label">这个方向包含</div>');
      for (var i = 0; i < r.subTopics.length; i++) {
        h.push('<div class="mod' + (r.status === "live" ? "" : " soon") + '"><span class="dot"></span>' +
          UI.esc(r.subTopics[i]) +
          (r.status === "soon" ? '<span class="soon-tag">1 课时 · 即将开放</span>' : "") +
          '</div>');
      }
      h.push('</section>');

      if (r.status === "live") {
        var cs = Course.ofRegion(r.id);
        h.push('<section class="lessons"><div class="label">本区课程</div>');
        for (var k = 0; k < cs.length; k++) {
          var c = cs[k], done = Store.isDone(c.id);
          h.push(lessonRow(c, done, true));
        }
        h.push('</section>');
      } else {
        h.push('<section class="coming-card"><p>这个区域正在认真准备中。</p><p class="muted small">第一阶段建议先把中央区走完，其余方向会陆续在这里开放。</p></section>');
      }
      return h.join("");
    },
    bind: function (v) {
      bindLessonRows(v);
    }
  };

  function lessonRow(c, done, clickable) {
    var mark = done ? "done" : (Store.courseState(c.id) === "started" ? "doing" : "");
    var label = done ? "已完成" : Store.courseState(c.id) === "started" ? "继续" : "开始";
    return '<div class="lesson-row ' + mark + '" data-go-lesson="' + c.id + '" role="button">' +
      '<div class="lr-main"><span class="lr-no">' + (c.order < 10 ? "0" : "") + c.order + '</span>' +
      '<div class="lr-text"><b>' + UI.esc(c.title) + '</b><span class="muted small">预计 ' + c.minutes + ' 分钟' + (done ? " · 已完成" : "") + '</span></div></div>' +
      '<span class="lr-cta">' + label + ' →</span></div>';
  }

  /* 供课程列表页复用：把页面里的课程行绑上进入学习 */
  function bindLessonRows(v) {
    var rows = UI.$all("[data-go-lesson]", v);
    for (var i = 0; i < rows.length; i++) (function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-go-lesson");
        Store.markStarted(id);
        Router.navigate("lesson", { id: id });
      });
    })(rows[i]);
  }
  window.bindLessonRows = bindLessonRows;
})();
