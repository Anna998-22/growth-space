/* =========================================================================
 * 成长空间 · 手机宽度横向溢出检查（node 内置模块 + 本机 Chrome，零依赖）
 * -------------------------------------------------------------------------
 * 为什么需要单独一个工具：
 *   tools/smoke.js 用 --window-size 设视口，而 Chrome 在 Windows 上有最小窗口
 *   宽度（实测 ~487px）。请求 390 拿到的是 487 —— 于是「手机端无横向滚动」
 *   这条断言其实是在 487px 下验的，跟真机没关系。
 *
 * 这个工具把页面套进一个 width=真实手机宽的 iframe 里，里面的文档才会真的
 * 按那个宽度排版。然后逐个页面读 documentElement.scrollWidth 比对 innerWidth。
 *
 * 用法：node tools/mobile.js                默认 390
 *       node tools/mobile.js 414 375 360    指定多个宽度
 * 退出码 0 = 所有页面都不溢出；1 = 有页面溢出（会逐条打印）
 * ========================================================================= */
"use strict";

var fs = require("fs");
var path = require("path");
var os = require("os");
var cp = require("child_process");

var ROOT = path.resolve(__dirname, "..");
var PAGE = path.join(ROOT, "_mobile.html");

var PAGES = ["", "trace", "notes", "explore", "me", "questionnaire"];

/* 每页顶栏应当出现的标题。这条断言是必须的：
   干净的 profile 会让 app.js 每次都先跳「称呼」页 ——
   于是六个页面量到的其实是同一个页面，还全部 PASS。
   只看 scrollWidth 永远发现不了这件事，标题才是照妖镜。 */
var EXPECT = {
  home: "首页", trace: "成长轨迹", notes: "记录",
  explore: "探索", me: "我的", questionnaire: "认识自己"
};

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

/* 探针页：自己开 iframe、自己换页、把结果写进 <pre>。
   标记在运行时拼接 —— --dump-dom 会把这段源码一起吐出来，
   写死字面量的话，抓到的是源码而不是输出。 */
function buildProbe(width) {
  var js = [
    "(function(){",
    "  var PAGES=" + JSON.stringify(PAGES) + ";",
    "  var f=document.getElementById('f'),out=document.getElementById('out');",
    "  var lines=[],i=0,guard=null;",
    "  function done(){",
    "    out.textContent='@@'+'M@@\\n'+lines.join('\\n')+'\\n@@'+'E@@';",
    "  }",
    "  /* 先种一个最小 profile。没有它，boot() 每次都先跳「称呼」页，",
    "     六个页面量到的是同一页 —— 而且照样全 PASS。 */",
    "  function prime(){",
    "    f.onload=function(){",
    "      try{",
    "        f.contentWindow.localStorage.setItem('gs.profile',JSON.stringify({",
    "          done:true,startedAt:Date.now(),nickname:'检查',nicknameSetAt:Date.now()}));",
    "      }catch(e){ lines.push('prime|读不到 iframe（'+e.name+'）||'); }",
    "      next();",
    "    };",
    "    f.src='index.html?prime=1';",
    "  }",
    "  function next(){",
    "    if(guard){clearTimeout(guard);guard=null;}",
    "    if(i>=PAGES.length){done();return;}",
    "    var page=PAGES[i++];",
    "    f.onload=function(){",
    "      setTimeout(function(){",
    "        var w,de,title='?';",
    "        try{",
    "          w=f.contentWindow;",
    "          de=f.contentDocument.documentElement;",
    "          var t=f.contentDocument.getElementById('pageTitle');",
    "          if(t)title=t.textContent;",
    "        }catch(e){ lines.push((page||'home')+' 读不到 iframe（'+e.name+'）'); next(); return; }",
    "        var over=de.scrollWidth-w.innerWidth;",
    "        lines.push((page||'home')+'|'+w.innerWidth+'|'+de.scrollWidth+'|'+title);",
    "        next();",
    "      },350);",
    "    };",
    "    /* 保险：load 没触发也要往下走，别让探针吊死在某一页 */",
    "    guard=setTimeout(function(){ lines.push((page||'home')+'|timeout||'); next(); },3000);",
    "    /* 每次换一个 query：只改 hash 不会重新加载文档，load 事件不会来 */",
    "    f.src='index.html?p='+i+(page?'#'+page:'');",
    "  }",
    "  prime();",
    "})();"
  ].join("\n");

  return '<!doctype html><meta charset="utf-8">' +
    "<style>html,body{margin:0;background:#fff}" +
    "iframe{display:block;border:0;width:" + width + "px;height:900px}</style>" +
    '<iframe id="f"></iframe><pre id="out">pending</pre><script>' + js + "<\/script>";
}

function main() {
  var chrome = findChrome();
  if (!chrome) { console.error("找不到 Chrome"); process.exit(2); }

  var widths = process.argv.slice(2).map(Number).filter(function (n) { return n > 0; });
  if (!widths.length) widths = [390];

  var common = ["--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run",
                "--disable-extensions", "--hide-scrollbars",
                /* file:// 下的 iframe 默认是 opaque origin，读不到 contentDocument */
                "--allow-file-access-from-files",
                "--user-data-dir=" + path.join(os.tmpdir(), "gs-mobile-profile")];

  var bad = [];
  try {
    for (var w = 0; w < widths.length; w++) {
      var width = widths[w];
      fs.writeFileSync(PAGE, buildProbe(width), "utf8");
      var url = "file:///" + PAGE.replace(/\\/g, "/");
      var r = cp.spawnSync(chrome, common.concat([
        "--window-size=" + Math.max(width + 60, 560) + ",960",
        "--virtual-time-budget=40000", "--dump-dom", url
      ]), { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 180000 });

      var dom = (r && r.stdout) || "";
      var m = dom.match(/@@M@@([\s\S]*?)@@E@@/);
      console.log("\n=== 视口 " + width + "px ===");
      if (!m) { console.log("  探针没跑出结果"); bad.push(width + "px 探针失败"); continue; }

      /* 每行都要先去掉 \r：--dump-dom 出来的行尾带 CR，
         不剥掉的话「成长轨迹」和「成长轨迹」会比不相等 —— 肉眼完全看不出来 */
      var rows = m[1].replace(/\r/g, "").split("\n");
      for (var i = 0; i < rows.length; i++) {
        if (!rows[i]) continue;                    /* 首尾的空行 */
        var c = rows[i].split("|");
        var name = c[0], iw = c[1], sw = c[2], title = c[3];

        if (name === "prime") { console.log("  " + (rows[i].indexOf("读不到") === -1 ? "PASS" : "FAIL") + " | 已种入 profile"); if (rows[i].indexOf("读不到") !== -1) bad.push(width + "px 种 profile 失败"); continue; }
        if (iw === "timeout" || iw === "") { console.log("  ? " + name + " 超时"); bad.push(width + "px " + name + " 超时"); continue; }

        var over = Number(sw) - Number(iw);
        var why = over > 0 ? "溢出 " + over + "px"
          : Number(iw) !== width ? "视口没生效"
          : title !== EXPECT[name] ? "渲染的不是这一页（标题=" + title + "，应为 " + EXPECT[name] + "）"
          : "";
        var ok = !why;
        console.log("  " + (ok ? "PASS" : "FAIL") + " | " + name +
          " innerWidth=" + iw + " scrollWidth=" + sw + " | " + title +
          (ok ? "" : "  ← " + why));
        if (!ok) bad.push(width + "px " + name + " " + why);
      }
    }
  } finally {
    try { fs.unlinkSync(PAGE); } catch (e) {}
  }

  console.log("\n========================================");
  if (bad.length) {
    console.log("失败 " + bad.length + " 条：");
    for (var b = 0; b < bad.length; b++) console.log("  ✗ " + bad[b]);
    process.exit(1);
  }
  console.log("手机宽度下所有页面均无横向滚动");
}

main();
