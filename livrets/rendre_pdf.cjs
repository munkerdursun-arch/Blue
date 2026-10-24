// Rend un livret HTML en PDF A4 et signale les pages dont le contenu déborde.
// Usage : node rendre_pdf.cjs livret.html livret.pdf [dossier_captures]
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const [src, out, shots] = process.argv.slice(2);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
  await page.goto('file://' + path.resolve(src));
  await page.evaluate(() => document.fonts.ready);

  // Une page déborde si son contenu dépasse la hauteur A4 fixe.
  const overflow = await page.$$eval('section.page', (els) =>
    els.map((el, i) => {
      const body = el.querySelector('.body') || el;
      const foot = el.querySelector('.ph-foot');
      const limit = foot ? foot.getBoundingClientRect().top : el.getBoundingClientRect().bottom;
      const bottom = Math.max(...[...body.querySelectorAll('*')].map((c) => c.getBoundingClientRect().bottom), 0);
      return { page: i + 1, overflowPx: Math.round(bottom - limit) };
    }).filter((p) => p.overflowPx > 0));
  console.log(overflow.length ? 'DÉBORDEMENTS : ' + JSON.stringify(overflow) : 'Aucun débordement');

  if (shots) {
    const els = await page.$$('section.page');
    for (let i = 0; i < els.length; i++) await els[i].screenshot({ path: `${shots}/p${String(i + 1).padStart(2, '0')}.png` });
  }
  await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true });
  await browser.close();
})();
