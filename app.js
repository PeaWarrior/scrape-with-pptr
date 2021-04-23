const puppeteer = require('puppeteer');
const URL = 'https://www.heb.com/category/shop/pantry/cereal-breakfast/cereal/490116/490560';

(async () => {
  const browser = await puppeteer.launch({ headless: false });
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
  for (link of cerealLinks) {
    await page.goto(link, { waitUntil: 'networkidle2' });
    const data = await page.evaluate(() => {
      const cereal = {};
      const name = document.querySelector('h1').innerText;
      const size = document.querySelector('div.packing-options').innerText;
      const price = document.querySelector('span#addToCartPrice').innerText;
      const description = document.querySelector('p').innerText;

      cereal.name = name;
      cereal.size = size;
      cereal.price = price;
      cereal.description = description;
    })
    cereals.push(data);
  }
  console.log(cereals);

  await browser.close();
})();