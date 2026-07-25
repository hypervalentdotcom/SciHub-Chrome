const CAS_PATTERN = /^\d{2,7}-\d{2}-\d$/;

export function isValidCas(value) {
  if (typeof value !== "string" || !CAS_PATTERN.test(value)) {
    return false;
  }

  const [prefix, middle, checkDigit] = value.split("-");
  const digits = `${prefix}${middle}`;
  let checksum = 0;

  for (let index = 0; index < digits.length; index += 1) {
    const digit = Number(digits[digits.length - 1 - index]);
    checksum += digit * (index + 1);
  }

  return checksum % 10 === Number(checkDigit);
}

export function extractCasNumbers(synonyms = []) {
  const values = [];
  const seen = new Set();

  for (const synonym of synonyms) {
    if (!isValidCas(synonym) || seen.has(synonym)) {
      continue;
    }

    seen.add(synonym);
    values.push(synonym);
  }

  return values;
}
