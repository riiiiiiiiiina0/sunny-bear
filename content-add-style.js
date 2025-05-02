/**
 * Content script for Light Theme extension
 * This script converts dark themed websites to light theme
 */

(function () {
  if (document.getElementById('light-theme-extension-styles')) {
    return;
  }

  console.log('Light Theme content script running');

  // Apply light theme conversion
  applyLightTheme();

  /**
   * Main function to apply light theme to the current page
   */
  function applyLightTheme() {
    injectLightThemeCSS();
  }

  /**
   * Inject CSS to override dark theme styles
   */
  function injectLightThemeCSS() {
    const css = `
      @media (prefers-color-scheme: light) {
        html, img, video, [style*="background-image"], iframe {
          filter: invert(1) hue-rotate(180deg);
        }
      }
    `;

    const style = document.createElement('style');
    style.id = 'light-theme-extension-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }
})();
