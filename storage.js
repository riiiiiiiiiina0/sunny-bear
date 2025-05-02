/**
 * Storage module for the Light Theme extension
 * Provides methods to work with URLs stored in Chrome's sync storage
 */

// Key used to store URLs in chrome.storage.sync
const STORAGE_KEY = 'light_theme_urls';

/**
 * Get all stored URLs
 * @returns {Promise<Array<string>>} Array of stored URLs
 */
function getUrls() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(STORAGE_KEY, (result) => {
      resolve(result[STORAGE_KEY] || []);
    });
  });
}

/**
 * Add a new URL to storage
 * @param {string} url - URL to add
 * @returns {Promise<boolean>} Success status
 */
function addUrl(url) {
  return new Promise((resolve) => {
    if (!url || typeof url !== 'string') {
      console.error('Invalid URL provided');
      resolve(false);
      return;
    }

    getUrls().then((urls) => {
      // Check if URL already exists to avoid duplicates
      if (urls.includes(url)) {
        resolve(false);
        return;
      }

      urls.push(url);
      chrome.storage.sync.set({ [STORAGE_KEY]: urls }, () => {
        resolve(true);
      });
    });
  });
}

/**
 * Delete a URL from storage
 * @param {string} url - URL to delete
 * @returns {Promise<boolean>} Success status
 */
function deleteUrl(url) {
  return new Promise((resolve) => {
    getUrls().then((urls) => {
      const index = urls.indexOf(url);

      if (index === -1) {
        resolve(false);
        return;
      }

      urls.splice(index, 1);
      chrome.storage.sync.set({ [STORAGE_KEY]: urls }, () => {
        resolve(true);
      });
    });
  });
}

/**
 * Update a URL in storage
 * @param {string} oldUrl - URL to update
 * @param {string} newUrl - New URL value
 * @returns {Promise<boolean>} Success status
 */
function updateUrl(oldUrl, newUrl) {
  return new Promise((resolve) => {
    if (!newUrl || typeof newUrl !== 'string') {
      console.error('Invalid new URL provided');
      resolve(false);
      return;
    }

    getUrls().then((urls) => {
      const index = urls.indexOf(oldUrl);

      if (index === -1) {
        resolve(false);
        return;
      }

      // Check if new URL already exists
      if (urls.includes(newUrl) && oldUrl !== newUrl) {
        resolve(false);
        return;
      }

      urls[index] = newUrl;
      chrome.storage.sync.set({ [STORAGE_KEY]: urls }, () => {
        resolve(true);
      });
    });
  });
}

/**
 * Clear all stored URLs
 * @returns {Promise<boolean>} Success status
 */
function clearUrls() {
  return new Promise((resolve) => {
    chrome.storage.sync.remove(STORAGE_KEY, () => {
      resolve(true);
    });
  });
}

export { getUrls, addUrl, deleteUrl, updateUrl, clearUrls };
