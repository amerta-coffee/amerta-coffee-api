/**
 * Generates a URL for an SVG avatar based on the given name.
 *
 * @param {string} name - The name to generate the avatar for.
 * @returns {string} The URL of the generated avatar.
 */
export const generateAvatarUrl = (name: string): string =>
  `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${encodeURIComponent(
    name.toLowerCase()
  )}`;
