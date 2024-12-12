type SortOrder = "asc" | "desc";

/**
 * Parses the given sort string into an array of sorting options.
 * The sort string should be a JSON object where each key is a field name
 * and each value is a sort order ('asc' or 'desc').
 *
 * Nested fields can be specified using dot notation.
 *
 * @example
 * ```json
 * {"name": "asc", "price": "desc"}
 * ```
 *
 * @param sort The sort string to parse.
 * @returns An array of sorting options where each option is a record with
 *   field names as keys and sort orders as values.
 * @throws {Error} If the sort string is invalid or cannot be parsed.
 */
export default function parseSorts(
  sort?: string
): Array<Record<string, SortOrder>> {
  if (!sort || typeof sort !== "string") return [];

  const sortParams = JSON.parse(sort);

  if (typeof sortParams !== "object" || sortParams === null) {
    throw new Error("Invalid sort format. Please provide valid JSON.");
  }

  const sortOptions: Array<Record<string, any>> = [];

  Object.keys(sortParams).forEach((key) => {
    const value = sortParams[key];

    const keys = key.split(".");

    if (
      typeof value !== "string" ||
      !["asc", "desc"].includes(value.toLowerCase())
    ) {
      throw new Error("Invalid sort type. Must be 'asc' or 'desc'.");
    }

    const sortDirection = value.toLowerCase() as SortOrder;

    let currentOption: Record<string, any> = {};
    let currentRef = currentOption;

    keys.forEach((k, index) => {
      if (index === keys.length - 1) {
        currentRef[k] = sortDirection;
      } else {
        currentRef[k] = currentRef[k] || {};
        currentRef = currentRef[k];
      }
    });

    sortOptions.push(currentOption);
  });

  return sortOptions;
}
