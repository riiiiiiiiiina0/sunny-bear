/**
 * This script detects if the page is using a light or dark theme and logs the result to the console.
 */
(function() {
  // Function to determine if a color is light or dark
  function getTheme(color) {
    // Variables for red, green, blue values
    let r, g, b;

    // Check the format of the color, HEX or RGB
    if (color.match(/^rgb/)) {
      // If RGB --> store the red, green, blue values in separate variables
      const colorValues = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
      if (!colorValues) {
        // Default to light theme if color can't be parsed
        return 'Light Theme';
      }
      r = colorValues[1];
      g = colorValues[2];
      b = colorValues[3];
    } else {
      // If hex --> Convert it to RGB
      color = +("0x" + color.slice(1).replace(
        color.length < 5 && /./g, '$&$&'
      ));
      r = color >> 16;
      g = (color >> 8) & 255;
      b = color & 255;
    }

    // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
    const hsp = Math.sqrt(
      0.299 * (r * r) +
      0.587 * (g * g) +
      0.114 * (b * b)
    );

    // Using the HSP value, determine whether the color is light or dark
    if (hsp > 127.5) {
      return 'Light Theme';
    } else {
      return 'Dark Theme';
    }
  }

  function detectAndLogTheme() {
    // Start with the body element
    let element = document.body;
    let backgroundColor = window.getComputedStyle(element).backgroundColor;

    // If the body's background is transparent, traverse up to find a non-transparent background
    while ((backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') && element.parentElement) {
      element = element.parentElement;
      backgroundColor = window.getComputedStyle(element).backgroundColor;
    }

    const theme = getTheme(backgroundColor);
    console.log(`This page is using a ${theme}. Detected from element:`, element);
  }

  // Run the detection logic
  detectAndLogTheme();
})();
