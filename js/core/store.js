/* =========================================================================
 * 成长空间 · 本地数据层（LocalStorage，key 前缀 gs.）
 * 所有用户数据只保存在当前浏览器里，不联网、不上传。
 * ========================================================================= */
(function () {
  "use strict";

  var PREFIX = "gs.";
  var KEYS = { profile: "profile", progress: "progress", journal: "journal", practices: "practices" };

  function raw(k) { return PREFIX + k; }
  function loadJson(k, def) {
    try {
      var v = JSON.parse(localStorage.getItem(raw(k)));
      return v == null ? def : v;
    } catch (e) { return def; }
  }
  function saveJson(k, v) {
    try { localStorage.setItem(raw(k), JSON.stringify(v)); } catch (e) { /* 隐私/容量异常时静默 */ }
  }

  function getProfile() { return loadJson(KEYS.profile, null); }
  function saveProfile(p) { saveJson(KEYS.profile, p); }

  function progress() { return loadJson(KEYS.progress, {}); }
  function saveProgress(o) { saveJson(KEYS.progress, o); }
  function journal() { return loadJson(KEYS.journal, []); }
  function practices() { return loadJson(KEYS.practices, []); }

  function courseState(id) {
    var p = progress()[id];
    return p ? p.status : "none";
  }
  function isDone(id) { return courseState(id) === "done"; }
  function markStarted(id) {
    var p = progress();
    if (!p[id] || p[id].status !== "done") {
      if (!p[id]) p[id] = { status: "started", startedAt: Date.now() };
    }
    saveProgress(p);
  }

  /* 新增一条成长记录（时间线用）。type: assessment / course / practice */
  function addJournal(type, note, meta) {
    var j = journal();
    var d = new Date();
    j.push({
      id: "j" + d.getTime() + Math.floor(Math.random() * 1000),
      date: UI.today(), ts: d.getTime(), type: type, note: note || "", meta: meta || {}
    });
    j.sort(function (a, b) { return a.ts - b.ts; });
    saveJson(KEYS.journal, j);
  }

  /* 记录一次“今日练习” */
  function addPractice(courseId, note) {
    var arr = practices();
    var d = new Date();
    arr.push({ id: courseId + "-" + d.getTime(), courseId: courseId, note: note || "", date: UI.today(), ts: d.getTime() });
    arr.sort(function (a, b) { return b.ts - a.ts; });
    saveJson(KEYS.practices, arr);
  }

  /* 完成一节课程：写进度 + 练习 + 成长记录 */
  function completeCourse(courseId, payload) {
    payload = payload || {};
    var p = progress();
    p[courseId] = { status: "done", finishedAt: Date.now() };
    saveProgress(p);
    if (!payload.noPractice) addPractice(courseId, payload.practiceNote);
    addJournal("course", "完成课程《" + courseTitle(courseId) + "》", {
      courseId: courseId,
      reflections: payload.reflections || []
    });
  }

  /* 已完成后，再次做练习/反思：只追加记录，不改完成状态 */
  function logSession(courseId, payload) {
    payload = payload || {};
    addPractice(courseId, payload.practiceNote);
    addJournal("practice", "重做练习《" + courseTitle(courseId) + "》", { courseId: courseId });
  }

  function courseTitle(id) {
    var c = window.COURSES && COURSES.filter(function (x) { return x.id === id; })[0];
    return c ? c.title : "";
  }

  /* ---- 统计 ---- */
  function doneIds() {
    var p = progress(), out = [];
    for (var k in p) if (p.hasOwnProperty(k) && p[k].status === "done") out.push(k);
    return out;
  }
  function nextCourseId() {
    var cs = window.COURSES || [];
    for (var i = 0; i < cs.length; i++) if (!isDone(cs[i].id)) return cs[i].id;
    return null;
  }
  function practiceDistinct() {
    var arr = practices(), set = {};
    for (var i = 0; i < arr.length; i++) set[arr[i].courseId] = true;
    return Object.keys(set).length;
  }
  /* 连续学习天数：从今天(或昨天)往前数连续有记录的天数 */
  function streak() {
    var j = journal(), set = {}, has = function (s) { return !!set[s]; };
    for (var i = 0; i < j.length; i++) set[j[i].date] = true;
    if (!j.length) return 0;
    var cur = UI.today(), count = 0;
    if (!has(cur)) cur = UI.dayBefore(cur);   // 今天还没记录时，从昨天算起，不断签
    while (has(cur)) { count++; cur = UI.dayBefore(cur); }
    return count;
  }
  function stats() {
    var ids = doneIds();
    var total = (window.COURSES || []).length;
    var thisWeek = 0, td = UI.today(), j = journal();
    var weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    for (var i = 0; i < j.length; i++) if (j[i].ts >= weekAgo.getTime()) thisWeek++;
    var todayActive = j.some(function (e) { return e.date === td; });
    return {
      coursesTotal: total,
      coursesDone: ids.length,
      practiceDone: practiceDistinct(),
      streak: streak(),
      thisWeek: thisWeek,
      todayActive: todayActive
    };
  }

  function resetAll() {
    try {
      localStorage.removeItem(raw(KEYS.profile));
      localStorage.removeItem(raw(KEYS.progress));
      localStorage.removeItem(raw(KEYS.journal));
      localStorage.removeItem(raw(KEYS.practices));
    } catch (e) {}
  }

  window.Store = {
    getProfile: getProfile, saveProfile: saveProfile,
    journal: journal, practices: practices,
    progress: progress,
    courseState: courseState, isDone: isDone, markStarted: markStarted,
    addJournal: addJournal, addPractice: addPractice,
    completeCourse: completeCourse, logSession: logSession,
    doneIds: doneIds, nextCourseId: nextCourseId,
    practiceDistinct: practiceDistinct, streak: streak, stats: stats,
    resetAll: resetAll
  };
})();
