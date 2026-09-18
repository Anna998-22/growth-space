/* =========================================================================
 * 成长空间 · 9 区地图 + 单个方向详情
 * -------------------------------------------------------------------------
 * 9 区从「一个 tab」降级成「探索页里的一个区块」——它仍然必须被渲染出来。
 * js/data/regions.js 的 9 个对象、顺序、pos、id 一行不动，这里只负责画。
 *
 * ZoneMap 是给别处复用的：探索页把地图直接嵌进去。
 * ========================================================================= */
(function () {
  "use strict";
  window.Pages = window.Pages || {};

  function zoneStatusText(r) {
    return r.status === "live" ? "可学习" : "即将开放";
  }

  function doneOf(regionId) {
    var cs = window.Course ? Course.ofRegion(regionId) : [];
    var done = 0;
    for (var i = 0; i < cs.length; i++) if (Store.isDone(cs[i].id)) done++;
    return { done: done, total: cs.length };
  }


  var ZoneMap = {
    html: function () {
      var cells = [], R = GData.regions;
      for (var i = 0; i < R.length; i++) {
        var r = R[i], live = r.status === "live";
        var count = "";
        if (live) {
          var d = doneOf(r.id);
          count = '<span class="zc-count">' + d.done + " / " + d.total + "</span>";
        }
        cells.push('<a class="zone-cell' + (live ? " live" : "") +
          '" style="grid-row:' + r.pos.r + ";grid-column:" + r.pos.c +
          '" data-zone="' + r.id + '">' +
          '<span class="zc-name">' + UI.esc(r.name) + "</span>" + count +
          '<span class="zc-status' + (live ? " ok" : "") + '">' + zoneStatusText(r) + "</span></a>");
      }
      return '<div class="zonemap">' + cells.join("") + "</div>";
    },
    bind: function (root) {
      var els = UI.$all(".zone-cell", root);
      for (var i = 0; i < els.length; i++) (function (b) {
        b.addEventListener("click", function () {
          Router.navigate("zone", { id: b.getAttribute("data-zone") });
        });
      })(els[i]);
    }
  };

  window.ZoneMap = ZoneMap;

  /* ---- 单个方向的详情 ---- */
  window.Pages.zone = {
    hideTab: true,
    title: function (p) {
      var r = GData.regionById(p.id);
      return r ? r.name : "成长方向";
    },
    render: function (p) {
      var r = GData.regionById(p.id);
      if (!r) return '<div class="empty">' + UI.icon("compass", 30) +
        "<b>没有找到这个方向</b><p>它可能已经调整过了，回探索页看看别的。</p></div>";
      var h = [];

      h.push('<section class="card">' +
        '<div class="zone-head"><h2>' + UI.esc(r.name) + "</h2>" +
        '<span class="tag ' + r.status + '">' + zoneStatusText(r) + "</span></div>" +
        '<p class="sub">' + UI.esc(r.intro) + "</p></section>");

      h.push('<section class="mods"><div class="label">这个方向包含</div>');
      for (var i = 0; i < r.subTopics.length; i++) {
        h.push('<div class="mod' + (r.status === "live" ? "" : " soon") + '"><span class="dot"></span>' +
          UI.esc(r.subTopics[i]) +
          (r.status === "soon" ? '<span class="soon-tag">即将开放</span>' : "") +
          "</div>");
      }
      h.push("</section>");

      if (r.status === "live") {
        var cs = Course.ofRegion(r.id);
        h.push('<section class="lessons"><div class="label">本区课程</div>');
        for (var k = 0; k < cs.length; k++) h.push(Widgets.lessonRow(cs[k]));
        h.push("</section>");
      } else {
        h.push('<section class="coming-card"><p>这个方向还在准备中。</p>' +
          '<p class="muted small">不用等它。中央区那几节，现在就可以开始。</p></section>');
      }
      return h.join("");
    },
    bind: function (v) {
      Widgets.bindLessonRows(v);
      Widgets.bindFav(v);
    }
  };
})();
