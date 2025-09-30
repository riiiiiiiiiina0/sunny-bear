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

    // Remove the active flag from the html element.
    document.documentElement.removeAttribute('data-sunny-bear-active');

    // Find all elements that were filtered by our extension and revert them.
    const filteredElements = document.querySelectorAll('[data-light-theme-filtered="true"]');
    filteredElements.forEach(element => {
      if (element instanceof HTMLElement) {
        const lightThemeFilter = 'invert(1) hue-rotate(180deg)';
        const currentFilter = element.style.filter || '';

        // Create a regex to safely remove our filter while preserving others.
        const filterRegex = new RegExp(`\\s*${lightThemeFilter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'g');
        const newFilter = currentFilter.replace(filterRegex, ' ').trim();

        if (newFilter) {
          element.style.filter = newFilter;
        } else {
          element.style.removeProperty('filter');
        }

        // Remove our tracking attribute.
        element.removeAttribute('data-light-theme-filtered');
      }
    });
  }
})();