/* =========================================================================
 * 成长空间 · 成长状态自评（数据 + 画像规则）
 * 只输出「当前状态 / 值得关注的方向 / 推荐练习」，
 * 不做人格类型、不做心理等级结论。
 * ========================================================================= */
(function () {
  "use strict";

  var SCALE_WORDS = ["很少", "偶尔", "有时", "经常", "很明显"];

  var QUESTIONS = [
    { key: "q1", text: "当事情发生时，我常常会马上就有反应。", needSign: "high" },
    { key: "q2", text: "我能注意到自己的情绪正在变化。", needSign: "low" },
    { key: "q3", text: "我能看出，在类似的事情上，我常常用同一种方式应对。", needSign: "low" },
    { key: "q4", text: "情绪很冲的时候，我能先停下来，而不是立刻发作。", needSign: "low" },
    { key: "q5", text: "我会回头想想那些反复困扰我的问题。", needSign: "low" }
  ];

  var FOCUS_TEXT = {
    q1: "练习在反应之前，先给自己一个“停一下”的间隙",
    q2: "练习留意自己情绪的变化——哪怕只是“我在生气”“我在紧张”",
    q3: "练习认出自己在哪些相似情境里，反复用同一种方式应对",
    q4: "练习在情绪最冲的时候，先拉开一点距离，再决定怎么回应",
    q5: "练习定期回头看看，自己正在重复哪些模式"
  };
  /* 每个方向对应中央区里的课程 */
  var COURSE_MAP = { q1: "c1", q2: "c3", q3: "c2", q4: "c4", q5: "c5" };

  function courseById(id) {
    var cs = window.COURSES || [];
    for (var i = 0; i < cs.length; i++) if (cs[i].id === id) return cs[i];
    return null;
  }

  /* answers: {q1:1..5, ...} */
  function buildPortrait(answers) {
    var total = 0, scored = [];
    for (var i = 0; i < QUESTIONS.length; i++) {
      var q = QUESTIONS[i], v = answers[q.key];
      v = Math.max(1, Math.min(5, Number(v) || 3));
      var need = q.needSign === "high" ? v : 6 - v;   // 需要关注的程度 1..5
      total += need;
      scored.push({ q: q.key, need: need });
    }
    scored.sort(function (a, b) { return b.need - a.need; });

    var focus = [], seen = {};
    for (var k = 0; k < scored.length && focus.length < 2; k++) {
      if (scored[k].need >= 2 && !seen[scored[k].q]) {
        seen[scored[k].q] = true;
        focus.push({ q: scored[k].q, text: FOCUS_TEXT[scored[k].q], need: scored[k].need });
      }
    }
    if (!focus.length) {
      /* 五项都比较稳时，仍给一个温和的“保持方向” */
      focus.push({ q: "q2", text: "现在的状态已经比较稳，可以继续在“留意自己的反应”上保持练习", need: 0 });
    }

    /* 推荐课程：由关注方向映射，不足时补第一课 */
    var recommendIds = [], seenC = {};
    for (var m = 0; m < focus.length; m++) {
      var cid = COURSE_MAP[focus[m].q];
      if (cid && !seenC[cid]) { seenC[cid] = true; recommendIds.push(cid); }
    }
    if (!recommendIds.length) recommendIds.push("c1");

    var state;
    if (total <= 9) {
      state = "你已经开始留意自己的反应，这个起点本身就很难得。接下来的练习，会把“事后想明白”，慢慢练成“当场就看见”。";
    } else if (total <= 16) {
      state = "大多数时候，你是在事情过去之后才想明白；真正难的，是“当下的那几秒”。这几节课程，会陪你在最容易被带走的时刻，练习先停一停。";
    } else {
      state = "情绪或冲突来得很快的时候，你常常来不及刹车。这里不会评判你，只会陪你一小步一小步地练：看见它、暂停一下、再选择怎么回应。";
    }

    return {
      state: state,
      focus: focus.map(function (f) { return { q: f.q, text: f.text }; }),
      recommendIds: recommendIds,
      raw: { total: total, answers: answers }
    };
  }

  function scaleWord(n) { return SCALE_WORDS[n - 1] || ""; }

  window.ASSESS = {
    intro: "下面 5 个句子，请按最近一两周的真实感受，为每句选一个最接近的数字。没有对错，也不是考试。",
    questions: QUESTIONS,
    scaleWords: SCALE_WORDS,
    scaleWord: scaleWord,
    buildPortrait: buildPortrait,
    courseMap: COURSE_MAP
  };
})();
