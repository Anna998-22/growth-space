/* =========================================================================
 * 我的成长档案：当前状态 / 统计 / 已完成课程 / 成长记录时间线 / 阶段复盘
 * ========================================================================= */
(function () {
  "use strict";
  window.Pages = window.Pages || {};

  function journalLabel(t) {
    return { assessment: "成长状态自评", course: "完成课程", practice: "做了一次练习" }[t] || "成长记录";
  }

  Pages.archive = {
    title: "我的档案",
    render: function () {
      var prof = Store.getProfile();
      var st = Store.stats();
      var h = [];

      /* ---- 当前成长状态 ---- */
      if (prof && prof.portrait) {
        var pt = prof.portrait;
        h.push('<section class="card">');
        h.push('<div class="card-head"><span class="label">当前成长状态</span>' +
          (prof.revisedAt ? '<span class="muted">最近更新 ' + UI.friendlyDate(dateStr(prof.revisedAt)) + '</span>' : "") +
          '</div>');
        h.push('<p class="state-text">' + UI.esc(pt.state) + '</p>');
        h.push('<div class="focus"><div class="focus-label">值得关注的方向</div>');
        for (var f = 0; f < pt.focus.length; f++) h.push('<p class="focus-item">· ' + UI.esc(pt.focus[f].text) + '</p>');
        h.push('</div>');
        h.push('<div class="focus-label">推荐练习</div>');
        var recs = pt.recommendIds;
        h.push('<div class="chips">');
        for (var c = 0; c < recs.length; c++) {
          var cc = Course.byId(recs[c]);
          if (cc) h.push('<button class="chip" data-go-lesson="' + cc.id + '">《' + UI.esc(cc.title) + '》</button>');
        }
        h.push('</div>');
        h.push('<button class="btn ghost smallmt" data-assess="1">重新自评，更新我的状态</button>');
        h.push('</section>');
      } else {
        h.push('<section class="card"><p class="muted">还没有做过成长状态自评。</p>' +
          '<button class="btn primary" data-assess="1">现在做一次自评</button></section>');
      }

      /* ---- 统计 ---- */
      h.push('<section class="statgrid">' +
        statCell("完成课程", st.coursesDone + " / " + st.coursesTotal) +
        statCell("练习次数", st.practiceDone + " 种") +
        statCell("连续成长", st.streak + " 天") +
        statCell("本周记录", st.thisWeek + " 条") +
        '</section>');

      /* ---- 已完成课程 ---- */
      var done = Store.doneIds();
      h.push('<section class="card"><div class="card-head"><span class="label">已完成课程</span><span class="muted">' + done.length + ' / ' + st.coursesTotal + '</span></div>');
      if (!done.length) {
        h.push('<p class="muted small">还没完成课程。去首页开始第一课吧。</p>');
      } else {
        h.push('<div class="chips">');
        for (var d = 0; d < done.length; d++) {
          var c = Course.byId(done[d]);
          if (c) h.push('<button class="chip ok" data-go-lesson="' + c.id + '">✓ 《' + UI.esc(c.title) + '》</button>');
        }
        h.push('</div>');
      }
      h.push('</section>');

      /* ---- 阶段复盘 ---- */
      h.push(reviewBlock(done.length, st.coursesTotal));

      /* ---- 成长记录时间线 ---- */
      var j = Store.journal();
      h.push('<section class="card"><div class="card-head"><span class="label">成长记录</span><span class="muted">共 ' + j.length + ' 条</span></div>');
      if (!j.length) {
        h.push('<p class="muted small">这里会按时间记录你的每一步成长。</p>');
      } else {
        h.push('<ul class="timeline">');
        for (var k = j.length - 1; k >= 0; k--) {
          var it = j[k];
          h.push('<li><span class="tl-date">' + UI.friendlyDate(it.date) + '<em>' + UI.friendlyTime(it.ts) + '</em></span>' +
            '<div class="tl-main"><b>' + UI.esc(it.note || journalLabel(it.type)) + '</b>' +
            (it.meta && it.meta.courseId ?
              '<button class="link small" data-go-lesson="' + it.meta.courseId + '">再看一遍 →</button>' : "") +
            '</div></li>');
        }
        h.push('</ul>');
      }
      h.push('</section>');

      h.push('<p class="muted small center" style="margin:14px 0 4px">数据只保存在这台设备的浏览器里。</p>');
      return h.join("");
    },
    bind: function (v) {
      var l = UI.$all("[data-go-lesson]", v);
      for (var i = 0; i < l.length; i++) (function (b) {
        b.addEventListener("click", function () {
          var id = b.getAttribute("data-go-lesson");
          Store.markStarted(id);
          Router.navigate("lesson", { id: id });
        });
      })(l[i]);
      var a = UI.$all("[data-assess]", v);
      for (var j = 0; j < a.length; j++) a[j].addEventListener("click", function () {
        Router.navigate("assess", { mode: "redo" });
      });
      var g = UI.$all("[data-go]", v);
      for (var m = 0; m < g.length; m++) (function (b) {
        b.addEventListener("click", function () { Router.navigate(b.getAttribute("data-go")); });
      })(g[m]);
    }
  };

  function dateStr(ts) { return UI.dateToStr(new Date(ts)); }
  function statCell(k, v) {
    return '<div class="stat"><b>' + UI.esc(v) + '</b><span>' + k + '</span></div>';
  }
  function reviewBlock(done, total) {
    var h = ['<section class="card review">', '<div class="card-head"><span class="label">阶段复盘</span></div>'];
    if (done === 0) h.push('<p>你还没有完成课程。从第一课《' + UI.esc(titleByOrder(1)) + '》开始，给自己 10 分钟就好。</p>');
    else if (done < total) h.push('<p>你已经完成 ' + done + ' / ' + total + ' 节。你的下一节是《' + UI.esc(titleByOrder(done + 1)) + '》。记得：走完，比走快更重要。</p>');
    else h.push('<p>第一阶段 ' + total + ' 节全部完成了。可以过几天回来复习一遍，也可以重新自评一次，看看自己有没有什么变化。</p>');
    h.push('<div class="btnrow"><button class="btn ghost" data-assess="1">重新自评</button>');
    if (done === 0) h.push('<button class="btn primary" data-go="home">去开始第一课</button>');
    else h.push('<button class="btn primary" data-go="course">回到课程</button>');
    h.push('</div></section>');
    return h.join("");
  }
  function titleByOrder(o) {
    for (var i = 0; i < COURSES.length; i++) if (COURSES[i].order === o) return COURSES[i].title;
    return "";
  }
})();
