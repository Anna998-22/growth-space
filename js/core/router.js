/* =========================================================================
 * 成长空间 · 路由与页面切换
 * 页面由 window.Pages[name] 提供：
 *   { title?, render(params)->html, bind(viewEl, params), hideTab?, hideBar? }
 * 底部 5 个根页面(tab) + 下钻页面(zone/lesson/assess)。
 * ========================================================================= */
(function () {
  "use strict";

  var TABS = ["home", "route", "course", "practice", "archive"];
  var TAB_NAMES = { home: "首页", route: "成长路线", course: "课程", practice: "练习", archive: "我的档案" };

  var state = { tab: "home", stack: [] };

  function isTab(name) { return TAB_NAMES.hasOwnProperty(name); }

  function render(name, params) {
    var page = window.Pages[name];
    if (!page) { name = "home"; page = window.Pages.home; }
    var v = UI.$("#view");
    v.innerHTML = page.render(params || {});
    if (page.bind) page.bind(v, params || {});

    /* 顶栏 */
    var hideBar = !!(page.hideBar || name === "assess");
    var topbar = UI.$("#topbar");
    if (topbar) topbar.classList.toggle("hidden", hideBar);
    UI.$("#btnBack") && UI.$("#btnBack").classList.toggle("hidden", isTab(name));

    var titleEl = UI.$("#pageTitle");
    if (titleEl) {
      var t = (typeof page.title === "function" ? page.title(params) : page.title) || TAB_NAMES[name] || "成长空间";
      titleEl.textContent = t;
    }
    document.body.classList.toggle("no-bar", hideBar);
    document.body.classList.toggle("no-tab", !!(page.hideTab || name === "assess"));

    /* 底部导航 */
    var tabbar = UI.$("#tabbar");
    if (tabbar) {
      var hideTab = !!(page.hideTab || name === "assess");
      tabbar.classList.toggle("hidden", hideTab);
      var btns = UI.$all("#tabbar .tab");
      for (var i = 0; i < btns.length; i++) {
        var active = btns[i].getAttribute("data-nav") === name;
        btns[i].classList.toggle("on", active);
      }
    }
    window.scrollTo(0, 0);
    if (window.afterNav) window.afterNav(name, params);
    state.current = { name: name, params: params || {} };
    return state.current;
  }

  function navigate(name, params) {
    if (isTab(name)) { state.tab = name; state.stack = []; }
    else { state.stack.push({ name: name, params: params || {} }); }
    return render(name, params);
  }

  function back() {
    var target;
    if (state.stack.length) { state.stack.pop(); }
    if (state.stack.length) { var top = state.stack[state.stack.length - 1]; target = top; }
    else { target = { name: state.tab, params: {} }; }
    return render(target.name, target.params);
  }

  function current() { return state.current || { name: state.tab }; }

  function init() {
    UI.$("#btnBack").addEventListener("click", function () { back(); });
    var btns = UI.$all("#tabbar .tab");
    for (var i = 0; i < btns.length; i++) {
      (function (b) {
        b.addEventListener("click", function () { navigate(b.getAttribute("data-nav")); });
      })(btns[i]);
    }
  }

  window.Router = {
    TABS: TABS, TAB_NAMES: TAB_NAMES,
    navigate: navigate, back: back, render: render, init: init, current: current
  };
})();
