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
  chrome.action.setBadgeText({ text: '✔️', tabId: tabId });
  chrome.action.setBadgeBackgroundColor({ color: '#73C6B6', tabId: tabId }); // Optional: A greenish color
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
  chrome.action.setBadgeText({ text: '', tabId: tabId });
}

/**
 * Updates the action badge based on whether the URL is in the light theme list.
 * @param {string} url - The URL of the tab.
 * @param {number} tabId - The ID of the tab.
 */
async function updateBadgeForTab(url, tabId) {
  if (!url || !tabId) {
    chrome.action.setBadgeText({ text: '', tabId: tabId });
    return;
  }
  try {
    const urls = await getUrls();
    const shouldApplyLightTheme = urls.some((u) => url.startsWith(u));

    if (shouldApplyLightTheme) {
      chrome.action.setBadgeText({ text: '✔️', tabId: tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#73C6B6', tabId: tabId });
    } else {
      chrome.action.setBadgeText({ text: '', tabId: tabId });
    }
  } catch (error) {
    console.error('Error updating badge for tab:', error);
    chrome.action.setBadgeText({ text: '', tabId: tabId }); // Clear badge on error
  }
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Process when a URL has loaded or is loading, or title changes (good proxy for SPA nav)
  if (tab.url && (changeInfo.status === 'loading' || changeInfo.status === 'complete')) {
    await updateBadgeForTab(tab.url, tabId); // Update badge based on current state

    // Original logic for applying/removing theme
    try {
      const urls = await getUrls();
      const shouldApplyLightTheme = urls.some((url) => {
        return tab.url && tab.url.startsWith(url);
      });

      if (shouldApplyLightTheme) {
        applyLightTheme(tabId); // This will also set the badge
      } else {
        // If the URL is not in the list, ensure theme is removed (and badge cleared)
        // This handles cases where a page was in the list, then removed, and user reloads.
        // Or navigates from a themed page to a non-themed page on the same site (if origin isn't whitelisted).
        // Note: removeLightTheme also clears the badge.
        // We only call removeLightTheme if we are sure it should NOT be themed.
        // The updateBadgeForTab above will handle the badge for general navigation.
        // This specific call to removeLightTheme is more about active style removal.
        const currentTab = await chrome.tabs.get(tabId);
        if (currentTab.url) {
            const currentOrigin = new URL(currentTab.url).origin;
            const originIsListed = urls.some(url => url === currentOrigin);
            // If the specific URL isn't listed AND its origin isn't listed, then remove.
            if (!shouldApplyLightTheme && !originIsListed) {
                 removeLightTheme(tabId);
            } else if (!shouldApplyLightTheme && originIsListed) {
                // If origin is listed, but this specific sub-page is not,
                // we assume the origin-level rule applies, so we keep the theme.
                // The badge would have been set by applyLightTheme if origin was matched.
                // If only a sub-path was matched previously and now it's not,
                // updateBadgeForTab will clear it if no other rule matches.
                // If an origin rule IS present, applyLightTheme (via origin match) would set it.
            }
        }
      }
    } catch (error) {
      console.error('Error in onUpdated listener:', error);
    }
  }
});

// Listen for history state updates (e.g., SPA navigations)
chrome.webNavigation.onHistoryStateUpdated.addListener(async (details) => {
  if (details.frameId === 0 && details.url) { // frameId === 0 means top-level frame
    await updateBadgeForTab(details.url, details.tabId); // Update badge

    // Original logic for applying/removing theme
    try {
      const urls = await getUrls();
      const shouldApplyLightTheme = urls.some((url) => {
        return details.url && details.url.startsWith(url);
      });

      if (shouldApplyLightTheme) {
        applyLightTheme(details.tabId); // This also sets the badge
      } else {
        const currentTab = await chrome.tabs.get(details.tabId);
        if (currentTab.url) {
          const currentOrigin = new URL(currentTab.url).origin;
          const originIsListed = urls.some(url => url === currentOrigin);
          // Only remove if the new URL (even in SPA) is not in the list AND its origin is not.
          if (!originIsListed) {
            removeLightTheme(details.tabId); // This also clears the badge
          }
          // If origin is listed, theme/badge persists due to origin-level rule.
        }
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
        const shouldApplyLightTheme = urls.some((u) => tab.url.startsWith(u));
        if (shouldApplyLightTheme) {
          chrome.action.setBadgeText({ text: '✔️', tabId: tab.id });
          chrome.action.setBadgeBackgroundColor({ color: '#73C6B6', tabId: tab.id });
        } else {
          chrome.action.setBadgeText({ text: '', tabId: tab.id });
        }
      }
    }
  } catch (error) {
    console.error('Error initializing badges:', error);
  }
}

// Run initialization
initializeBadges();
