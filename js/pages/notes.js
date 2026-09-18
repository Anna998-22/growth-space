/* =========================================================================
 * 成长空间 · 记录
 * -------------------------------------------------------------------------
 * 首页的「今日小记 / 我的心情」是随手入口，这里是它们真正的主场：
 * 今天可以改、可以重写，往下翻能看到全部记录。
 *
 * 所有内容都写进 gs.journal（按时序追加的行为流），
 * 所以小记和心情会自动计入连续天数 —— 它们本来就是成长活动。
 * ========================================================================= */
(function () {
  "use strict";
  window.Pages = window.Pages || {};

  var KIND = {
    assessment: { icon: "sprout", label: "认识自己" },
    course: { icon: "book", label: "课程" },
    practice: { icon: "pen", label: "练习" },
    note: { icon: "pen", label: "小记" },
    mood: { icon: "heart", label: "心情" }
  };

  function kindOf(t) { return KIND[t] || { icon: "pen", label: "记录" }; }

  /* journal 条目 -> 列表行 */
  function entryRow(e) {
    var k = kindOf(e.type);
    var title, sub;

    if (e.type === "assessment") {
      title = e.note || "认识自己";
      sub = e.meta && e.meta.record ? e.meta.record.quote : "";
    } else if (e.type === "mood") {
      title = e.meta && e.meta.label ? "心情 · " + e.meta.label : "记录了一次心情";
      sub = "";
    } else if (e.type === "note") {
      title = e.note || "今日小记";
      sub = "";
    } else {
      title = e.note || k.label;
      var rs = (e.meta && e.meta.reflections) || [];
      sub = "";
      for (var i = 0; i < rs.length; i++) if (rs[i] && rs[i].a) { sub = rs[i].a; break; }
    }

    var openable = e.type === "assessment" && e.meta && e.meta.kind === "first-self";
    return '<div class="rec-item k-' + UI.esc(e.type) + '"' +
      (openable ? ' data-record="' + e.id + '" role="button" tabindex="0"' : "") + ">" +
      '<span class="ri-ic">' + UI.icon(k.icon, 17) + "</span>" +
      '<div class="ri-body">' +
      '<span class="when">' + UI.esc(UI.dotDate(e.date)) + " · " + UI.esc(UI.weekday(e.date)) + "</span>" +
      "<b>" + UI.esc(title) + "</b>" +
      (sub ? "<p>" + UI.esc(sub) + "</p>" : "") +
      "</div>" +
      (openable ? '<span class="lr-cta">' + UI.icon("chevron", 14) + "</span>" : "") +
      "</div>";
  }

  /* 全部记录（新的在前），按日期分组 */
  function listHtml() {
    var j = Store.journal();
    if (!j.length) {
      return '<div class="empty">' + UI.icon("pen", 30) +
        "<b>还没有任何记录</b>" +
        "<p>上面写一句、选一个心情，<br>这里就会出现第一条。</p></div>";
    }
    var h = [], lastDate = "";
    for (var i = j.length - 1; i >= 0; i--) {
      var e = j[i];
      if (e.date !== lastDate) {
        var gap = lastDate ? " style=\"margin-top:18px\"" : "";
        h.push('<div class="label" ' + gap + ">" + UI.esc(UI.friendlyDate(e.date)) + "</div>");
        lastDate = e.date;
      }
      h.push(entryRow(e));
    }
    return h.join("");
  }

  /* ---------------------------------------------------------------------
   * 今日：小记 + 心情（和首页是同一套交互，只是这里可以慢慢改）
   * ------------------------------------------------------------------- */
  function todayHtml() {
    var note = Store.todayEntry("note");
    var mood = Store.todayEntry("mood");
    var curId = mood && mood.meta ? mood.meta.moodId : "";
    var series = Store.moodSeries(14);
    var hasMood = false;
    for (var k = 0; k < series.length; k++) if (series[k].score) hasMood = true;
    var curve = hasMood ? Widgets.moodSvg(series) : "";
    var h = [];

    h.push('<div class="card note-box">');
    h.push('<div class="card-head"><h3>今日小记</h3>' +
      '<span class="small muted">' + UI.esc(UI.dotDate(UI.today())) + " " + UI.esc(UI.weekday(UI.today())) + "</span></div>");
    h.push('<p class="small muted" style="margin:0 0 8px">想到什么写什么。写下的东西只有你自己看得到。</p>');
    h.push('<textarea data-field="dailyNote" placeholder="今天有什么想留下的？一句就好。">' +
      UI.esc(note ? note.note : "") + "</textarea>");
    h.push('<div class="note-foot">' +
      '<span class="note-hint">' + (note ? "上次记于 " + UI.friendlyTime(note.ts) : "今天还没写") + "</span>" +
      '<button class="btn ghost" data-save-note="1" type="button">保存</button></div>');
    h.push("</div>");

    h.push('<div class="card">');
    h.push('<div class="card-head"><h3>我的心情</h3><span class="small muted">近 14 天</span></div>');
    if (curve) {
      h.push('<div class="mood-wrap">' + curve + "</div>" + Widgets.moodAxis(series));
    } else {
      h.push('<div class="mood-empty">还没有记录。<br>选一个此刻最接近的，曲线会从这里开始。</div>');
    }
    h.push('<div class="mood-pick">');
    for (var i = 0; i < Widgets.MOODS.length; i++) {
      var m = Widgets.MOODS[i];
      h.push('<button class="mood-btn' + (m.id === curId ? " on" : "") + '" data-mood="' + m.id + '" type="button"' +
        ' aria-label="' + m.label + '" title="' + m.label + '">' +
        UI.icon(m.icon, 22) + "<span>" + m.label + "</span></button>");
    }
    h.push("</div>");
    h.push('<p class="small muted" style="margin:10px 0 0">这不是打分。只是给此刻的自己留一个标记。</p>');
    h.push("</div>");

    return h.join("");
  }

  function render() {
    return todayHtml() +
      '<div class="sec-head"><h2>全部记录</h2><span class="small muted">' +
      Store.stats().recordCount + " 条</span></div>" +
      listHtml();
  }

  function bind(v) {
    var btn = UI.$("[data-save-note]", v);
    var ta = UI.$('[data-field="dailyNote"]', v);
    if (btn && ta) {
      btn.addEventListener("click", function () {
        var txt = ta.value.replace(/^\s+|\s+$/g, "");
        if (!txt) { UI.toast("写一句就好"); ta.focus(); return; }
        Store.saveDailyNote(txt);
        UI.toast("已经记下了");
        Router.render("notes", {});
      });
    }

    var moodBtns = UI.$all("[data-mood]", v);
    for (var i = 0; i < moodBtns.length; i++) (function (b) {
      b.addEventListener("click", function () {
        var m = Widgets.moodById(b.getAttribute("data-mood"));
        if (!m) return;
        Store.saveMood(m.id, m.score, m.label);
        UI.toast("记下了：" + m.label);
        Router.render("notes", {});
      });
    })(moodBtns[i]);

    Widgets.bindGo(v);
  }

  function rail() {
    var st = Store.stats();
    return '<div class="rail-card">' +
      "<h4>" + UI.icon("pen", 15) + "记录概览</h4>" +
      '<div class="statrow">' +
      '<div class="stat"><b>' + st.recordCount + "</b><span>条记录</span></div>" +
      '<div class="stat"><b>' + st.noteDays + "</b><span>天小记</span></div>" +
      /* 这里原本显示近 30 天心情均值（3.1 这种数字）。
         一个带小数点的分数，会让人立刻开始比较「这个月是不是比上个月好」——
         那正是这套东西不该制造的焦虑。曲线已经把起伏画出来了，
         所以这里只数次数，不给分。 */
      '<div class="stat"><b>' + st.moodDays30 + "</b><span>天记了心情</span></div>" +
      "</div>" +
      '<p class="rail-note">只是数一数，不是打分。<br>心情的起伏，交给上面那条曲线说。</p>' +
      "</div>";
  }

  window.Pages.notes = {
    title: "记录",
    render: render, bind: bind,
    rail: rail, bindRail: function () {}
  };
})();
