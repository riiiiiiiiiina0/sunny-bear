/**
 * Content script for Light Theme extension
 * This script removes the light theme styles from the page
 */
(function () {
  // Remove the light theme styles and attributes
  removeLightTheme();

  function removeLightTheme() {
    // Clean up MutationObserver
    if (window.lightThemeExtension && window.lightThemeExtension.observer) {
      window.lightThemeExtension.observer.disconnect();
      delete window.lightThemeExtension;
    }

    // Remove our data attributes from all elements.
    document.querySelectorAll('[data-sunny-bear-ignore]').forEach(element => {
      element.removeAttribute('data-sunny-bear-ignore');
    });

    document.documentElement.removeAttribute('data-sunny-bear-active');

    // Remove filters from elements that were filtered by our extension.
    const filteredElements = document.querySelectorAll('[data-light-theme-filtered="true"]');
    filteredElements.forEach(element => {
      if (element instanceof HTMLElement) {
        const lightThemeFilter = 'invert(1) hue-rotate(180deg)';
        const currentFilter = element.style.filter || '';

        // Create a regex to safely remove our filter.
        const filterRegex = new RegExp(`\\s*${lightThemeFilter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'g');
        const newFilter = currentFilter.replace(filterRegex, ' ').trim();

        if (newFilter) {
          element.style.filter = newFilter;
        } else {
          element.style.removeProperty('filter');
        }

        element.removeAttribute('data-light-theme-filtered');
      }
    });
  }
})();