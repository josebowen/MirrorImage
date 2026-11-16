// All on-screen teaching text. Chemistry checked against John McMurry,
// Organic Chemistry (OpenStax), Chapter 5. No dashes in UI copy.
const B = 'https://openstax.org/books/organic-chemistry/pages/';
export const URLS = { '5.2': B + '5-2-the-reason-for-handedness-in-molecules-chirality', '5.5': B + '5-5-sequence-rules-for-specifying-configuration', '5.12': B + '5-12-chirality-in-nature-and-chiral-environments', '5.13': B + '5-chemistry-matters-chiral-drugs' };
const NAMES = { '5.13': 'Chapter 5, Chemistry Matters: Chiral Drugs' };
export const cite = (s) => `<a class="cite" href="${URLS[s]}" target="_blank" rel="noopener">OpenStax, Organic Chemistry, ${NAMES[s] || '§' + s}</a>`;
export const STEPS = ['Mirror', 'Center', 'Rank', 'R or S', 'Pocket', 'Debrief'];

export const TEXT = {
  mirror: { title: 'The mirror test',
    intro: '<p>These are two forms of ibuprofen. They have the same atoms joined in the same order. Molecule B is the mirror image of molecule A.</p>',
    q: 'Predict first. Can B be turned so that it matches A exactly?',
    whyQ: 'Your reason',
    why: [['same', 'Same atoms and bonds, so a turn will do it'], ['swap', 'Two groups on one carbon will stay swapped'], ['ring', 'The ring is too bulky to turn far enough']],
    try: '<p>Turn molecule B until it sits exactly on the faint outline of A. The meter counts how many of the four groups around the central carbon line up.</p>',
    result: '<p>You can line up two groups at a time. The other two always end up swapped. A molecule that cannot be superimposed on its mirror image is chiral. The two forms are called enantiomers.</p>' },
  center: { title: 'Find the chirality center', intro: '<p>The usual cause of chirality is a carbon atom bonded to four different groups. Ibuprofen has one. Find it.</p>' },
  centerStart: 'Tap the carbon you think it is.',
  centerRight: 'That is it. This carbon holds four different groups: a hydrogen, a methyl group, a carboxylic acid and the ring.',
  centerWrong: {
    ch3: 'Not this one. A CH<sub>3</sub> carbon holds three identical hydrogens.', ch2: 'Not this one. A CH<sub>2</sub> carbon holds two identical hydrogens.',
    ring: 'Not this one. A ring carbon here is bonded to only three atoms.', acid: 'Not this one. The acid carbon is bonded to only three atoms.',
    ch: 'Close, but no. This carbon holds two identical CH<sub>3</sub> groups.', o: 'That is an oxygen. Look for a carbon.', h: 'That is a hydrogen. Look for a carbon.' },
  rank: { title: 'Rank the four groups',
    intro: '<p>The sequence rules rank the four groups from 1 to 4.</p><p><b>Rule 1.</b> Higher atomic number at the point of attachment ranks higher.<br><b>Rule 2.</b> On a tie, compare the next atoms out.<br><b>Rule 3.</b> A double bond counts as two single bonds to that atom.</p><p>Tap the groups in order, highest first.</p>' },
  rankStart: 'Tap the group you rank first. Wrong taps are recorded, with the rule that settles them.',
  rankCenter: 'That is the chirality center itself. Tap one of the four groups attached to it.',
  rankOk: { Acid: 'Rank 1. The acid carbon carries (O, O, O). The double-bonded oxygen counts twice.', Aryl: 'Rank 2. The ring carbon carries (C, C, C).', Me: 'Rank 3. The methyl carbon carries (H, H, H). Hydrogen takes rank 4.' },
  rankWrong: {
    Acid: { Aryl: 'Not first. Both attach through carbon, so compare the next atoms out. The ring carbon carries (C, C, C). Another group carries oxygens.', Me: 'Not first. The methyl carbon carries only (H, H, H).', H: 'Hydrogen has the lowest atomic number. It ranks last.' },
    Aryl: { Me: 'Not yet. The methyl carbon carries (H, H, H). The ring carbon carries (C, C, C).', H: 'Hydrogen has the lowest atomic number. It ranks last.' },
    Me: { H: 'Hydrogen is rank 4. One group still outranks it.' } },
  turn: { title: 'Name it: R or S',
    intro: '<p>Turn the molecule so the lowest-ranked group, the hydrogen, points directly away from you.</p>',
    call: '<p>The hydrogen is at the back. Follow the moving light from group 1 to 2 to 3.</p>',
    result: '<p>Its mirror image, molecule B, runs clockwise, so B is (R)-ibuprofen. The two differ only in this handedness.</p>' },
  pocket: { title: 'Does handedness matter?',
    intro: '<p>A drug works by fitting a receptor in the body. Receptors are built from chiral molecules, so they are handed too.</p><p>This model receptor has three binding sites: a charged site for the acid, a greasy channel for the ring and a small notch for the methyl group.</p>',
    q: 'Predict first. What will happen when each form tries to dock?',
    dockA: '<p>Turn molecule A, the (S) form, until the acid, the ring and the methyl group each face their site.</p>',
    seatedA: '<p>All three sites match and the molecule seats.</p>',
    dockB: '<p>Now turn molecule B, the (R) form. Try to make all three contacts at once.</p>',
    result: '<p>B can make two contacts at a time. The third group always points the wrong way, because two of its groups are swapped. A chiral receptor tells the two forms apart even though every bond is the same.</p><p>For ibuprofen, only the S form is active as a pain reliever and anti-inflammatory agent. The R form is inactive, and the body slowly converts it to the S form.</p>',
    beyond: 'The pocket is a three-site teaching model, not the structure of a real enzyme. Beyond the textbook: <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC1564971" target="_blank" rel="noopener">one laboratory study</a> found that the R form does inhibit ibuprofen\'s target enzyme, but much more weakly than the S form.' },
  objectives: ['Identify a chirality center in a molecule.', 'Assign R or S configuration with the sequence rules.', 'Explain why enantiomers behave differently in a chiral environment.'],
  debrief: `<ul class="try"><li>Ibuprofen has one chirality center, so it has two enantiomers.</li><li>It is sold as a 50:50 mixture of the R and S forms.</li><li>Only the S form is active. The body slowly converts the R form to the S form.</li></ul><p class="src">Source: ${cite('5.13')}</p>`,
  credit: 'Chemistry checked against John McMurry, <i>Organic Chemistry</i>, OpenStax, Chapter 5. Licensed CC BY-NC-SA 4.0. Access for free at <a href="https://openstax.org/books/organic-chemistry/pages/1-why-this-chapter" target="_blank" rel="noopener">openstax.org</a>.',
};

export const ABOUT = `
<h2 id="aboutH">About this demo</h2>
<p>A short activity for an organic chemistry course. The player tests whether two mirror-image forms of ibuprofen can be superimposed, finds the chirality center, ranks its groups, names the configuration and docks both forms in a model receptor.</p>
<p>It was built with AI (Claude, Anthropic) for José Antonio Bowen, <a href="https://weteachwithai.com" target="_blank" rel="noopener">weteachwithai.com</a>, as an example of what AI can build for students. No data is collected.</p>
<h3>Source</h3>
<p>The chemistry was checked against John McMurry, <i>Organic Chemistry</i>, OpenStax, Chapter 5, Stereochemistry at Tetrahedral Centers: ${cite('5.2')}, ${cite('5.5')}, ${cite('5.12')}, ${cite('5.13')}. The book is licensed CC BY-NC-SA 4.0. Access for free at <a href="https://openstax.org/books/organic-chemistry/pages/1-why-this-chapter" target="_blank" rel="noopener">openstax.org</a>. No text or figures from the book are reproduced. This demo is not produced or endorsed by OpenStax. Pages were checked on 11 November 2026.</p>
<h3>How answers are checked</h3>
<ul>
<li>The molecule is built in 3D from standard bond lengths and angles. Its mirror image is made by reflecting every atom.</li>
<li>R or S is computed from the 3D positions of the four groups, not stored as an answer.</li>
<li>The mirror test and the docking test count groups that point within 24 degrees of their target. A search over 60,000 orientations confirms that the mirror image never lines up more than two of four groups, and never makes more than two of three contacts.</li>
</ul>
<h3>How your thinking is recorded</h3>
<p>The page keeps your two predictions, the reason and confidence you gave, every atom you tapped while looking for the chirality center, every ranking miss, and whether you used Show me. The debrief plays that record back. A step finished with Show me is reported as shown to you. Nothing is sent anywhere.</p>
<h3>Simplifications</h3>
<ul>
<li>The molecule is shown rigid in one idealized shape. Real molecules flex and rotate about single bonds. Bond lengths and angles are textbook averages, not measured values for ibuprofen.</li>
<li>The receptor is a three-site teaching model of the kind the textbook uses to explain chiral recognition. It is not the structure of cyclooxygenase or of any real protein.</li>
<li>In the model the R form cannot seat. In the body the difference is one of degree: the R form inhibits the target enzyme much more weakly, and part of it is converted to the S form. The conversion is not shown.</li>
<li>Only the three sequence rules needed for this molecule are stated.</li>
<li>Atom colors follow the common convention: carbon gray, oxygen red, hydrogen white. Sizes are not to scale.</li>
</ul>
<h3>Controls</h3>
<p>Drag to turn the active molecule. Tap an atom to choose it. The arrow keys also turn the molecule. Every step has a button that moves on without fine motor control.</p>`;
