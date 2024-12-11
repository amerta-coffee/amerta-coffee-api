type SortOrder = "asc" | "desc";

/**
 * Parses a JSON string of sort parameters into a record of column names
 * mapped to their respective sort orders.
 *
 * @param sort A JSON string of sort parameters, e.g. '{"name": "asc", "price": "desc"}'.
 * @returns An object with the same keys as the input JSON object, but with
 * values of type `SortOrder` instead of strings.
 * @throws {Error} If the input string is not valid JSON or contains invalid sort orders.
 */
const parseSorts = (sort?: string | null) => {
  if (!sort) return {};

  try {
    const sortParams = JSON.parse(sort);

    return Object.keys(sortParams).reduce(
      (sortOptions, key) => {
        const value = sortParams[key];

        if (
          typeof value === "string" &&
          ["asc", "desc"].includes(value.toLowerCase())
        ) {
          sortOptions[key] = value.toLowerCase() as SortOrder;
        }

        return sortOptions;
      },
      {} as Record<string, SortOrder>
    );
  } catch (error: Error | any) {
    throw new Error(
      error.message || "Invalid filter format. Please provide valid JSON."
    );
  }
};

export default parseSorts;
