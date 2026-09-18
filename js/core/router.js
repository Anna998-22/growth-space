/* =========================================================================
 * 成长空间 · 路由与页面切换
 * -------------------------------------------------------------------------
 * 页面由 window.Pages[name] 提供：
 *   { title?, render(params)->html, bind(viewEl, params),
 *     rail?(params)->html, bindRail?(railEl, params),   // 可选右栏（宽屏）
 *     hideTab?, hideBar? }                              // 整屏页用
 *
 * 导航只有一份数据源 TABS：桌面侧栏与手机底栏都由它生成，
 * 将来改名 / 调顺序只改这里一处。
 * ========================================================================= */
(function () {
  "use strict";

  var TABS = [
    { id: "home",    label: "首页",     icon: "home" },
    { id: "trace",   label: "成长轨迹", icon: "path" },
    { id: "notes",   label: "记录",     icon: "pen" },
    { id: "explore", label: "探索",     icon: "compass" },
    { id: "me",      label: "我的",     icon: "user" }
  ];

  var TAB_NAMES = {};
  for (var t = 0; t < TABS.length; t++) TAB_NAMES[TABS[t].id] = TABS[t].label;

  var state = { tab: "home", stack: [] };

  function isTab(name) { return TAB_NAMES.hasOwnProperty(name); }

  /* ---- 导航渲染：两个容器共用一份数据 ---- */
  function buildNav(host) {
    if (!host) return;
    var h = [];
    for (var i = 0; i < TABS.length; i++) {
      h.push('<button class="tab" data-nav="' + TABS[i].id + '" type="button">' +
        UI.icon(TABS[i].icon, 20) + "<span>" + TABS[i].label + "</span></button>");
    }
    host.innerHTML = h.join("");
    /* 事件委托：整个容器一个监听。
       逐按钮绑的话，将来重建导航（换顺序/换文案）监听会全部丢失。 */
    host.addEventListener("click", function (e) {
      var b = e.target;
      while (b && b !== host) {
        if (b.getAttribute && b.getAttribute("data-nav")) {
          navigate(b.getAttribute("data-nav"));
          return;
        }
        b = b.parentNode;
      }
    });
  }

  function render(name, params) {
    var page = window.Pages[name];
    if (!page) { name = "home"; page = window.Pages.home; }
    params = params || {};

    var v = UI.$("#view");
    v.innerHTML = page.render(params);
    if (page.bind) page.bind(v, params);

    /* ---- 右栏：容器在外壳，内容由页面填 ----
       必须【无条件先清空】：漏了这一步，用户会带着首页的「今日小记」
       出现在成长轨迹页。 */
    var rail2 = UI.$("#rail2");
    if (rail2) {
      rail2.innerHTML = page.rail ? page.rail(params) : "";
      if (page.rail && page.bindRail) page.bindRail(rail2, params);
    }
    document.body.classList.toggle("has-rail", !!page.rail);

    /* ---- 顶栏 ---- */
    var hideBar = !!page.hideBar;
    var topbar = UI.$("#topbar");
    if (topbar) topbar.classList.toggle("hidden", hideBar);
    var back = UI.$("#btnBack");
    if (back) back.classList.toggle("hidden", isTab(name));
    var titleEl = UI.$("#pageTitle");
    if (titleEl) {
      var tt = (typeof page.title === "function" ? page.title(params) : page.title);
      titleEl.textContent = tt || TAB_NAMES[name] || "成长空间";
    }
    document.body.classList.toggle("no-bar", hideBar);

    /* ---- 底部导航 / 侧栏 ---- */
    var hideTab = !!page.hideTab;
    document.body.classList.toggle("no-tab", hideTab);
    var tabbar = UI.$("#tabbar");
    if (tabbar) tabbar.classList.toggle("hidden", hideTab);

    var navs = UI.$all("[data-nav]");
    for (var i = 0; i < navs.length; i++) {
      navs[i].classList.toggle("on", navs[i].getAttribute("data-nav") === name);
    }

    window.scrollTo(0, 0);
    if (window.afterNav) window.afterNav(name, params);
    state.current = { name: name, params: params };
    return state.current;
  }

  /* page.enter 只在【用户主动进入】时调用，页面自己调 render() 重绘时不调。
     15 题那种「一页多步」的流程靠它复位，否则第二次进来会停在完成页。 */
  function enter(name, params) {
    var page = window.Pages[name];
    if (page && page.enter) page.enter(params || {});
  }

  function navigate(name, params) {
    if (isTab(name)) { state.tab = name; state.stack = []; }
    else { state.stack.push({ name: name, params: params || {} }); }
    enter(name, params);
    return render(name, params);
  }

  function back() {
    var target;
    if (state.stack.length) state.stack.pop();
    if (state.stack.length) {
      var top = state.stack[state.stack.length - 1];
      target = top;
    } else {
      target = { name: state.tab, params: {} };
    }
    enter(target.name, target.params);
    return render(target.name, target.params);
  }

  function current() { return state.current || { name: state.tab }; }

  function init() {
    buildNav(UI.$("#tabbar"));
    buildNav(UI.$("#railNav"));
    var back = UI.$("#btnBack");
    if (back) back.addEventListener("click", function () { Router.back(); });
  }

  window.Router = {
    TABS: TABS, TAB_NAMES: TAB_NAMES,
    navigate: navigate, back: back, render: render, init: init, current: current,
    isTab: isTab
  };
})();
