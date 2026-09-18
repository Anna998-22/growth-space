/* =========================================================================
 * 成长空间 · 本地数据层（LocalStorage，key 前缀 gs.）
 * 所有用户数据只保存在当前浏览器里，不联网、不上传。
 * ========================================================================= */
(function () {
  "use strict";

  var PREFIX = "gs.";
  var KEYS = {
    profile: "profile", progress: "progress", journal: "journal", practices: "practices",
    favorites: "favorites", settings: "settings"
  };

  /* ---- 示例模式 ---------------------------------------------------------
     非 null 时，读写全部改道到这个内存对象，LocalStorage 一次都不碰。
     这两个函数是整个 App 唯一的存储出入口，所以只在这里拦一次，
     十个页面就都进了示例模式，不需要每个页面各写一份示例分支。

     为什么是「可写的内存副本」而不是「只读」：
       只读的话，朋友点一下心情、写一句小记都没反应，会以为坏了；
       而写进真实存储又会污染他自己的数据。
       内存副本两头都占：点得动，退出即消失。

     为什么它同时是 iOS 的兜底：
       iOS 上 localStorage 有可能整个不可用。那种情况下普通模式是
       「能用但存不住」，而示例模式本来就不用存储，反而是完整的。 */
  var demoState = null;

  function raw(k) { return PREFIX + k; }
  function loadJson(k, def) {
    if (demoState) {
      var d = demoState[k];
      return d === undefined ? def : d;
    }
    try {
      var v = JSON.parse(localStorage.getItem(raw(k)));
      return v == null ? def : v;
    } catch (e) { return def; }
  }
  function saveJson(k, v) {
    if (demoState) { demoState[k] = v; return; }
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

  /* 新增一条成长记录（时间线用）。type: assessment / course / practice
     返回写入的那一条 —— 完成页要拿它的 id 跳去「回看完整记录」。 */
  function addJournal(type, note, meta) {
    var j = journal();
    var d = new Date();
    var e = {
      id: "j" + d.getTime() + Math.floor(Math.random() * 1000),
      date: UI.today(), ts: d.getTime(), type: type, note: note || "", meta: meta || {}
    };
    j.push(e);
    j.sort(function (a, b) { return a.ts - b.ts; });
    saveJson(KEYS.journal, j);
    return e;
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

  /* =======================================================================
   * 昵称（存在 profile 里，不另开 key）
   * ===================================================================== */
  function nickname() {
    var p = getProfile();
    return (p && p.nickname) || "";
  }
  /* 保存昵称。注意【不要】顺手把 done 设成 true —— 昵称和自评是两件事 */
  function saveNickname(n) {
    var p = getProfile() || { done: false, startedAt: Date.now() };
    p.nickname = String(n == null ? "" : n).replace(/^\s+|\s+$/g, "").slice(0, 12);
    p.nicknameSetAt = Date.now();
    saveProfile(p);
    return p.nickname;
  }

  /* =======================================================================
   * 今日小记 / 心情
   * 都写进 journal（它本就是按时序追加的行为流，streak / thisWeek 都从它派生），
   * 但【每天一条】—— 所以走 upsertToday，避免改主意重写时留下两条。
   * ===================================================================== */
  function upsertToday(type, note, meta) {
    var j = journal(), td = UI.today(), i;
    for (i = 0; i < j.length; i++) {
      if (j[i].type === type && j[i].date === td) {
        j[i].note = note || "";
        j[i].meta = meta || {};
        j[i].ts = Date.now();
        saveJson(KEYS.journal, j);
        return false;             /* 改写，不是新建 */
      }
    }
    addJournal(type, note, meta);  /* 复用现有函数，排序逻辑一起复用 */
    return true;                   /* 新建 */
  }

  function todayEntry(type) {
    var j = journal(), td = UI.today();
    for (var i = j.length - 1; i >= 0; i--) {
      if (j[i].type === type && j[i].date === td) return j[i];
    }
    return null;
  }

  function saveDailyNote(text) {
    return upsertToday("note", String(text == null ? "" : text).replace(/^\s+|\s+$/g, ""), {});
  }
  function saveMood(moodId, score, label) {
    return upsertToday("mood", "", { moodId: moodId, score: score, label: label || "" });
  }

  /* 近 N 天心情序列；没记录的日子是 null（曲线断开，不连线） */
  function moodSeries(days) {
    days = days || 14;
    var j = journal(), map = {}, i;
    for (i = 0; i < j.length; i++) {
      if (j[i].type === "mood" && j[i].meta && j[i].meta.score) map[j[i].date] = j[i].meta.score;
    }
    var out = [], cur = UI.today();
    for (i = 0; i < days; i++) {
      out.unshift({ date: cur, score: map[cur] || null });
      cur = UI.dayBefore(cur);
    }
    return out;
  }

  /* 按类型取记录，新的在前 */
  function entries(type) {
    var j = journal(), out = [];
    for (var i = j.length - 1; i >= 0; i--) if (j[i].type === type) out.push(j[i]);
    return out;
  }

  /* =======================================================================
   * journal -> 时间轴展示项
   * 首页和「成长轨迹」读的是同一份映射，不是两份要同步维护的代码。
   *
   * opts.maxMood：只在【摘要】里限制心情条目的条数（-1 = 不限，默认）。
   *
   * 为什么需要它：心情每天都能记，小记和课程不是。记得越勤，摘要就越被
   * 「心情 · 还不错」这种没有内容的行占满，而完成一节课、写下的一句话
   * 全被挤到看不见的地方 —— 那正好和这条时间轴的意义相反。
   *
   * 为什么是「限制总数」而不是「不许连着出两条」：
   *   试过后者。示例数据是心情与小记交替的，连着出的规则会把
   *   心情 · 小记 · 心情 · 小记 一路放行，8 条里仍然有 4 条是心情，
   *   两节已完成的课照样进不来 —— 等于没治。限总数才真的把位置让出来。
   *
   * 「成长轨迹」页取的是全量（limit=0），一条不删、不做任何取舍。
   * ===================================================================== */
  function timelineItems(limit, opts) {
    var maxMood = (opts && opts.maxMood !== undefined) ? opts.maxMood : -1;
    var moods = 0;
    var j = journal(), out = [];
    for (var i = j.length - 1; i >= 0; i--) {
      var e = j[i], meta = e.meta || {}, item;
      var k;

      if (e.type === "assessment") {
        var rec = meta.record;
        item = {
          title: e.note || (rec ? rec.title : "认识自己"),
          quote: rec ? rec.quote : "",
          kind: "assessment",
          /* 只有那条《第一次认识自己》可点开回看 */
          refId: meta.kind === "first-self" ? e.id : ""
        };
      } else if (e.type === "course") {
        var rs = meta.reflections || [], q = "";
        for (k = 0; k < rs.length; k++) {
          if (rs[k] && rs[k].a) { q = rs[k].a; break; }
        }
        item = { title: e.note || "完成了一节课", quote: q, kind: "course", refId: "" };
      } else if (e.type === "mood") {
        /* 超出的心情直接跳过，把位置留给后面的小记和课程。
           这里用 continue 而不是 break —— break 会让整个列表提前结束。 */
        if (maxMood >= 0 && moods >= maxMood) continue;
        moods++;
        item = { title: meta.label ? "心情 · " + meta.label : "记录了一次心情", quote: "", kind: "mood", refId: "" };
      } else if (e.type === "note") {
        item = { title: "今日小记", quote: e.note || "", kind: "note", refId: "" };
      } else {
        item = { title: e.note || "一条记录", quote: "", kind: e.type, refId: "" };
      }

      item.date = e.date;
      item.day = UI.dotDate(e.date).slice(5);
      item.ts = e.ts;
      out.push(item);
      if (limit && out.length >= limit) break;
    }
    return out;
  }

  /* =======================================================================
   * 收藏 / 设置 / 探索过的主题
   * ===================================================================== */
  function favorites() { return loadJson(KEYS.favorites, []); }
  function isFav(id) { return favorites().indexOf(id) !== -1; }
  function toggleFav(id) {
    var f = favorites(), i = f.indexOf(id);
    if (i === -1) f.push(id); else f.splice(i, 1);
    saveJson(KEYS.favorites, f);
    return i === -1;              /* true = 刚收藏 */
  }

  function settings() {
    var s = loadJson(KEYS.settings, null) || {};
    if (!s.remind) s.remind = { on: false, time: "20:00" };
    if (!s.explored) s.explored = [];
    return s;
  }
  function saveSettings(s) { saveJson(KEYS.settings, s); }

  /* 记录「看过某个探索入口」。刻意不写进 journal ——
     浏览入口不算成长活动，不该影响连续天数。 */
  function markExplored(topicId) {
    var s = settings();
    if (s.explored.indexOf(topicId) === -1) {
      s.explored.push(topicId);
      saveSettings(s);
    }
  }

  /* =======================================================================
   * 15 题：保存答案 + 生成《第一次认识自己》
   * ===================================================================== */
  function saveAssessment(answers) {
    var rec = window.Record.build(answers);
    var p = getProfile() || { done: false, startedAt: Date.now() };
    p.done = true;
    p.answers = answers;
    p.answersVersion = 2;         /* 2 = 15 题版；老数据是 1 */
    p.portrait = rec;
    p.revisedAt = Date.now();
    saveProfile(p);
    rec.entryId = addJournal("assessment", rec.title, { kind: rec.kind, record: rec }).id;
    return rec;
  }

  /* 那条「第一次认识自己」 */
  function firstRecord() {
    var j = journal();
    for (var i = 0; i < j.length; i++) {
      if (j[i].type === "assessment" && j[i].meta && j[i].meta.kind === "first-self") return j[i];
    }
    return null;
  }

  /* 老数据的答案版本；没有 profile 或没做过题时返回 0 */
  function answersVersion() {
    var p = getProfile();
    if (!p || !p.answers) return 0;
    return p.answersVersion === undefined ? 1 : p.answersVersion;
  }

  /* 把老用户标成 v1。只加一个标记字段，绝不动 answers / portrait */
  function migrate() {
    var p = getProfile();
    if (p && p.answersVersion === undefined) {
      p.answersVersion = p.answers ? 1 : 0;
      saveProfile(p);
    }
  }

  /* ---- 示例模式开关（见上面 demoState 的说明）---- */
  function isDemo() { return demoState !== null; }
  function startDemo() { demoState = window.DemoData.build(); }
  /* 只是把指针放回 null。示例数据是内存里的对象，没有引用就回收了，
     真实数据从头到尾没被碰过 —— 所以「退出示例」不需要恢复任何东西。 */
  function stopDemo() { demoState = null; }

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
  /* 写过小记的天数（去重日期） */
  function noteDays() {
    var j = journal(), set = {}, n = 0;
    for (var i = 0; i < j.length; i++) {
      if (j[i].type === "note" && !set[j[i].date]) { set[j[i].date] = true; n++; }
    }
    return n;
  }
  /* 近 N 天记过心情的天数。
     这里刻意【不】提供均值：一个 3.1 这样的分数，会让人开始比较
     「这个月是不是比上个月差」，而起伏本来就该由曲线去说。
     数次数是中性的，打分不是。 */
  function moodDays(days) {
    var s = moodSeries(days), n = 0;
    for (var i = 0; i < s.length; i++) if (s[i].score) n++;
    return n;
  }

  function stats() {
    var ids = doneIds();
    var total = (window.COURSES || []).length;
    var thisWeek = 0, td = UI.today(), j = journal();
    var weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    for (var i = 0; i < j.length; i++) if (j[i].ts >= weekAgo.getTime()) thisWeek++;
    var todayActive = j.some(function (e) { return e.date === td; });
    var fr = firstRecord();

    return {
      /* 原有字段：很多页面在读，一个都不能改 */
      coursesTotal: total,
      coursesDone: ids.length,
      practiceDone: practiceDistinct(),
      streak: streak(),
      thisWeek: thisWeek,
      todayActive: todayActive,

      /* 新增 */
      recordCount: j.length,
      noteDays: noteDays(),
      moodDays30: moodDays(30),
      favCount: favorites().length,
      exploreCount: settings().explored.length,
      hasFirstRecord: !!fr,
      firstRecordTs: fr ? fr.ts : 0
    };
  }

  function resetAll() {
    try {
      localStorage.removeItem(raw(KEYS.profile));
      localStorage.removeItem(raw(KEYS.progress));
      localStorage.removeItem(raw(KEYS.journal));
      localStorage.removeItem(raw(KEYS.practices));
      localStorage.removeItem(raw(KEYS.favorites));
      localStorage.removeItem(raw(KEYS.settings));
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
    resetAll: resetAll,

    /* 示例模式 */
    isDemo: isDemo, startDemo: startDemo, stopDemo: stopDemo,

    /* 昵称 */
    nickname: nickname, saveNickname: saveNickname,
    /* 小记 / 心情 */
    upsertToday: upsertToday, todayEntry: todayEntry,
    saveDailyNote: saveDailyNote, saveMood: saveMood,
    moodSeries: moodSeries, moodDays: moodDays, entries: entries,
    timelineItems: timelineItems,
    /* 收藏 / 设置 / 探索记录 */
    favorites: favorites, isFav: isFav, toggleFav: toggleFav,
    settings: settings, saveSettings: saveSettings, markExplored: markExplored,
    /* 15 题 */
    saveAssessment: saveAssessment, firstRecord: firstRecord,
    answersVersion: answersVersion, migrate: migrate
  };
})();
