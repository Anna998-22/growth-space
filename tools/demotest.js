/* =========================================================================
 * 成长空间 · 示例模式检查（node 内置模块 + 本机 Chrome，零依赖）
 * -------------------------------------------------------------------------
 * 示例模式有一条不能破的性质：【一个字节都不许写进 LocalStorage】。
 * 破了的话，朋友点一下示例就会覆盖掉自己的真实数据 —— 而且没有任何提示。
 *
 * 这个工具就盯着这一条，顺带把进出流程走一遍：
 *   称呼页有入口 → 点进去 → 横幅出现 / 首页有内容
 *   → 点心情 → 再点收藏 → 全程 gs.* 依然是空的
 *   → 点退出 → 横幅消失、回到称呼页
 *
 * 用法：node tools/demotest.js   （退出码 0 = 全过）
 * ========================================================================= */
"use strict";

var fs = require("fs");
var path = require("path");
var os = require("os");
var cp = require("child_process");

var ROOT = path.resolve(__dirname, "..");
var PAGE = path.join(ROOT, "_demotest.html");

var JS = [
  "(function(){",
  "  var lines=[], step=0;",
  "  function ok(name,cond,extra){ lines.push((cond?'PASS':'FAIL')+'|'+name+(extra?'|'+extra:'')); }",
  "  /* 运行时拼标记：--dump-dom 会把本段源码一起吐出来，",
  "     写死字面量的话匹配到的是源码，不是输出。",
  "     也别顺手把标记写进 document.title —— 那样它在 DOM 里同样是个",
  "     字面量，而且出现在文档最前面，正则从那开始吃，整页都会当成结果。 */",
  "  function done(){",
  "    var p=document.createElement('pre');",
  "    p.textContent='@@'+'M@@\\n'+lines.join('\\n')+'\\n@@'+'E@@';",
  "    document.body.appendChild(p); }",
  "  function keys(){ var out=[],i,k;",
  "    try{ for(i=0;i<localStorage.length;i++){ k=localStorage.key(i);",
  "      if(k&&k.indexOf('gs.')===0) out.push(k); } }catch(e){ out.push('THREW:'+e.name); }",
  "    return out; }",
  "  function q(s){ return document.querySelector(s); }",
  "  /* 读【实际占位高度】，不读 hidden 属性。",
  "     CSS 里写了 display:flex 的话，作者样式会盖掉浏览器默认的",
  "     [hidden]{display:none} —— 属性还是 true，横幅却好好地在屏幕上。",
  "     第一版这里读的就是属性，于是这条断言对着一个全程可见的横幅报了 PASS。 */",
  "  function demoBarOn(){",
  "    var b=q('#demoBar');",
  "    return !!b && b.getBoundingClientRect().height > 0;",
  "  }",
  "  function txt(){ return document.body.innerText||''; }",
  "",
  "  var t=[",
  "    function(){",
  "      ok('称呼页出现示例入口', !!q('[data-demo]'));",
  "      ok('称呼页上横幅是藏着的', !demoBarOn());",
  "      ok('起始时没有 gs.* 键', keys().length===0, keys().join(','));",
  "      var d=q('[data-demo]'); if(d) d.click();",
  "    },",
  "    function(){",
  "      ok('点示例后横幅出现', demoBarOn());",
  "      ok('body 带 demo-on', document.body.className.indexOf('demo-on')!==-1);",
  "      ok('落到了首页', txt().indexOf('此刻，你想看什么')!==-1);",
  "      ok('首页显示了示例昵称', txt().indexOf('小舟')!==-1);",
  "      ok('首页有示例记录', txt().indexOf('最近的成长记录')!==-1);",
  "      ok('★ 示例数据没有写进 LocalStorage', keys().length===0, keys().join(','));",
  "      var m=q('.mood-btn'); if(m) m.click();",
  "    },",
  "    function(){",
  "      ok('点心情后仍没写 LocalStorage', keys().length===0, keys().join(','));",
  "      var f=q('[data-fav]'); if(f) f.click();",
  "    },",
  "    function(){",
  "      ok('点收藏后仍没写 LocalStorage', keys().length===0, keys().join(','));",
  "      var b=q('#demoExit'); ok('横幅上有退出按钮', !!b); if(b) b.click();",
  "    },",
  "    function(){",
  "      ok('退出后横幅消失', !demoBarOn());",
  "      ok('退出后 body 不再带 demo-on', document.body.className.indexOf('demo-on')===-1);",
  "      ok('退出后回到称呼页', txt().indexOf('该怎么称呼你')!==-1);",
  "      ok('退出后 LocalStorage 依然是空的', keys().length===0, keys().join(','));",
  "      done();",
  "    }",
  "  ];",
  "  function next(){",
  "    if(step>=t.length){ if(lines.indexOf('@@done@@')===-1) done(); return; }",
  "    var fn=t[step++];",
  "    setTimeout(function(){ try{ fn(); }catch(e){ lines.push('FAIL|第'+step+'步抛异常|'+e.message); } next(); },420);",
  "  }",
  "  window.addEventListener('load', function(){ setTimeout(next,500); });",
  "})();"
].join("\n");

function findChrome() {
  var cands = [
    path.join(os.homedir(), "AppData", "Local", "Google", "Chrome", "Application", "chrome.exe"),
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
  ];
  for (var i = 0; i < cands.length; i++) {
    try { if (fs.existsSync(cands[i])) return cands[i]; } catch (e) {}
  }
  return null;
}

function main() {
  var chrome = findChrome();
  if (!chrome) { console.error("找不到 Chrome"); process.exit(2); }

  var html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  /* 把探针插在 </body> 前，排在 app.js 之后 */
  html = html.replace(/<\/body>/, "<script>" + JS + "<\/script>\n</body>");
  fs.writeFileSync(PAGE, html, "utf8");

  var url = "file:///" + PAGE.replace(/\\/g, "/");
  var bad = [];
  try {
    var r = cp.spawnSync(chrome, [
      "--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run",
      "--disable-extensions", "--hide-scrollbars",
      "--allow-file-access-from-files",
      "--user-data-dir=" + path.join(os.tmpdir(), "gs-demotest-profile"),
      "--window-size=520,1000",
      "--virtual-time-budget=30000", "--dump-dom", url
    ], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 180000 });

    var dom = (r && r.stdout) || "";
    var m = dom.match(/@@M@@([\s\S]*?)@@E@@/);
    if (!m) { console.error("探针没跑出结果（DOM 长度 " + dom.length + "）"); process.exit(1); }

    /* 逐行去掉 \r：--dump-dom 在 Windows 上给的行尾是 CRLF，
       不剥掉的话「小舟」和「小舟」会比不相等 —— 肉眼看不出来 */
    var rows = m[1].replace(/\r/g, "").split("\n");
    console.log("示例模式检查：");
    for (var i = 0; i < rows.length; i++) {
      if (!rows[i]) continue;
      var c = rows[i].split("|");
      var pass = c[0] === "PASS";
      console.log("  " + c[0] + " | " + c[1] + (c[2] ? "   [" + c[2] + "]" : ""));
      if (!pass) bad.push(c[1] + (c[2] ? " [" + c[2] + "]" : ""));
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
  console.log("示例模式：进出正常，且全程没有写过一个字节的 LocalStorage");
}

main();
