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
  for (link of cerealLinks.slice(0, 1)) {
    await page.goto(link, { waitUntil: 'networkidle2' });
    const data = await page.evaluate(() => {
      const cereal = {};
      const name = document.querySelector('h1').innerText.trim();
      const img = document.querySelector('img.pdp-mobile-image').src.split('?')[0];
      const size = document.querySelector('div.packing-options').innerText.trim();
      const price = document.querySelector('span#addToCartPrice').innerText.trim();
      const description = document.querySelector('p').innerText.trim();
      const nutritionFacts = document.querySelector('li.liNutrition > div.content').children;
      const servingsPerContainer = nutritionFacts[0].innerText.trim().split('\n')[0];
      const servingSize = nutritionFacts[1].querySelector('tbody > tr > td.val').innerText.trim();
      const details = nutritionFacts[2].querySelector('table.details-xtd').children;
      // const details = nutritionFacts[2].querySelectorAll('tr');

      const nF = []
      details.forEach(node => {
        const row = node.querySelector('tr').children;
        const nutrient = row[0].innerText.replace(/\s+/g, " ").trim();
        const value = row[1].innerText.trim();

        const detail = {};
        detail[nutrient] = value;

        if (node.nodeName === 'TBODY') {
          if (nF[nF.length - 1].sub) {
            nF[nF.length - 1].sub.push(detail);
          } else {
            nF[nF.length - 1].sub = [detail]
          }
        } else {
          nF.push(detail);
        };
      });

      cereal.name = name;
      cereal.size = size;
      cereal.price = price;
      cereal.description = description;
      cereal.img = img;
      cereal.nutritionFacts = {
        servingsPerContainer: servingsPerContainer,
        servingSize: servingSize,
        details: nF,
      }

      return cereal;
    })
    cereals.push(data);
  }
  console.log(cereals);
  console.log(cereals[0].nutritionFacts.details);
  console.log(cereals[0].nutritionFacts.details[0].sub);
  console.log(cereals[0].nutritionFacts.details[4].sub);

  await browser.close();
})();