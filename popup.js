import { PubChemError, lookupCompoundFromMolfile } from "./lib/pubchem.js";
import {
  createMolfileStorage,
  createSearchResultStorage,
  isBlankMolecule
} from "./lib/molecule-storage.js";
import {
  checkSpectraBaseByCas,
  getSpectraBaseSearchUrl
} from "./lib/spectra.js";
import { getSupplierSearches } from "./lib/suppliers.js";

const SKETCHER_WIDTH = 434;
const SKETCHER_HEIGHT = 168;
const AUTOSAVE_DELAY = 250;
const AUTOSAVE_INTERVAL = 800;
const SEARCH_RESULT_SCHEMA_VERSION = 1;

const editorFrame = document.querySelector(".editor-frame");
const searchButton = document.querySelector("#searchButton");
const resultPanel = document.querySelector("#resultPanel");
const loadingState = document.querySelector("#loadingState");
const errorState = document.querySelector("#errorState");
const resultState = document.querySelector("#resultState");
const errorTitle = document.querySelector("#errorTitle");
const errorMessage = document.querySelector("#errorMessage");
const casValue = document.querySelector("#casValue");
const compoundName = document.querySelector("#compoundName");
const pubchemLink = document.querySelector("#pubchemLink");
const copyButton = document.querySelector("#copyButton");
const spectrabaseLink = document.querySelector("#spectrabaseLink");
const spectrabaseStatus = document.querySelector("#spectrabaseStatus");
const suppliersDisclosure = document.querySelector("#suppliersDisclosure");
const supplierLinks = new Map(
  [...document.querySelectorAll("[data-supplier]")].map((link) => [
    link.dataset.supplier,
    link
  ])
);
const propertiesDisclosure = document.querySelector("#propertiesDisclosure");
const propertyValues = {
  molecularWeight: document.querySelector("#molecularWeightValue"),
  density: document.querySelector("#densityValue"),
  physicalState: document.querySelector("#physicalStateValue"),
  meltingPoint: document.querySelector("#meltingPointValue"),
  boilingPoint: document.querySelector("#boilingPointValue"),
  formula: document.querySelector("#formulaValue")
};

ChemDoodle.ELEMENT.H.jmolColor = "black";
ChemDoodle.ELEMENT.S.jmolColor = "#a48612";

const sketcher = new ChemDoodle.SketcherCanvas(
  "sketcher",
  SKETCHER_WIDTH,
  SKETCHER_HEIGHT,
  {
    useServices: false,
    oneMolecule: true,
    requireStartingAtom: true,
    uiColor: "#B8342A",
    resizable: false
  }
);

sketcher.styles.atoms_displayTerminalCarbonLabels_2D = true;
sketcher.styles.atoms_useJMOLColors = true;
sketcher.styles.bonds_clearOverlaps_2D = true;
sketcher.styles.backgroundColor = "#ffffff";
sketcher.hideHelp = true;
sketcher.repaint();

const moleculeStorage = createMolfileStorage({
  chromeStorage: globalThis.chrome?.storage?.local,
  webStorage: window.localStorage
});
const searchResultStorage = createSearchResultStorage({
  chromeStorage: globalThis.chrome?.storage?.local,
  webStorage: window.localStorage
});
let persistenceReady = false;
let persistInFlight = false;
let persistTimer;
let lastPersistedMolfile = "";
let lastResultMolfile = "";

function showState(state) {
  resultPanel.hidden = state === "empty";
  loadingState.hidden = state !== "loading";
  errorState.hidden = state !== "error";
  resultState.hidden = state !== "result";
  resultPanel.setAttribute("aria-busy", String(state === "loading"));
}

function presentError(error) {
  if (error instanceof PubChemError && error.code === "not_found") {
    errorTitle.textContent = "No match";
  } else if (error instanceof PubChemError && error.code === "throttled") {
    errorTitle.textContent = "PubChem is busy";
  } else {
    errorTitle.textContent = "Search failed";
  }

  errorMessage.textContent =
    error instanceof Error
      ? error.message
      : "An unexpected error occurred during the search.";
  showState("error");
}

function presentCompound(compound) {
  if (compound.casNumbers.length === 0) {
    errorTitle.textContent = "CAS not listed";
    errorMessage.textContent =
      `The structure matches CID ${compound.cid}, but no checksum-valid CAS number ` +
      "appears in its PubChem synonyms.";
    showState("error");
    return false;
  }

  const [primaryCas] = compound.casNumbers;
  casValue.textContent = primaryCas;
  compoundName.textContent = compound.name;
  compoundName.title = compound.iupacName || compound.name;
  pubchemLink.textContent = `CID ${compound.cid}`;
  pubchemLink.href = compound.pubchemUrl;
  suppliersDisclosure.open = false;
  propertiesDisclosure.open = false;

  propertyValues.molecularWeight.textContent = formatProperty(
    compound.molecularWeight,
    "g/mol"
  );
  propertyValues.density.textContent = formatProperty(compound.density);
  propertyValues.physicalState.textContent = formatProperty(compound.physicalState);
  propertyValues.meltingPoint.textContent = formatProperty(compound.meltingPoint);
  propertyValues.boilingPoint.textContent = formatProperty(compound.boilingPoint);
  propertyValues.formula.textContent = formatProperty(compound.formula);

  showState("result");
  prepareSpectrumLinks(primaryCas);
  prepareSupplierLinks(primaryCas);
  return true;
}

function formatProperty(value, unit = "") {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return unit ? `${value} ${unit}` : String(value);
}

function prepareSpectrumLinks(casNumber) {
  spectrabaseLink.href = getSpectraBaseSearchUrl(casNumber);
  spectrabaseLink.dataset.state = "loading";
  spectrabaseStatus.textContent = "Checking…";

  void updateSpectraBaseStatus(casNumber);
}

function prepareSupplierLinks(casNumber) {
  for (const supplier of getSupplierSearches(casNumber)) {
    const link = supplierLinks.get(supplier.id);

    if (!link) {
      continue;
    }

    link.href = supplier.url;
  }
}

async function updateSpectraBaseStatus(casNumber) {
  const result = await checkSpectraBaseByCas(casNumber);

  if (casValue.textContent.trim() !== casNumber) {
    return;
  }

  spectrabaseLink.href = result.url;
  spectrabaseLink.dataset.state = result.state;

  if (result.state === "available") {
    spectrabaseStatus.textContent =
      result.count > 1 ? `${result.count} references` : "Reference found";
  } else if (result.state === "missing") {
    spectrabaseStatus.textContent = "No result";
  } else {
    spectrabaseStatus.textContent = "Open search";
  }
}

async function searchCas() {
  searchButton.disabled = true;
  showState("loading");

  try {
    await persistStructure();
    const molfile = getCurrentMolfile();
    const compound = await lookupCompoundFromMolfile(molfile);

    if (presentCompound(compound)) {
      await searchResultStorage.set({
        schemaVersion: SEARCH_RESULT_SCHEMA_VERSION,
        molfile,
        compound
      });
      lastResultMolfile = molfile;
    } else {
      await searchResultStorage.set(null);
      lastResultMolfile = "";
    }
  } catch (error) {
    presentError(error);
  } finally {
    searchButton.disabled = false;
  }
}

function getCurrentMolfile() {
  const molecule = sketcher.getMolecule();
  return isBlankMolecule(molecule) ? "" : ChemDoodle.writeMOL(molecule);
}

async function restoreStructure() {
  try {
    const savedMolfile = await moleculeStorage.get();

    if (!savedMolfile) {
      return "";
    }

    const molecule = ChemDoodle.readMOL(savedMolfile);

    if (isBlankMolecule(molecule)) {
      await moleculeStorage.set("");
      return "";
    }

    sketcher.loadMolecule(molecule);
    const restoredMolfile = getCurrentMolfile();

    if (restoredMolfile !== savedMolfile) {
      await moleculeStorage.set(restoredMolfile);
    }

    lastPersistedMolfile = restoredMolfile;
    return restoredMolfile;
  } catch {
    await moleculeStorage.set("").catch(() => {});
    return "";
  } finally {
    persistenceReady = true;
  }
}

async function restoreSearchResult(savedMolfile) {
  try {
    const savedResult = await searchResultStorage.get();

    if (
      !savedMolfile ||
      savedResult?.schemaVersion !== SEARCH_RESULT_SCHEMA_VERSION ||
      !savedResult?.compound ||
      savedResult.molfile !== savedMolfile
    ) {
      await searchResultStorage.set(null);
      return false;
    }

    lastResultMolfile = getCurrentMolfile();
    return presentCompound(savedResult.compound);
  } catch {
    await searchResultStorage.set(null).catch(() => {});
    lastResultMolfile = "";
    return false;
  }
}

async function persistStructure() {
  if (!persistenceReady || persistInFlight) {
    return;
  }

  const molfile = getCurrentMolfile();

  if (molfile === lastPersistedMolfile) {
    return;
  }

  persistInFlight = true;

  try {
    await moleculeStorage.set(molfile);
    lastPersistedMolfile = molfile;

    if (lastResultMolfile && molfile !== lastResultMolfile) {
      await searchResultStorage.set(null);
      lastResultMolfile = "";
      showState("empty");
    }
  } finally {
    persistInFlight = false;
  }
}

function scheduleStructurePersistence() {
  window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => {
    void persistStructure();
  }, AUTOSAVE_DELAY);
}

async function copyCas() {
  const value = casValue.textContent.trim();

  try {
    await navigator.clipboard.writeText(value);
    copyButton.setAttribute("aria-label", "CAS number copied");
    copyButton.title = "Copied";
    window.setTimeout(() => {
      copyButton.setAttribute("aria-label", "Copy CAS number");
      copyButton.title = "Copy CAS number";
    }, 1400);
  } catch {
    errorTitle.textContent = "Copy failed";
    errorMessage.textContent = "Select the CAS number and copy it manually.";
    showState("error");
  }
}

searchButton.addEventListener("click", searchCas);
copyButton.addEventListener("click", copyCas);
suppliersDisclosure.addEventListener("toggle", () => {
  if (suppliersDisclosure.open) {
    propertiesDisclosure.open = false;
  }
});
propertiesDisclosure.addEventListener("toggle", () => {
  if (propertiesDisclosure.open) {
    suppliersDisclosure.open = false;
  }
});

editorFrame.addEventListener("pointerup", scheduleStructurePersistence, true);
editorFrame.addEventListener("keyup", scheduleStructurePersistence, true);
window.addEventListener("pagehide", () => {
  void persistStructure();
});
window.setInterval(() => {
  void persistStructure();
}, AUTOSAVE_INTERVAL);

const restoredMolfile = await restoreStructure();
const restoredResult = await restoreSearchResult(restoredMolfile);

if (!restoredResult) {
  showState("empty");
}
