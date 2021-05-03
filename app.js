const puppeteer = require('puppeteer');
const fs = require('fs');
const URLS = require('./constants');
let URL = URLS[0];
let index = 0;

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  let productType;

  while (URL) {
    await page.goto(URL, { waitUntil: 'networkidle2' });
    const productLinks = await page.evaluate(() => {
      const links = [];
      const nodes = document.querySelectorAll('ul#productResults > li > a');
      nodes.forEach(node => {
        if (!node['href'].includes('h-e-b-')) links.push(node['href']);
      });
      return links;
    });

    const nextPage = await page.evaluate(() => {
      const a = document.querySelector('[aria-label="go to next page"]');
      return a ? a.href : null;
    });
    if (nextPage) {
      URL = nextPage;
    } else {
      ++index;
      URL = URLS[index];
    };
    
    const products = [];
    for (link of productLinks) {
      await page.goto(link, { waitUntil: 'networkidle2' });
      const data = await page.evaluate(() => {
        const product = {};
        const name = document.querySelector('h1').innerText.trim();
        category = document.querySelectorAll('div.breadcrumb-parent-wrapper');
        category = category[category.length-1].innerText.split(' ')[0];
        const img = document.querySelector('img.pdp-mobile-image').src.split('?')[0];
        const weight = document.querySelector('div.packing-options').innerText.trim();
        const price = parseInt(document.querySelector('span#addToCartPrice').innerText.match(/[0-9.]+/)[0]*100);
        const description = document.querySelector('p').childNodes[0].nodeValue.trim();
        let ingredients;
        document.querySelectorAll('span.clearfix').forEach(span => {
          if (span.innerText === 'Ingredients') {
            ingredients = span.parentElement.childNodes[2].nodeValue.trim();
          }
        })

        const table = document.querySelector('table');
        if (!table) return;
        const calorieDetails = document.querySelector('table.details-single').querySelectorAll('.val');
        const nutritionFactDetails = document.querySelector('table.details-xtd').children;
        const vitaminDetails = document.querySelector('table.vitamins > tbody').children;
        let servingsPerContainer;
        let servingSize;
        
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
  
        const vitamins = [];
        let doubleColumn = false;
        vitaminDetails.forEach(node => {
          const row = node.children;
          if (doubleColumn || row[0].innerText.includes('%')) {
            doubleColumn = true;
            row.forEach(vit => {
              const detail = {};
              detail.name = vit.innerText.match(/[A-Z]+ ?([\w\d]+)?/i)[0];
              detail.dv = vit.innerText.match(/\d+\%/) ? vit.innerText.match(/\d+\%/)[0] : '0%';
              vitamins.push(detail);
            })
          } else {
            const vitamin = row[0].innerText.match(/[A-Z]+ ?([\w\d]+)?/i)[0];
            const value = row[1].innerText.trim() || '0%';
    
            const detail = {};
            detail.name = vitamin;
            detail.dv = value;
            vitamins.push(detail);
          }
        });
  
        product.name = name;
        product.category = category;
        product.weight = weight;
        product.price = price;
        product.description = description;
        product.ingredients = ingredients;
        product.img = img;
        product.nutritionFacts = {
          servingsPerContainer: servingsPerContainer ? servingsPerContainer[0].trim() : null,
          servingSize: servingSize[0].trim() || null,
          calories: calories,
          caloriesFromFat: caloriesFromFat,
          details: details,
          vitamins: vitamins,
        };
  
        return product;
      });
      
      if (data) {
        products.push(data);
        productType = data.category;
        console.log(data.ingredients)
      };
    };
    fs.writeFile(`data/${productType}.json`, JSON.stringify(products), { flag: 'w' }, err => console.log(err));
  };


  await browser.close();
})();