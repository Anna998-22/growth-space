/* =========================================================================
 * 成长空间 · 「15 个问题｜第一次认识自己」
 * -------------------------------------------------------------------------
 * 这不是心理测试，也不是人格测试。
 * 它的目的只有一个：让用户停下来，看一看最近的自己。
 *
 * 因此这里刻意【没有】：
 *   - 正确答案 / 得分 / 等级 / 类型
 *   - 任何医学、心理疾病、玄学判断
 *   - 任何“你属于 XX”的结论
 *
 * options[].tone 是【内部权重，绝不渲染】：0 表示更觉察，3 表示更被带走。
 * 它只用来生成完成页那句温和的“最近的你，似乎正在更多地关注……”，
 * 不会展示给用户，也不会告诉用户哪个答案更好。
 * ========================================================================= */
(function () {
  "use strict";

  /* 维度：用于生成「我比较在意的事情」与「我想继续了解的方向」 */
  var DIMS = {
    understand: "自我理解",
    emotion: "情绪与反应",
    relation: "关系与沟通",
    action: "行动与习惯",
    self: "自我接纳",
    thinking: "思维与认知"
  };

  var QUESTIONS = [
    /* ---- 十个日常自我观察 ---- */
    {
      key: "q1", no: 1, dim: "understand", kind: "choice",
      group: "日常",
      title: "最近的自己",
      text: "最近这段时间，你对自己的状态更接近哪一种感觉？",
      /* 设计意图：让用户开始进行自我观察 */
      options: [
        { v: "A", text: "我大概知道自己在经历什么", tone: 0 },
        { v: "B", text: "有些事情能感觉到，但还说不清", tone: 1 },
        { v: "C", text: "经常被情绪或事情带着走", tone: 2 },
        { v: "D", text: "最近有点不知道自己怎么了", tone: 3 }
      ]
    },
    {
      key: "q2", no: 2, dim: "emotion", kind: "choice",
      group: "日常",
      title: "情绪",
      text: "当一种明显的情绪出现时，你通常会：",
      options: [
        { v: "A", text: "能比较快发现自己正在有什么情绪", tone: 0 },
        { v: "B", text: "过一会儿才意识到", tone: 1 },
        { v: "C", text: "通常先做出反应，之后才发现自己情绪很大", tone: 2 },
        { v: "D", text: "我常常说不清自己到底是什么感觉", tone: 3 }
      ]
    },
    {
      key: "q3", no: 3, dim: "emotion", kind: "choice",
      group: "日常",
      title: "触发",
      text: "当别人说了一句话让你不舒服时，你更容易：",
      /* 设计意图：观察自动反应与觉察之间的距离 */
      options: [
        { v: "A", text: "先停一下，看看自己为什么不舒服", tone: 0 },
        { v: "B", text: "当下会有情绪，但之后会想一想", tone: 1 },
        { v: "C", text: "很容易马上反驳或防御", tone: 2 },
        { v: "D", text: "表面没什么，之后却一直想着这件事", tone: 3 }
      ]
    },
    {
      key: "q4", no: 4, dim: "thinking", kind: "choice",
      group: "日常",
      title: "遇到问题",
      text: "当一件事情没有按照预期发生时，你通常会：",
      /* 设计意图：参考“向外归责 / 向内反思”的思路，
         但不告诉用户哪一个答案更好 —— 所以这里没有对错标注 */
      options: [
        { v: "A", text: "先看看事情本身，再想自己能做什么", tone: 0 },
        { v: "B", text: "先抱怨一下，然后再处理", tone: 1 },
        { v: "C", text: "很容易觉得是别人或环境的问题", tone: 2 },
        { v: "D", text: "会反复想“为什么偏偏是我”", tone: 3 }
      ]
    },
    {
      key: "q5", no: 5, dim: "thinking", kind: "choice",
      group: "日常",
      title: "思维",
      text: "当你发现一件自己原本相信的事情可能并不完全正确时：",
      options: [
        { v: "A", text: "我愿意重新看看", tone: 0 },
        { v: "B", text: "会有点不舒服，但可以继续了解", tone: 1 },
        { v: "C", text: "第一反应通常是反驳", tone: 2 },
        { v: "D", text: "我很难改变原来的看法", tone: 3 }
      ]
    },
    {
      key: "q6", no: 6, dim: "action", kind: "choice",
      group: "日常",
      title: "专注",
      text: "当你需要完成一件事情时：",
      options: [
        { v: "A", text: "通常可以比较专注地完成", tone: 0 },
        { v: "B", text: "容易被手机或其他事情打断", tone: 1 },
        { v: "C", text: "经常同时做很多事情", tone: 2 },
        { v: "D", text: "明知道要做，却很难真正开始", tone: 3 }
      ]
    },
    {
      key: "q7", no: 7, dim: "self", kind: "choice",
      group: "日常",
      title: "自我接纳",
      text: "当你发现自己某方面做得不好时，你更容易：",
      options: [
        { v: "A", text: "接受自己现在的状态，然后想办法调整", tone: 0 },
        { v: "B", text: "会失望，但过一阵子可以放下", tone: 1 },
        { v: "C", text: "很容易责怪自己", tone: 2 },
        { v: "D", text: "会反复拿自己和别人比较", tone: 3 }
      ]
    },
    {
      key: "q8", no: 8, dim: "relation", kind: "choice",
      group: "日常",
      title: "关系",
      text: "和别人发生分歧时，你通常：",
      options: [
        { v: "A", text: "希望先理解彼此为什么会这样想", tone: 0 },
        { v: "B", text: "会表达自己的想法，但也愿意听对方", tone: 1 },
        { v: "C", text: "很容易觉得对方根本不理解我", tone: 2 },
        { v: "D", text: "通常会选择不说，自己消化", tone: 3 }
      ]
    },
    {
      key: "q9", no: 9, dim: "relation", kind: "choice",
      group: "日常",
      title: "表达",
      text: "当你真正不舒服的时候，你更容易：",
      options: [
        { v: "A", text: "尝试说清楚自己的感受和需要", tone: 0 },
        { v: "B", text: "会说，但经常不知道怎么表达", tone: 1 },
        { v: "C", text: "先忍着，忍到受不了才说", tone: 2 },
        { v: "D", text: "干脆不说，希望对方自己能发现", tone: 3 }
      ]
    },
    {
      key: "q10", no: 10, dim: "thinking", kind: "choice",
      group: "日常",
      title: "信息",
      text: "最近接触很多信息、观点和建议时：",
      /* 设计意图：参考“信息过滤能力”，转化为日常生活中的信息选择 */
      options: [
        { v: "A", text: "我会先判断什么对自己真正有用", tone: 0 },
        { v: "B", text: "通常会先收藏起来，以后再看", tone: 1 },
        { v: "C", text: "很容易被别人的观点影响", tone: 2 },
        { v: "D", text: "信息太多时，我反而不知道自己真正想要什么", tone: 3 }
      ]
    },

    /* ---- 三个情境选择 ---- */
    {
      key: "q11", no: 11, dim: "self", kind: "choice",
      group: "情境",
      title: "情境：被否定",
      text: "你认真做了一件事情，却被别人直接否定了。你的第一反应更接近：",
      /* 设计意图：回答后不评价用户，只记录选择 */
      options: [
        { v: "A", text: "“他说的具体是什么？我先听听。”", tone: 0 },
        { v: "B", text: "“我有点难受，但我想知道他说得有没有道理。”", tone: 1 },
        { v: "C", text: "“他凭什么这么说？”", tone: 2 },
        { v: "D", text: "“算了，可能是我真的不行。”", tone: 3 }
      ]
    },
    {
      key: "q12", no: 12, dim: "action", kind: "choice",
      group: "情境",
      title: "情境：计划被打乱",
      text: "今天原本安排好的事情突然全部被打乱。你更可能：",
      /* 设计意图：参考“反应固化 / 反应变通”，但不直接告诉用户理论名称 */
      options: [
        { v: "A", text: "重新整理一下，看看现在还能做什么", tone: 0 },
        { v: "B", text: "会烦躁一阵子，然后慢慢调整", tone: 1 },
        { v: "C", text: "整个人的节奏都会被打乱", tone: 2 },
        { v: "D", text: "直接放弃今天的计划", tone: 3 }
      ]
    },
    {
      key: "q13", no: 13, dim: "relation", kind: "choice",
      group: "情境",
      title: "情境：关系中的冲突",
      text: "你和一个重要的人发生了争执。冷静下来以后，你更可能：",
      options: [
        { v: "A", text: "想知道自己真正介意的是什么", tone: 0 },
        { v: "B", text: "会想想对方可能在想什么", tone: 1 },
        { v: "C", text: "一直回想对方说过的话", tone: 2 },
        { v: "D", text: "更希望对方先来理解我", tone: 3 }
      ]
    },

    /* ---- 两个开放问题 ---- */
    {
      key: "q14", no: 14, dim: "", kind: "text",
      group: "开放",
      title: "停下来看看自己",
      text: "如果不用考虑别人怎么看，最近的你，最想改变的一件事情是什么？",
      placeholder: "写一句就好，不需要完整。"
    },
    {
      key: "q15", no: 15, dim: "", kind: "text",
      group: "开放",
      title: "给现在的自己",
      text: "如果现在的你可以对一个月后的自己说一句话，你想说什么？",
      placeholder: "可以是一句话，也可以什么都不说。"
    }
  ];

  var CHOICE_COUNT = 13;
  var TEXT_COUNT = 2;

  function byKey(k) {
    for (var i = 0; i < QUESTIONS.length; i++) if (QUESTIONS[i].key === k) return QUESTIONS[i];
    return null;
  }

  /* 仅取选择题（用于维度统计） */
  function choiceQuestions() {
    var out = [];
    for (var i = 0; i < QUESTIONS.length; i++) if (QUESTIONS[i].kind === "choice") out.push(QUESTIONS[i]);
    return out;
  }

  window.QUESTIONNAIRE = {
    intro: {
      title: "最近的你，还好吗？",
      subtitle: "用 15 个问题，花几分钟认识一下现在的自己。",
      note: "没有标准答案。\n选最接近现在的你就好。",
      meta: "约 5 分钟 · 15 个问题",
      startLabel: "开始探索 →"
    },
    done: {
      title: "第一次认识自己",
      subtitle: "这不是一个结论。\n只是把此刻的你，认真留下来。"
    },
    dims: DIMS,
    questions: QUESTIONS,
    byKey: byKey,
    choiceQuestions: choiceQuestions,
    choiceCount: CHOICE_COUNT,
    textCount: TEXT_COUNT,
    total: QUESTIONS.length
  };
})();
