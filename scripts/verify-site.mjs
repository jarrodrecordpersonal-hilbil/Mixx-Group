import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const pages=[
  ["index.html","/"],
  ["shows/index.html","/shows/"],
  ["community/index.html","/community/"],
  ["mixx-tank/index.html","/mixx-tank/"],
  ["mixx-wave/index.html","/mixx-wave/"],
  ["mixx-bench/index.html","/mixx-bench/"],
  ["mixx-measure/index.html","/mixx-measure/"],
  ["sway/index.html","/sway/"],
  ["partners/index.html","/partners/"],
  ["about/index.html","/about/"],
  ["sunday-pours/index.html","/sunday-pours/"],
  ["bourbon-games-live/index.html","/bourbon-games-live/"],
  ["mixxvibe/index.html","/mixxvibe/"],
  ["mixxbox/index.html","/mixxbox/"],
  ["mixxplay/index.html","/mixxplay/"],
];
const errors=[];
const text=(p)=>fs.readFileSync(path.join(root,p),"utf8");
const existsRoute=(href)=>{
  if(href==="/"||href.startsWith("/assets/")) return true;
  const clean=href.split("#")[0].split("?")[0];
  if(!clean) return true;
  const rel=clean.replace(/^\//,"").replace(/\/$/,"");
  if(!rel) return true;
  return fs.existsSync(path.join(root,rel))||fs.existsSync(path.join(root,rel,"index.html"))||fs.existsSync(path.join(root,rel));
};
for(const [file,route] of pages){
  if(!fs.existsSync(path.join(root,file))){errors.push(`${file}: missing page`);continue;}
  const c=text(file);
  if(!/<title>[^<]+<\/title>/s.test(c)) errors.push(`${file}: missing title`);
  if(!/name="description"/.test(c)) errors.push(`${file}: missing meta description`);
  if(!/rel="canonical"/.test(c)) errors.push(`${file}: missing canonical`);
  const h1=(c.match(/<h1\b/g)||[]).length;
  if(h1!==1) errors.push(`${file}: expected 1 h1, found ${h1}`);
  const ids=[...c.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);
  const dup=[...new Set(ids.filter((x,i)=>ids.indexOf(x)!==i))];
  if(dup.length) errors.push(`${file}: duplicate ids ${dup.join(", ")}`);
  for(const m of c.matchAll(/<img\b[^>]*>/g)) if(!/\balt=/.test(m[0])) errors.push(`${file}: image missing alt`);
  for(const m of c.matchAll(/href="([^"]+)"/g)){
    const href=m[1];
    if(href.startsWith("/")&&!href.startsWith("//")&&!existsRoute(href)) errors.push(`${file}: broken internal link ${href}`);
  }
  if(/MIXDATA/.test(c)) errors.push(`${file}: stale MIXDATA naming`);
  if(route!=="/"&&!c.includes(`https://mixxgroup.com${route}`)) errors.push(`${file}: canonical/url does not match ${route}`);
}
const sitemap=text("sitemap.xml");
for(const [,route] of pages){
  const url=`https://mixxgroup.com${route}`;
  if(!sitemap.includes(`<loc>${url}</loc>`)) errors.push(`sitemap.xml: missing ${url}`);
}
const robots=text("robots.txt");
if(!robots.includes("Sitemap: https://mixxgroup.com/sitemap.xml")) errors.push("robots.txt: sitemap declaration missing");
if(errors.length){
  console.error("MIXX Group site QA failed:\n- "+errors.join("\n- "));
  process.exit(1);
}
console.log(`MIXX Group site QA passed for ${pages.length} public routes.`);
