/* =========================================================================
 * 成长空间 · 启动
 * -------------------------------------------------------------------------
 * 两件事，顺序不能颠倒：
 *   1. migrate() —— 给老用户的 profile 补 answersVersion 标记（只加字段，
 *      绝不动 answers / portrait）。必须在任何页面读 profile 之前跑。
 *   2. Router.init() —— 生成两套导航（手机底栏 + 桌面侧栏，同一份 TABS）。
 *
 * 首屏落点：
 *   - 从没被问过称呼（nicknameSetAt 不存在）→ 先问一次，可以跳过
 *   - 其余情况 → URL 上的 #页码（认得出的话），否则首页
 * 刻意【不】把没做过 15 题的人直接扔进答题页 ——
 * 首页第一屏本来就是这个入口，强行进入会变成「被考试」。
 * ========================================================================= */
(function () {
  "use strict";

  /* 纯静态单页，不需要 history —— hash 只决定首屏落在哪一页，
     之后的路由仍由 Router 自己管（它不会回写 hash）。
     有了这一步，#成长轨迹 这类链接才能被收藏、被直接打开。 */
  function firstPage() {
    var name = String(location.hash || "").replace(/^#\/?/, "");
    return (name && window.Pages[name]) ? name : "home";
  }

  /* ---- 示例模式 ---------------------------------------------------------
     所有页面都是在 render 的时候读数据的，所以进出示例只需要
     「换掉数据源 → 重新导航一次」，没有别的收尾工作。 */
  function syncDemo() {
    var on = Store.isDemo();
    var bar = UI.$("#demoBar");
    if (bar) bar.hidden = !on;
    /* body 上的类会顶开固定的横幅（见 style.css 里 --demoh 那几条） */
    document.body.classList.toggle("demo-on", on);
  }

  function enterDemo() {
    Store.startDemo();
    syncDemo();
    Router.navigate("home", {});
    UI.toast("随便点，不会留下任何记录");
  }

  function exitDemo() {
    Store.stopDemo();
    syncDemo();
    /* 没设过称呼的人退回称呼页，否则首页会「你好，」后面空着一块 */
    var p = Store.getProfile();
    Router.navigate(p && p.nicknameSetAt !== undefined ? "home" : "nickname", {});
  }

  function boot() {
    Store.migrate();
    Router.init();

    var exit = UI.$("#demoExit");
    if (exit) exit.addEventListener("click", exitDemo);
    /* 进入示例的入口有两个（称呼页 / 首页空状态），
       都走事件委托 —— 它们是重渲染出来的，直接绑会随重渲染一起没掉 */
    document.addEventListener("click", function (e) {
      var t = e.target;
      while (t && t !== document) {
        if (t.hasAttribute && t.hasAttribute("data-demo")) {
          e.preventDefault();
          enterDemo();
          return;
        }
        t = t.parentNode;
      }
    });

    var p = Store.getProfile();
    if (!p || p.nicknameSetAt === undefined) Router.navigate("nickname", {});
    else Router.navigate(firstPage(), {});
  }

  /* 清空本地数据 + 回到首屏，方便反复验收 */
  window.devReset = function () {
    Store.resetAll();
    UI.toast("本地数据已清空");
    Router.navigate("nickname", {});
  };

  /* 控制台里手动进出示例，验收用 */
  window.devDemo = function (on) {
    if (on === false) exitDemo(); else enterDemo();
    return Store.isDemo() ? "示例模式：开" : "示例模式：关";
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
