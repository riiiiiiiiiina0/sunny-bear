# Light Theme Chrome Extension

A Chrome extension that converts dark-themed websites into light themes for better readability in bright environments.

<a href="https://buymeacoffee.com/riiiiiiiiiina" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-blue.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## Features

- Automatically converts dark-themed websites to light theme
- Simple toggle via the extension icon - click to enable/disable for a website
- State is remembered per website
- Options page to manage your list of websites
- Import/Export functionality for website list
- Works on most websites with dark themes
- Uses CSS filter inversion to create light themes from dark ones

## Installation

### From Chrome Web Store

[Install Light Theme from Chrome Web Store](https://chromewebstore.google.com/detail/light-theme/jdjdmghffibmbnnhidfhdjegkcemmanb)

### Manual Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top-right corner
4. Click "Load unpacked" and select the folder containing the extension files
5. The extension should now be installed and active

## Usage

1. When you visit a website with a dark theme, click the extension icon in the toolbar
2. The website will automatically refresh with a light theme applied
3. Click the icon again to disable the light theme for that site
4. To manage your list of websites, right-click the extension icon and select "Options"

## How It Works

The extension:

1. Stores a list of website origins where light theme should be applied
2. When you visit a website, it checks if the origin is in your list
3. If found, it injects CSS to invert colors and rotate hue by 180 degrees
4. This effectively converts dark backgrounds to light, while preserving images and videos
5. The extension uses Chrome's storage API to remember your preferences
6. The Options page allows you to add, edit, delete, import, and export your list of websites

## File Structure

- `manifest.json`: Extension configuration file
- `background.js`: Background service worker that monitors tab activity and handles icon clicks
- `content-add-style.js`: Script that applies the light theme conversion
- `content-remove-style.js`: Script that removes the light theme conversion
- `storage.js`: Module for managing website data storage
- `options.html`: User interface for managing website list
- `options.js`: JavaScript for the options page functionality
- `icons/`: Directory containing extension icons

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## License

This project is open source and available under the [MIT License](LICENSE).
