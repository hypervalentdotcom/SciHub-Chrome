# CASdb

## Disclaimer

CASdb is provided "as is". It is a PubChem-based research shortcut, not an
official CAS Registry lookup, so verify critical information before ordering
25 kg of something toxic, explosive, or unnecessarily expensive. A valid
checksum does not guarantee that a CAS number is authoritative.

This extension was **100% vibe-coded by Codex, powered by GPT-5.6 Sol with Very
High reasoning effort**.

## CASdb - Installation Guide

1. Download the ZIP file.
2. Unzip it into a permanent folder. Moving or deleting it later will break the
   extension.
3. Open Chrome and go to `chrome://extensions`.
4. Enable **Developer mode** in the top-right corner.
5. Click **Load unpacked**.
6. Select the unzipped folder containing `manifest.json`.
7. Pin **CASdb** to the Chrome toolbar.

No build step or dependency installation is required.

### How it works:

Open CASdb, draw one molecule in the ChemDoodle editor, and click **Find CAS**.
The extension searches PubChem for the exact structure and displays the first
checksum-valid CAS number found in its synonyms.

You can also view physicochemical properties, check SpectraBase, and search the
CAS directly at six chemical suppliers. No copying the CAS into six different
catalogues, no reopening tabs, and no wondering whether a spectrum even exists:
the useful next steps are already attached to the result. The structure and
result stay saved when the popup closes and are removed when the structure is
edited or cleared.

**NB:** If PubChem does not recognize the structure or does not list a valid CAS
number, CASdb will not invent one just to make the search feel productive.

## Short description

Tired of SciFinder refusing to start, demanding another login because a session
is active, or taking 1,000 years to load your structure? CASdb gets straight to
the CAS number, useful properties, SpectraBase references, and ready-made
supplier searches.

SciFinder remains essential for planning a synthesis and cross-referencing the
literature. CASdb is simply the faster option when you only need a CAS number
and want to check spectra or commercial availability.

### Features:

- Integrated ChemDoodle molecular editor
- Exact-structure search through PubChem
- CAS format and checksum validation
- Useful physicochemical properties
- One-click SpectraBase reference search
- Ready-made CAS searches at Sigma-Aldrich, TCI, Fluorochem, abcr,
  EnamineStore, and CymitQuimica
- Persistent structure and result
- Lightweight, with no tracking or analytics

## Licence

ChemDoodle Web Components 11.0.0 is provided by iChemLabs under GPLv3. CASdb
and its distribution must therefore comply with GPLv3; the complete licence and
third-party notice are included in `LICENSE` and `NOTICE.md`. Contact iChemLabs
for a proprietary ChemDoodle licence.

No other third-party runtime library is bundled. PubChem, SpectraBase, and the
supplier catalogues are external services; their respective terms apply when
they are accessed.

- ChemDoodle: <https://web.chemdoodle.com/>
- ChemDoodle licensing: <https://web.chemdoodle.com/installation/license>
- PubChem PUG REST: <https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest>

Tech stack: Chrome Manifest V3, vanilla JavaScript, ChemDoodle Web Components,
Chrome Storage API, PubChem PUG REST/PUG View, and SpectraBase.

---

*Last updated: July 25, 2026*
