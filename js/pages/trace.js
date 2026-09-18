/* =========================================================================
 * 成长空间 · 成长轨迹
 * -------------------------------------------------------------------------
 * 这里只做一件事：把用户做过的事，按时间摆出来。
 * 不打分、不排名、不显示「进步了多少」——只让他看见自己确实走过。
 * 手机端固定纵向：横向时间轴在 <900px 时由 CSS 折成纵向，DOM 只有一份。
 * ========================================================================= */
(function () {
  "use strict";
  window.Pages = window.Pages || {};

  function statsLine(st) {
    var bits = [];
    if (st.recordCount) bits.push(st.recordCount + " 条记录");
    if (st.noteDays) bits.push(st.noteDays + " 天写过小记");
    if (st.streak > 1) bits.push("连续 " + st.streak + " 天");
    return bits.join(" · ");
  }

  function render() {
    var items = Store.timelineItems(0);
    var st = Store.stats();
    var h = [];

    if (!items.length) {
      h.push('<p class="page-intro">你走过的每一步，都会留在这里。</p>');
      h.push('<div class="empty">' + UI.icon("path", 32) +
        "<b>轨迹还没有开始</b>" +
        "<p>做完「第一次认识自己」，或者写下今天的一句话，<br>第一个节点就会出现在这里。</p>" +
        '<button class="btn primary" data-go="questionnaire" type="button">开始探索</button>' +
        '<p class="small" style="margin-top:12px">或者 <button class="link small" data-go="notes" type="button">先写一句今天的自己</button></p>' +
        "</div>");
      return h.join("");
    }

    var line = statsLine(st);
    h.push('<p class="page-intro">你走过的每一步，都在这里。' +
      (line ? '<br><span class="muted small">' + UI.esc(line) + "</span>" : "") + "</p>");
    h.push(Widgets.timeline(items, { layout: "v" }));
    h.push('<div class="rail-quiet">往前翻，看见的是自己走过的路。<br>不需要和谁比较。</div>');
    return h.join("");
  }

  function bind(v) { Widgets.bindGo(v); }

  /* 宽屏右栏：只读的概览，不重复正文 */
  function rail() {
    var st = Store.stats();
    var h = [];
    h.push('<div class="rail-card">');
    h.push("<h4>" + UI.icon("path", 15) + "这一路</h4>");
    h.push('<div class="statrow">' +
      '<div class="stat"><b>' + st.recordCount + "</b><span>条记录</span></div>" +
      '<div class="stat"><b>' + st.noteDays + "</b><span>天小记</span></div>" +
      '<div class="stat"><b>' + st.streak + "</b><span>连续天数</span></div>" +
      "</div>");
    h.push("</div>");

    /* 第一条《第一次认识自己》单独拎出来 —— 它是整条轨迹的起点。
       不能拿 timelineItems 的末项充数：末项只是最老的一条，不一定是它。 */
    var all = Store.timelineItems(0), start = null;
    for (var i = 0; i < all.length; i++) {
      if (all[i].kind === "assessment" && all[i].refId) { start = all[i]; break; }
    }
    if (start) {
      h.push('<div class="rail-card">');
      h.push("<h4>" + UI.icon("sprout", 15) + "最开始的那次</h4>");
      h.push(Widgets.timeline([start], { layout: "v" }));
      h.push("</div>");
    }
    return h.join("");
  }

  function bindRail(el) { Widgets.bindGo(el); }

  window.Pages.trace = {
    title: "成长轨迹",
    render: render, bind: bind,
    rail: rail, bindRail: bindRail
  };
})();
