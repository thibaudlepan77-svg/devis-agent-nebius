// Control characters, soft hyphens, zero-width and bidirectional marks. Guided
// decoding sometimes leaves one behind when it closes a string at its length
// limit, and web page titles carry them too.
const INVISIBLES = new RegExp(
  "[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F\\u00AD\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\uFEFF]",
  "g",
);

const NON_BREAKING_HYPHENS = new RegExp("[\u2010\u2011]", "g");

export function stripInvisible(value: string): string {
  return value.replace(INVISIBLES, "");
}

// Nemotron favours non-breaking hyphens (U+2011), which survive a copy into an
// email or a spreadsheet as odd glyphs. Plain hyphens read the same.
export function plainText(value: string): string {
  return stripInvisible(value).replace(NON_BREAKING_HYPHENS, "-");
}

export function excerpt(value: string, length: number): string {
  const flat = stripInvisible(value).replace(/\s+/g, " ").trim();
  if (flat.length <= length) return flat;
  const cut = flat.slice(0, length);
  const lastSpace = cut.lastIndexOf(" ");
  return `${lastSpace > 0 ? cut.slice(0, lastSpace) : cut}…`;
}
