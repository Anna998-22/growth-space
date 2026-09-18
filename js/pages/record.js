/* =========================================================================
 * 成长空间 · 单条成长记录详情
 * -------------------------------------------------------------------------
 * 目前唯一可点开回看的是《第一次认识自己》。
 * 正文用 UI.textLines（转义后保留换行）——规则生成的段落里有 \n，
 * 直接塞进 <p> 会被 HTML 折叠成一行。
 * ========================================================================= */
(function () {
  "use strict";
  window.Pages = window.Pages || {};

  function findEntry(id) {
    var j = Store.journal();
    for (var i = 0; i < j.length; i++) if (j[i].id === id) return j[i];
    return null;
  }

  function render(params) {
    var e = params && params.id ? findEntry(params.id) : null;
    if (!e) {
      return '<div class="empty">' + UI.icon("pen", 30) +
        "<b>没有找到这条记录</b><p>它可能已经被清空了。</p>" +
        '<button class="btn ghost" data-go="trace" type="button">去成长轨迹</button></div>';
    }

    var rec = e.meta && e.meta.record ? e.meta.record : null;
    var h = [];

    h.push('<div class="done-head" style="padding-top:6px">' +
      '<div class="done-mark">' + UI.icon("sprout", 28) + "</div>" +
      "<h2>" + UI.esc(e.note || "成长记录") + "</h2>" +
      '<p class="muted small">' + UI.esc(UI.dotDate(e.date)) + " " + UI.esc(UI.weekday(e.date)) + "</p>" +
      "</div>");

    if (!rec) {
      h.push('<div class="card"><p>' + UI.textLines(e.note || "") + "</p></div>");
      return h.join("");
    }

    if (rec.quote) {
      h.push('<div class="rec-sec quote"><h3>那天</h3><p>' + UI.esc(rec.quote) + "</p></div>");
    }

    var secs = rec.sections || [];
    for (var i = 0; i < secs.length; i++) {
      h.push('<div class="rec-sec"><h3>' + UI.esc(secs[i].label) + "</h3>" +
        "<p>" + UI.textLines(secs[i].text) + "</p></div>");
    }

    if (rec.dimNames) {
      h.push('<div class="rec-sec"><h3>当时留意到的方向</h3>' +
        '<div class="chips">' +
        '<span class="chip ok">' + UI.esc(rec.dimNames) + "</span>" +
        "</div></div>");
    }

    h.push('<div class="rail-quiet">这是那时候的你写下的。<br>现在再看，感觉可能已经不一样了。</div>');
    h.push('<div class="btnrow" style="margin-top:16px">' +
      '<button class="btn ghost" data-go="trace" type="button">回到成长轨迹</button></div>');

    return h.join("");
  }

  function bind(v) { Widgets.bindGo(v); }

  window.Pages.record = {
    hideTab: true,
    title: "成长记录",
    render: render, bind: bind
  };
})();
