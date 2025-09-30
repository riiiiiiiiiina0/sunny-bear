/**
 * Content script for Light Theme extension
 * This script converts dark themed websites to light theme
 */
(function () {
  if (document.documentElement.getAttribute('data-sunny-bear-active') === 'true') {
    return;
  }
  document.documentElement.setAttribute('data-sunny-bear-active', 'true');

  const lightThemeFilter = 'invert(1) hue-rotate(180deg)';
  let mutationObserver = null;
  let applyFiltersTimeout = null;

  function applyFilters() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return;
    }

    // Apply the main filter to the html element to invert the entire page.
    const htmlElement = document.documentElement;
    if (!htmlElement.style.filter.includes(lightThemeFilter)) {
      const originalFilter = htmlElement.style.filter || '';
      htmlElement.style.filter = originalFilter ? `${originalFilter} ${lightThemeFilter}` : lightThemeFilter;
      htmlElement.setAttribute('data-light-theme-filtered', 'true');
    }

    // Now, iterate through elements that need to be "un-inverted" to appear correctly.
    document.querySelectorAll('*').forEach(element => {
      // No need to process the html element itself.
      if (element === htmlElement) {
        return;
      }

      const computedStyle = window.getComputedStyle(element);

      // Condition 1: It's an image, video, or similar element that should always be visible.
      const isMediaElement = ['IMG', 'VIDEO', 'CANVAS', 'IFRAME'].includes(element.tagName);
      const hasBackgroundImage = computedStyle.backgroundImage && computedStyle.backgroundImage.startsWith('url(');

      // Condition 2: It's a non-media element that has its own filter we need to preserve.
      const hasExistingFilter = computedStyle.filter !== 'none';

      // If either condition is met, apply the corrective filter.
      if (isMediaElement || hasBackgroundImage || hasExistingFilter) {
        const originalElementFilter = element.style.filter || '';
        // Only add the filter if it's not already there.
        if (!originalElementFilter.includes(lightThemeFilter)) {
          const newFilter = originalElementFilter
            ? `${originalElementFilter} ${lightThemeFilter}`
            : lightThemeFilter;
          element.style.filter = newFilter;
          element.setAttribute('data-light-theme-filtered', 'true');
        }
      }
    });
  }

  function setupDOMObserver() {
    if (mutationObserver) {
      mutationObserver.disconnect();
    }

    mutationObserver = new MutationObserver(() => {
      clearTimeout(applyFiltersTimeout);
      applyFiltersTimeout = setTimeout(applyFilters, 500);
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    window.lightThemeExtension = { observer: mutationObserver };
  }

  applyFilters();
  setupDOMObserver();
})();