import puppeteer from "puppeteer";
import fs from "fs";
import { cleanPrice, extractBrand, getMostAvailableStore } from "./utils.js";

const startUrl = "https://mr-bricolage.bg/instrumenti/elektroprenosimi-instrumenti/vintoverti/c/006003013";

async function scrapeVinotverti() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  let results = [];

  async function scrapePage(url) {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(3000);
    await page.waitForSelector("brico-product .product");

    const products = await page.$$eval("brico-product .product", items =>
      items.map(item => {
        const title = item.querySelector("a")?.innerText.trim();
        const priceRaw = item.innerText.match(/[\d.,\s]+лв/)?.[0] || "";
        const link = item.querySelector("a")?.href;
        const image = item.querySelector("img")?.getAttribute("data-src")?.split("?")[0] || "";
        return { title, priceRaw, link, image };
      })
    );

    console.log(`🟢 Found on ${url}: ${products.length} products`);

    for (let product of products) {
      
      const productPage = await browser.newPage();
      await productPage.goto(product.link, { waitUntil: "domcontentloaded", timeout: 60000 });
      await productPage.waitForTimeout(3000);

      const fullTitle = await productPage.$eval("h1", el => el.innerText.trim()).catch(() => "Без заглавие");

      const rating = await productPage
        .$eval("div.rating-stars", el => el.getAttribute("data-rating"))
        .catch(() => null);

      const techSpecs = await productPage.$$eval(".product-attributes .attribute", rows =>
        rows.map(row => {
          const label = row.querySelector(".label")?.innerText.trim();
          const value = row.querySelector(".data")?.innerText.trim();
          return { label, value };
        })
      ).catch(() => []);

      const availability = await productPage.$$eval(".availability-store .store-name", stores =>
        stores.map(store => store.innerText.trim())
      ).catch(() => []);

      const brand = extractBrand(techSpecs);
      const titleWithBrand = fullTitle.toLowerCase().startsWith(brand.toLowerCase())
      ? fullTitle
      : `${brand} ${fullTitle}`;

      results.push({
        title: titleWithBrand,
        price: cleanPrice(product.priceRaw),
        image: product.image,
        link: product.link,
        rating,
        technical_specs: techSpecs,
        availability_by_store: availability,
        store_with_most_stock: getMostAvailableStore(availability)
      });

      await productPage.close();
    }

    const nextPage = await page.$eval("a.page-link.next", a => a.href).catch(() => null);
    if (nextPage) {
      await scrapePage(nextPage);
    }
  }

  await scrapePage(startUrl);
  await browser.close();

  fs.mkdirSync("./data", { recursive: true });
  fs.writeFileSync("./data/vinotverti_data.json", JSON.stringify(results, null, 2));

  console.log("✅ Скрейпването завърши успешно!");
}

export default scrapeVinotverti;
