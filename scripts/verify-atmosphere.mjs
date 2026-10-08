import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root=process.cwd();
const errors=[];
const text=p=>fs.readFileSync(path.join(root,p),'utf8');
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
const gitDigest=b=>crypto.createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');
const expect=(condition,message)=>{if(!condition)errors.push(message);};
const keys=['tank','wave','sway','games','barrel','vibe','sunday','benchpacking','maison'];
const css=text('assets/portfolio-atmosphere.css');
const source=JSON.parse(text('assets/environments/sources.json'));
expect(source.images.length===9,'Expected nine documented environments.');
expect(new Set(source.images.map(i=>i.property)).size===9,'Environment keys must be unique.');
let imageBytes=0;
for(const key of keys){
  const entry=source.images.find(i=>i.property===key);
  expect(Boolean(entry),`Missing source record: ${key}`);
  const file=`assets/environments/${key}.webp`;
  const data=fs.readFileSync(path.join(root,file));
  imageBytes+=data.length;
  expect(data.subarray(0,4).toString()==='RIFF'&&data.subarray(8,12).toString()==='WEBP',`Not a valid WebP container: ${file}`);
  expect(entry?.file===`${key}.webp`&&entry?.sha256===sha256(data),`Source/file integrity mismatch: ${key}`);
  expect(css.includes(`/${file}`),`Background not wired into homepage CSS: ${key}`);
  expect(fs.existsSync(path.join(root,'public',file)),`Image missing from published output: ${key}`);
}
expect(imageBytes<800000,'Environment images exceed the 800 KB release budget.');
const logos={
  'assets/logos/mixx-group-globe-transparent.png':'0d6f2fa749ca8538c2347976d08402aea92dafae',
  'assets/tank.png':'502228f570fa85ddf70d27a0a985b2121411890d',
  'assets/logos/mixxwave.svg':'bb425b7f289ec9a218a7c2237556eb475a00b615',
  'assets/logos/sway-irl.png':'bd9de181da003a30a120d4b24b10888a458a8b79',
  'assets/programs/bourbon-games.png':'4115d3a566aa9103e75aca86b1b152e0af6a8c5e',
  'assets/programs/barrel-run.png':'8c654f88249233ca574863553bf4c11ca16ad3de',
  'assets/logos/mixxvibe.svg':'0be8ae4b0bfdbd55b22fc9d3cc0e7ebf22a103d2',
  'assets/logos/sunday-pours.svg':'04daf98924119354eea5c2cddbd7023961bba32d'
};
for(const [file,digest] of Object.entries(logos)){
  expect(gitDigest(fs.readFileSync(path.join(root,file)))===digest,`Original artwork changed: ${file}`);
}
const pages=['index.html','mixx-tank/index.html','mixx-wave/index.html'];
for(const file of pages){
  const html=text(file);
  for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)){
    const url=match[1];
    if(!url.startsWith('/')&&!url.startsWith('#'))continue;
    if(url.startsWith('//'))continue;
    const [location,anchor]=url.split('#');
    const clean=location.split('?')[0];
    let target=clean?path.join(root,clean.replace(/^\//,'')):path.join(root,file);
    if(!clean){}else if(fs.existsSync(target)&&fs.statSync(target).isDirectory())target=path.join(target,'index.html');
    expect(fs.existsSync(target),`${file}: missing target ${url}`);
    if(anchor&&fs.existsSync(target)&&target.endsWith('.html')){
      const targetText=fs.readFileSync(target,'utf8');
      expect(targetText.includes(`id="${anchor}"`),`${file}: missing anchor ${url}`);
    }
  }
  expect(!/<form\b|\bautoplay\b/i.test(html),`${file}: unrequested form or autoplay.`);
  expect(fs.readFileSync(path.join(root,'public',file),'utf8')===html,`${file}: published HTML differs from source.`);
}
expect(text('index.html').includes('/assets/portfolio-atmosphere.css?v=field-1'),'Homepage is not using the environment stylesheet.');
expect(css.includes('prefers-reduced-motion:reduce')&&css.includes('hover:none'),'Missing reduced-motion or touch behavior.');
const release=JSON.parse(text('assets/release.json'));
expect(release.photoBackgroundsIncluded===true&&release.environmentImageCount===9,'Release marker does not describe the actual photographic build.');
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(`Atmosphere QA passed: 9 backgrounds (${imageBytes} bytes), 8 unchanged original marks, 3 page routes and their anchors.`);
