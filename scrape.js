import scrapeVinotverti from "./scraper/productScraper.js";

scrapeVinotverti()
  .then(() => console.log("🎉 Данните са успешно запазени!"))
  .catch(err => console.error("⚠️ Грешка:", err));