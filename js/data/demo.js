/* =========================================================================
 * 成长空间 · 示例数据
 * -------------------------------------------------------------------------
 * 给「先看看示例」用：一份「用了十来天」的数据，让朋友一打开就能看到
 * 首页有轨迹、成长轨迹有节点、我的画像有内容 —— 而不是一片空状态。
 *
 * 两个关键性质：
 *
 * 1. 它【完全不碰 LocalStorage】。进入示例模式后，Store 的读写都改道到
 *    这个内存对象，用同一个拦截面 —— 所以十个页面自动全部生效，
 *    不需要每个页面各写一份示例逻辑。朋友在示例里点什么都不会留下痕迹，
 *    退出即消失，也绝不会覆盖他自己的真实数据。
 *
 *    附带的好处：iOS 上 localStorage 被禁用时（file:// 下有可能），
 *    示例模式反而是唯一能完整跑起来的部分 —— 因为它本来就不用存储。
 *
 * 2. 日期一律「相对今天」算。不管哪一天打开，看起来都是刚用过的样子。
 *
 * 入口：称呼页和首页空状态的「先看看示例」。退出：顶部那条示例横幅。
 * ========================================================================= */
(function () {
  "use strict";

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function iso(off) {
    var d = new Date(Date.now() - off * 86400000);
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function ts(off) { return Date.now() - off * 86400000; }

  function build() {
    var j = [], n = 0;

    function add(off, type, note, meta) {
      n++;
      j.push({
        /* id 带 demo 前缀：万一它出现在真实数据里（不应该），一眼认得出来 */
        id: "demo" + n,
        date: iso(off),
        /* 同一天可能有多条，加 n 保证排序稳定 */
        ts: ts(off) + n,
        type: type, note: note || "", meta: meta || {}
      });
    }

    /* 11 天前：第一次认识自己 —— 整条轨迹的起点 */
    var rec = window.Record.build({
      q1: "B", q2: "C", q3: "D", q4: "B", q5: "B", q6: "D", q7: "C", q8: "D",
      q9: "C", q10: "C", q11: "B", q12: "C", q13: "C",
      q14: "想少一点地责怪自己，多一点地照顾自己。",
      q15: "不用急着变好，先别丢下自己。"
    });
    add(11, "assessment", rec.title, { kind: "first-self", record: rec });

    /* 小记与心情。刻意留几天空白 —— 心情曲线本来就会断开，不连线 */
    add(10, "note", "今天开完会又反复想了两小时，写下来好像就没那么重了。");
    add(10, "mood", "", { moodId: "m2", score: 2, label: "有点沉" });
    add(9, "course", "完成课程《我为什么总是下意识地这样反应？》", {
      courseId: "c1",
      reflections: [{ q: "你最容易在什么时刻被自动反应带走？", a: "别人语气稍微冷一点，我第一反应就是自己是不是做错了。" }]
    });
    add(9, "mood", "", { moodId: "m3", score: 3, label: "还算平静" });
    add(8, "note", "试着在回消息之前停了三秒。很难，但做到了两次。");
    add(6, "course", "完成课程《看见自己的自动化反应》", {
      courseId: "c2",
      reflections: [{ q: "你的触发点通常是什么？", a: "被否定的时候。" }]
    });
    add(6, "mood", "", { moodId: "m4", score: 4, label: "还不错" });
    add(5, "note", "今天什么也没做。允许自己什么也没做。");
    add(4, "mood", "", { moodId: "m1", score: 1, label: "很低落" });
    add(3, "note", "和妈妈打了电话，说起小时候的事，忽然理解了一点。");
    add(3, "mood", "", { moodId: "m3", score: 3, label: "还算平静" });
    add(1, "note", "把上次那节课的练习又做了一遍，这次写得比上次长。");
    add(1, "mood", "", { moodId: "m4", score: 4, label: "还不错" });
    add(0, "mood", "", { moodId: "m5", score: 5, label: "挺好的" });

    j.sort(function (a, b) { return a.ts - b.ts; });

    /* 键名用的是 Store 内部的短名（profile / progress / …），
       不是 "gs.profile" —— 拦截发生在 raw(k) 之前。 */
    return {
      profile: {
        done: true,
        startedAt: ts(11),
        nickname: "小舟",
        nicknameSetAt: ts(11),
        answersVersion: 2,
        answers: { q1: "B" },
        portrait: rec
      },
      progress: {
        c1: { status: "done", finishedAt: ts(9) },
        c2: { status: "done", finishedAt: ts(6) },
        c3: { status: "started" }
      },
      journal: j,
      practices: [
        { id: "c1-1", courseId: "c1", note: "", date: iso(9), ts: ts(9) },
        { id: "c2-1", courseId: "c2", note: "", date: iso(6), ts: ts(6) }
      ],
      favorites: ["c4"],
      settings: { remind: { on: true, time: "20:00" }, explored: ["anxiety"] }
    };
  }

  window.DemoData = { build: build };
})();
