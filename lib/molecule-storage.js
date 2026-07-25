export const MOLECULE_STORAGE_KEY = "casDb.persistedMolfile";
export const SEARCH_RESULT_STORAGE_KEY = "casDb.persistedSearchResult";

export function isBlankMolecule(molecule) {
  const atoms = Array.isArray(molecule?.atoms) ? molecule.atoms : [];
  const bonds = Array.isArray(molecule?.bonds) ? molecule.bonds : [];

  if (atoms.length === 0) {
    return true;
  }

  if (atoms.length !== 1 || bonds.length !== 0) {
    return false;
  }

  const [atom] = atoms;
  return (
    (atom.label ?? "C") === "C" &&
    (atom.charge ?? 0) === 0 &&
    (atom.mass ?? -1) === -1
  );
}

export function createMolfileStorage({ chromeStorage, webStorage } = {}) {
  const hasChromeStorage =
    chromeStorage &&
    typeof chromeStorage.get === "function" &&
    typeof chromeStorage.set === "function" &&
    typeof chromeStorage.remove === "function";

  return {
    async get() {
      if (hasChromeStorage) {
        const values = await chromeStorage.get(MOLECULE_STORAGE_KEY);
        return values?.[MOLECULE_STORAGE_KEY] ?? "";
      }

      return webStorage?.getItem(MOLECULE_STORAGE_KEY) ?? "";
    },

    async set(molfile) {
      if (hasChromeStorage) {
        if (molfile) {
          await chromeStorage.set({ [MOLECULE_STORAGE_KEY]: molfile });
        } else {
          await chromeStorage.remove(MOLECULE_STORAGE_KEY);
        }
        return;
      }

      if (molfile) {
        webStorage?.setItem(MOLECULE_STORAGE_KEY, molfile);
      } else {
        webStorage?.removeItem(MOLECULE_STORAGE_KEY);
      }
    }
  };
}

export function createSearchResultStorage({ chromeStorage, webStorage } = {}) {
  const hasChromeStorage =
    chromeStorage &&
    typeof chromeStorage.get === "function" &&
    typeof chromeStorage.set === "function" &&
    typeof chromeStorage.remove === "function";

  return {
    async get() {
      if (hasChromeStorage) {
        const values = await chromeStorage.get(SEARCH_RESULT_STORAGE_KEY);
        return values?.[SEARCH_RESULT_STORAGE_KEY] ?? null;
      }

      const value = webStorage?.getItem(SEARCH_RESULT_STORAGE_KEY);

      if (!value) {
        return null;
      }

      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    },

    async set(result) {
      if (hasChromeStorage) {
        if (result) {
          await chromeStorage.set({ [SEARCH_RESULT_STORAGE_KEY]: result });
        } else {
          await chromeStorage.remove(SEARCH_RESULT_STORAGE_KEY);
        }
        return;
      }

      if (result) {
        webStorage?.setItem(SEARCH_RESULT_STORAGE_KEY, JSON.stringify(result));
      } else {
        webStorage?.removeItem(SEARCH_RESULT_STORAGE_KEY);
      }
    }
  };
}
