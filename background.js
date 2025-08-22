/**
 * Background service worker for the Sunny Bear extension
 */

import {
  getUrls,
  addUrl,
  deleteUrl,
  getExcludeUrls,
  addExcludeUrl,
  deleteExcludeUrl,
} from './storage.js';

/**
 * Apply light theme to the current tab and set the action icon to light.
 * @param {number} tabId - The ID of the tab.
 */
function applyLightTheme(tabId) {
  if (!tabId) return;
  chrome.scripting.executeScript({
    target: { tabId },
    files: ['content-add-style.js'],
  });
  chrome.action.setIcon({ path: 'icons/icon-light-48x48.png', tabId });
}

/**
 * Remove light theme from the current tab and set the action icon to dark.
 * @param {number} tabId - The ID of the tab.
 */
function removeLightTheme(tabId) {
  if (!tabId) return;
  chrome.scripting.executeScript({
    target: { tabId },
    files: ['content-remove-style.js'],
  });
  chrome.action.setIcon({ path: 'icons/icon-dark-48x48.png', tabId });
}

/**
 * Evaluates whether to apply the light theme based on OS theme, URL list, and page theme.
 * @param {number} tabId - The ID of the tab to evaluate.
 * @param {string} url - The URL of the tab.
 */
async function evaluateAndApplyTheme(tabId, url) {
  if (!tabId || !url || !url.startsWith('http')) return;

  // wait a bit to make sure the page is loaded
  await new Promise((resolve) => setTimeout(resolve, 200));

  try {
    // Execute the content script to get both page and OS themes
    const injectionResults = await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content-theme-detection.js'],
    });

    if (
      !injectionResults ||
      !injectionResults[0] ||
      !injectionResults[0].result
    ) {
      throw new Error('Could not get theme info from content script.');
    }

    const { pageTheme, osTheme } = injectionResults[0].result;

    if (osTheme === 'dark') {
      // Per user instruction, if OS theme is dark, do nothing (remove theme).
      removeLightTheme(tabId);
      return;
    }

    // OS theme is 'light', so proceed with the checks.
    const excludeUrls = await getExcludeUrls();
    const urlIsInExcludeList = excludeUrls.some((u) => url.startsWith(u));

    if (urlIsInExcludeList) {
      return;
    }

    const urls = await getUrls();
    const urlIsInList = urls.some((u) => url.startsWith(u));

    if (urlIsInList || pageTheme === 'dark') {
      applyLightTheme(tabId);
    } else {
      removeLightTheme(tabId);
    }
  } catch (error) {
    // Ignore errors from attempting to inject scripts into restricted pages.
    if (
      error.message.includes('Cannot access a chrome:// URL') ||
      error.message.includes('Cannot access contents of the page') ||
      error.message.includes('The extensions gallery cannot be scripted')
    ) {
      // Known, expected errors on restricted pages.
    } else {
      console.error('Error evaluating and applying theme:', error);
      // Default to removing the theme on other errors.
      removeLightTheme(tabId);
    }
  }
}

// --- Event Listeners ---

// Re-evaluate theme when a tab is updated (e.g., page load)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === 'complete' &&
    tab.url &&
    tab.url.startsWith('http')
  ) {
    evaluateAndApplyTheme(tabId, tab.url);
  }
});

// Re-evaluate theme on SPA navigations
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  if (details.frameId === 0 && details.url && details.url.startsWith('http')) {
    evaluateAndApplyTheme(details.tabId, details.url);
  }
});

// Toggle theme when the action button is clicked
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url || !tab.url.startsWith('http')) return;

  try {
    const url = new URL(tab.url);
    const origin = url.origin;

    const urls = await getUrls();
    const excludeUrls = await getExcludeUrls();

    const mainListMatch = urls.find((u) => tab.url.startsWith(u));
    const excludeListMatch = excludeUrls.find((u) => tab.url.startsWith(u));

    // Rule 0: If a prefix of the current URL is in either list, remove it and toggle.
    if (mainListMatch) {
      await deleteUrl(mainListMatch);
      removeLightTheme(tab.id);
      return;
    }
    if (excludeListMatch) {
      await deleteExcludeUrl(excludeListMatch);
      applyLightTheme(tab.id); // Toggle on
      return;
    }

    // If we're here, no prefix of the URL is in any list. Proceed with theme detection.
    const injectionResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content-theme-detection.js'],
    });

    if (
      !injectionResults ||
      !injectionResults[0] ||
      !injectionResults[0].result
    ) {
      throw new Error('Could not get theme info from content script.');
    }

    const { pageTheme } = injectionResults[0].result;

    // Add the new origin and ensure exclusivity.
    if (pageTheme === 'dark') {
      await addExcludeUrl(origin);
      await deleteUrl(origin); // Ensure origin is not in the other list.
      removeLightTheme(tab.id);
    } else {
      await addUrl(origin);
      await deleteExcludeUrl(origin); // Ensure origin is not in the other list.
      applyLightTheme(tab.id);
    }
  } catch (error) {
    console.error('Error handling action click:', error);
  }
});

// Re-evaluate theme when the active tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (!tab.url || !tab.url.startsWith('http')) {
      return;
    }
    evaluateAndApplyTheme(activeInfo.tabId, tab.url);
  } catch (error) {
    // This can happen if the tab is closed before we can get it.
    if (!error.message.includes('No tab with id')) {
      console.warn('Error in onActivated listener:', error);
    }
  }
});

/**
 * Initializes the state of the action icons for all open tabs when the extension starts.
 */
async function initializeActionIcons() {
  try {
    const tabs = await chrome.tabs.query({
      url: ['http://*/*', 'https://*/*'],
    });
    for (const tab of tabs) {
      // The query ensures we only get tabs with http/https URLs.
      if (tab.id && tab.url) {
        evaluateAndApplyTheme(tab.id, tab.url);
      }
    }
  } catch (error) {
    console.error('Error initializing action icons:', error);
  }
}

// Run initialization
initializeActionIcons();
