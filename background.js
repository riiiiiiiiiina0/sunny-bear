/**
 * Background service worker for the Sunny Bear extension
 */

import { getUrls, addUrl, deleteUrl } from './storage.js';

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
  if (!tabId || !url) return;

  try {
    // Execute the content script to get both page and OS themes
    const injectionResults = await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content-theme-detection.js'],
    });

    if (!injectionResults || !injectionResults[0] || !injectionResults[0].result) {
      throw new Error('Could not get theme info from content script.');
    }

    const { pageTheme, osTheme } = injectionResults[0].result;

    if (osTheme === 'dark') {
      // Per user instruction, if OS theme is dark, do nothing (remove theme).
      removeLightTheme(tabId);
      return;
    }

    // OS theme is 'light', so proceed with the checks.
    const urls = await getUrls();
    const urlIsInList = urls.some((u) => url.startsWith(u));

    if (urlIsInList || pageTheme === 'dark') {
      applyLightTheme(tabId);
    } else {
      removeLightTheme(tabId);
    }
  } catch (error) {
    console.error('Error evaluating and applying theme:', error);
    // Default to removing the theme on error
    removeLightTheme(tabId);
  }
}

// --- Event Listeners ---

// Re-evaluate theme when a tab is updated (e.g., page load)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    evaluateAndApplyTheme(tabId, tab.url);
  }
});

// Re-evaluate theme on SPA navigations
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  if (details.frameId === 0 && details.url) {
    evaluateAndApplyTheme(details.tabId, details.url);
  }
});

// Toggle theme when the action button is clicked
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url) return;

  try {
    const url = new URL(tab.url);
    const origin = url.origin;
    const urls = await getUrls();
    const originExists = urls.some((existingUrl) => existingUrl === origin);

    if (originExists) {
      await deleteUrl(origin);
      // After toggling, re-evaluate the theme for the tab
      evaluateAndApplyTheme(tab.id, tab.url);
    } else {
      await addUrl(origin);
      // After adding to the list, the theme should be applied immediately
      applyLightTheme(tab.id);
    }
  } catch (error) {
    console.error('Error toggling URL:', error);
  }
});

// Re-evaluate theme when the active tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      evaluateAndApplyTheme(activeInfo.tabId, tab.url);
    } else {
      removeLightTheme(activeInfo.tabId);
    }
  } catch (error) {
    console.warn('Error in onActivated listener:', error);
  }
});

/**
 * Initializes the state of the action icons for all open tabs when the extension starts.
 */
async function initializeActionIcons() {
  try {
    const tabs = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] });
    for (const tab of tabs) {
      if (tab.id && tab.url) {
        // We need to evaluate each tab individually.
        // This is a simplified check; a full evaluation might be too heavy on startup.
        // Let's just set the default icon, and the active tab will be updated anyway.
        evaluateAndApplyTheme(tab.id, tab.url);
      }
    }
  } catch (error) {
    console.error('Error initializing action icons:', error);
  }
}

// Run initialization
initializeActionIcons();
