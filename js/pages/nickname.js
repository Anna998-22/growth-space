/* =========================================================================
 * 成长空间 · 第一次问昵称
 * -------------------------------------------------------------------------
 * 只问一次，可以跳过。存的是 gs.profile.nickname，
 * 刻意【不】顺手把 done 设成 true —— 昵称和「做过 15 题」是两件事，
 * 混在一起会让「我的」页误以为用户已经认识过自己。
 *
 * 从「我的」页进来是修改模式（params.edit），文案和落点都不一样。
 * ========================================================================= */
(function () {
  "use strict";
  window.Pages = window.Pages || {};

  function render(params) {
    var edit = !!(params && params.edit);
    var cur = Store.nickname();
    var h = [];

    h.push('<div class="nick-wrap">');
    h.push('<div class="nick-mark">' + UI.icon("sprout", 28) + "</div>");

    if (edit) {
      h.push("<h2>换个称呼</h2>");
      h.push('<p class="nick-sub">想叫什么都可以，留空就是不加称呼。</p>');
    } else {
      h.push("<h2>该怎么称呼你？</h2>");
      h.push('<p class="nick-sub">只是想让这里看起来不那么陌生。<br>' +
        "随便写一个就好，也可以跳过。</p>");
    }

    h.push('<input type="text" data-field="nick" maxlength="12" ' +
      'placeholder="写一个称呼" value="' + UI.esc(cur) + '" ' +
      'autocomplete="off" aria-label="昵称">');

    h.push('<div class="btnrow" style="margin-top:18px">' +
      '<button class="btn primary" data-save-nick="1" type="button">' +
      (edit ? "保存" : "就这样开始") + "</button></div>");

    /* 示例入口和「先跳过」并列，而且放在后面：
       先跳过是「不想写名字」，先看看示例是「还不知道这是干嘛的」——
       后者才是第一次打开的人真正的问题，所以给它一个出口。 */
    if (!edit) {
      h.push('<p class="center nick-alt" style="margin-top:14px">' +
        '<button class="link small" data-skip="1" type="button">先跳过</button>' +
        '<span class="nick-sep" aria-hidden="true">·</span>' +
        '<button class="link small" data-demo="1" type="button">先看看示例</button>' +
        "</p>");
    }

    h.push('<p class="small muted center" style="margin-top:22px;line-height:1.8">' +
      "只存在这台设备上。<br>没有账号，也不会被上传。</p>");
    h.push("</div>");

    return h.join("");
  }

  function bind(v, params) {
    var edit = !!(params && params.edit);
    var input = UI.$('[data-field="nick"]', v);
    var save = UI.$("[data-save-nick]", v);

    function commit(next) {
      var name = input ? input.value : "";
      Store.saveNickname(name);
      UI.toast(name.replace(/^\s+|\s+$/g, "") ? "好，就这样叫你" : "好，那就不加称呼");
      /* 修改模式回「我的」，首次进来去首页 */
      Router.navigate(edit ? "me" : "home", {});
    }

    if (save) save.addEventListener("click", function () { commit(); });
    if (input) input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.keyCode === 13) { e.preventDefault(); commit(); }
    });

    var skip = UI.$("[data-skip]", v);
    if (skip) skip.addEventListener("click", function () {
      Store.saveNickname("");
      Router.navigate("home", {});
    });

    if (input) {
      /* 移动端键盘弹起会顶掉半屏，聚焦后滚一下，别让输入框被挡住 */
      try { input.focus({ preventScroll: true }); } catch (err) { input.focus(); }
    }
  }

  window.Pages.nickname = {
    hideTab: true,
    hideBar: true,
    title: "称呼",
    render: render, bind: bind
  };
})();
