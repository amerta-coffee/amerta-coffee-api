/**
 * Slugify a string.
 *
 * @param name - The string to be slugified.
 * @returns A slugified string.
 *
 * This function slugifies a string by:
 *
 * 1. Trimming the string.
 * 2. Lowercasing the string.
 * 3. Normalizing the string.
 * 4. Replacing special characters with their corresponding replacements.
 * 5. Replacing spaces, percent signs, and plus signs with dashes.
 * 6. Removing any characters that are not alphanumeric, dashes, or underscores.
 * 7. Replacing multiple dashes with a single dash.
 * 8. Removing any leading or trailing dashes.
 */
export default function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/#/g, "number")
    .replace(/[\s%+]/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}
