/* =========================================================================
 * 成长空间 · 冒烟测试（node 内置模块 + 本机 Chrome，零依赖）
 * -------------------------------------------------------------------------
 * 不做单元测试框架那一套。这里只回答一个问题：
 *   把 index.html 用 file:// 打开，走完主要流程，会不会炸、会不会渲染出
 *   undefined / NaN / [object Object]。
 *
 * 做法：读 index.html 原文，在 </body> 前注入一段测试脚本，
 * 写到 tools/_smoke.html，再用 Chrome --dump-dom 把结果取回来。
 * 测的是【真的 index.html】，不是另写一份测试页 —— 否则测过了也不代表能跑。
 *
 * 用法：node tools/smoke.js
 * ========================================================================= */
"use strict";

var fs = require("fs");
var path = require("path");
var os = require("os");
var cp = require("child_process");

var ROOT = path.resolve(__dirname, "..");
/* 默认测 index.html；也可以指定单文件版：
     node tools/smoke.js 成长空间.html
   两者跑的是同一套断言，这样「双击哪个文件」都是验过的。 */
var SRC = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, "index.html");
/* 必须写在项目根目录，不能写在 tools/ 下：
   index.html 用的是 js/core/ui.js 这类相对路径，放在 tools/ 会深一层，
   所有脚本指向 tools/js/... 全部 404 —— 页面看着正常，其实一行 JS 都没跑。 */
var OUT = path.join(ROOT, "_smoke.html");
var WIDTHS = [390, 1000, 1440];

/* 跑完就删。它落在项目根目录，留着会被一起推到 GitHub Pages；
   每次运行都会重新生成，删掉不影响下次。 */
function cleanup() {
  try { fs.unlinkSync(OUT); } catch (e) {}
}

/* ---- 找到 Chrome ---- */
function findChrome() {
  var cands = [
    path.join(os.homedir(), "AppData", "Local", "Google", "Chrome", "Application", "chrome.exe"),
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "/usr/bin/google-chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  ];
  for (var i = 0; i < cands.length; i++) {
    try { if (fs.existsSync(cands[i])) return cands[i]; } catch (e) {}
  }
  return null;
}

/* ---- 注入的测试脚本。ES5 风格，跟主代码保持一致。 ---- */
var HARNESS = [
"<script>",
"(function(){",
"  var R = [];",
"  function ok(name, cond, extra) {",
"    R.push((cond ? 'PASS' : 'FAIL') + ' | ' + name + (extra ? ' | ' + extra : ''));",
"  }",
"  window.onerror = function (m, s, l, c) { R.push('FAIL | JS 未捕获错误 | ' + m + ' @' + l + ':' + c); };",
"  function V() { return document.getElementById('view').innerHTML; }",
"  function has(s) { return V().indexOf(s) !== -1; }",
"  function dirty(where) {",
"    var v = V();",
"    var bad = [];",
"    if (/undefined/.test(v)) bad.push('undefined');",
"    if (/NaN/.test(v)) bad.push('NaN');",
"    if (/\\[object Object\\]/.test(v)) bad.push('[object Object]');",
"    ok('渲染无脏值: ' + where, bad.length === 0, bad.join(','));",
"  }",
"",
"  /* 先确认每个命名空间都到位 —— 缺一个就没什么好测的了，",
"     直接报出来比在 100 行后抛 'X is not defined' 好查得多。 */",
"  var NS = ['UI','ICONS','Store','Router','Widgets','GData','COURSES','Course','QUESTIONNAIRE','Record','TOPICS','Pages','ZoneMap'];",
"  var missing = [];",
"  for (var ni = 0; ni < NS.length; ni++) if (typeof window[NS[ni]] === 'undefined') missing.push(NS[ni]);",
"  ok('全部命名空间已加载', missing.length === 0, '缺失: ' + missing.join(','));",
"  if (missing.length) {",
"    var s0 = document.createElement('script'); s0.type = 'text/plain'; s0.id = '__smoke';",
"    s0.textContent = '\\n' + '@@' + 'SMOKE' + '@@' + '\\n' + R.join('\\n') + '\\n' + '@@' + 'END' + '@@' + '\\n';",
"    document.body.appendChild(s0);",
"    return;",
"  }",
"",
"  try {",
"    /* ---------- 0. 从零开始 ---------- */",
"    Store.resetAll();",
"    Router.init();",
"    ok('导航生成 5 个底栏按钮', UI.$all('#tabbar .tab').length === 5);",
"    ok('导航生成 5 个侧栏按钮', UI.$all('#railNav .tab').length === 5);",
"    ok('两套导航文案同源', UI.$all('#railNav .tab')[0].textContent.indexOf('首页') !== -1);",
"",
"    /* ---------- 1. 昵称（首次） ---------- */",
"    Router.navigate('nickname', {});",
"    ok('昵称页出现', has('该怎么称呼你'));",
"    dirty('昵称页');",
"    Store.saveNickname('小舟');",
"    ok('昵称已保存', Store.nickname() === '小舟');",
"    ok('存昵称不会把 done 设成 true', !(Store.getProfile() || {}).done);",
"",
"    /* ---------- 2. 首页 ---------- */",
"    Router.navigate('home', {});",
"    ok('首页问候带昵称', has('你好，小舟'));",
"    ok('首页出现 15 题入口', has('最近的你，还好吗'));",
"    ok('首页出现 6 个探索入口', UI.$all('#view [data-topic]').length === 6);",
"    ok('首页空状态出现', has('这里还很安静'));",
"    ok('手机内联侧栏存在', UI.$all('#view .rail-mobile .rail-card').length === 3);",
"    dirty('首页');",
"",
"    /* ---------- 3. 三步走完 15 题 ---------- */",
"    Router.navigate('questionnaire', {});",
"    ok('答题页出现第 1 题', has('01 / 15'));",
"    var guard = 0;",
"    while (guard++ < 40) {",
"      var picks = UI.$all('#view [data-pick]');",
"      if (picks.length) { picks[guard % picks.length].click(); continue; }",
"      var nxt = UI.$('#view [data-next]');",
"      if (nxt) { var ta = UI.$('#view [data-field=\"free\"]'); if (ta) ta.value = '第 ' + guard + ' 次测试写下的一句话'; nxt.click(); continue; }",
"      break;",
"    }",
"    ok('15 题走完到完成页', has('第一次认识自己'), '循环 ' + guard + ' 次');",
"    dirty('完成页');",
"    var fr = Store.firstRecord();",
"    ok('生成了《第一次认识自己》记录', !!fr);",
"    ok('记录含分段正文', !!(fr && fr.meta.record && fr.meta.record.sections.length >= 5));",
"    ok('答案版本标记为 2', Store.answersVersion() === 2);",
"    ok('profile 已标记 done', !!(Store.getProfile() || {}).done);",
"",
"    /* ---------- 4. 记录详情 ---------- */",
"    Router.navigate('record', { id: fr.id });",
"    ok('记录详情出现状态段', has('我最近的状态'));",
"    ok('记录详情保留了换行', V().indexOf('<br>') !== -1);",
"    dirty('记录详情');",
"",
"    /* ---------- 5. 成长轨迹首节点 ---------- */",
"    Router.navigate('trace', {});",
"    ok('轨迹出现首个节点', has('第一次认识自己'));",
"    ok('轨迹是纵向时间轴', UI.$all('#view .tl-v .tl-item').length >= 1);",
"    dirty('成长轨迹');",
"",
"    /* ---------- 6. 记录：小记 + 心情 ---------- */",
"    Router.navigate('notes', {});",
"    UI.$('#view [data-field=\"dailyNote\"]').value = '今天有点累，但还是写下了一句。';",
"    UI.$('#view [data-save-note]').click();",
"    ok('小记写入成功', !!Store.todayEntry('note'));",
"    UI.$all('#view [data-mood]')[3].click();",
"    ok('心情写入成功', !!Store.todayEntry('mood'));",
"    ok('心情曲线出现', UI.$all('#view .mood-curve').length >= 1);",
"    ok('同一天改主意不会写两条', Store.entries('mood').length === 1, '实际 ' + Store.entries('mood').length);",
"    dirty('记录页');",
"",
"    /* ---------- 7. 探索：9 区 + 主题 + 课程 ---------- */",
"    Router.navigate('explore', {});",
"    ok('9 区地图完整渲染', UI.$all('#view .zone-cell').length === 9, '实际 ' + UI.$all('#view .zone-cell').length);",
"    ok('中央区标记为可学习', UI.$all('#view .zone-cell.live').length === 1);",
"    ok('课程行出现 5 节', UI.$all('#view [data-go-lesson]').length === 5);",
"    dirty('探索页');",
"",
"    /* ---------- 8. 探索入口 -> 主题页 ---------- */",
"    UI.$all('#view [data-topic]')[0].click();",
"    ok('主题页出现「被听见」的那句话', has('心里好像一直悬着点什么'));",
"    ok('主题页给了方向', UI.$all('#view [data-go-lesson]').length >= 1);",
"    ok('主题页留了「什么都不做也行」的出口', has('今天什么都不想做，也可以'));",
"    ok('看过入口被记下', Store.settings().explored.length === 1);",
"    ok('浏览入口不计入连续天数以外的记录', Store.journal().length === 3, '实际 ' + Store.journal().length);",
"    dirty('主题页');",
"",
"    /* ---------- 9. 课程页（跨门类下一节 + 区域名不再写死） ---------- */",
"    Router.navigate('lesson', { id: 'c1' });",
"    /* 对着数据断言，不写死字面量 —— 区域改名时这里不该假失败 */",
"    var c1region = GData.regionById(Course.byId('c1').regionId);",
"    ok('课程页的区域名来自数据', !!c1region && has(c1region.name), c1region ? c1region.name : '区域为空');",
"    ok('课程页不再写死旧文案', !has('中央区 · 自我认知与反应'));",
"    ok('课程页节号有两位补零', has('第 01 节'));",
"    dirty('课程页');",
"    Router.navigate('lesson', { id: 'c5' });",
"    ok('最后一节没有「下一节」', !UI.$('#view #goNext'));",
"    ok('下一节只在同区内找（c5 无后继）', Course.nextAfter('c5') === null);",
"",
"    /* ---------- 10. 我的 ---------- */",
"    Router.navigate('me', {});",
"    ok('我的页显示画像', has('我的画像') && has('我最近的状态'));",
"    ok('我的页统计已更新', has('条记录'));",
"    ok('提醒开关是关的（诚实默认）', UI.$('#view .switch.on') === null);",
"    UI.$('#view [data-toggle-remind]').click();",
"    ok('提醒开关可切换', Store.settings().remind.on === true);",
"    dirty('我的');",
"",
"    /* ---------- 11. 收藏 ---------- */",
"    Router.navigate('explore', {});",
"    UI.$all('#view [data-fav]')[0].click();",
"    ok('收藏成功', Store.favorites().length === 1);",
"    ok('收藏的课排在最前', UI.$all('#view [data-go-lesson]')[0].getAttribute('data-go-lesson') === Store.favorites()[0]);",
"",
"    /* ---------- 12. 布局：底栏 / 侧栏 / 右栏 的切换 ---------- */",
"    /* 必须回到首页再量 —— .rail-mobile 是首页的侧栏副本，",
"       停在探索页会让 getComputedStyle 拿到 null。 */",
"    Router.navigate('home', {});",
"    var w = window.innerWidth;",
"    var tab = getComputedStyle(document.getElementById('tabbar')).display;",
"    var rail = getComputedStyle(document.getElementById('rail')).display;",
"    var rail2 = getComputedStyle(document.getElementById('rail2')).display;",
"    var mob = getComputedStyle(UI.$('#view .rail-mobile')).display;",
"    if (w < 900) {",
"      ok('手机：底栏显示', tab !== 'none');",
"      ok('手机：侧栏隐藏', rail === 'none');",
"      ok('手机：右栏隐藏', rail2 === 'none');",
"      ok('手机：内联侧栏显示', mob !== 'none');",
"    } else if (w < 1180) {",
"      ok('中屏：底栏隐藏', tab === 'none');",
"      ok('中屏：侧栏显示', rail !== 'none');",
"      ok('中屏：右栏隐藏', rail2 === 'none');",
"      ok('中屏：内联侧栏显示', mob !== 'none');",
"    } else {",
"      ok('宽屏：底栏隐藏', tab === 'none');",
"      ok('宽屏：侧栏显示', rail !== 'none');",
"      ok('宽屏：右栏显示', rail2 !== 'none');",
"      ok('宽屏：内联侧栏让位', mob === 'none');",
"      ok('宽屏：右栏有内容', document.getElementById('rail2').innerHTML.length > 200);",
"    }",
"    ok('无横向滚动 @' + w, document.documentElement.scrollWidth <= w + 1,",
"       'scrollWidth=' + document.documentElement.scrollWidth + ' innerWidth=' + w);",
"",
"    /* ---------- 13. 切页滚动复位 ---------- */",
"    window.scrollTo(0, 600);",
"    Router.navigate('me', {});",
"    ok('切页后滚动复位', window.scrollY === 0, 'scrollY=' + window.scrollY);",
"",
"    /* ---------- 14. 老数据兼容 ---------- */",
"    localStorage.setItem('gs.profile', JSON.stringify({",
"      done: true, startedAt: 1,",
"      portrait: { state: '你最近的状态偏向于安静地观察自己。', focus: ['情绪与反应', '关系与沟通'] },",
"      answers: { a1: 3, a2: 4, a3: 2, a4: 3, a5: 4 }",
"    }));",
"    ok('老数据被识别为 v1', Store.answersVersion() === 1);",
"    Router.navigate('me', {});",
"    ok('老画像仍然显示', has('你最近的状态偏向于安静地观察自己'));",
"    ok('老 focus 仍然显示', has('情绪与反应'));",
"    ok('给了软提示但不主动清空', has('要不要用新的 15 题再认识一次'));",
"    ok('老 answers 一字未动', JSON.stringify(Store.getProfile().answers).indexOf('a1') !== -1);",
"    ok('老 portrait 一字未动', !!Store.getProfile().portrait.state);",
"  } catch (e) {",
"    R.push('FAIL | 测试脚本异常 | ' + (e && e.message) + ' @ ' + (e && e.stack ? e.stack.split('\\n')[1] : ''));",
"  }",
"",
"  R.push('INFO | 实际视口 innerWidth=' + window.innerWidth + ' dpr=' + window.devicePixelRatio +",
"         ' 命中断点=' + (window.innerWidth < 900 ? '手机' : (window.innerWidth < 1180 ? '中屏' : '宽屏')));",
"",
"  var s = document.createElement('script');",
"  s.type = 'text/plain';",
"  s.id = '__smoke';",
"  /* 标记必须运行时拼 —— 直接写字面量的话，它也会出现在注入的源码里，",
"     提取时会先命中源码那一份，拿到的是一堆转义过的测试代码。 */",
"  s.textContent = '\\n' + '@@' + 'SMOKE' + '@@' + '\\n' + R.join('\\n') + '\\n' + '@@' + 'END' + '@@' + '\\n';",
"  document.body.appendChild(s);",
"})();",
/* 收尾必须是真正的 </script>。写成 <\/script> 的话 HTML 解析器不认，
   会把后面的 </body></html> 一起吞进脚本源码 —— 整段语法错误，
   页面看起来「什么都没跑」，而 dump 出来的 DOM 完全正常，极难排查。
   （这个转义只在「JS 字符串本身写在 HTML 的 <script> 里」时才需要，这里不需要。） */
"</script>"
].join("\n");

function buildSmokeFile() {
  var html = fs.readFileSync(SRC, "utf8").replace(/^﻿/, "");
  if (html.indexOf("</body>") === -1) throw new Error(path.basename(SRC) + " 里找不到 </body>");
  html = html.replace("</body>", HARNESS + "\n</body>");
  fs.writeFileSync(OUT, html, "utf8");
}

function runChrome(chrome, width) {
  var url = "file:///" + OUT.replace(/\\/g, "/");
  var args = [
    "--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run",
    "--disable-extensions", "--disable-background-networking",
    "--window-size=" + width + ",900",
    "--virtual-time-budget=6000",
    "--dump-dom", url
  ];
  var r = cp.spawnSync(chrome, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 90000 });
  return (r.stdout || "") + (r.stderr || "");
}

function extract(dom) {
  var a = dom.indexOf("@@SMOKE@@");
  var b = dom.indexOf("@@END@@");
  if (a === -1 || b === -1) return null;
  return dom.slice(a + 9, b)
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&")
    .split("\n").map(function (s) { return s.replace(/\s+$/, ""); })
    .filter(function (s) { return s.length; });
}

function main() {
  var chrome = findChrome();
  if (!chrome) { console.error("找不到 Chrome / Edge，无法运行冒烟测试"); process.exit(2); }
  console.log("浏览器: " + chrome);
  console.log("被测文件: " + SRC);
  buildSmokeFile();

  var fails = [], total = 0;
  for (var i = 0; i < WIDTHS.length; i++) {
    var w = WIDTHS[i];
    var lines = extract(runChrome(chrome, w));
    console.log("\n=== 视口 " + w + "px ===");
    if (!lines) {
      console.log("  !! 没有拿到测试输出（页面可能加载失败）");
      fails.push(w + "px: 无输出");
      continue;
    }
    for (var j = 0; j < lines.length; j++) {
      total++;
      if (lines[j].indexOf("FAIL") === 0) { fails.push(w + "px " + lines[j]); console.log("  " + lines[j]); }
      else if (lines[j].indexOf("INFO") === 0) console.log("  " + lines[j]);
      else if (w === WIDTHS[0]) console.log("  " + lines[j]);
    }
  }

  console.log("\n========================================");
  console.log("断言 " + total + " 条，失败 " + fails.length + " 条");
  /* 先收尾再退出 —— process.exit() 之后什么都不跑，
     放在最后一行的话这个文件会永远留在项目根目录 */
  cleanup();
  if (fails.length) { for (var k = 0; k < fails.length; k++) console.log("  ✗ " + fails[k]); process.exit(1); }
  console.log("全部通过");
  process.exit(0);
}

main();
