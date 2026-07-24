SciHub Access - Installation Guide

1. Unzip this file into a folder on your computer.
2. Open Chrome and go to chrome://extensions
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked" and select the unzipped folder.
5. The extension will appear in your toolbar.

How it works:
Click the extension icon in the Chrome toolbar to open the popup.
If a DOI is automatically detected on the page you are viewing, it will be pre filled in the search field.
Otherwise, paste a DOI, a title, or a URL and click Search.

Short description

A Chrome extension that auto-detects DOIs and gives you one-click access to the corresponding paper on Sci-Hub. Inspired by the Lean Library model, it scans the page you are viewing for a DOI (via citation metadata or the URL) and lets you open the matching article instantly from the toolbar popup, without needing to search or copy paste anything.

Features:
- Automatic DOI detection on academic pages (Google Scholar, PubMed, journal websites, etc.)
- One-click popup search, pre-filled with the detected DOI when available
- Manual lookup by DOI, title, or URL when auto-detection is not available
- Clean, minimal interface in the SciHub custom red (B8342A) color scheme
- Lightweight, no tracking, no data collection

Tech stack: Manifest V3, vanilla JavaScript, Chrome storage API.
