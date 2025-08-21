import {
  getUrls,
  addUrl,
  deleteUrl,
  updateUrl,
  getExcludeUrls,
  addExcludeUrl,
  deleteExcludeUrl,
} from './storage.js';

document.addEventListener('DOMContentLoaded', function () {
  // Elements - Using non-null assertions with casting for TypeScript checking
  // @ts-ignore
  const urlValueInput = /** @type {HTMLInputElement} */ (
    document.getElementById('url-value')
  );
  // @ts-ignore
  const addBtn = /** @type {HTMLButtonElement} */ (
    document.getElementById('add-btn')
  );
  // @ts-ignore
  const urlList = /** @type {HTMLElement} */ (
    document.getElementById('url-list')
  );
  // @ts-ignore
  const excludeUrlValueInput = /** @type {HTMLInputElement} */ (
    document.getElementById('exclude-url-value')
  );
  // @ts-ignore
  const addExcludeBtn = /** @type {HTMLButtonElement} */ (
    document.getElementById('add-exclude-btn')
  );
  // @ts-ignore
  const excludeUrlList = /** @type {HTMLElement} */ (
    document.getElementById('exclude-url-list')
  );
  // @ts-ignore
  const editDialog = /** @type {HTMLDialogElement} */ (
    document.getElementById('edit-dialog')
  );
  // @ts-ignore
  const editIndexInput = /** @type {HTMLInputElement} */ (
    document.getElementById('edit-index')
  );
  // @ts-ignore
  const editUrlInput = /** @type {HTMLInputElement} */ (
    document.getElementById('edit-url')
  );
  // @ts-ignore
  const saveBtn = /** @type {HTMLButtonElement} */ (
    document.getElementById('save-btn')
  );
  // @ts-ignore
  const cancelBtn = /** @type {HTMLButtonElement} */ (
    document.getElementById('cancel-btn')
  );
  // @ts-ignore
  const exportBtn = /** @type {HTMLButtonElement} */ (
    document.getElementById('export-btn')
  );
  // @ts-ignore
  const importBtn = /** @type {HTMLButtonElement} */ (
    document.getElementById('import-btn')
  );
  // @ts-ignore
  const fileInput = /** @type {HTMLInputElement} */ (
    document.getElementById('file-input')
  );
  // @ts-ignore
  const storageQuotaDiv = /** @type {HTMLElement} */ (
    document.getElementById('storage-quota')
  );
  // @ts-ignore
  const refreshQuotaBtn = /** @type {HTMLButtonElement} */ (
    document.getElementById('refresh-quota')
  );

  // Store URLs locally to avoid multiple storage calls
  let urls = [];
  let excludeUrls = [];

  // Load stored URLs
  loadUrls();
  loadExcludeUrls();

  // Get and display storage quota information
  displayStorageQuota();

  async function loadUrls() {
    // Get URLs from storage
    urls = await getUrls();
    console.log(urls);
    renderUrls();
  }

  // Render URLs
  function renderUrls() {
    urlList.innerHTML = '';

    if (urls.length === 0) {
      urlList.innerHTML = `
        <tr>
          <td colspan="2" class="text-center text-base-content/70 py-8">
            <div class="flex flex-col items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span class="text-lg">No URLs stored yet</span>
              <span class="text-sm">Add your first URL above to get started</span>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    urls.forEach((url, index) => {
      const tr = document.createElement('tr');
      tr.className = 'hover transition-colors duration-200 group';
      tr.innerHTML = `
        <td class="font-mono text-sm">
          <a href="${url}" target="_blank" class="link link-primary hover:link-secondary break-all">
            ${url}
          </a>
        </td>
        <td class="text-center">
          <div class="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button class="btn btn-sm btn-outline btn-primary edit-btn" data-index="${index}">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            <button class="btn btn-sm btn-outline btn-error delete-btn" data-index="${index}">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </td>
      `;
      urlList.appendChild(tr);
    });

    // Attach event listeners to buttons
    document.querySelectorAll('.edit-btn').forEach((btn) => {
      btn.addEventListener('click', handleEdit);
    });

    document.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', handleDelete);
    });
  }

  // Add new URL
  async function handleAdd() {
    const url = urlValueInput.value.trim();

    if (!url) {
      alert('Please enter a valid URL');
      return;
    }

    const success = await addUrl(url);

    if (success) {
      // Reload URLs from storage
      await loadUrls();
      // Update storage quota display
      displayStorageQuota();

      // Clear input
      urlValueInput.value = '';
    } else {
      alert('URL already exists or is invalid');
    }
  }

  // Edit URL
  function handleEdit(e) {
    const index = e.target.dataset.index;
    const url = urls[index];

    // Fill edit form
    editIndexInput.value = index;
    editUrlInput.value = url;

    // Show edit form
    editDialog.showModal();
  }

  // Save edited URL
  async function handleSave() {
    const index = parseInt(editIndexInput.value);
    const oldUrl = urls[index];
    const newUrl = editUrlInput.value.trim();

    if (!newUrl) {
      alert('Please enter a valid URL');
      return;
    }

    const success = await updateUrl(oldUrl, newUrl);

    if (success) {
      // Reload URLs from storage
      await loadUrls();
      // Update storage quota display
      displayStorageQuota();

      // Hide edit form
      editDialog.close();
    } else {
      alert('URL already exists or is invalid');
    }
  }

  // Cancel editing
  function handleCancel() {
    editDialog.close();
  }

  // Delete URL
  async function handleDelete(e) {
    if (confirm('Are you sure you want to delete this URL?')) {
      const index = e.target.dataset.index;
      const url = urls[index];

      const success = await deleteUrl(url);

      if (success) {
        // Reload URLs from storage
        await loadUrls();
        // Update storage quota display
        displayStorageQuota();
      }
    }
  }

  // Export URLs
  function handleExport() {
    if (urls.length === 0) {
      alert('No URLs to export');
      return;
    }

    // Create a JSON file to download
    const dataStr = JSON.stringify({ urls });
    const dataUri =
      'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    // Create a temporary link element and trigger the download
    const exportLink = document.createElement('a');
    exportLink.setAttribute('href', dataUri);
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    exportLink.setAttribute('download', `light-theme-urls-${dateStr}.json`);
    document.body.appendChild(exportLink);
    exportLink.click();
    document.body.removeChild(exportLink);
  }

  // Import URLs - Trigger file selection
  function handleImportClick() {
    fileInput.click();
  }

  // Import URLs - Process the selected file
  async function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();

      reader.onload = async function (e) {
        try {
          if (typeof e.target?.result !== 'string') {
            throw new Error('Invalid format: Expected a string');
          }

          const { urls: importedUrls } = JSON.parse(e.target.result);

          if (!Array.isArray(importedUrls)) {
            throw new Error('Invalid format: Expected an array of URLs');
          }

          // Confirm with user
          const confirmImport = confirm(
            `Import ${importedUrls.length} URLs? This will add to your existing URLs.`,
          );
          if (!confirmImport) return;

          // Add each imported URL
          let addedCount = 0;
          for (const url of importedUrls) {
            if (typeof url === 'string') {
              const success = await addUrl(url);
              if (success) addedCount++;
            }
          }

          alert(
            `Successfully imported ${addedCount} URLs out of ${importedUrls.length}`,
          );
          await loadUrls(); // Reload the URLs to update the UI
          displayStorageQuota(); // Update storage quota display
        } catch (error) {
          alert('Error importing URLs: ' + error.message);
        }
      };

      reader.readAsText(file);

      // Clear the file input so the same file can be selected again
      fileInput.value = '';
    } catch (error) {
      alert('Error reading file: ' + error.message);
    }
  }

  async function loadExcludeUrls() {
    // Get URLs from storage
    excludeUrls = await getExcludeUrls();
    console.log(excludeUrls);
    renderExcludeUrls();
  }

  // Render Exclude URLs
  function renderExcludeUrls() {
    excludeUrlList.innerHTML = '';

    if (excludeUrls.length === 0) {
      excludeUrlList.innerHTML = `
        <tr>
          <td colspan="2" class="text-center text-base-content/70 py-8">
            <div class="flex flex-col items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="text-lg">No URLs excluded yet</span>
              <span class="text-sm">Add a URL to the exclude list above</span>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    excludeUrls.forEach((url, index) => {
      const tr = document.createElement('tr');
      tr.className = 'hover transition-colors duration-200 group';
      tr.innerHTML = `
        <td class="font-mono text-sm">
          <a href="${url}" target="_blank" class="link link-primary hover:link-secondary break-all">
            ${url}
          </a>
        </td>
        <td class="text-center">
          <div class="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button class="btn btn-sm btn-outline btn-error delete-exclude-btn" data-index="${index}">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </td>
      `;
      excludeUrlList.appendChild(tr);
    });

    // Attach event listeners to buttons
    document.querySelectorAll('.delete-exclude-btn').forEach((btn) => {
      btn.addEventListener('click', handleDeleteExclude);
    });
  }

  // Add new Exclude URL
  async function handleAddExclude() {
    const url = excludeUrlValueInput.value.trim();

    if (!url) {
      alert('Please enter a valid URL');
      return;
    }

    const success = await addExcludeUrl(url);

    if (success) {
      // Reload URLs from storage
      await loadExcludeUrls();
      // Update storage quota display
      displayStorageQuota();

      // Clear input
      excludeUrlValueInput.value = '';
    } else {
      alert('URL already exists or is invalid');
    }
  }

  // Delete Exclude URL
  async function handleDeleteExclude(e) {
    if (confirm('Are you sure you want to delete this excluded URL?')) {
      const index = e.target.dataset.index;
      const url = excludeUrls[index];

      const success = await deleteExcludeUrl(url);

      if (success) {
        // Reload URLs from storage
        await loadExcludeUrls();
        // Update storage quota display
        displayStorageQuota();
      }
    }
  }

  // Event listeners
  addBtn.addEventListener('click', handleAdd);

  urlValueInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  });

  saveBtn.addEventListener('click', handleSave);
  cancelBtn.addEventListener('click', handleCancel);
  exportBtn.addEventListener('click', handleExport);
  importBtn.addEventListener('click', handleImportClick);
  fileInput.addEventListener('change', handleFileSelect);
  refreshQuotaBtn.addEventListener('click', displayStorageQuota);
  addExcludeBtn.addEventListener('click', handleAddExclude);

  excludeUrlValueInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleAddExclude();
    }
  });

  /**
   * Get and display Chrome storage quota information
   */
  function displayStorageQuota() {
    // Show loading message
    storageQuotaDiv.innerHTML = 'Loading storage information...';

    // Check if chrome.storage.sync.getBytesInUse exists
    if (chrome.storage.sync.getBytesInUse) {
      chrome.storage.sync.getBytesInUse(null, (bytesInUse) => {
        chrome.storage.sync.get(null, (items) => {
          let itemsCount = Object.keys(items).length;

          // Get sync storage limits
          // Chrome sync storage limits: https://developer.chrome.com/docs/extensions/reference/storage#property-sync
          const QUOTA_BYTES = 102400; // 100 KB
          const QUOTA_BYTES_PER_ITEM = 8192; // 8 KB
          const QUOTA_MAX_ITEMS = 512; // 512 items

          const usedPercentage = ((bytesInUse / QUOTA_BYTES) * 100).toFixed(2);
          const itemsPercentage = (
            (itemsCount / QUOTA_MAX_ITEMS) *
            100
          ).toFixed(2);

          storageQuotaDiv.innerHTML = `
            <div><strong>Bytes in use:</strong> ${bytesInUse.toLocaleString()} / ${QUOTA_BYTES.toLocaleString()} bytes (${usedPercentage}%)</div>
            <div><strong>Items stored:</strong> ${itemsCount} / ${QUOTA_MAX_ITEMS} (${itemsPercentage}%)</div>
            <div><strong>Max bytes per item:</strong> ${QUOTA_BYTES_PER_ITEM.toLocaleString()} bytes</div>
            <div><small>Last updated: ${new Date().toLocaleString()}</small></div>
          `;
        });
      });
    } else {
      storageQuotaDiv.innerHTML = 'Storage quota information is not available.';
    }
  }
});
