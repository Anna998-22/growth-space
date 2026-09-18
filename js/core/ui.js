/* =========================================================================
 * 成长空间 · 通用 UI 小工具（无依赖）
 * ========================================================================= */
(function () {
  "use strict";

  function $(s, root) { return (root || document).querySelector(s); }
  function $all(s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); }

  /* 转义，防止用户输入内容被当作 HTML 渲染 */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  /* 本地日期 YYYY-MM-DD */
  function today() {
    var d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function dateToStr(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function dayBefore(str) {
    var d = new Date(str + "T00:00:00");
    d.setDate(d.getDate() - 1);
    return dateToStr(d);
  }
  /* 显示友好日期：今天/昨天/M月d日 */
  function friendlyDate(str) {
    var t = today();
    if (str === t) return "今天";
    if (str === dayBefore(t)) return "昨天";
    var p = str.split("-");
    return parseInt(p[1], 10) + "月" + parseInt(p[2], 10) + "日";
  }
  function friendlyTime(ts) {
    var d = new Date(ts);
    return pad(d.getHours()) + ":" + pad(d.getMinutes());
  }

  /* 轻提示 */
  var toastTimer = null;
  function toast(msg) {
    var t = $("#toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 1800);
  }

  /* 课程序号：两位补零的唯一入口。
     以前散在 course.js 的 ('0' + order) 与 route.js 的 (order < 10 ? "0" : "")，
     课程超过 9 节后会渲染成 "010"，收拢到这里统一处理。 */
  function courseNo(n) {
    n = Number(n) || 0;
    return (n < 10 ? "0" : "") + n;
  }

  var WEEK = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  function weekday(dateStr) {
    var d = dateStr ? new Date(dateStr + "T00:00:00") : new Date();
    return WEEK[d.getDay()];
  }

  /* 2026.09.17 —— 参考图里日期都用点分隔 */
  function dotDate(dateStr) {
    var p = String(dateStr || today()).split("-");
    if (p.length < 3) return dateStr || "";
    return p[0] + "." + p[1] + "." + p[2];
  }

  /* 图标：转发给 ICONS，ICONS 未加载时安全降级为空串 */
  function icon(name, size) {
    return (window.ICONS && window.ICONS.icon) ? window.ICONS.icon(name, size) : "";
  }

  /* 转义后保留换行（用户写的多行文本、记录正文用） */
  function textLines(s) {
    return esc(s).replace(/\n/g, "<br>");
  }

  window.UI = {
    $: $, $all: $all, el: el, esc: esc,
    today: today, pad: pad, dateToStr: dateToStr, dayBefore: dayBefore,
    friendlyDate: friendlyDate, friendlyTime: friendlyTime, toast: toast,
    courseNo: courseNo, weekday: weekday, dotDate: dotDate,
    icon: icon, textLines: textLines
  };
})();
