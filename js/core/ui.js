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

  window.UI = {
    $: $, $all: $all, el: el, esc: esc,
    today: today, pad: pad, dateToStr: dateToStr, dayBefore: dayBefore,
    friendlyDate: friendlyDate, friendlyTime: friendlyTime, toast: toast
  };
})();
