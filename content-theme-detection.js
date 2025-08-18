/**
 * Content script to detect page theme (light or dark).
 */

/**
 * Gets the background color of an element, traversing up the DOM if transparent.
 * @param {HTMLElement} element - The element to check.
 * @returns {string} The computed background color in rgb format.
 */
function getElementBackgroundColor(element) {
  const style = window.getComputedStyle(element);
  let bgColor = style.backgroundColor;

  let currentElement = element;
  while (
    bgColor === 'rgba(0, 0, 0, 0)' ||
    bgColor === 'transparent'
  ) {
    currentElement = currentElement.parentElement;
    if (!currentElement) {
      return 'rgb(255, 255, 255)'; // Default to white if we reach the top
    }
    bgColor = window.getComputedStyle(currentElement).backgroundColor;
  }

  return bgColor;
}

/**
 * Parses an RGB color string into an array of numbers.
 * @param {string} rgbString - The RGB color string (e.g., "rgb(255, 255, 255)").
 * @returns {Array<number>} An array of [r, g, b] values.
 */
function parseRgbColor(rgbString) {
  const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  return match
    ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])]
    : [255, 255, 255]; // Default to white on parsing failure
}

/**
 * Calculates the relative luminance of an RGB color.
 * @param {number} r - Red value (0-255).
 * @param {number} g - Green value (0-255).
 * @param {number} b - Blue value (0-255).
 * @returns {number} The luminance value (0 to 1).
 */
function calculateLuminance(r, g, b) {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * Determines if a color is light or dark based on its luminance.
 * @param {string} rgbString - The RGB color string.
 * @returns {boolean} True if the color is light, false if dark.
 */
function isLightColor(rgbString) {
  const [r, g, b] = parseRgbColor(rgbString);
  const luminance = calculateLuminance(r, g, b);
  return luminance > 0.5; // W3C threshold for light vs. dark
}

/**
 * Analyzes the page to determine if its theme is light or dark.
 * @returns {string} 'light' or 'dark'.
 */
function analyzePageTheme() {
  const elementsToCheck = [
    document.body,
    document.documentElement,
    ...Array.from(document.querySelectorAll('div, main, header, section, article, nav')),
  ].filter(Boolean).slice(0, 20); // Limit samples for performance

  let lightPixels = 0;
  let darkPixels = 0;

  elementsToCheck.forEach((element) => {
    const bgColor = getElementBackgroundColor(element);
    const rect = element.getBoundingClientRect();
    const area = rect.width * rect.height;

    if (area > 0) { // Only consider visible elements with some area
      if (isLightColor(bgColor)) {
        lightPixels += area;
      } else {
        darkPixels += area;
      }
    }
  });

  const theme = lightPixels > darkPixels ? 'light' : 'dark';
  return theme;
}

// --- Main execution ---
// This script is designed to be executed by chrome.scripting.executeScript,
// so it needs to return the result. We wrap the logic in a self-executing
// anonymous function that returns the detected theme.
(() => {
  try {
    const detectedTheme = analyzePageTheme();
    return detectedTheme;
  } catch (error) {
    console.error('Error detecting page theme:', error);
    // Return a default value in case of an error
    return 'light';
  }
})();
