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
      if (!node['href'].includes('h-e-b-') && !node['href'].includes('malt-o-meal')) links.push(node['href']);
    });
    return links;
  });

  const cereals = [];
  for (link of cerealLinks.slice(0, 3)) {
    await page.goto(link, { waitUntil: 'networkidle2' });
    const data = await page.evaluate(() => {
      const cereal = {};
      const name = document.querySelector('h1').innerText.trim();
      const img = document.querySelector('img.pdp-mobile-image').src.split('?')[0];
      const weight = document.querySelector('div.packing-options').innerText.trim();
      const price = document.querySelector('span#addToCartPrice').innerText.trim();
      const description = document.querySelector('p').innerText.trim();
      const servingsPerContainer = document.querySelector('div.content > p').innerText.trim().split('\n')[0];
      const servingSize = document.querySelector('table.serving-size > tbody > tr > td.val').innerText.trim();
      const calorieDetails = document.querySelector('table.details-single').querySelectorAll('.val');
      const nutritionFactDetails = document.querySelector('table.details-xtd').children;
      const vitaminDetails = document.querySelector('table.vitamins > tbody').children;

      const calories = parseInt(calorieDetails[0].innerText);
      const caloriesFromFat = parseInt(calorieDetails[1].innerText);

      const details = [];
      nutritionFactDetails.forEach(node => {
        const row = node.querySelector('tr').children;
        const nutrient = row[0].innerText.replace(/\s+/g, " ").trim();
        const value = row[1].innerText.trim();

        const detail = {};
        detail.name = nutrient;
        detail.dv = value;

        if (node.nodeName === 'TBODY') {
          if (details[details.length - 1].sub) {
            details[details.length - 1].sub.push(detail);
          } else {
            details[details.length - 1].sub = [detail];
          }
        } else {
          details.push(detail);
        };
      });

      const vitamins = [];
      vitaminDetails.forEach(node => {
        const row = node.children;
        const vitamin = row[0].innerText.replace(/\s+/g, " ").trim();
        const value = row[1].innerText.trim();

        const detail = {};
        detail.name = vitamin;
        detail.dv = value;
        vitamins.push(detail);
      });

      cereal.name = name;
      cereal.weight = weight;
      cereal.price = price;
      cereal.description = description;
      cereal.img = img;
      cereal.nutritionFacts = {
        servingsPerContainer: servingsPerContainer,
        servingSize: servingSize,
        calories: calories,
        caloriesFromFat: caloriesFromFat,
        details: details,
        vitamins: vitamins,
      }

      return cereal;
    })
    cereals.push(data);
  }
  console.log(cereals)
  // console.log(cereals[0].nutritionFacts.details[0]);
  // console.log(cereals[0].nutritionFacts.details[0].sub);

  await browser.close();
})();