SciHub Access

A Chrome extension that auto-detects DOIs and gives you one-click access to the corresponding paper on Sci-Hub. Inspired by the Lean Library model, it scans the page you are viewing for a DOI (via citation metadata or the URL) and lets you open the matching article instantly from the toolbar popup, without needing to search or copy paste anything.

Features:
- Automatic DOI detection on academic pages (Google Scholar, PubMed, journal websites, etc.)
- One-click popup search, pre-filled with the detected DOI when available
- Manual lookup by DOI, title, or URL when auto-detection is not available
- Clean, minimal interface in a custom red (B8342A) color scheme
- Lightweight, no tracking, no data collection

How it works:
1. The content script checks the current page's metadata and URL for a DOI pattern.
2. If found, the DOI is stored locally and shown in the popup the next time you click the extension icon.
3. Clicking Search opens the corresponding Sci-Hub page in a new tab.

Tech stack: Manifest V3, vanilla JavaScript, Chrome storage API.
