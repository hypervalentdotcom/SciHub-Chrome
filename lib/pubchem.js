import { extractCasNumbers } from "./cas.js";

const API_ROOT = "https://pubchem.ncbi.nlm.nih.gov/rest/pug";
const PUG_VIEW_ROOT = "https://pubchem.ncbi.nlm.nih.gov/rest/pug_view";
const MAX_IDENTITY_RESULTS = 10;
const PROPERTY_FIELDS = [
  "Title",
  "IUPACName",
  "MolecularFormula",
  "MolecularWeight"
].join(",");
const EXPERIMENTAL_HEADINGS = {
  density: "Density",
  boilingPoint: "Boiling Point",
  meltingPoint: "Melting Point",
  physicalDescription: "Physical Description"
};

export class PubChemError extends Error {
  constructor(code, message, status = 0) {
    super(message);
    this.name = "PubChemError";
    this.code = code;
    this.status = status;
  }
}

export function molfileToSdf(molfile) {
  if (typeof molfile !== "string" || !molfile.includes("M  END")) {
    throw new PubChemError("invalid_structure", "The drawn structure could not be read.");
  }

  const molBlock = molfile.slice(0, molfile.indexOf("M  END") + "M  END".length);
  return `${molBlock}\n$$$$\n`;
}

async function fetchJson(url, options, fetchImpl) {
  let response;

  try {
    response = await fetchImpl(url, options);
  } catch {
    throw new PubChemError(
      "network",
      "Could not connect to PubChem. Check your internet connection."
    );
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new PubChemError(
        "not_found",
        "No exact match was found in PubChem.",
        response.status
      );
    }

    if (response.status === 429 || response.status === 503) {
      throw new PubChemError(
        "throttled",
        "PubChem is temporarily busy. Try again in a few seconds.",
        response.status
      );
    }

    throw new PubChemError(
      "service",
      "PubChem could not process this structure.",
      response.status
    );
  }

  try {
    return await response.json();
  } catch {
    throw new PubChemError(
      "service",
      "The PubChem response could not be read.",
      response.status
    );
  }
}

async function fetchOptionalJson(url, fetchImpl) {
  let response;

  try {
    response = await fetchImpl(url, { headers: { Accept: "application/json" } });
  } catch {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

function cleanAnnotationValue(value) {
  return String(value)
    .replace(/\s+/g, " ")
    .replace(/\s*\([A-Za-z][A-Za-z0-9.-]*,\s*\d{4}\)\s*$/i, "")
    .trim();
}

function valuesFromInformation(information) {
  const value = information?.Value ?? {};
  const strings = (value.StringWithMarkup ?? [])
    .map((item) => item?.String)
    .filter(Boolean);
  const numbers = Array.isArray(value.Number) ? value.Number : [];

  if (numbers.length > 0) {
    const joined = numbers.join(numbers.length > 1 ? "–" : "");
    strings.push(value.Unit ? `${joined} ${value.Unit}` : joined);
  }

  return strings.map(cleanAnnotationValue).filter(Boolean);
}

export function extractPugViewValues(data, heading) {
  const values = [];

  function visit(sections) {
    for (const section of sections ?? []) {
      if (section.TOCHeading === heading) {
        for (const information of section.Information ?? []) {
          values.push(...valuesFromInformation(information));
        }
      }

      visit(section.Section);
    }
  }

  visit(data?.Record?.Section);
  return values;
}

function formatNumber(value, maximumDecimals = 2) {
  return Number(value)
    .toFixed(maximumDecimals)
    .replace(/(\.\d*?[1-9])0+$|\.0+$/, "$1");
}

function temperatureFromValue(value) {
  const match = value.match(
    /(-?\d+(?:\.\d+)?)\s*(?:[-–]\s*(-?\d+(?:\.\d+)?))?\s*°\s*([CF])/i
  );

  if (!match) {
    return null;
  }

  const scale = match[3].toUpperCase();
  const convert = (number) =>
    scale === "F" ? ((Number(number) - 32) * 5) / 9 : Number(number);
  const start = convert(match[1]);
  const end = match[2] === undefined ? null : convert(match[2]);
  const range =
    end === null
      ? formatNumber(start)
      : `${formatNumber(start)}–${formatNumber(end)}`;
  const pressure = value.match(/\b(?:at|@)\s*([\d.]+\s*(?:mm\s*Hg|kPa|bar|Pa))/i);

  return {
    celsius: end === null ? start : (start + end) / 2,
    text:
      `${range} °C` +
      (pressure ? ` (${pressure[1].replace(/\s+/g, " ")})` : "")
  };
}

export function selectTemperature(values) {
  const cleanValues = values.map(cleanAnnotationValue);
  const selected =
    cleanValues.find((value) => /°\s*C/i.test(value)) ??
    cleanValues.find((value) => /°\s*F/i.test(value));

  if (!selected) {
    return null;
  }

  const temperature = temperatureFromValue(selected);
  if (!temperature) {
    return null;
  }

  const decomposes = cleanValues.some((value) => /decomp/i.test(value));
  const sublimes = cleanValues.some((value) => /sublim/i.test(value));
  return (
    temperature.text +
    (decomposes ? " (decomp.)" : sublimes ? " (subl.)" : "")
  );
}

export function selectDensity(values) {
  const cleanValues = values.map(cleanAnnotationValue);
  const withUnits = cleanValues
    .filter((value) =>
      /(?:g\s*\/\s*(?:cm(?:³|3)|mL)|kg\s*\/\s*m(?:³|3)|kg\s*\/\s*L|g\s*\/\s*cu\s*cm)/i.test(
        value
      )
    )
    .sort((left, right) => left.length - right.length);
  const selected =
    withUnits[0] ??
    cleanValues.find((value) => /^\d+(?:\.\d+)?(?:\s|$)/);

  if (!selected) {
    return null;
  }

  return selected
    .replace(/g\s*\/\s*cu\s*cm/gi, "g/cm³")
    .replace(/g\s*\/\s*cm3/gi, "g/cm³")
    .replace(/kg\s*\/\s*m3/gi, "kg/m³");
}

function celsiusValue(value) {
  return value ? temperatureFromValue(value)?.celsius ?? null : null;
}

export function selectPhysicalState(
  values,
  meltingPoint = null,
  boilingPoint = null
) {
  const candidates = values
    .map(cleanAnnotationValue)
    .sort((left, right) => left.length - right.length);

  for (const value of candidates) {
    if (/^(?:gas|gaseous)$/i.test(value) || /\bgas(?:eous)?\b/i.test(value)) {
      return "Gas";
    }
    if (/^liquid$/i.test(value) || /\bliquid\b/i.test(value)) {
      return "Liquid";
    }
    if (
      /^(?:solid|crystalline solid)$/i.test(value) ||
      /\b(?:solid|crystal(?:line)?|powder)\b/i.test(value)
    ) {
      return "Solid";
    }
  }

  const meltingCelsius = celsiusValue(meltingPoint);
  const boilingCelsius = celsiusValue(boilingPoint);

  if (meltingCelsius !== null && meltingCelsius > 20) {
    return "Solid";
  }
  if (boilingCelsius !== null && boilingCelsius < 20) {
    return "Gas";
  }
  if (
    meltingCelsius !== null &&
    boilingCelsius !== null &&
    meltingCelsius <= 20 &&
    boilingCelsius > 20
  ) {
    return "Liquid";
  }

  return null;
}

function selectCompound(cids, properties, information) {
  const propertiesByCid = new Map(properties.map((item) => [Number(item.CID), item]));
  const synonymsByCid = new Map(
    information.map((item) => [Number(item.CID), item.Synonym ?? []])
  );

  const compounds = cids.map((cid) => {
    const property = propertiesByCid.get(cid) ?? { CID: cid };
    const casNumbers = extractCasNumbers(synonymsByCid.get(cid) ?? []);

    return {
      cid,
      name: property.Title || property.IUPACName || `PubChem compound ${cid}`,
      iupacName: property.IUPACName || "",
      formula: property.MolecularFormula || "",
      molecularWeight: property.MolecularWeight ?? null,
      casNumbers
    };
  });

  return compounds.find((compound) => compound.casNumbers.length > 0) ?? compounds[0];
}

export async function lookupCompoundFromMolfile(molfile, fetchImpl = fetch) {
  const sdf = molfileToSdf(molfile);
  const identityUrl =
    `${API_ROOT}/compound/fastidentity/sdf/cids/JSON` +
    "?identity_type=same_stereo_isotope&MaxRecords=10";

  const identity = await fetchJson(
    identityUrl,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
      },
      body: new URLSearchParams({ sdf }).toString()
    },
    fetchImpl
  );

  const cids = (identity?.IdentifierList?.CID ?? [])
    .map(Number)
    .filter(Number.isSafeInteger)
    .slice(0, MAX_IDENTITY_RESULTS);

  if (cids.length === 0) {
    throw new PubChemError(
      "not_found",
      "No exact match was found in PubChem."
    );
  }

  const cidPath = cids.join(",");
  const [propertyData, synonymData] = await Promise.all([
    fetchJson(
      `${API_ROOT}/compound/cid/${cidPath}/property/${PROPERTY_FIELDS}/JSON`,
      { headers: { Accept: "application/json" } },
      fetchImpl
    ),
    fetchJson(
      `${API_ROOT}/compound/cid/${cidPath}/synonyms/JSON`,
      { headers: { Accept: "application/json" } },
      fetchImpl
    )
  ]);

  const compound = selectCompound(
    cids,
    propertyData?.PropertyTable?.Properties ?? [],
    synonymData?.InformationList?.Information ?? []
  );
  const annotationEntries = await Promise.all(
    Object.entries(EXPERIMENTAL_HEADINGS).map(async ([key, heading]) => {
      const url =
        `${PUG_VIEW_ROOT}/data/compound/${compound.cid}/JSON` +
        `?heading=${encodeURIComponent(heading)}`;
      const data = await fetchOptionalJson(url, fetchImpl);
      return [key, extractPugViewValues(data, heading)];
    })
  );
  const annotations = Object.fromEntries(annotationEntries);
  const meltingPoint = selectTemperature(annotations.meltingPoint);
  const boilingPoint = selectTemperature(annotations.boilingPoint);

  return {
    ...compound,
    density: selectDensity(annotations.density),
    meltingPoint,
    boilingPoint,
    physicalState: selectPhysicalState(
      annotations.physicalDescription,
      meltingPoint,
      boilingPoint
    ),
    pubchemUrl: `https://pubchem.ncbi.nlm.nih.gov/compound/${compound.cid}`
  };
}
