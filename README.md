# Mirror Image

A 5 minute 3D browser activity for organic chemistry. The player tests whether the two mirror-image forms of ibuprofen can be superimposed, finds the chirality center, ranks its groups with the sequence rules, names the configuration R or S, and docks both forms in a three-site model receptor.

Built with AI (Claude, Anthropic) for José Antonio Bowen, [weteachwithai.com](https://weteachwithai.com), as a workshop demo of what AI can build for students.

## Chemistry

Checked against John McMurry, *Organic Chemistry*, OpenStax, Chapter 5 (§5.2, §5.5, §5.12, Chemistry Matters: Chiral Drugs). The book is CC BY-NC-SA 4.0. Access for free at https://openstax.org/books/organic-chemistry/pages/1-why-this-chapter. No text or figures from the book are reproduced. Not produced or endorsed by OpenStax.

R and S are computed from 3D geometry (`src/molecule.js`), not stored. `window.__demo.search()` brute-forces 60,000 orientations and confirms the mirror image never aligns more than 2 of 4 groups or makes more than 2 of 3 contacts. The in-app About panel lists every simplification.

## Files

- `index.html`: the whole app in one file, Three.js bundled in. The only external request is Google Fonts.
- `src/`: `main.js` (app, steps, UI), `molecule.js` (ibuprofen geometry, mirror image, configuration check, model pocket), `content.js` (all teaching text), `fx.js`, `style.css`, `template.html`.
- `build.mjs`: `npm install && node build.mjs`.
- `test/shots.mjs`: headless Chrome walkthrough. `node test/shots.mjs 1600 900 desk`.
