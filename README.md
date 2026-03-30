# YoKeys (GitHub Pages)

Standalone web widget that normalizes YoWorld home links.

## Canonical Output

The widget always outputs:

https://yoworld.com/?d=hHOME_ID

## Features

- Accepts Home ID only, old `index.php?d=h...`, or new `?d=h...` URLs.
- Accepts legacy Facebook layout links like `https://apps.facebook.com/playyoworld/?d=h108837847`.
- Normalizes to a single canonical link format.
- Shows one canonical output labeled **Here are your keys!**
- Includes one-click copy for the canonical link.
- Optional remember-last-ID toggle using localStorage.

## Files

- `index.html`
- `style.css`
- `script.js`

## Quick Local Preview

Open `index.html` directly in your browser.

## Publish On GitHub Pages

1. Create a GitHub repository named `YoKeys`.
2. Push these files to the repository root.
3. In **Settings -> Pages**, set:
   - Source: **Deploy from a branch**
   - Branch: main
   - Folder: `/ (root)`
4. Save.
5. Your widget URL will be:

   `https://<username>.github.io/YoKeys/`

## Future Tweaks

- Add shareable query param support (for example: `?id=108837847`).
- Add one-click copy toast notifications.
- Add presets for signature templates.