import fs from 'node:fs';
import assert from 'node:assert/strict';

// Presentation-only focus mode. Existing routes, applications and original artwork
// remain intact. Rebuild with SWAY_FOCUS=0 to restore the full portfolio chooser.
const file = 'public/index.html';
if (process.env.SWAY_FOCUS === '0') {
  console.log('SWAY focus disabled; original portfolio preserved.');
  process.exit(0);
}
let html = fs.readFileSync(file, 'utf8');
assert(!html.includes('id="sway-focus-style"'), 'Build must start from the original index.');
let held = 0;
let active = 0;
html = html.replace(/<a class="property ([^"]+)"([^>]*)>([\s\S]*?)<\/a>/g,
  (all, classes, attrs, body) => {
    if (classes.split(/\s+/).includes('sway')) {
      active++;
      return `<a class="property ${classes} focus-active"${attrs}>${body.replace('<span>Retail technology</span>', '<span>Current focus</span>')}</a>`;
    }
    held++;
    attrs = attrs.replace(/\s+href="[^"]*"/g, '');
    body = body.replace(/<span class="arrow" aria-hidden="true">[\s\S]*?<\/span>/,
      '<span class="focus-status">On hold</span>');
    return `<a class="property ${classes} on-hold" role="link" aria-disabled="true" tabindex="-1"${attrs}>${body}</a>`;
  });
assert.equal(active, 1, 'Exactly one SWAY tile is required.');
assert.equal(held, 8, 'Expected eight held portfolio tiles.');
html = html.replace('<h1 id="properties-title">Our properties.</h1><p>Media, technology and experiences.<br>Choose a property to explore.</p>',
  '<h1 id="properties-title">Our focus: SWAY.</h1><p>Building creator-led media technology for global, cross-industry use.<br>Other property launches are on hold while we focus on SWAY.</p>');
assert(html.includes('Our focus: SWAY.'), 'Heading replacement failed.');
const style = `
<style id="sway-focus-style">
.portfolio-grid .property.on-hold{cursor:default;background:#5c252b!important;color:#fff5f5!important;box-shadow:inset 0 0 0 1px #a8636a;transform:none!important;pointer-events:none}
.portfolio-grid .property.on-hold::before{filter:grayscale(1) sepia(.6)!important;opacity:.16!important;transform:none!important}
.portfolio-grid .property.on-hold::after{content:"";position:absolute;inset:0;background:rgba(108,20,32,.38)!important;pointer-events:none;z-index:0;opacity:1!important}
.portfolio-grid .property.on-hold .tile-top,.portfolio-grid .property.on-hold .tile-mark,.portfolio-grid .property.on-hold .tile-copy{position:relative;z-index:2;color:#fff5f5!important;opacity:1!important;transform:none!important}
.portfolio-grid .property.on-hold .tile-logo{opacity:.86;filter:grayscale(1)}
.portfolio-grid .property.on-hold .tile-reveal{display:none!important}
.focus-status{display:inline-block;padding:5px 7px;border:1px solid #edbfc4;border-radius:3px;font-size:10px;font-weight:700;letter-spacing:.08em;line-height:1.2;text-transform:uppercase;white-space:nowrap;background:#69212a;color:#fff}
.portfolio-grid .property.focus-active{outline:3px solid #317568;outline-offset:-3px}
.portfolio-grid .property.focus-active:focus-visible{outline:4px solid #101a16;outline-offset:4px}
@media(forced-colors:active){.portfolio-grid .property.on-hold{border:2px dashed GrayText}.focus-status{border:1px solid GrayText}.portfolio-grid .property.focus-active{outline:3px solid LinkText}}
</style>
<meta name="mixx-focus-release" content="sway-focus-20261011">
`;
html = html.replace('</head>', `${style}</head>`);
const tiles = [...html.matchAll(/<a class="property [^>]+>/g)].map(m => m[0]);
assert.equal(tiles.length, 9);
assert.equal(tiles.filter(t => /\shref=/.test(t)).length, 1);
assert(tiles.find(t => /\shref=/.test(t)).includes('href="/sway/"'));
assert.equal(tiles.filter(t => t.includes('aria-disabled="true"') && t.includes('tabindex="-1"') && !/\shref=/.test(t)).length, 8);
assert.equal((html.match(/class="focus-status"/g) || []).length, 8);
assert(html.includes('href="/about/"') && html.includes('href="/partners/"'));
fs.writeFileSync(file, html);
fs.writeFileSync('public/focus-status.json', JSON.stringify({release:'sway-focus-20261011',activeProperty:'SWAY IRL',heldPropertyTiles:8,scope:'homepage property navigation only; underlying routes and apps preserved'}, null, 2) + '\n');
console.log('SWAY focus verified: 1 active tile, 8 red-tinted disabled tiles, original routes preserved.');
