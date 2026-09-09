/* =========================================================================
 * 首页：今天想给自己留 10 分钟吗？→ 今日课程 / 今日练习 / 成长进度
 * ========================================================================= */
(function () {
  "use strict";
  window.Pages = window.Pages || {};

  function statCell(k, v) {
    return '<div class="stat"><b>' + UI.esc(v) + '</b><span>' + k + '</span></div>';
  }

  Pages.home = {
    title: "成长空间",
    render: function () {
      var st = Store.stats();
      var esc = UI.esc;
      var hr = new Date().getHours();
      var greet = hr < 5 ? "夜深了，辛苦了" : hr < 11 ? "早上好" : hr < 14 ? "中午好" : hr < 18 ? "下午好" : "晚上好";
      var recId = Store.nextCourseId();
      var rec = recId ? Course.byId(recId) : null;
      var h = [];

      h.push('<section class="hero">' +
        '<div class="hero-row"><span class="brand-mini">成长空间</span><span class="streak-chip">连续成长 ' + st.streak + ' 天</span></div>' +
        '<p class="greet">' + greet + '</p>' +
        '<h2 class="hero-q">今天，你想给自己<br>留 10 分钟吗？</h2></section>');

      if (rec) {
        var stateLabel = Store.isDone(rec.id) ? "再学一次" : (Store.courseState(rec.id) === "started" ? "继续" : "开始");
        h.push('<section class="card today-card">' +
          '<div class="card-head"><span class="label">今日课程</span></div>' +
          '<h3>' + esc(rec.title) + '</h3>' +
          '<p class="meta muted">预计 ' + rec.minutes + ' 分钟 · 中央区 · 第 ' + rec.order + ' 节</p>' +
          '<p class="sub">' + esc(rec.summary) + '</p>' +
          '<button class="btn primary wide" data-go-lesson="' + rec.id + '">' + stateLabel + '今天的成长</button>' +
          '</section>');

        h.push('<section class="card soft">' +
          '<div class="card-head"><span class="label">今日练习</span></div>' +
          '<p class="pt">' + esc(rec.practice.title) + '</p>' +
          '<button class="link" data-go-lesson="' + rec.id + '">去做练习 →</button>' +
          '</section>');
      } else {
        h.push('<section class="card done-card">' +
          '<div class="big">完成</div>' +
          '<h3>第一阶段 5 节都走完了</h3>' +
          '<p>你已经有“在反应之前先看见它”的能力了。之后可以把练习偶尔带回来重温，也可以去档案里看看自己走过的路。</p>' +
          '<div class="btnrow"><button class="btn ghost" data-go="archive">去看我的档案</button>' +
          '<button class="btn primary" data-assess="1">更新一次状态</button></div></section>');
      }

      var pct = st.coursesTotal ? Math.round(st.coursesDone / st.coursesTotal * 100) : 0;
      h.push('<section class="card">' +
        '<div class="card-head"><span class="label">我的成长进度</span><span class="muted">' + st.coursesDone + ' / ' + st.coursesTotal + ' 节</span></div>' +
        '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
        '<div class="statrow">' +
        statCell("课程", st.coursesDone + " / " + st.coursesTotal) +
        statCell("练习", st.practiceDone + " / " + st.coursesTotal) +
        statCell("连续成长", st.streak + " 天") +
        '</div></section>');

      h.push('<p class="today-note">' +
        (st.todayActive ? "今天已经留下成长记录 ☺" : "今天还没有记录——完成今天这节课，就会留下今天的第一笔。") +
        '</p>');

      return h.join("");
    },
    bind: function (v) {
      var els = UI.$all("[data-go-lesson]", v);
      for (var i = 0; i < els.length; i++) els[i].addEventListener("click", goLesson);
      var a = UI.$all("[data-go]", v);
      for (var j = 0; j < a.length; j++) (function (b) {
        b.addEventListener("click", function () { Router.navigate(b.getAttribute("data-go")); });
      })(a[j]);
      var as = UI.$all("[data-assess]", v);
      for (var k = 0; k < as.length; k++) as[k].addEventListener("click", function () {
        Router.navigate("assess", { mode: "redo" });
      });
    }
  };
  function goLesson(e) {
    var id = e.currentTarget.getAttribute("data-go-lesson");
    Store.markStarted(id);
    Router.navigate("lesson", { id: id });
  }
})();
