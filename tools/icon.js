/* =========================================================================
 * 成长空间 · 主屏幕图标生成
 * -------------------------------------------------------------------------
 * 为什么需要：iOS 的「添加到主屏幕」如果没有 apple-touch-icon，会拿一张
 * 页面截图当图标 —— 灰扑扑的一小块，跟旁边那些正经 App 放一起很扎眼。
 * 既然这一版以 iOS 为主，这个图标就是「加到主屏幕」这条路的门面。
 *
 * 做法：手写 PNG 编码（zlib + 自算 CRC32），图形用解析式画再超采样。
 * 不引任何依赖，也不引任何素材文件 —— 图标本身就是代码算出来的，
 * 改配色只要动下面两个常量。
 *
 * 图形用的就是 App 里那个新芽 logo，控制点和 index.html 的 SVG 一一对应：
 *   圆环  r=0.70
 *   茎    竖线 v ∈ [0.0125, 0.35]
 *   双叶  两个半径 0.2875 的圆求交（vesica），描边不填充
 *
 * 用法：node tools/icon.js        生成 icon-180.png
 * ========================================================================= */
"use strict";

var fs = require("fs");
var path = require("path");
var zlib = require("zlib");

var ROOT = path.resolve(__dirname, "..");
var OUT = path.join(ROOT, "icon-180.png");

var SIZE = 180;          /* iOS 主屏图标的标准尺寸 */
var SS = 4;              /* 每像素 4×4 超采样，边缘才不会锯齿 */

var BG = [0x45, 0x65, 0x5c];   /* --brand-ink 深雾绿，和主按钮同色 */
var FG = [0xf7, 0xf5, 0xf1];   /* --bg 暖白 */

/* ---- 图形：在 [-1,1]² 上判定某点是不是芽的一部分 ----
   scale 把整个图形缩到 0.88，四周留出边距，免得贴到图标边缘 */
var SCALE = 0.88;

function hit(u, v) {
  var x = u / SCALE, y = v / SCALE;

  /* 圆环 */
  var d = Math.sqrt(x * x + y * y);
  if (Math.abs(d - 0.70) < 0.045) return true;

  /* 茎 */
  if (Math.abs(x) < 0.0437 && y >= 0.0125 && y <= 0.35) return true;

  /* 双叶：两个圆的交（vesica piscis），只描边 */
  var R = 0.2875, HS = 0.0437;
  var B = { x: 0, y: -0.275 };            /* 上方那个圆心，两片叶子共用 */
  var centres = [{ x: -0.2875, y: 0.0125 }, { x: 0.2875, y: 0.0125 }];

  for (var i = 0; i < 2; i++) {
    var A = centres[i];
    var dA = Math.sqrt((x - A.x) * (x - A.x) + (y - A.y) * (y - A.y));
    var dB = Math.sqrt((x - B.x) * (x - B.x) + (y - B.y) * (y - B.y));
    /* 交线的两段圆弧各来自一个圆；哪一段落在另一个圆里，哪一段就是边界 */
    if (Math.abs(dA - R) < HS && dB <= R + HS) return true;
    if (Math.abs(dB - R) < HS && dA <= R + HS) return true;
  }
  return false;
}

/* ---- 画布 ---- */
function render() {
  var px = Buffer.alloc(SIZE * SIZE * 4);
  var step = 2 / (SIZE * SS);
  for (var py = 0; py < SIZE; py++) {
    for (var pxi = 0; pxi < SIZE; pxi++) {
      var cov = 0;
      for (var sy = 0; sy < SS; sy++) {
        for (var sx = 0; sx < SS; sx++) {
          /* 采样点取在每个子像素的中心 */
          var u = -1 + step * (pxi * SS + sx + 0.5);
          var v = -1 + step * (py * SS + sy + 0.5);
          if (hit(u, v)) cov++;
        }
      }
      var a = cov / (SS * SS);
      var o = (py * SIZE + pxi) * 4;
      for (var c = 0; c < 3; c++) px[o + c] = Math.round(BG[c] * (1 - a) + FG[c] * a);
      px[o + 3] = 255;                    /* 全不透明：iOS 自己会做圆角遮罩 */
    }
  }
  return px;
}

/* ---- PNG 编码 ---- */
var CRC_TABLE = (function () {
  var t = [], c, n, k;
  for (n = 0; n < 256; n++) {
    c = n;
    for (k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  var c = 0xffffffff;
  for (var i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  var len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  var body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  var crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function png(px) {
  var ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8;        /* 位深 */
  ihdr[9] = 6;        /* 颜色类型 6 = RGBA */
  ihdr[10] = 0;       /* 压缩方式 */
  ihdr[11] = 0;       /* 滤波方式 */
  ihdr[12] = 0;       /* 非隔行 */

  /* 每条扫描线前面要加一个滤波字节，这里统一用 0（None） */
  var raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
  for (var y = 0; y < SIZE; y++) {
    raw[y * (SIZE * 4 + 1)] = 0;
    px.copy(raw, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

if (require.main === module) {
  var buf = png(render());
  fs.writeFileSync(OUT, buf);
  process.stdout.write("✓ 已生成 " + path.basename(OUT) + "（" + buf.length + " 字节，" +
    SIZE + "×" + SIZE + " RGBA）\n");
}

module.exports = { render: render, png: png };
