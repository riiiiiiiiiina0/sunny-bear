/**
 * Content script for Light Theme extension
 * This script converts dark themed websites to light theme
 */
(function () {
  // A flag to indicate that the script is running and to avoid re-injection.
  if (document.documentElement.getAttribute('data-sunny-bear-active') === 'true') {
    return;
  }
  document.documentElement.setAttribute('data-sunny-bear-active', 'true');

  const lightThemeFilter = 'invert(1) hue-rotate(180deg)';
  let mutationObserver = null;
  let applyFiltersTimeout = null;

  function applyFilterToElement(element) {
    // If the element is part of a subtree that we've decided to skip, do nothing.
    if (element.closest('[data-sunny-bear-ignore]')) {
      return;
    }

    const computedStyle = window.getComputedStyle(element);
    // If a filter is already applied (by CSS or inline style), we'll respect it and not apply our own.
    // We mark this element's subtree as 'ignored' to prevent our filters from being applied to its children.
    if (computedStyle.filter !== 'none') {
      element.setAttribute('data-sunny-bear-ignore', 'true');
      return;
    }

    // Exclude specific elements if they have a class of 'sunny-bear-excluded'
    if (element.classList.contains('sunny-bear-excluded')) {
      return;
    }

    // Apply our filter. We combine it with any existing inline filter.
    const originalFilter = element.style.filter || '';
    const newFilter = originalFilter ? `${originalFilter} ${lightThemeFilter}` : lightThemeFilter;
    element.style.filter = newFilter;

    // Mark the element as filtered by our extension.
    element.setAttribute('data-light-theme-filtered', 'true');
  }

  function applyFiltersToAll() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return;
    }

    // The elements we want to apply our filter to.
    const selectors = [
      'html',
      'img',
      'video',
      'canvas',
      'iframe',
    ];

    // Apply filters to the main elements.
    document.querySelectorAll(selectors.join(',')).forEach(applyFilterToElement);

    // Additionally, find any element with a background image and apply the filter.
    // We check all elements for this.
    document.querySelectorAll('*').forEach(element => {
      const computedStyle = window.getComputedStyle(element);
      if (computedStyle.backgroundImage && computedStyle.backgroundImage.startsWith('url(')) {
        applyFilterToElement(element);
      }
    });
  }

  function setupDOMObserver() {
    if (mutationObserver) {
      mutationObserver.disconnect();
    }

    mutationObserver = new MutationObserver(() => {
      clearTimeout(applyFiltersTimeout);
      applyFiltersTimeout = setTimeout(applyFiltersToAll, 500);
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    window.lightThemeExtension = { observer: mutationObserver };
  }

  // Initial application of filters and observer setup.
  applyFiltersToAll();
  setupDOMObserver();
})();