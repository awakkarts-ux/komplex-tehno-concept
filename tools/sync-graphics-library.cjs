// Refresh the standalone library's affected modules from the actual page scripts.
// The original Python generator is outside this repository; keep this bridge reproducible.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const file = 'biblioteka-grafiki.html';
let html = read(file);
const start = html.indexOf('var D = ') + 8;
const end = html.indexOf('\n', start);
const data = JSON.parse(html.slice(start, end).trim().replace(/;$/, ''));
const home = read('js/home.js'), hvs = read('js/hvs.js');
const homeCss = read('css/home.css');
const cssStart = homeCss.indexOf('.uzel__swipe, .hero-a__swipe');
const cssEnd = homeCss.indexOf('.uzel__svg .hit', cssStart);
const homeFix = homeCss.slice(cssStart, cssEnd);
const hintFix = '\n.hvs .hvs__sc:not(.is-scroll) > .hvs__swipe,.hvs .hvs__sc + .hvs__swipe:not(.is-scroll){display:none}\n';
const wideTouch = read('css/uslugi-b.css').match(/\/\* audit-wide-touch:start[\s\S]*?\/\* audit-wide-touch:end \*\//)[0];
for (const e of data.els) {
  e.css = e.css.replace(/\n\/\* audit-p23:start \*\/[\s\S]*?\/\* audit-p23:end \*\//g, '');
  let css = '';
  if (e.id === 'uzel') { e.js = home; css += homeFix; }
  if (['dots', 'rem', 'season'].includes(e.kind) && e.id !== 'uzel' || e.id === 'err') {
    e.js = hvs; css += hintFix + wideTouch;
  }
  if (e.id === 'err') css += '@media(max-width:767px){.hvs__sc--err .hvs__err{width:max(100%,var(--hvs-min,37rem));max-width:none}}';
  if (e.id === 'ap') css += '@media(max-width:1199px){.ap-ind__node:first-child::before{left:0}.ap-ind__node:last-child::before{right:0}}';
  if (css) e.css += '\n/* audit-p23:start */\n' + css + '\n/* audit-p23:end */';
}
html = html.slice(0, start) + JSON.stringify(data).replace(/<\//g, '<\\/') + ';' + html.slice(end);
fs.writeFileSync(path.join(root, file), html);
console.log('Updated library: '+data.els.length+' entries');
