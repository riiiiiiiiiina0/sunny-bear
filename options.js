import { getUrls, addUrl, deleteUrl, updateUrl } from './storage.js';

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
  const editContainer = /** @type {HTMLElement} */ (
    document.getElementById('edit-container')
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

  // Load stored URLs
  loadUrls();

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
      urlList.innerHTML = '<tr><td colspan="2">No URLs stored yet</td></tr>';
      return;
    }

    urls.forEach((url, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><a href="${url}" target="_blank">${url}</a></td>
        <td class="actions">
          <button class="edit-btn" data-index="${index}">Edit</button>
          <button class="delete-btn" data-index="${index}">Delete</button>
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
    editContainer.classList.remove('hidden');
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
      editContainer.classList.add('hidden');
    } else {
      alert('URL already exists or is invalid');
    }
  }

  // Cancel editing
  function handleCancel() {
    editContainer.classList.add('hidden');
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

  // Event listeners
  addBtn.addEventListener('click', handleAdd);
  saveBtn.addEventListener('click', handleSave);
  cancelBtn.addEventListener('click', handleCancel);
  exportBtn.addEventListener('click', handleExport);
  importBtn.addEventListener('click', handleImportClick);
  fileInput.addEventListener('change', handleFileSelect);
  refreshQuotaBtn.addEventListener('click', displayStorageQuota);

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
