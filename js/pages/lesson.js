/* =========================================================================
 * 课程学习页：阅读 → 今日练习 → 自我反思 → 完成/保存 → 完成反馈
 * 数据在“完成”那一刻一次性写入（课程进度 + 练习 + 成长记录）。
 * ========================================================================= */
(function () {
  "use strict";
  window.Pages = window.Pages || {};

  var cur = null;          // 当前课程
  var state = null;        // { stage:0..3, note:'', refs:[] }

  function reset(c) {
    cur = c;
    state = { stage: 0, note: "", refs: [], saved: false };
  }

  function bodyHtml(c) {
    var h = [];
    for (var i = 0; i < c.body.length; i++) {
      var b = c.body[i];
      if (b.t === "h") h.push('<h4 class="body-h">' + UI.esc(b.x) + '</h4>');
      else if (b.t === "case") h.push('<div class="case"><span class="case-tag">一个生活里的场景</span><p>' + UI.esc(b.x) + '</p></div>');
      else h.push('<p class="body-p">' + UI.esc(b.x) + '</p>');
    }
    return h.join("");
  }

  /* 顶部进度指示：三个步骤 */
  function stepDots(stage) {
    var labels = ["阅读", "练习", "反思"];
    var h = ['<div class="stepper">'];
    for (var i = 0; i < 3; i++) {
      var cls = i < stage ? "on" : (i === stage ? "cur" : "");
      h.push('<span class="step ' + cls + '"><i>' + (i + 1) + '</i>' + labels[i] + '</span>');
    }
    h.push('</div>');
    return h.join("");
  }

  function draw() {
    var c = cur, s = state;
    var done = Store.isDone(c.id);
    var v = UI.$("#view");
    var h = [];

    /* 头信息 */
    h.push('<div class="lesson-head">');
    h.push('<div class="lh-meta"><span class="tag ok">中央区 · 自我认知与反应</span><span class="muted">预计 ' + c.minutes + ' 分钟</span></div>');
    h.push('<h2>' + UI.esc(c.title) + '</h2>');
    h.push('<p class="sub">' + UI.esc(c.summary) + '</p>');
    if (done && s.stage < 3) h.push('<div class="ribbon">已完成 ✓ · 可以复习，或再做一次练习/反思</div>');
    h.push(stepDots(Math.min(s.stage, 2)));
    h.push('</div>');

    if (s.stage === 0) {
      h.push('<article class="reading">' + bodyHtml(c) + '</article>');
      h.push('<div class="action-bar"><button class="btn primary wide" id="toPractice">我已经读完 → 进入今日练习</button></div>');
    } else if (s.stage === 1) {
      h.push('<section class="card">');
      h.push('<div class="card-head"><span class="label">今日练习</span></div>');
      h.push('<h3>' + UI.esc(c.practice.title) + '</h3>');
      h.push('<ol class="steps">');
      for (var i = 0; i < c.practice.steps.length; i++) h.push('<li>' + UI.esc(c.practice.steps[i]) + '</li>');
      h.push('</ol>');
      h.push('<label class="field"><span>' + UI.esc(c.practice.prompt) + '</span>' +
        '<textarea id="note" rows="4" placeholder="写点什么，或先留白……"></textarea></label>');
      h.push('<button class="btn primary wide" id="savePractice">保存我的练习</button>');
      h.push('</section>');
      h.push('<div class="btnrow center"><button class="link" id="backRead">← 回到课程内容</button></div>');
    } else if (s.stage === 2) {
      h.push('<section class="card">');
      h.push('<div class="card-head"><span class="label">自我反思</span><span class="muted">想写就写，写不下也没关系</span></div>');
      for (var r = 0; r < c.reflections.length; r++) {
        var q = c.reflections[r];
        h.push('<label class="field"><span class="q">' + UI.esc(q.q) + '</span>' +
          (q.hint ? '<span class="hint">' + UI.esc(q.hint) + '</span>' : "") +
          '<textarea data-ref="' + r + '" rows="2" placeholder="写下你的想法……"></textarea></label>');
      }
      var btn = done ? "保存这次的记录" : "完成这节课";
      h.push('<button class="btn primary wide bigpad" id="finishLesson">' + btn + '</button>');
      h.push('</section>');
      h.push('<div class="btnrow center"><button class="link" id="backPractice">← 回到练习</button></div>');
    } else {
      /* stage 3：完成反馈 */
      h.push('<section class="card finish">');
      h.push('<div class="big">完成</div>');
      h.push('<h3>' + (done ? '这节课复习完成' : '这节课完成') + '</h3>');
      h.push('<p class="sub">' + UI.esc(c.feedback.text) + '</p>');
      h.push('<div class="tip"><span>接下来</span>' + UI.esc(c.feedback.tip) + '</div>');
      var next = Course.nextAfter(c.id);
      h.push('<div class="btnrow">');
      h.push('<button class="btn primary" id="goHome">回首页</button>');
      if (next) h.push('<button class="btn ghost" id="goNext">下一节</button>');
      h.push('<button class="btn ghost" id="goArchive">我的档案</button>');
      h.push('</div></section>');
    }

    v.innerHTML = h.join("");
    bind();
    window.scrollTo(0, 0);
  }

  function bind() {
    var s = state;
    var el1 = UI.$("#toPractice", UI.$("#view"));
    if (el1) el1.addEventListener("click", function () { s.stage = 1; draw(); });

    var elB = UI.$("#backRead", UI.$("#view"));
    if (elB) elB.addEventListener("click", function () { s.stage = 0; draw(); });

    var save = UI.$("#savePractice", UI.$("#view"));
    if (save) {
      save.addEventListener("click", function () {
        s.note = UI.$("#note", UI.$("#view")).value.trim();
        s.saved = true;
        UI.toast("练习已保存");
        s.stage = 2;
        draw();
      });
    }

    var elP = UI.$("#backPractice", UI.$("#view"));
    if (elP) elP.addEventListener("click", function () { s.stage = 1; draw(); });

    /* 反思输入即时同步 */
    var refs = UI.$all("[data-ref]", UI.$("#view"));
    for (var i = 0; i < refs.length; i++) (function (ta) {
      var idx = Number(ta.getAttribute("data-ref"));
      if (s.refs[idx]) ta.value = s.refs[idx];
      ta.addEventListener("input", function () { s.refs[idx] = ta.value.trim(); });
    })(refs[i]);

    var fin = UI.$("#finishLesson", UI.$("#view"));
    if (fin) {
      fin.addEventListener("click", function () {
        fin.disabled = true;
        var done = Store.isDone(cur.id);
        if (done) Store.logSession(cur.id, { practiceNote: s.note });
        else Store.completeCourse(cur.id, { practiceNote: s.note, reflections: s.refs.slice() });
        s.stage = 3;
        draw();
      });
    }

    var home = UI.$("#goHome", UI.$("#view"));
    if (home) home.addEventListener("click", function () { Router.navigate("home"); });
    var nxt = UI.$("#goNext", UI.$("#view"));
    if (nxt) nxt.addEventListener("click", function () {
      var nx = Course.nextAfter(cur.id);
      if (nx) Router.render("lesson", { id: nx.id });
    });
    var arch = UI.$("#goArchive", UI.$("#view"));
    if (arch) arch.addEventListener("click", function () { Router.navigate("archive"); });
  }

  Pages.lesson = {
    hideTab: true,
    title: function (p) {
      var c = Course.byId(p.id);
      return c ? "第 " + c.order + " 节" : "课程";
    },
    render: function (p) {
      var c = Course.byId(p.id) || COURSES[0];
      reset(c);
      return '<div class="page-loading">…</div>';
    },
    bind: function () { draw(); }
  };
})();
