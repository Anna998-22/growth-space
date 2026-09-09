/* =========================================================================
 * 成长空间 · 启动与装配
 * 首次进入（无本地画像）→ 成长评估；已有画像 → 首页。
 * ========================================================================= */
(function () {
  "use strict";

  Router.init();

  var prof = Store.getProfile();
  if (prof && prof.done) {
    Router.navigate("home");
  } else {
    Router.render("assess", {});   // 首次进入：整屏成长评估
  }

  /* 调试用：在浏览器控制台执行 devReset() 即可清空本机数据、重新走一遍 */
  window.devReset = function () {
    Store.resetAll();
    location.reload();
  };
})();
