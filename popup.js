
document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.local.get('dernierDOI', function(data) {
    if (data.dernierDOI) {
      document.getElementById('entree').value = data.dernierDOI;
      document.getElementById('statut').textContent = 'DOI automatically detected on this page.';
    }
  });

  document.getElementById('rechercher').addEventListener('click', function() {
    var valeur = document.getElementById('entree').value.trim();
    if (!valeur) {
      document.getElementById('statut').textContent = 'Please enter a DOI, title, or URL.';
      return;
    }
    var regexDOI = /10\.\d{4,9}\/\S+/;
    var url;
    if (regexDOI.test(valeur)) {
      var doi = valeur.match(regexDOI)[0];
      url = 'https://sci-hub.fr/' + doi;
    } else {
      url = 'https://sci-hub.fr/' + encodeURIComponent(valeur);
    }
    chrome.tabs.create({ url: url });
  });
});
