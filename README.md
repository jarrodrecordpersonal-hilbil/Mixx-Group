# MIXX GROUP

A simple property chooser: nine aligned color-mosaic tiles, original logo artwork, photographic environments and restrained hover reveals. Each tile opens its existing property route.

## This release

`portfolio-atmosphere-1` adds self-hosted background images to all nine tiles and develops the MIXX TANK and MIXXWAVE pages. The square configuration, original palette and original logo files are preserved. Benchpacking and Maison Cedro retain their text identities.

The atmosphere is understated at rest and clearer on hover or keyboard focus. Touch remains one tap. Reduced-motion preferences are respected. No autoplay, new accounts, checkout, tracking or paid services are added.

## Build and verify

```sh
sh build.sh
node scripts/verify-site.mjs
node scripts/verify-atmosphere.mjs
```

Render service: `mixxgroup` (static). Build command: `sh build.sh`. Publish directory: `public`.

`assets/release.json` identifies the content of a build; it does not prove that a deployment is live. Confirm the commit and successful deployment in Render, then check the deployed homepage and release marker.

## Images and original marks

Images are bundled in `assets/environments/`. Source records, credits, file sizes and SHA-256 digests are in `assets/environments/sources.json`. Production, bar, distillery and golf stills are extracted from supplied materials. Other environments include licensed illustrative photography and the existing SWAY concept scene. They are not claims of current installed customers, branded equipment or tobacco inventory.

`verify-atmosphere.mjs` checks all nine images, an 800 KB environment-image budget, the seven original property marks plus the MIXX GROUP globe, and the new pages' internal links and anchors.

The one-time preparation workflow is restricted to the design branch. It is not part of the production build. Original SWAY artwork is bundled and verified locally by the existing build helper.
