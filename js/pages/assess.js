/* =========================================================================
 * 成长状态自评（整屏）：5 题 × 1–5 档 → 生成画像 → 进入首页 / 返回档案
 * ========================================================================= */
(function () {
  "use strict";
  window.Pages = window.Pages || {};

  function legend() {
    var w = ASSESS.scaleWords;
    return '<div class="scale-legend"><span>' + w[0] + ' ' + 1 + '</span><span class="dim">1 —— 5</span><span>5 ' + w[4] + '</span></div>';
  }

  function formHtml() {
    var h = [];
    h.push('<div class="assess">');
    h.push('<div class="assess-top"><span class="brand-mini">成长空间</span><h2>成长状态自评</h2></div>');
    h.push('<p class="page-intro">' + UI.esc(ASSESS.intro) + '</p>');
    h.push(legend());
    var qs = ASSESS.questions;
    for (var i = 0; i < qs.length; i++) {
      var q = qs[i];
      h.push('<section class="card aq" data-q="' + q.key + '">' +
        '<p class="aq-no">' + (i + 1) + '</p>' +
        '<p class="aq-text">' + UI.esc(q.text) + '</p>' +
        '<div class="scale">');
      for (var n = 1; n <= 5; n++) {
        h.push('<button class="sc" data-v="' + n + '"><b>' + n + '</b><span>' + UI.esc(ASSESS.scaleWord(n)) + '</span></button>');
      }
      h.push('</div></section>');
    }
    h.push('<div class="action-bar"><button class="btn primary wide" id="assessGo" disabled>完成，看看我的成长画像</button></div>');
    h.push('</div>');
    return h.join("");
  }

  function resultHtml(pt, first) {
    var h = [];
    h.push('<div class="assess">');
    h.push('<div class="assess-top"><h2>我的成长画像</h2><p class="muted small">这不是标签，也不是分数，只是此刻的一个起点。</p></div>');
    h.push('<section class="card"><div class="card-head"><span class="label">当前状态</span></div><p class="state-text">' + UI.esc(pt.state) + '</p></section>');
    h.push('<section class="card"><div class="card-head"><span class="label">值得关注的方向</span></div>');
    for (var f = 0; f < pt.focus.length; f++) h.push('<p class="focus-item">· ' + UI.esc(pt.focus[f].text) + '</p>');
    h.push('</section>');
    h.push('<section class="card"><div class="card-head"><span class="label">推荐练习</span></div>');
    h.push('<div class="chips">');
    for (var c = 0; c < pt.recommendIds.length; c++) {
      var cc = Course.byId(pt.recommendIds[c]);
      if (cc) h.push('<button class="chip ok" data-go-lesson="' + cc.id + '">《' + UI.esc(cc.title) + '》</button>');
    }
    h.push('</div></section>');
    h.push('<div class="btnrow">');
    if (first) h.push('<button class="btn primary wide" data-go="home">开始今天的成长 →</button>');
    else h.push('<button class="btn primary wide" data-go="archive">回到我的档案</button>');
    h.push('</div>');
    h.push('</div>');
    return h.join("");
  }

  Pages.assess = {
    hideTab: true,
    hideBar: true,
    title: "成长状态自评",
    render: function () { return formHtml(); },
    bind: function (v, params) {
      var answers = {};
      var cells = UI.$all(".aq", v);
      for (var i = 0; i < cells.length; i++) (function (cell) {
        var qk = cell.getAttribute("data-q");
        var scs = UI.$all(".sc", cell);
        for (var j = 0; j < scs.length; j++) (function (b) {
          b.addEventListener("click", function () {
            var n = b.getAttribute("data-v");
            answers[qk] = n;
            for (var k = 0; k < scs.length; k++) scs[k].classList.toggle("on", scs[k] === b);
            UI.toast(ASSESS.scaleWord(Number(n)));
            if (Object.keys(answers).length === ASSESS.questions.length) UI.$("#assessGo", v).disabled = false;
          });
        })(scs[j]);
      })(cells[i]);

      var go = UI.$("#assessGo", v);
      if (go) go.addEventListener("click", function () {
        go.disabled = true;
        var prev = Store.getProfile();
        var first = !prev;
        var pt = ASSESS.buildPortrait(answers);
        var profile = {
          done: true,
          answers: answers,
          portrait: pt,
          startedAt: prev ? prev.startedAt : Date.now(),
          revisedAt: Date.now()
        };
        Store.saveProfile(profile);
        Store.addJournal("assessment", first ? "完成首次成长状态自评" : "更新成长状态自评", {});
        UI.$("#view").innerHTML = resultHtml(pt, first);
        bindResult();
      });
    }
  };

  function bindResult() {
    var v = UI.$("#view");
    var r = UI.$all("[data-go-lesson]", v);
    for (var i = 0; i < r.length; i++) (function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-go-lesson");
        Store.markStarted(id);
        Router.navigate("lesson", { id: id });
      });
    })(r[i]);
    var g = UI.$all("[data-go]", v);
    for (var j = 0; j < g.length; j++) (function (b) {
      b.addEventListener("click", function () { Router.navigate(b.getAttribute("data-go")); });
    })(g[j]);
    window.scrollTo(0, 0);
  }
})();
