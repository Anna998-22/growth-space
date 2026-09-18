/* =========================================================================
 * 成长空间 · 15 题｜第一次认识自己
 * -------------------------------------------------------------------------
 * 一次一题，点选项就往下走。没有分数、没有等级、没有类型。
 *
 * 刻意的设计选择：
 *   - 进度用「03 / 15」和一条极细的线，不用粗百分比条 —— 粗条会把这件事
 *     变成「完成任务」，而它应该是「停下来看看自己」。
 *   - 选项不标对错，选完不立刻给反馈，不制造「答得好不好」的压力。
 *   - 最后两题可以留空直接跳过，跳过不等于失败。
 *   - 课程入口只在【完成之后】出现，而且只是「可以继续看的方向」，
 *     不是「你需要买课才能解决」。
 *
 * 答案里的 tone 是内部权重，只用于生成完成页那句温和的观察，绝不渲染。
 * ========================================================================= */
(function () {
  "use strict";
  window.Pages = window.Pages || {};

  var Q = null;                 /* QUESTIONNAIRE，延迟取，保证脚本顺序无关 */
  var S = { i: 0, answers: {}, rec: null };

  function qs() { return Q || (Q = window.QUESTIONNAIRE); }

  function reset() { S = { i: 0, answers: {}, rec: null }; }

  /* 维度 -> 一个可以继续看的需求入口。只是给个方向，不是结论。 */
  var DIM_TOPIC = {
    understand: "knowself",
    emotion: "anxiety",
    relation: "tired",
    action: "nothing",
    self: "irritable",
    thinking: "racing"
  };

  /* ---------------------------------------------------------------------
   * 答题页
   * ------------------------------------------------------------------- */
  function questionHtml() {
    var list = qs().questions, q = list[S.i];
    var h = [];

    h.push('<div class="q-flow">');
    /* 进度：细线 + 计数，两条都不带百分比数字 */
    h.push('<div class="q-bar"><i style="width:' + Math.round(S.i / list.length * 100) + '%"></i></div>');
    h.push('<p class="q-count">' + UI.courseNo(q.no) + " / " + list.length + "</p>");
    h.push('<p class="q-text">' + UI.esc(q.text) + "</p>");
    h.push('<p class="q-hint">' + (q.kind === "text" ? "可以写，也可以跳过。" : "选最接近现在的你就好，没有对错。") + "</p>");

    if (q.kind === "choice") {
      h.push('<div class="q-opts">');
      for (var i = 0; i < q.options.length; i++) {
        var o = q.options[i];
        var on = S.answers[q.key] === o.v;
        h.push('<button class="q-opt' + (on ? " on" : "") + '" data-pick="' + o.v + '" type="button">' +
          '<span class="q-key">' + o.v + "</span><span>" + UI.esc(o.text) + "</span></button>");
      }
      h.push("</div>");
    } else {
      h.push('<textarea class="q-text-input" data-field="free" placeholder="' +
        UI.esc(q.placeholder || "") + '">' + UI.esc(S.answers[q.key] || "") + "</textarea>");
    }

    h.push('<div class="q-nav">');
    h.push(S.i > 0
      ? '<button class="link" data-prev="1" type="button">‹ 上一题</button>'
      : "<span></span>");
    if (q.kind === "text") {
      h.push('<button class="btn primary" data-next="1" type="button">' +
        (S.i === list.length - 1 ? "写完了" : "下一题") + "</button>");
    } else if (S.answers[q.key]) {
      h.push('<button class="btn ghost" data-next="1" type="button">下一题</button>');
    } else {
      h.push("<span></span>");
    }
    h.push("</div>");

    h.push('<p class="small muted center" style="margin-top:18px">' +
      "这些回答只留在这台设备上，不会上传，也不会有人看到。</p>");
    h.push("</div>");
    return h.join("");
  }

  /* ---------------------------------------------------------------------
   * 完成页
   * ------------------------------------------------------------------- */
  function doneHtml() {
    var rec = S.rec, h = [];
    var top = rec.dims && rec.dims.length ? rec.dims[0] : null;
    var topic = top ? TOPICS.byId(DIM_TOPIC[top]) : null;

    h.push('<div class="q-flow">');
    h.push('<div class="done-head">' +
      '<div class="done-mark">' + UI.icon("sprout", 28) + "</div>" +
      "<h2>" + UI.esc(qs().done.title) + "</h2>" +
      "<p>" + UI.textLines(qs().done.subtitle) + "</p></div>");

    h.push('<div class="rec-sec quote" style="margin-top:20px">' +
      '<h3>此刻的你</h3><p>' + UI.textLines(window.Record.summary(rec)) + "</p></div>");

    h.push('<div class="card">' +
      '<p class="small muted" style="margin:0">你写下的这些，已经收进「记录」里，' +
      "也会成为「成长轨迹」的第一个节点。以后随时可以回来看。</p>" +
      '<div class="btnrow">' +
      '<button class="btn primary" data-open-record="' + UI.esc(rec.entryId || "") + '" type="button">看完整的一份</button>' +
      '<button class="btn ghost" data-go="trace" type="button">去成长轨迹</button>' +
      "</div></div>");

    if (topic) {
      h.push('<div class="sec-head"><h2>如果你想继续往前一步</h2></div>');
      h.push('<p class="sec-note">不是必须。只是如果你愿意，这里有一个方向。</p>');
      h.push('<button class="topic-card" data-topic="' + topic.id + '" type="button">' +
        '<span class="tc-ic">' + UI.icon(topic.icon, 22) + "</span>" +
        "<b>" + UI.esc(topic.name) + "</b>" +
        '<span class="tc-sub">' + UI.esc(topic.echo) + "</span></button>");
      h.push('<div style="margin-top:12px">' + Widgets.lessonList(topic.courses) + "</div>");
      h.push('<p class="small muted" style="margin:10px 2px 0;line-height:1.8">' +
        "今天不想做任何事，也完全可以。这一份记录已经留下了。</p>");
    }

    h.push('<div class="btnrow" style="margin-top:20px">' +
      '<button class="btn ghost" data-go="home" type="button">先回首页</button></div>');
    h.push("</div>");
    return h.join("");
  }

  function render() {
    return S.rec ? doneHtml() : questionHtml();
  }

  function bind(v) {
    if (S.rec) { bindDone(v); return; }
    bindQuestion(v);
  }

  function bindQuestion(v) {
    var list = qs().questions, q = list[S.i];

    var opts = UI.$all("[data-pick]", v);
    for (var i = 0; i < opts.length; i++) (function (b) {
      b.addEventListener("click", function () {
        S.answers[q.key] = b.getAttribute("data-pick");
        next();
      });
    })(opts[i]);

    var nxt = UI.$("[data-next]", v);
    if (nxt) nxt.addEventListener("click", function () {
      if (q.kind === "text") {
        var ta = UI.$('[data-field="free"]', v);
        S.answers[q.key] = ta ? ta.value.replace(/^\s+|\s+$/g, "") : "";
      }
      next();
    });

    var prv = UI.$("[data-prev]", v);
    if (prv) prv.addEventListener("click", function () {
      /* 回上一题时把当前这题的输入也保住，不然回头一看白写了 */
      if (q.kind === "text") {
        var ta2 = UI.$('[data-field="free"]', v);
        if (ta2) S.answers[q.key] = ta2.value.replace(/^\s+|\s+$/g, "");
      }
      S.i = Math.max(0, S.i - 1);
      Router.render("questionnaire", {});
    });
  }

  function next() {
    var list = qs().questions;
    if (S.i < list.length - 1) {
      S.i++;
      Router.render("questionnaire", {});
      return;
    }
    /* 最后一题：生成记录。
       注意顺序 —— 先生成再渲染，否则完成页拿不到 rec。 */
    S.rec = Store.saveAssessment(S.answers);
    Router.render("questionnaire", {});
  }

  function bindDone(v) {
    Widgets.bindGo(v);
    Widgets.bindLessonRows(v);

    var open = UI.$("[data-open-record]", v);
    if (open) open.addEventListener("click", function () {
      var id = open.getAttribute("data-open-record");
      /* 先把流程状态清掉，再回首页、再压入记录详情。
         这样在记录页按返回，落在的是首页，而不是一个已经做完了的答题页。 */
      reset();
      Router.navigate("home", {});
      Router.navigate("record", { id: id });
    });
  }

  window.Pages.questionnaire = {
    hideTab: true,
    title: function () { return S.rec ? "第一次认识自己" : "认识自己"; },
    render: render,
    bind: bind,
    /* 从别处再次进入时重置，避免上次的完成页残留 */
    enter: reset
  };
})();
