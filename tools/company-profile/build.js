/**
 * Builds the company profile PDF from brochure.html using headless Chrome.
 *   CHROME_PATH=/path/to/chrome node build.js [output.pdf]
 * Needs: npm i puppeteer-core   (and any Chrome/Chromium; set HEADLESS=shell for chrome-headless-shell)
 * Then run: python3 finish.py   (metadata + fast-web-view)
 */
const path = require('path');
const puppeteer = require('puppeteer-core');

const OUT = path.resolve(process.argv[2] || path.join(__dirname, 'build', 'profile-raw.pdf'));
const exe = process.env.CHROME_PATH;
if (!exe) { console.error('Set CHROME_PATH to a Chrome/Chromium executable.'); process.exit(1); }

(async () => {
  require('fs').mkdirSync(path.dirname(OUT), { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: exe,
    headless: process.env.HEADLESS === 'shell' ? 'shell' : true,
    args: ['--no-sandbox', '--font-render-hinting=none']
  });
  try {
    const page = await browser.newPage();
    await page.goto('file://' + path.join(__dirname, 'brochure.html'), { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);
    const pages = await page.evaluate(() => document.querySelectorAll('.page').length);
    // Fail loudly if any page overflows its A4 box (text would be clipped silently otherwise).
    const overflow = await page.evaluate(() => [...document.querySelectorAll('.page')].map((p, i) => {
      const inner = p.querySelector('.inner');
      return inner && inner.scrollHeight > inner.clientHeight + 1 ? `page ${i + 1}: content ${inner.scrollHeight}px > ${inner.clientHeight}px` : null;
    }).filter(Boolean));
    if (overflow.length) throw new Error('Content overflows: ' + overflow.join('; '));
    await page.pdf({ path: OUT, format: 'A4', printBackground: true, preferCSSPageSize: true, tagged: true, outline: true });
    console.log('wrote', OUT, '(' + pages + ' pages)');
  } finally { await browser.close(); }
})().catch(e => { console.error(e.message); process.exit(1); });
