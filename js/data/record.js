/* =========================================================================
 * 成长空间 · 《第一次认识自己》记录生成
 * -------------------------------------------------------------------------
 * 由 15 题的【选择分布】生成一份温和的「记录式反馈」。
 *
 * 这不是评估，也不是结论：
 *   - 不计算“你是什么类型”，不给答案打分，不告诉用户哪个答案更好
 *   - 不做心理诊断，不出现任何医学 / 玄学判断
 *   - 使用简单的规则映射（对每个维度累加内部权重），不做复杂算法
 *   - 多个方向接近时，明确说“似乎同时在关注几个方向”，不强行给单一结论
 * ========================================================================= */
(function () {
  "use strict";

  /* 维度 -> 「我想继续了解的方向」的一句话 */
  var DIRECTION = {
    understand: "最近的自己，正在经历什么",
    emotion: "情绪来的时候，它到底想告诉我什么",
    relation: "在关系里，我真正的需要是什么",
    action: "想做的事，怎么才能真的开始",
    self: "我怎么看待自己，又是怎么和自己说话的",
    thinking: "我脑子里那些“理所当然”，是不是只有一种可能"
  };

  /* 做题时“被带走”程度越高，越说明这个方向此刻占着他/她的心 */
  var CARE_ORDER = ["understand", "emotion", "relation", "self", "action", "thinking"];

  /* ---- 维度统计：纯粹是选择分布的汇总，不是评分 ---- */
  function dimWeights(answers) {
    answers = answers || {};
    var qs = window.QUESTIONNAIRE.choiceQuestions();
    var byDim = {}, i, j;

    for (i = 0; i < qs.length; i++) {
      var q = qs[i];
      if (!q.dim) continue;
      var pick = findOption(q, answers[q.key]);
      if (!pick) continue;
      if (!byDim[q.dim]) byDim[q.dim] = { dim: q.dim, weight: 0, count: 0 };
      byDim[q.dim].weight += pick.tone;
      byDim[q.dim].count += 1;
    }

    var out = [];
    for (i = 0; i < CARE_ORDER.length; i++) {
      if (byDim[CARE_ORDER[i]]) out.push(byDim[CARE_ORDER[i]]);
    }
    /* 权重高的排前面；同权重时保持 CARE_ORDER 的稳定顺序 */
    out.sort(function (a, b) { return b.weight - a.weight; });
    return out;
  }

  function findOption(q, v) {
    if (v == null) return null;
    for (var i = 0; i < q.options.length; i++) if (q.options[i].v === v) return q.options[i];
    return null;
  }

  /* 取最突出的若干维度；与最高权重相差 <=1 的都算“同时在关注” */
  function topDims(dims, max) {
    if (!dims.length) return [];
    var top = dims[0].weight, out = [];
    for (var i = 0; i < dims.length && out.length < max; i++) {
      if (top - dims[i].weight > 1) break;
      if (dims[i].weight <= 0) break;
      out.push(dims[i].dim);
    }
    return out;
  }

  function names(dims, joinWord) {
    var out = [];
    for (var i = 0; i < dims.length; i++) out.push(window.QUESTIONNAIRE.dims[dims[i]] || dims[i]);
    return out.join(joinWord || "、");
  }

  /* ---- 各段文字 ---- */

  function stateText(answers) {
    var q1 = window.QUESTIONNAIRE.byKey("q1");
    var pick = q1 ? findOption(q1, answers.q1) : null;
    if (!pick) return "最近的你，开始愿意停下来看看自己。这件事本身，就已经是开始。";
    if (pick.tone === 0) {
      return "最近的你，对自己正在经历什么是比较清楚的。你知道自己走在什么样的路上，这让接下来的每一步都有个落脚点。";
    }
    if (pick.tone === 1) {
      return "最近的你，有些部分能感觉到，还有些部分暂时说不清。这很正常——说不清的地方，往往是还没被认真看过的地方。";
    }
    if (pick.tone === 2) {
      return "最近的你，好像常常被情绪或事情推着走，反应比觉察来得更快一些。这不代表你做错了什么，只是那几秒的间隙，还没被留出来。";
    }
    return "最近的你，好像有点不知道自己怎么了。在这样的时候还愿意坐下来回答问题，本身就是一次很温柔的自我照顾。";
  }

  function careText(dims, top) {
    if (!top.length) return "你还没有特别集中的方向。也许此刻更重要的，只是先允许自己停一停。";
    /* 空行是用 <br><br> 拼出来的，周围没有别的排版线索时，
       那个空档看起来不像「分段」，像「渲染漏了一块」——
       所以这里都收成单换行，改用一句话把方向讲完。 */
    if (top.length === 1) {
      return "最近的你，似乎正在更多地关注：\n" + names(top) + "。";
    }
    return "最近的你，似乎同时在关注几个方向：\n" + names(top) +
      "。\n它们不必同时解决，先挑一个最想看的就好。";
  }

  function noticeText(answers, dims) {
    var parts = [];

    var q2 = window.QUESTIONNAIRE.byKey("q2");
    var p2 = q2 ? findOption(q2, answers.q2) : null;
    if (p2) {
      if (p2.tone <= 1) parts.push("你能比较快地发现自己正在有什么情绪，这是很珍贵的能力。");
      else parts.push("你留意到，情绪往往是在反应之后才被认出来的。");
    }

    var q3 = window.QUESTIONNAIRE.byKey("q3");
    var p3 = q3 ? findOption(q3, answers.q3) : null;
    if (p3) {
      if (p3.tone === 0) parts.push("不舒服的时候，你会先停下来看看自己为什么不舒服。");
      else if (p3.tone === 3) parts.push("你写下的那种“表面没什么、之后一直想着”，说明有些情绪还在等你回头看看它。");
      else parts.push("你不舒服的时候会有反应，但之后愿意回头想一想。");
    }

    var q7 = window.QUESTIONNAIRE.byKey("q7");
    var p7 = q7 ? findOption(q7, answers.q7) : null;
    if (p7 && p7.tone >= 2) parts.push("对自己，你好像比对别人更严格一些。");
    else if (p7 && p7.tone === 0) parts.push("面对做得不好的地方，你能先接受它，再想办法调整。");

    if (!parts.length) parts.push("你愿意花几分钟，认真回答这些问题——这本身就是一次自我观察。");
    return parts.join("");
  }

  function directionText(top, dims) {
    var use = top.length ? top : [dims.length ? dims[0].dim : "understand"];
    var lines = [];
    for (var i = 0; i < use.length; i++) {
      var d = DIRECTION[use[i]];
      if (d) lines.push("· " + d);
    }
    if (!lines.length) return "· 最近的自己，正在经历什么";
    return lines.join("\n");
  }

  function futureText(answers) {
    var t = (answers && answers.q15) ? String(answers.q15).replace(/^\s+|\s+$/g, "") : "";
    if (!t) return "（这一句，你留给了自己。）";
    return t;
  }

  function changeText(answers) {
    var t = (answers && answers.q14) ? String(answers.q14).replace(/^\s+|\s+$/g, "") : "";
    if (!t) return "";
    return t;
  }

  /* ---- 组装 ---- */
  function build(answers) {
    answers = answers || {};
    var dims = dimWeights(answers);
    var top = topDims(dims, 3);
    var sections = [];

    sections.push({ k: "state", label: "我最近的状态", text: stateText(answers) });

    var change = changeText(answers);
    if (change) {
      sections.push({ k: "change", label: "我最近最想改变的", text: change });
    }

    sections.push({ k: "care", label: "我比较在意的事情", text: careText(dims, top) });
    sections.push({ k: "notice", label: "我注意到的自己", text: noticeText(answers, dims) });
    sections.push({ k: "direction", label: "我想继续了解的方向", text: directionText(top, dims) });
    sections.push({ k: "future", label: "我写给未来自己的话", text: futureText(answers) });

    return {
      kind: "first-self",
      title: "第一次认识自己",
      quote: "我开始认真看看最近的自己。",
      sections: sections,
      dims: top,
      dimNames: names(top)
    };
  }

  /* 完成页顶部的「此刻的你」——比记录更短的一句观察 */
  function summary(record) {
    var n = record.dimNames;
    if (!n) return "最近的你，开始愿意停下来看看自己。";
    return "最近的你，似乎正在更多地关注：\n" + n + "。";
  }

  window.Record = {
    build: build,
    summary: summary,
    dimWeights: dimWeights,
    topDims: topDims,
    direction: DIRECTION
  };
})();
