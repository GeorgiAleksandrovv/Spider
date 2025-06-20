export function cleanPrice(rawPrice) {
  if (!rawPrice) return null;
  const cleaned = rawPrice
    .replace(/\s/g, "")               
    .replace(/[^\d,]/g, "")           
    .replace(/\.(?=\d{3})/g, "")      
    .replace(",", ".");               
  return parseFloat(cleaned) || null;
}

export function extractBrand(specs = []) {
  const brandSpec = specs.find(spec => spec.label.toLowerCase().includes("марка"));
  return brandSpec?.value || "";
}

export function getMostAvailableStore(storeList = []) {
  const countMap = {};
  for (const store of storeList) {
    countMap[store] = (countMap[store] || 0) + 1;
  }
  let maxStore = null;
  let maxCount = 0;
  for (const [store, count] of Object.entries(countMap)) {
    if (count > maxCount) {
      maxCount = count;
      maxStore = store;
    }
  }
  return maxStore;
}
