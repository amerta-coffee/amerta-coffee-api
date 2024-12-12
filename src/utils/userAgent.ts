import { UAParser } from "ua-parser-js";

const parser = new UAParser();

/**
 * Parses a user agent string and returns an object containing detailed information
 * about the browser, operating system, device, and other relevant data.
 *
 * @param {string} userAgent - The user agent string to be parsed.
 * @returns {UAParser.IResult} An object containing parsed details of the user agent.
 */
export function parseUserAgent(userAgent: string): UAParser.IResult {
  return parser.setUA(userAgent).getResult();
}

/**
 * Compares two user agent strings to determine if they belong to the same browser and
 * operating system. This is useful for verifying that a user is using the same browser
 * and operating system that they used to sign up or make a purchase.
 *
 * @param {string} userAgentRequest - The user agent string of the request.
 * @param {string} userAgentDB - The user agent string stored in the database.
 * @returns {boolean} True if the user agent strings match, false otherwise.
 */
export function compareUserAgent(
  userAgentRequest: string,
  userAgentDB: string
): boolean {
  const parserRequest = new UAParser(userAgentRequest);
  const parserDB = new UAParser(userAgentDB);

  const resultRequest = parserRequest.getResult();
  const resultDB = parserDB.getResult();

  const isBrowserSimilar = resultRequest.browser.name === resultDB.browser.name;

  const isOSSimilar =
    resultRequest.os.name === resultDB.os.name &&
    Math.abs(
      parseFloat(resultRequest.os.version || "0") -
        parseFloat(resultDB.os.version || "0")
    ) <= 1;

  return isBrowserSimilar && isOSSimilar;
}
