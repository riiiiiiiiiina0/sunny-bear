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
  // Only process if URL has loaded completely
  if (changeInfo.status === 'complete' && tab.url) {
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
        // Execute content script to apply light theme
        applyLightTheme(tabId);
      }
    } catch (error) {
      console.error('Error in background script:', error);
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
