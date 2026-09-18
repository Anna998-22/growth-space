/* =========================================================================
 * 成长空间 · 我的
 * -------------------------------------------------------------------------
 * 三件事：我是谁（昵称）+ 我留下了什么（画像与统计）+ 我能改什么（设置）。
 *
 * 老用户兼容：v1 是 5 题量表的画像（{state, focus, recommendIds}），
 * v2 是 15 题生成的《第一次认识自己》（{sections, quote}）。
 * 两种都在这里能正常显示，老数据【只读保留、绝不主动清空】，
 * 只给一句软提示问要不要用新的 15 题更新一次。
 * ========================================================================= */
(function () {
  "use strict";
  window.Pages = window.Pages || {};

  /* ---- v2 画像：分段正文 ---- */
  function v2Html(rec) {
    var h = ['<div class="card">'];
    h.push('<div class="card-head"><h3>' + UI.esc(rec.title || "第一次认识自己") + "</h3>" +
      '<span class="tag live">15 题版</span></div>');
    if (rec.quote) h.push('<p class="small muted" style="margin:0 0 4px">' + UI.esc(rec.quote) + "</p>");
    var secs = rec.sections || [];
    for (var i = 0; i < secs.length; i++) {
      h.push('<div class="rec-sec"><h3>' + UI.esc(secs[i].label) + "</h3>" +
        "<p>" + UI.textLines(secs[i].text) + "</p></div>");
    }
    h.push("</div>");
    return h.join("");
  }

  /* ---- v1 画像：老的 5 题结果，只读 ---- */
  function v1Html(pf) {
    var h = ['<div class="card">'];
    h.push('<div class="card-head"><h3>你的状态画像</h3><span class="tag">早先做过的一次</span></div>');
    if (pf.state) h.push('<p class="state-text">' + UI.textLines(pf.state) + "</p>");
    if (pf.focus && pf.focus.length) {
      h.push('<div class="focus-label">当时留意到的方向</div>');
      for (var i = 0; i < pf.focus.length; i++) {
        h.push('<div class="focus-item">· ' + UI.esc(pf.focus[i]) + "</div>");
      }
    }
    h.push('<p class="small muted" style="margin-top:12px">' +
      "这一份是早先那版留下的，会一直给你保留着，不会被覆盖掉。</p>");
    h.push("</div>");
    return h.join("");
  }

  function portraitHtml() {
    var p = Store.getProfile();
    if (!p || !p.portrait) {
      return '<div class="empty">' + UI.icon("sprout", 30) +
        "<b>还没有认识过自己</b>" +
        "<p>用 15 个问题，花几分钟看看现在的自己。<br>写下来的东西只会留在你的浏览器里。</p>" +
        '<button class="btn primary" data-go="questionnaire" type="button">开始探索</button></div>';
    }
    var rec = p.portrait;
    return rec.sections ? v2Html(rec) : v1Html(rec);
  }

  function render() {
    var p = Store.getProfile() || {};
    var st = Store.stats();
    var nick = p.nickname || "";
    var v = Store.answersVersion();
    var h = [];

    /* 头部 */
    h.push('<div class="me-head">' +
      '<div class="me-avatar">' + UI.esc(nick ? nick.charAt(0) : "你") + "</div>" +
      "<div><h1>" + (nick ? UI.esc(nick) : "还没有起名字") + "</h1>" +
      '<p class="sub">' + (st.hasFirstRecord ? "你已经认真看过自己一次了。" : "慢慢来，不着急。") + "</p>" +
      "</div></div>");

    /* 统计 */
    h.push('<div class="statgrid">' +
      '<div class="stat"><b>' + st.recordCount + "</b><span>条记录</span></div>" +
      '<div class="stat"><b>' + st.noteDays + "</b><span>天小记</span></div>" +
      '<div class="stat"><b>' + st.streak + "</b><span>连续天数</span></div>" +
      '<div class="stat"><b>' + st.favCount + "</b><span>收藏</span></div>" +
      "</div>");

    /* 画像 */
    h.push('<div class="sec-head"><h2>我的画像</h2></div>');
    h.push(portraitHtml());

    /* 老数据软提示：只问，不替换 */
    if (v === 1) {
      h.push('<div class="card" style="border-color:var(--brand-line)">' +
        "<h3>要不要用新的 15 题再认识一次？</h3>" +
        '<p class="small muted">新的版本会更贴近你此刻的状态。做完之后，上面那份旧的仍然会留着。</p>' +
        '<div class="btnrow"><button class="btn primary" data-go="questionnaire" type="button">重新认识一次</button></div>' +
        "</div>");
    } else if (v === 2) {
      h.push('<div class="btnrow"><button class="btn ghost" data-go="questionnaire" type="button">重新做一次</button></div>');
    }

    /* 收藏 */
    var favs = Store.favorites();
    if (favs.length) {
      h.push('<div class="sec-head"><h2>我收藏的课</h2></div>');
      h.push(Widgets.lessonList(favs));
    }

    /* 设置 */
    var s = Store.settings();
    h.push('<div class="sec-head"><h2>设置</h2></div>');
    h.push('<div class="card">');

    h.push('<div class="set-row"><div class="sr-label">昵称' +
      "<small>只用在问候里</small></div>" +
      '<button class="btn ghost" data-set-nick="1" type="button" style="min-height:38px;padding:0 16px;font-size:13.5px">修改</button></div>');

    h.push('<div class="set-row"><div class="sr-label">每天提醒我一下' +
      "<small>这个网页没有后台，做不到到点自己弹出来。<br>只能在你打开它的时候，温和地提一句。</small></div>" +
      '<button class="switch' + (s.remind.on ? " on" : "") + '" data-toggle-remind="1" type="button" ' +
      'role="switch" aria-checked="' + (s.remind.on ? "true" : "false") + '" ' +
      'aria-label="每天提醒我一下"></button></div>');

    h.push('<div class="set-row"><div class="sr-label">我用过的功能' +
      "<small>认识自己、小记、心情、收藏、探索入口</small></div>" +
      '<span class="sr-val">' + st.recordCount + " 条记录</span></div>");

    h.push("</div>");

    h.push('<div class="card">' +
      "<h3>关于数据</h3>" +
      '<p class="small muted">所有内容都只存在你这台设备的浏览器里。没有账号、不上传、不同步。' +
      "换一台设备或换一个浏览器，这里是空的。</p>" +
      '<div class="btnrow"><button class="btn ghost" data-reset="1" type="button">清空所有数据</button></div>' +
      "</div>");

    h.push('<div class="rail-quiet">成长空间 v7 · 纯本地运行<br>不是诊断工具，也不替代任何专业帮助。</div>');

    return h.join("");
  }

  function bind(v) {
    Widgets.bindGo(v);
    Widgets.bindLessonRows(v);
    Widgets.bindFav(v, function () { Router.render("me", {}); });

    var nick = UI.$("[data-set-nick]", v);
    if (nick) nick.addEventListener("click", function () {
      Router.navigate("nickname", { edit: 1 });
    });

    var sw = UI.$("[data-toggle-remind]", v);
    if (sw) sw.addEventListener("click", function () {
      var s = Store.settings();
      s.remind.on = !s.remind.on;
      Store.saveSettings(s);
      sw.classList.toggle("on", s.remind.on);
      sw.setAttribute("aria-checked", s.remind.on ? "true" : "false");
      UI.toast(s.remind.on ? "好，你打开它的时候我会提一句" : "已关闭");
    });

    var rst = UI.$("[data-reset]", v);
    if (rst) rst.addEventListener("click", function () {
      if (!window.confirm("会清空这台设备上的全部记录，且无法恢复。确定吗？")) return;
      Store.resetAll();
      UI.toast("已经清空了");
      Router.navigate("home", {});
    });
  }

  function rail() {
    var st = Store.stats();
    return '<div class="rail-card">' +
      "<h4>" + UI.icon("user", 15) + "这些数字" +
      "</h4>" +
      '<div class="statrow">' +
      '<div class="stat"><b>' + st.coursesDone + "</b><span>节课程</span></div>" +
      '<div class="stat"><b>' + st.practiceDone + "</b><span>次练习</span></div>" +
      '<div class="stat"><b>' + st.thisWeek + "</b><span>本周记录</span></div>" +
      "</div>" +
      '<p class="rail-note">数字只是痕迹，不是成绩。</p>' +
      "</div>";
  }

  window.Pages.me = {
    title: "我的",
    render: render, bind: bind,
    rail: rail, bindRail: function () {}
  };
})();
