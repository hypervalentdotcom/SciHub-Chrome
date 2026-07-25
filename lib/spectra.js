const SPECTRABASE_ROOT = "https://spectrabase.com";

export function getSpectraBaseSearchUrl(casNumber) {
  return `${SPECTRABASE_ROOT}/search?q=${encodeURIComponent(casNumber)}`;
}

function parseSearchResults(html) {
  const match = html.match(
    /getSearchResults:\s*function\s*\(\)\s*\{\s*return\s+(\[[\s\S]*?\]);/
  );

  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

export async function checkSpectraBaseByCas(casNumber, fetchImpl = fetch) {
  const url = getSpectraBaseSearchUrl(casNumber);
  let response;

  try {
    response = await fetchImpl(url, {
      headers: { Accept: "text/html" }
    });
  } catch {
    return { state: "unknown", url };
  }

  if (!response.ok) {
    return { state: "unknown", url };
  }

  let results;

  try {
    results = parseSearchResults(await response.text());
  } catch {
    return { state: "unknown", url };
  }

  if (!Array.isArray(results)) {
    return { state: "unknown", url };
  }

  const compounds = results.flatMap((result) =>
    Array.isArray(result?.compounds) ? result.compounds : []
  );

  return {
    state: compounds.length > 0 ? "available" : "missing",
    url,
    count: compounds.length
  };
}
