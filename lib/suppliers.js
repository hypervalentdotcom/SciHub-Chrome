const encodeCas = (casNumber) => encodeURIComponent(casNumber);

export function getSupplierSearches(casNumber) {
  const cas = encodeCas(casNumber);

  return [
    {
      id: "sigma",
      name: "Sigma-Aldrich",
      detail: "Merck",
      url:
        `https://www.sigmaaldrich.com/FR/fr/search/${cas}` +
        `?focus=products&page=1&perpage=30&sort=relevance&term=${cas}&type=cas_number`
    },
    {
      id: "tci",
      name: "TCI",
      detail: "Tokyo Chemical Industry",
      url: `https://www.tcichemicals.com/FR/fr/search?text=${cas}`
    },
    {
      id: "fluorochem",
      name: "Fluorochem",
      detail: "UK catalogue",
      url: `https://fluorochem.co.uk/?s=${cas}`
    },
    {
      id: "abcr",
      name: "abcr",
      detail: "CAS search",
      url: `https://abcr.com/de_en/catalogsearch/result/?q=${cas}`
    },
    {
      id: "enamine",
      name: "Enamine",
      detail: "Building blocks",
      url: `https://enaminestore.com/catalog?q=${cas}&searchBy=CASs`
    },
    {
      id: "cymit",
      name: "CymitQuimica",
      detail: "Products by CAS",
      url: `https://cymitquimica.com/cas/${cas}/`
    }
  ];
}
