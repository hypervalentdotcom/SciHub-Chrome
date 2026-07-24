## Disclaimer

This project is provided "as is", with no warranty of any kind, express or implied. **I am not responsible for the shit you do with it, how you use it, or any consequences (legal, technical, or otherwise) that may result from its use.** Use at your own risk and make sure you comply with the laws applicable in your jurisdiction (maybe you live in Russia who knows).

This extension is 100% vibe-coded using Claude Sonnet 5 Thinking from Perplexity's environment. Logos generated with ChatGPT 5.6 Sol image gen. 

**Feel free to use it, modify it, and share it however you like, no attribution required.**

## SciHub Access - Installation Guide

1. Download the zip file provided.
2. Unzip it into a folder on your computer. Keep this folder in its final location before loading it into Chrome, since moving or deleting it later will break the extension.
3. Open Chrome and go to `chrome://extensions`.
4. Enable **Developer mode** in the top right corner, if not already active.
5. Click **Load unpacked** and select the unzipped folder.
6. The extension icon will appear in your toolbar.
7. If you already have a paper open on an academic site (Google Scholar, PubMed, a journal website, etc.), reload the page so the extension can detect the DOI. This is only needed once, every page you open afterward will be detected automatically.

### How it works:

Click the extension icon in the Chrome toolbar to open the popup.
If a DOI is automatically detected on the page you are viewing, it will be pre-filled in the search field.
Otherwise, paste a DOI, a title, or a URL and click Search.

**NB:** Sci-Hub generally does not have the most recent papers in its database. If a search doesn't return a result, it's most likely because the paper simply isn't indexed yet. In that case, you can submit a paid request through Sci-Hub's internal system, [Sci-Net](https://sci-net.xyz/), to have the paper added.

## Short description

A Chrome extension that auto-detects DOIs and gives you one-click access to the corresponding paper on Sci-Hub. Inspired by the Lean Library extension, it scans the page you are viewing for a DOI (via citation metadata or the URL) and lets you open the matching article instantly from the toolbar popup, without needing to search or copy paste anything.

### Features:

- Automatic DOI detection on academic pages (Google Scholar, PubMed, journal websites, etc.)
- One-click popup search, pre-filled with the detected DOI when available
- Manual lookup by DOI, title, or URL when auto-detection is not available
- Clean, minimal interface in the SciHub custom red (B8342A) color scheme
- Lightweight, no tracking, no data collection

Tech stack: Manifest V3, vanilla JavaScript, Chrome storage API.

---

*Last updated: July 24, 2026*
