
(function() {
  function extraireDOI() {
    var metaSelectors = [
      'meta[name="citation_doi"]',
      'meta[name="dc.identifier"]',
      'meta[name="prism.doi"]',
      'meta[scheme="doi"]'
    ];
    for (var i = 0; i < metaSelectors.length; i++) {
      var el = document.querySelector(metaSelectors[i]);
      if (el && el.content) {
        var val = el.content.replace('doi:', '').trim();
        if (val.match(/10\.\d{4,9}\/\S+/)) return val;
      }
    }
    var bodyText = document.body ? document.body.innerText : '';
    var regexDOI = /10\.\d{4,9}\/[^\s"'<>]+/;
    var matchURL = window.location.href.match(regexDOI);
    if (matchURL) return matchURL[0];
    var matchBody = bodyText.match(regexDOI);
    if (matchBody) return matchBody[0];
    return null;
  }

  var doi = extraireDOI();
  if (doi) {
    chrome.storage.local.set({ dernierDOI: doi });
  }
})();
