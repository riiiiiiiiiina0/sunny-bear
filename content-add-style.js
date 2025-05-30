/**
 * Content script for Light Theme extension
 * This script converts dark themed websites to light theme
 */

(function () {
  if (document.getElementById('light-theme-extension-styles')) {
    return;
  }

  console.log('Light Theme content script running');

  // Global variables for cleanup
  let mutationObserver = null;
  let processedElements = new Set();
  let applyBackgroundImageFiltersTimeout = 0;

  // Apply light theme conversion
  applyLightTheme();

  /**
   * Main function to apply light theme to the current page
   */
  function applyLightTheme() {
    injectLightThemeCSS();
    applyBackgroundImageFilters();
    setupDOMObserver();
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

  /**
   * Find all elements with background-image style and apply CSS filter
   */
  function applyBackgroundImageFilters() {
    // Find elements with inline background-image styles
    const elementsWithBgImage = document.querySelectorAll('*');

    elementsWithBgImage.forEach((element) => {
      if (processedElements.has(element)) return;

      // ignore anchor tags
      if (element.tagName === 'A') return;

      const computedStyle = window.getComputedStyle(element);
      const backgroundImage = computedStyle.backgroundImage;

      // Check if element has background-image (excluding 'none')
      if (backgroundImage && backgroundImage.startsWith('url(')) {
        // Check if element is HTMLElement and has style property
        if (element instanceof HTMLElement) {
          // Apply filter to the element
          const originalFilter = element.style.filter || '';
          const lightThemeFilter = 'invert(1) hue-rotate(180deg)';

          // Combine existing filter with our light theme filter
          const newFilter = originalFilter
            ? `${originalFilter} ${lightThemeFilter}`
            : lightThemeFilter;

          element.style.filter = newFilter;
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
    clearTimeout(applyBackgroundImageFiltersTimeout);
    if (mutationObserver) return; // Observer already exists

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
        applyBackgroundImageFiltersTimeout = setTimeout(() => {
          applyBackgroundImageFilters();
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
