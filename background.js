/**
 * Background service worker for the Light Theme extension
 */

// Import storage module for URL operations
import { getUrls, addUrl, deleteUrl } from './storage.js';

/**
 * Apply light theme to the current tab
 * @param {number} [tabId] - The ID of the tab to apply light theme to
 */
function applyLightTheme(tabId) {
  if (!tabId) return;
  chrome.scripting.executeScript({
    target: { tabId },
    files: ['content-add-style.js'],
  });
}

/**
 * Remove light theme from the current tab
 * @param {number} [tabId] - The ID of the tab to remove light theme from
 */
function removeLightTheme(tabId) {
  if (!tabId) return;
  chrome.scripting.executeScript({
    target: { tabId },
    files: ['content-remove-style.js'],
  });
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Process when a URL has loaded or is loading
  if (tab.url && changeInfo.status === 'loading') {
    try {
      // Get list of URLs that should be converted to light theme
      const urls = await getUrls();

      // Check if current tab URL matches any stored URL patterns
      const shouldApplyLightTheme = urls.some((url) => {
        // Simple implementation: check if tab URL starts with the stored URL
        // This can be enhanced with regex pattern matching
        return tab.url && tab.url.startsWith(url);
      });

      if (shouldApplyLightTheme) {
        // Execute content script to apply light theme as early as possible
        applyLightTheme(tabId);
      }
    } catch (error) {
      console.error('Error in background script:', error);
    }
  }
});

// Listen for history state updates (e.g., SPA navigations)
chrome.webNavigation.onHistoryStateUpdated.addListener(async (details) => {
  // We are interested in client-side navigations that update the URL
  if (details.frameId === 0 && details.url) { // frameId === 0 means top-level frame
    try {
      const urls = await getUrls();
      const shouldApplyLightTheme = urls.some((url) => {
        return details.url && details.url.startsWith(url);
      });

      if (shouldApplyLightTheme) {
        applyLightTheme(details.tabId);
      } else {
        // If the new URL doesn't match, we might want to remove the theme.
        // This is important if the user was on a matched SPA route
        // and navigated to a non-matched SPA route on the same origin.
        // However, we need to be careful not to remove it if the origin itself is matched
        // and the user is navigating between sub-paths that are not individually listed.
        // For now, let's check if the origin of the new URL is in the list.
        // If the origin is NOT in the list, then it's safe to remove.
        const currentTab = await chrome.tabs.get(details.tabId);
        if (currentTab.url) {
          const currentOrigin = new URL(currentTab.url).origin;
          const originIsListed = urls.some(url => url === currentOrigin);
          if (!originIsListed) {
            removeLightTheme(details.tabId);
          }
          // If the origin IS listed, we keep the theme, assuming it was applied
          // because the origin matched.
        }
      }
    } catch (error) {
      console.error('Error in onHistoryStateUpdated listener:', error);
    }
  }
});

// Listen for extension action button clicks
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.url) return;

  try {
    // Get the origin of the current tab
    const url = new URL(tab.url);
    const origin = url.origin;

    // Get current list of URLs
    const urls = await getUrls();

    // Check if the origin is already in the list
    const originExists = urls.some((existingUrl) => existingUrl === origin);

    if (originExists) {
      // Remove the origin if it exists
      await deleteUrl(origin);
      removeLightTheme(tab.id);
    } else {
      // Add the origin if it doesn't exist
      await addUrl(origin);
      applyLightTheme(tab.id);
    }
  } catch (error) {
    console.error('Error toggling URL:', error);
  }
});
