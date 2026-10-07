// Copy an existing MIXX-owned brand asset; never redraw or recolor the logo.
// The commit and Git blob digest pin exactly which artwork is published.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const target = 'assets/logos/sway-irl.png';
const source = 'https://raw.githubusercontent.com/jarrodrecordpersonal-hilbil/SwayIRL.com/ad18b3c39b95df4a3155a07ebc710e2514c4345b/public/brand.png';
const expected = 'bd9de181da003a30a120d4b24b10888a458a8b79';
const digest = bytes => crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
let existing;
try { existing = await fs.readFile(target); } catch (error) { if (error.code !== 'ENOENT') throw error; }
if (existing && digest(existing) === expected) {
  console.log('SWAY original logo verified (cached).');
} else {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(source, {signal: AbortSignal.timeout(30000)});
      if (!response.ok) throw new Error(`SWAY logo source returned HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (digest(bytes) !== expected) throw new Error('SWAY logo source digest mismatch; refusing to substitute artwork.');
      await fs.mkdir(path.dirname(target), {recursive: true});
      await fs.writeFile(target + '.tmp', bytes);
      await fs.rename(target + '.tmp', target);
      console.log('SWAY original logo copied and verified.');
      lastError = null;
      break;
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 1500 * (attempt + 1)));
    }
  }
  if (lastError) throw lastError;
}
