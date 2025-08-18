/**
 * Background service worker for the Light Theme extension
 */

// Import storage module for URL operations
import { getUrls, addUrl, deleteUrl } from './storage.js';

/**
 * Apply light theme to the current tab and set badge
 * @param {number} tabId - The ID of the tab to apply light theme to
 */
function applyLightTheme(tabId) {
  if (!tabId) return;
  chrome.scripting.executeScript({
    target: { tabId },
    files: ['content-add-style.js'],
  });
  // Swap the extension action icon to the light version for this tab
  chrome.action.setIcon({ path: 'icons/icon-light-48x48.png', tabId });
  // Clear any previous badge text, if present
  chrome.action.setBadgeText({ text: '', tabId });
}

/**
 * Remove light theme from the current tab and clear badge
 * @param {number} tabId - The ID of the tab to remove light theme from
 */
function removeLightTheme(tabId) {
  if (!tabId) return;
  chrome.scripting.executeScript({
    target: { tabId },
    files: ['content-remove-style.js'],
  });
  // Revert the extension action icon back to the default dark version
  chrome.action.setIcon({ path: 'icons/icon-dark-48x48.png', tabId });
  chrome.action.setBadgeText({ text: '', tabId });
}

/**
 * Updates the action badge based on whether the URL is in the light theme list.
 * @param {string} url - The URL of the tab.
 * @param {number} tabId - The ID of the tab.
 */
async function updateBadgeForTab(url, tabId) {
  if (!url || !tabId) {
    chrome.action.setIcon({ path: 'icons/icon-dark-48x48.png', tabId });
    chrome.action.setBadgeText({ text: '', tabId });
    return;
  }
  try {
    const urls = await getUrls();
    const shouldApplyLightTheme = urls.some((u) => url.startsWith(u));

    if (shouldApplyLightTheme) {
      chrome.action.setIcon({ path: 'icons/icon-light-48x48.png', tabId });
    } else {
      chrome.action.setIcon({ path: 'icons/icon-dark-48x48.png', tabId });
      chrome.action.setBadgeText({ text: '', tabId });
    }
  } catch (error) {
    console.error('Error updating icon for tab:', error);
    chrome.action.setIcon({ path: 'icons/icon-dark-48x48.png', tabId });
    chrome.action.setBadgeText({ text: '', tabId }); // Clear badge on error
  }
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Inject theme detection script on page load
  if (changeInfo.status === 'complete' && tab.url) {
    chrome.scripting
      .executeScript({
        target: { tabId: tabId },
        files: ['content-theme-detection.js'],
      })
      .catch((error) => console.error('Failed to inject theme script:', error));
  }
  // Process when a URL has loaded or is loading, or title changes (good proxy for SPA nav)
  if (
    tab.url &&
    (changeInfo.status === 'loading' || changeInfo.status === 'complete')
  ) {
    await updateBadgeForTab(tab.url, tabId); // Update badge based on current state

    // Revised logic for applying/removing theme
    try {
      const urls = await getUrls();
      const shouldApplyLightTheme = urls.some((url) => {
        return tab.url && tab.url.startsWith(url);
      });

      if (shouldApplyLightTheme) {
        applyLightTheme(tabId); // This will also set the badge
      } else {
        // If the tab's URL does not start with any stored URL, remove the theme.
        removeLightTheme(tabId); // This will also clear the badge
      }
    } catch (error) {
      console.error('Error in onUpdated listener:', error);
    }
  }
});

// Listen for history state updates (e.g., SPA navigations)
chrome.webNavigation.onHistoryStateUpdated.addListener(async (details) => {
  if (details.frameId === 0 && details.url) {
    // frameId === 0 means top-level frame
    await updateBadgeForTab(details.url, details.tabId); // Update badge

    // Revised logic for applying/removing theme
    try {
      const urls = await getUrls();
      const shouldApplyLightTheme = urls.some((url) => {
        return details.url && details.url.startsWith(url);
      });

      if (shouldApplyLightTheme) {
        applyLightTheme(details.tabId); // This also sets the badge
      } else {
        // If the new URL in SPA navigation does not start with any stored URL, remove the theme.
        removeLightTheme(details.tabId); // This also clears the badge
      }
    } catch (error) {
      console.error('Error in onHistoryStateUpdated listener:', error);
    }
  }
});

// Listen for extension action button clicks
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url) return; // Ensure tab.id is present

  try {
    const url = new URL(tab.url);
    const origin = url.origin;
    const urls = await getUrls();
    const originExists = urls.some((existingUrl) => existingUrl === origin);

    if (originExists) {
      await deleteUrl(origin);
      removeLightTheme(tab.id); // Clears badge
    } else {
      await addUrl(origin);
      applyLightTheme(tab.id); // Sets badge
    }
  } catch (error) {
    console.error('Error toggling URL:', error);
    // Attempt to set a neutral badge state for the current tab on error
    if (tab.id) {
      chrome.action.setBadgeText({ text: '', tabId: tab.id });
    }
  }
});

// Listen for when the active tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      await updateBadgeForTab(tab.url, activeInfo.tabId);
    } else {
      // If tab has no URL (e.g., new tab page before navigation), clear badge
      chrome.action.setBadgeText({ text: '', tabId: activeInfo.tabId });
    }
  } catch (error) {
    // Errors can happen if tab is closed quickly, etc.
    console.warn('Error in onActivated listener:', error);
    chrome.action.setBadgeText({ text: '', tabId: activeInfo.tabId }); // Clear badge on error
  }
});

// Initial badge setup for already open tabs when the extension starts
// (e.g., after installation or enabling)
async function initializeBadges() {
  try {
    const tabs = await chrome.tabs.query({});
    const urls = await getUrls();
    for (const tab of tabs) {
      if (tab.id && tab.url) {
        const shouldApplyLightTheme = urls.some((u) => tab.url?.startsWith(u));
        if (shouldApplyLightTheme) {
          chrome.action.setIcon({
            path: 'icons/icon-light-48x48.png',
            tabId: tab.id,
          });
        } else {
          chrome.action.setIcon({
            path: 'icons/icon-dark-48x48.png',
            tabId: tab.id,
          });
        }
        // Ensure no badge text is displayed
        chrome.action.setBadgeText({ text: '', tabId: tab.id });
      }
    }
  } catch (error) {
    console.error('Error initializing badges:', error);
  }
}

// Run initialization
initializeBadges();
