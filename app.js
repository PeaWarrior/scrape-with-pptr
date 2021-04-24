const puppeteer = require('puppeteer');
const URL = 'https://www.heb.com/category/shop/pantry/cereal-breakfast/cereal/490116/490560';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: 'networkidle2' });
  const cerealLinks = await page.evaluate(() => {
    const links = [];
    const nodes = document.querySelectorAll('ul#productResults > li > a');
    nodes.forEach(node => {
      if (!node['href'].includes('h-e-b-')) links.push(node['href']);
    });
    return links;
  });

  const cereals = [];
  for (link of cerealLinks.slice(0, 2)) {
    await page.goto(link, { waitUntil: 'networkidle2' });
    const data = await page.evaluate(() => {
      const cereal = {};
      const name = document.querySelector('h1').innerText.trim();
      const img = document.querySelector('img.pdp-mobile-image').src.split('?')[0];
      const size = document.querySelector('div.packing-options').innerText.trim();
      const price = document.querySelector('span#addToCartPrice').innerText.trim();
      const description = document.querySelector('p').innerText.trim();

      cereal.name = name;
      cereal.size = size;
      cereal.price = price;
      cereal.description = description;
      cereal.img = img;

      return cereal;
    })
    cereals.push(data);
  }
  console.log(cereals);

  await browser.close();
})();