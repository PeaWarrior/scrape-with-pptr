const puppeteer = require('puppeteer');
const URL = 'https://www.heb.com/category/shop/pantry/cereal-breakfast/cereal/490116/490560';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: 'networkidle2' });
  const data = await page.evaluate(() => {
    let cereals = [];
    const nodes = document.querySelectorAll('span.responsivegriditem__title');
    nodes.forEach(node => {
      const nodeData = node.textContent.trim().split(', ');
      const cereal = {
        name: nodeData[0],
        size: nodeData[1],
      };
      cereals.push(cereal)
    });
    cereals = cereals.filter(cereal => !cereal.name.includes('H‑E‑B'));
    return cereals;
  });
  console.log(data);

  await browser.close();
})();