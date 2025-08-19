/**
 * Storage module for the Light Theme extension
 * Provides methods to work with URLs stored in Chrome's sync storage
 */

// Key used to store URLs in chrome.storage.sync
const STORAGE_KEY = 'light_theme_urls';
const EXCLUDE_STORAGE_KEY = 'light_theme_exclude_urls';

/**
 * Sort URLs alphabetically (case-insensitive)
 * @param {Array<string>} urls - Array of URLs to sort
 * @returns {Array<string>} Sorted array of URLs
 */
function sortUrls(urls) {
  return urls.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
}

/**
 * Check if a URL is valid
 * @param {string} url - URL to check
 * @returns {boolean} True if URL is valid, false otherwise
 */
function isValidUrl(url) {
  return Boolean(
    url &&
      typeof url === 'string' &&
      (url.startsWith('http') || url.startsWith('https')),
  );
}

/**
 * Get all stored URLs
 * @returns {Promise<Array<string>>} Array of stored URLs
 */
function getUrls() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(STORAGE_KEY, (result) => {
      const urls = result[STORAGE_KEY] || [];
      // filter out invalid URLs
      const validUrls = urls.filter(isValidUrl);
      // Ensure URLs are always returned in alphabetical order
      resolve(sortUrls(validUrls));
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
    if (!isValidUrl(url)) {
      console.error(`Invalid URL provided: ${url}`);
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
      // Sort URLs alphabetically before saving
      sortUrls(urls);
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
    if (!isValidUrl(newUrl)) {
      console.error(`Invalid new URL provided: ${newUrl}`);
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
      // Sort URLs alphabetically before saving
      sortUrls(urls);
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

/**
 * Get all stored exclude URLs
 * @returns {Promise<Array<string>>} Array of stored URLs
 */
function getExcludeUrls() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(EXCLUDE_STORAGE_KEY, (result) => {
      const urls = result[EXCLUDE_STORAGE_KEY] || [];
      // filter out invalid URLs
      const validUrls = urls.filter(isValidUrl);
      // Ensure URLs are always returned in alphabetical order
      resolve(sortUrls(validUrls));
    });
  });
}

/**
 * Add a new URL to exclude list
 * @param {string} url - URL to add
 * @returns {Promise<boolean>} Success status
 */
function addExcludeUrl(url) {
  return new Promise((resolve) => {
    if (!isValidUrl(url)) {
      console.error(`Invalid URL provided: ${url}`);
      resolve(false);
      return;
    }

    getExcludeUrls().then((urls) => {
      // Check if URL already exists to avoid duplicates
      if (urls.includes(url)) {
        resolve(false);
        return;
      }

      urls.push(url);
      // Sort URLs alphabetically before saving
      sortUrls(urls);
      chrome.storage.sync.set({ [EXCLUDE_STORAGE_KEY]: urls }, () => {
        resolve(true);
      });
    });
  });
}

/**
 * Delete a URL from exclude list
 * @param {string} url - URL to delete
 * @returns {Promise<boolean>} Success status
 */
function deleteExcludeUrl(url) {
  return new Promise((resolve) => {
    getExcludeUrls().then((urls) => {
      const index = urls.indexOf(url);

      if (index === -1) {
        resolve(false);
        return;
      }

      urls.splice(index, 1);
      chrome.storage.sync.set({ [EXCLUDE_STORAGE_KEY]: urls }, () => {
        resolve(true);
      });
    });
  });
}

export {
  getUrls,
  addUrl,
  deleteUrl,
  updateUrl,
  clearUrls,
  getExcludeUrls,
  addExcludeUrl,
  deleteExcludeUrl,
};
