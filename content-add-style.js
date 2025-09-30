/**
 * Content script for Light Theme extension
 * This script converts dark themed websites to light theme
 */

(function () {
  if (document.getElementById('light-theme-extension-styles')) {
    return;
  }

  // Global variables for cleanup
  let mutationObserver = null;
  let processedElements = new Set();
  let applySelectiveFiltersTimeout = 0;

  // Apply light theme conversion
  applyLightTheme();

  /**
   * Main function to apply light theme to the current page
   */
  function applyLightTheme() {
    injectLightThemeCSS();
    applySelectiveFilters();
    setupDOMObserver();
  }

  /**
   * Inject CSS to override dark theme styles
   */
  function injectLightThemeCSS() {
    const css = `
      @media (prefers-color-scheme: light) {
        html, .sunny-bear-excluded {
          filter: invert(1) hue-rotate(180deg);
        }
      }
    `;

    const style = document.createElement('style');
    style.id = 'light-theme-extension-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  /**
   * Find all elements that should be exempt from the theme and apply a reverse filter.
   * This includes images, videos, and elements with background images.
   * It will not apply filters to elements that already have a filter property.
   */
  function applySelectiveFilters() {
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return;
    }
    // Query all elements to check for background images, as well as specific media types
    const allElements = document.querySelectorAll('*');

    allElements.forEach((element) => {
      if (processedElements.has(element)) return;

      // Ignore anchor tags
      if (element.tagName === 'A') return;

      const computedStyle = window.getComputedStyle(element);
      const existingFilter = computedStyle.filter;

      // If a filter is already applied, skip this element to avoid conflicts
      if (existingFilter && existingFilter !== 'none') {
        return;
      }

      const isMediaType = ['IMG', 'VIDEO', 'CANVAS'].includes(element.tagName);
      const hasBackgroundImage =
        computedStyle.backgroundImage &&
        computedStyle.backgroundImage.startsWith('url(');

      if (isMediaType || hasBackgroundImage) {
        if (element instanceof HTMLElement) {
          // Apply the reverse filter to cancel out the html-level filter
          element.style.filter = 'invert(1) hue-rotate(180deg)';
          element.setAttribute('data-light-theme-filtered', 'true');
          processedElements.add(element);
        }
      }
    });
  }

  /**
   * Set up MutationObserver to watch for DOM changes
   */
  function setupDOMObserver() {
    clearTimeout(applySelectiveFiltersTimeout);

    // If an observer already exists from a previous execution of this content script
    // (e.g. due to SPA navigation re-triggering without full page reload),
    // disconnect it before creating a new one.
    if (
      window['lightThemeExtension'] &&
      window['lightThemeExtension'].observer
    ) {
      window['lightThemeExtension'].observer.disconnect();
      // We can also clear processedElements if we want a fresh start,
      // but existing processedElements set should still be valid.
      // For now, just ensure one observer.
      // The script-local `mutationObserver` variable will be (re)assigned a new observer below.
      // If it previously held a reference to the same observer as the global one,
      // that observer is now disconnected.
      mutationObserver = null;
    }

    mutationObserver = new MutationObserver((mutations) => {
      let needsUpdate = false;

      mutations.forEach((mutation) => {
        // Check for added nodes
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          needsUpdate = true;
        }

        // Check for attribute changes (style changes)
        if (
          mutation.type === 'attributes' &&
          (mutation.attributeName === 'style' ||
            mutation.attributeName === 'class')
        ) {
          needsUpdate = true;
        }
      });

      if (needsUpdate) {
        // Debounce the update to avoid excessive calls
        applySelectiveFiltersTimeout = setTimeout(() => {
          applySelectiveFilters();
        }, 500);
      }
    });

    // Start observing
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });
  }

  // Store references globally for cleanup (using bracket notation to avoid TS errors)
  window['lightThemeExtension'] = {
    observer: mutationObserver,
    processedElements: processedElements,
  };
})();
