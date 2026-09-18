/* =========================================================================
 * 成长空间 · 截图（node 内置模块 + 本机 Chrome，零依赖）
 * -------------------------------------------------------------------------
 * 用途：改版之后，人眼确认一遍实际渲染结果。
 *
 * 原理：file:// 在 Chrome 里是同一个 origin，LocalStorage 是共享的。
 *   第 1 步  用同一个 --user-data-dir 跑一次种子页，把数据写进 LocalStorage
 *   第 2 步  同一个 --user-data-dir 再打开 index.html 截图 —— 数据还在
 *
 * 用法：node tools/shot.js            只截首页，手机/中屏/宽屏三档
 *       node tools/shot.js all        五个 tab 页 + 答题页
 *       node tools/shot.js demo       示例模式（带顶部横幅），只截首页
 * 产物在 tools/shots/
 * ========================================================================= */
"use strict";

var fs = require("fs");
var path = require("path");
var os = require("os");
var cp = require("child_process");

var ROOT = path.resolve(__dirname, "..");
var SHOTS = path.join(__dirname, "shots");
var PROFILE = path.join(os.tmpdir(), "gs-shot-profile");
var SEED = path.join(ROOT, "_seed.html");
var DEMO = path.join(ROOT, "_demo.html");
var FRAME = path.join(ROOT, "_frame.html");

/* 为什么截图要套一层 iframe：
   Chrome 在 Windows 上有最小窗口宽度（实测 ~487px），--window-size=390 拿到的
   视口其实是 487 —— 页面按 487 排版，图片再裁成 390 宽。于是「手机端截图」
   看起来所有东西都被右边切掉了，那是裁切，不是布局坏了。
   套一个 width=390 的 iframe，里面的页面才真的按 390 排版。 */
function buildFrame(w, h, url) {
  var html = '<!doctype html><meta charset="utf-8">' +
    "<style>html,body{margin:0;background:#fff}iframe{display:block;border:0;width:" +
    w + "px;height:" + h + "px}</style>" +
    '<iframe src="' + url + '"></iframe>';
  fs.writeFileSync(FRAME, html, "utf8");
  return "file:///" + FRAME.replace(/\\/g, "/");
}

function findChrome() {
  var cands = [
    path.join(os.homedir(), "AppData", "Local", "Google", "Chrome", "Application", "chrome.exe"),
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "/usr/bin/google-chrome"
  ];
  for (var i = 0; i < cands.length; i++) {
    try { if (fs.existsSync(cands[i])) return cands[i]; } catch (e) {}
  }
  return null;
}

/* ---------------------------------------------------------------------
 * 种子脚本：写一份「用过十来天」的数据，让空状态之外的样子也能被看到
 *
 * 数据本身来自 js/data/demo.js —— 就是「先看看示例」用的那一份。
 * 这里【不再】另抄一份：抄本迟早会和正本漂移，而「截图里看到的样子」
 * 和「朋友点开看到的样子」必须是同一个东西，否则截图就失去意义了。
 *
 * 唯一的区别是落地方式：示例模式把数据放在内存里（不碰 LocalStorage），
 * 而截图要跨进程（先播种、再截图），所以这里把它写进 LocalStorage。
 * ------------------------------------------------------------------- */
var SEED_JS = [
"<script>",
"(function(){",
"  var d = DemoData.build();",
"  for (var k in d) {",
"    if (d.hasOwnProperty(k)) localStorage.setItem('gs.' + k, JSON.stringify(d[k]));",
"  }",
"  /* 不用自己跳页 —— app.js 首屏会认 location.hash。",
"     之前这里挂了个 DOMContentLoaded + setTimeout 去 Router.navigate，",
"     在 headless 下静默不生效，于是 18 张截图里 trace/me/... 全是首页。",
"     少一条会悄悄失灵的通路，就少一次「验证工具在骗我」。 */",
"})();",
"</script>"
].join("\n");

/* 示例模式截图用：打开就是示例模式，不碰 LocalStorage */
var DEMO_JS = [
"<script>",
"window.addEventListener('load', function(){",
"  setTimeout(function(){",
"    window.devDemo(true);",
"    var h = String(location.hash||'').replace(/^#\\/?/,'');",
"    if (h && window.Pages[h]) Router.navigate(h, {});",
"  }, 150);",
"});",
"</script>"
].join("\n");

function buildSeed() {
  var html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  fs.writeFileSync(SEED, html.replace("</body>", SEED_JS + "\n</body>"), "utf8");
  fs.writeFileSync(DEMO, html.replace("</body>", DEMO_JS + "\n</body>"), "utf8");
}

function chromeRun(chrome, args) {
  return cp.spawnSync(chrome, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 120000 });
}

function main() {
  var chrome = findChrome();
  if (!chrome) { console.error("找不到 Chrome"); process.exit(2); }
  if (!fs.existsSync(SHOTS)) fs.mkdirSync(SHOTS);
  buildSeed();

  var common = ["--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run",
                "--disable-extensions", "--hide-scrollbars",
                "--user-data-dir=" + PROFILE, "--force-device-scale-factor=1"];

  /* 1) 先播种 */
  if (process.argv[2] !== "demo") {
    var seedUrl = "file:///" + SEED.replace(/\\/g, "/");
    chromeRun(chrome, common.concat(["--virtual-time-budget=4000", "--dump-dom", seedUrl]));
    console.log("已播种数据");
  }

  /* 2) 再截图 */
  var idxUrl0 = "file:///" + path.join(ROOT, "index.html").replace(/\\/g, "/");
  var demoUrl0 = "file:///" + DEMO.replace(/\\/g, "/");
  var jobs = [];
  var mode = process.argv[2] || "";
  var demo = mode === "demo";
  var all = mode === "all";
  var pages = all ? ["", "trace", "notes", "explore", "me", "questionnaire"] : [""];
  var widths = [390, 1000, 1440];
  /* 示例模式截的是「朋友点开先看看示例」看到的那个样子：
     带顶部横幅、不碰 LocalStorage，值得单独看一遍。 */
  var indexUrl = demo ? demoUrl0 : idxUrl0;

  for (var p = 0; p < pages.length; p++) {
    for (var w = 0; w < widths.length; w++) {
      jobs.push({ page: pages[p], width: widths[w] });
    }
  }

  /* 每个页面独有的一个字符串，用来证明「这个 hash 真的落到了那一页」。
     之前这里只检查 PNG 文件存不存在就打 ✓ —— 而 #trace 当时根本没人读，
     18 张图里 15 张是首页，日志却全是 ✓。截图工具自己会撒谎，就得让它自证。 */
  /* 必须挑【只在这一页】出现的字符串：「今日小记」「此刻，你想看什么」
     首页也有，拿它们当标记，跳转失败时照样通过。 */
  var MARK = {
    "": "最近的成长记录",
    trace: "你走过的每一步",
    notes: "全部记录",
    explore: "九个成长方向",
    me: "我的画像",
    questionnaire: "q-text"
  };

  function verify(page) {
    var url = indexUrl + (page ? "#" + page : "");
    var r = chromeRun(chrome, common.concat([
      "--window-size=1440,1100", "--virtual-time-budget=4000", "--dump-dom", url
    ]));
    var dom = (r && r.stdout) || "";
    if (!dom) return "拿不到 DOM";
    /* 首页的标记出现在别的页面上 = 跳转没生效，这一张截图是假的 */
    if (MARK[page] && dom.indexOf(MARK[page]) === -1) return "没渲染出「" + MARK[page] + "」";
    /* 落回首页是最常见的一种失败，单独报出来 */
    if (page && dom.indexOf(MARK[""]) !== -1) return "落回了首页（hash 没生效）";
    return "";
  }

  var bad = [];
  for (var v = 0; v < pages.length; v++) {
    var why = verify(pages[v]);
    if (why) bad.push((pages[v] || "home") + ": " + why);
  }
  if (bad.length) {
    console.error("✗ 页面没有真正落到对应路由，截图不可信：");
    for (var b = 0; b < bad.length; b++) console.error("    " + bad[b]);
    process.exit(1);
  }

  for (var i = 0; i < jobs.length; i++) {
    var j = jobs[i];
    var name = (demo ? "demo-" : "") + (j.page || "home") + "-" + j.width + ".png";
    var out = path.join(SHOTS, name);
    var url = indexUrl + (j.page ? "#" + j.page : "");
    /* 手机那一档截高一些：1100px 看不到底部导航和内联侧栏卡片，
       而「底栏有没有、会不会横向滚动」正是手机端最该看的两件事 */
    var fh = j.width < 600 ? 2400 : 1100;
    var frame = buildFrame(j.width, fh, url);
    chromeRun(chrome, common.concat([
      /* 窗口比 iframe 宽，多出来的部分是白边：宁可图里留白，
         也不要让 Chrome 的最小宽度把里面的排版改掉 */
      "--window-size=" + Math.max(j.width + 40, 540) + "," + (fh + 40),
      "--virtual-time-budget=4000",
      "--screenshot=" + out,
      frame
    ]));
    /* 路由已在上面的 verify() 里证过了，这里只报「写出来了没有、多大」 */
    console.log("  " + (fs.existsSync(out) ? "✓ " + fs.statSync(out).size + "B" : "✗ 没写出") + "\t" + name);
  }
  /* 临时页跑完就删 —— 它们在项目根目录，留着会被一起推到 GitHub Pages */
  try { fs.unlinkSync(SEED); } catch (e) {}
  try { fs.unlinkSync(DEMO); } catch (e) {}
  try { fs.unlinkSync(FRAME); } catch (e) {}

  console.log("\n产物目录: " + SHOTS);
}

main();
