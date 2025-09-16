/**
 * Content script for Light Theme extension
 * This script removes the light theme styles from the page
 */

(function () {
  // Remove the light theme styles
  removeLightThemeStyles();

  /**
   * Function to remove light theme styles from the current page
   */
  function removeLightThemeStyles() {
    // Remove the injected CSS styles
    const styles = document.querySelectorAll('#light-theme-extension-styles');
    styles.forEach((style) => {
      style.remove();
    });

    // Clean up MutationObserver and processed elements
    if (window['lightThemeExtension']) {
      // Stop the MutationObserver
      if (window['lightThemeExtension'].observer) {
        window['lightThemeExtension'].observer.disconnect();
      }

      // Remove filters from processed elements
      const filteredElements = document.querySelectorAll(
        '[data-light-theme-filtered="true"]',
      );
      filteredElements.forEach((element) => {
        // Check if element is HTMLElement and has style property
        if (element instanceof HTMLElement) {
          // Remove the light theme filter from the element's style
          const currentFilter = element.style.filter || '';
          const lightThemeFilter = 'invert(1) hue-rotate(180deg)';

          // Remove our filter while preserving other filters
          let newFilter = currentFilter
            .replace(
              new RegExp(
                `\\s*${lightThemeFilter.replace(/[()]/g, '\\$&')}\\s*`,
                'g',
              ),
              ' ',
            )
            .replace(/\s+/g, ' ')
            .trim();

          if (newFilter) {
            element.style.filter = newFilter;
          } else {
            element.style.removeProperty('filter');
          }

          // Remove our data attribute
          element.removeAttribute('data-light-theme-filtered');
        }
      });

      // Clear the global reference
      delete window['lightThemeExtension'];
    }
  }
})();
