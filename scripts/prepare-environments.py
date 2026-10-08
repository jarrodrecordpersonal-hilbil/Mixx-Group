"""One-time asset preparation on the design branch, not a production dependency.
Only extracted photographs are included from the supplied documents; no slide text.
Public stock imagery is illustrative, not proof of a customer installation or inventory.
"""
from __future__ import annotations
import base64, hashlib, io, json, time, urllib.request
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'environments'
OUT.mkdir(parents=True, exist_ok=True)
encoded = ''.join(''.join(p.read_text().split()) for p in sorted((ROOT / 'scripts/source-photos').glob('atlas-*.b64')))
raw = base64.b64decode(encoded, validate=True)
assert hashlib.sha256(raw).hexdigest() == '8c6aaceddfc025e3a40804b81b7469c512a6f8f303adecf1282c91982646ced3', 'Original photograph transport failed its integrity check.'
atlas = Image.open(io.BytesIO(raw)).convert('RGB')
assert atlas.size == (640, 464)
records = []
local = [
 ('tank', (0,0,320,232), 'Production photograph extracted from the supplied BK_Deck 2.pdf, page 10.'),
 ('wave', (320,0,640,232), 'Barrel Run 2026 Summer Edition.mp4, 620 seconds. A bar setting; not a MIXXWAVE installation case study.'),
 ('barrel', (0,232,320,464), 'Barrel Run 2026 Summer Edition.mp4, 510 seconds. Distillery barrel storage.'),
 ('sunday', (320,232,640,464), 'Golf still from MixxTank Q4 Marketing Plan.pdf, page 10. Cropped from the pilot stills; no slide text included.'),
]
for name, box, provenance in local:
    image = atlas.crop(box)
    image.save(OUT / (name + '.webp'), 'WEBP', quality=88, method=6)
    records.append({'property': name, 'file': name+'.webp', 'kind': 'supplied-media', 'source': provenance})
# A production setting, not represented as a still from a particular Games episode.
atlas.crop((0,0,320,232)).crop((104,30,320,202)).save(OUT/'games.webp','WEBP',quality=88,method=6)
records.append({'property':'games','file':'games.webp','kind':'supplied-media','source':'Alternate crop of the supplied production photograph. Setting illustration, not a named Bourbon Games episode.'})

remote = [
 ('vibe', 'https://images.unsplash.com/photo-1719935114341-3984490e0e4c?fit=crop&fm=jpg&q=80&w=1400', 'Alice Kotlyarenko', 'https://unsplash.com/photos/nOyJzEmlRz4', 'unsplash-illustrative'),
 ('benchpacking', 'https://images.unsplash.com/photo-1771933270678-a97631ae9311?fit=crop&fm=jpg&q=80&w=1400', 'Todd Jiang', 'https://unsplash.com/photos/AMTW6c97EvE', 'unsplash-illustrative'),
 ('maison', 'https://images.unsplash.com/photo-1749842839766-8b71630a627d?fit=crop&fm=jpg&q=80&w=1400', 'Considerate Agency', 'https://unsplash.com/photos/ZWxKxRcxaas', 'unsplash-illustrative'),
 ('sway', 'https://raw.githubusercontent.com/jarrodrecordpersonal-hilbil/SwayIRL.com/ad18b3c39b95df4a3155a07ebc710e2514c4345b/public/retail-scene.png', 'Existing SWAY IRL project artwork', 'SwayIRL.com/public/retail-scene.png at ad18b3c', 'existing-concept-illustration'),
]

def download(url: str) -> bytes:
    error = None
    for attempt in range(3):
        try:
            request = urllib.request.Request(url, headers={'User-Agent':'MIXX-Group-site-asset-preparation/1.0'})
            with urllib.request.urlopen(request, timeout=30) as response:
                data = response.read(10_000_001)
            if len(data) > 10_000_000:
                raise ValueError('Image exceeds bounded download size')
            with Image.open(io.BytesIO(data)) as test:
                test.verify()
            return data
        except Exception as exc:
            error = exc
            if attempt < 2:
                time.sleep(1 + attempt)
    raise RuntimeError(f'Could not prepare approved image: {url}') from error

for name, url, credit, page, kind in remote:
    data = download(url)
    image = ImageOps.exif_transpose(Image.open(io.BytesIO(data))).convert('RGB')
    image.thumbnail((1400,1000), Image.Resampling.LANCZOS)
    image.save(OUT/(name+'.webp'), 'WEBP', quality=80, method=6)
    records.append({'property':name,'file':name+'.webp','kind':kind,'credit':credit,'source':page,'license':'https://unsplash.com/license' if kind.startswith('unsplash') else 'Existing user project asset','source_sha256':hashlib.sha256(data).hexdigest()})
# Bundle the existing SWAY logo as well. Production builds can verify it offline.
logo = download('https://raw.githubusercontent.com/jarrodrecordpersonal-hilbil/SwayIRL.com/ad18b3c39b95df4a3155a07ebc710e2514c4345b/public/brand.png')
assert hashlib.sha1(f'blob {len(logo)}\0'.encode()+logo).hexdigest() == 'bd9de181da003a30a120d4b24b10888a458a8b79'
(ROOT/'assets/logos/sway-irl.png').write_bytes(logo)
for item in records:
    path = OUT/item['file']
    item['sha256'] = hashlib.sha256(path.read_bytes()).hexdigest()
    item['bytes'] = path.stat().st_size
(OUT/'sources.json').write_text(json.dumps({'note':'Original logos are unchanged. Some environments are illustrative and are not claims of live installations, branded equipment or tobacco inventory.','images':records}, indent=2)+'\n')
print(json.dumps({'prepared':len(records),'image_bytes':sum(item['bytes'] for item in records),'properties':[item['property'] for item in records]}))
