const puppeteer = require('puppeteer');
const fs = require('fs');
const URL = 'https://www.heb.com/category/shop/pantry/cereal-breakfast/cereal/490116/490560';

(async () => {
  const browser = await puppeteer.launch( );
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: 'networkidle2' });
  const cerealLinks = await page.evaluate(() => {
    const links = [];
    const nodes = document.querySelectorAll('ul#productResults > li > a');
    nodes.forEach(node => {
      if (!node['href'].includes('h-e-b-') && !node['href'].includes('raisin-bran')) links.push(node['href']);
    });
    return links;
  });
  // const cerealLinks = ['https://www.heb.com/product-detail/malt-o-meal-fruity-dyno-bites-cereal-super-size-/1219157']
  const cereals = [];
  for (link of cerealLinks) {
    console.log(link)
    await page.goto(link, { waitUntil: 'networkidle2' });
    const data = await page.evaluate(() => {
      const cereal = {};
      const name = document.querySelector('h1').innerText.trim();
      const img = document.querySelector('img.pdp-mobile-image').src.split('?')[0];
      const weight = document.querySelector('div.packing-options').innerText.trim();
      const price = document.querySelector('span#addToCartPrice').innerText.trim();
      const description = document.querySelector('p').innerText.trim();
      // general mills, kelloggs, malt o meal uses p tag for serving size
      let servingsPerContainer;
      let servingSize;
      const calorieDetails = document.querySelector('table.details-single').querySelectorAll('.val');
      const nutritionFactDetails = document.querySelector('table.details-xtd').children;
      const vitaminDetails = document.querySelector('table.vitamins > tbody').children;
      
      const calories = parseInt(calorieDetails[0].innerText);
      const caloriesFromFat = calorieDetails[1] ? parseInt(calorieDetails[1].innerText): 0;
      
      servingsPerContainer = document.querySelector('div.content > p').innerText.match(/(about\s+)\d+/i) || document.querySelector('div.content > p').innerText.match(/(?<=container\s+)[.\d]+/i);
      servingSize = document.querySelector('div.content').innerText.match(/[ ./\d]+ cup[s]?[\s(\dg]+\)?/) || ['1'];

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

      // const vitamins = [];
      // vitaminDetails.forEach(node => {
      //   const row = node.children;
      //   if (name.includes('Malt-O-Meal')) {
      //     const vitaminNodes = row.innerText.split('\t');
      //     vitaminNodes.forEach(vit => {
      //       const detail = {};
      //       detail.name = vit.match(/[A-Z ]+/i);
      //       detail.dv = vit.match(/\d+\%/);
      //       vitamins.push(detail);
      //     })
      //   } else {
      //     const vitamin = row[0].innerText.replace(/\s+/g, " ").trim();
      //     const value = row[1].innerText.trim();
  
      //     const detail = {};
      //     detail.name = vitamin;
      //     detail.dv = value;
      //     vitamins.push(detail);
      //   }
      // });

      cereal.name = name;
      cereal.weight = weight;
      cereal.price = price;
      cereal.description = description;
      cereal.img = img;
      cereal.nutritionFacts = {
        servingsPerContainer: servingsPerContainer ? servingsPerContainer[0].trim() : null,
        servingSize: servingSize[0].trim() || null,
        calories: calories,
        caloriesFromFat: caloriesFromFat,
        details: details,
        vitamins: vitamins,
      };

      return cereal;
    });
    console.log(data)
    cereals.push(data);
  };

  fs.writeFile('data.json', JSON.stringify(cereals), { flag: 'w' }, err => console.log(err));

  await browser.close();
})();