<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Chrome Extension for Light/Dark Theme Detection

Creating a Chrome extension to reliably determine whether a webpage uses light or dark theme involves analyzing the page's dominant colors and calculating their brightness values. Here's a comprehensive approach to implement this functionality:

## Core Algorithm Approach

The most reliable method combines multiple techniques to analyze a webpage's color scheme:

### **1. Analyze Background Colors**

Use `getComputedStyle()` to examine the actual background colors of key elements:[^1][^2][^3]

```javascript
function getElementBackgroundColor(element) {
  const style = window.getComputedStyle(element);
  let bgColor = style.backgroundColor;
  
  // Handle transparent backgrounds by traversing up the DOM
  let currentElement = element;
  while (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
    currentElement = currentElement.parentElement;
    if (!currentElement) {
      return 'rgb(255, 255, 255)'; // Default to white
    }
    bgColor = window.getComputedStyle(currentElement).backgroundColor;
  }
  
  return bgColor;
}
```


### **2. Calculate Color Luminance**

Implement the **W3C relative luminance formula** to determine brightness:[^4][^5][^6]

```javascript
function calculateLuminance(r, g, b) {
  // Convert to 0-1 range
  const rgb = [r, g, b].map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  // W3C luminance formula
  return 0.2126 * rgb + 0.7152 * rgb[^1] + 0.0722 * rgb[^2];
}

function parseRgbColor(rgbString) {
  const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  return match ? [parseInt(match[^1]), parseInt(match[^2]), parseInt(match[^3])] : [255, 255, 255];
}

function isLightColor(rgbString) {
  const [r, g, b] = parseRgbColor(rgbString);
  const luminance = calculateLuminance(r, g, b);
  return luminance > 0.5; // Threshold for light vs dark
}
```


### **3. Analyze Multiple Elements**

Sample various important elements to get a comprehensive view of the page's color scheme:[^3][^1]

```javascript
function analyzePageTheme() {
  const elementsToCheck = [
    document.body,
    document.documentElement,
    document.querySelector('main'),
    document.querySelector('header'),
    document.querySelector('nav'),
    ...document.querySelectorAll('div, section, article')
  ].filter(Boolean).slice(0, 20); // Limit to avoid performance issues
  
  let lightCount = 0;
  let darkCount = 0;
  let totalArea = 0;
  
  elementsToCheck.forEach(element => {
    const bgColor = getElementBackgroundColor(element);
    const rect = element.getBoundingClientRect();
    const area = rect.width * rect.height;
    
    if (area > 100) { // Only consider visible elements
      totalArea += area;
      
      if (isLightColor(bgColor)) {
        lightCount += area;
      } else {
        darkCount += area;
      }
    }
  });
  
  // Return theme based on weighted area
  return lightCount > darkCount ? 'light' : 'dark';
}
```


## Chrome Extension Implementation

### **Manifest.json**

```json
{
  "manifest_version": 3,
  "name": "Theme Detector",
  "version": "1.0",
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"],
    "run_at": "document_idle"
  }],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_popup": "popup.html"
  },
  "permissions": ["activeTab"]
}
```


### **Content Script (content.js)**

```javascript
// Theme detection functions (from above)
function calculateLuminance(r, g, b) { /* ... */ }
function parseRgbColor(rgbString) { /* ... */ }
function isLightColor(rgbString) { /* ... */ }
function getElementBackgroundColor(element) { /* ... */ }
function analyzePageTheme() { /* ... */ }

// Advanced analysis with DOM sampling
function detectThemeAdvanced() {
  // Check CSS custom properties that might indicate theme
  const rootStyles = getComputedStyle(document.documentElement);
  const colorScheme = rootStyles.colorScheme;
  
  if (colorScheme && colorScheme.includes('dark')) {
    return 'dark';
  }
  if (colorScheme && colorScheme.includes('light')) {
    return 'light';
  }
  
  // Fallback to color analysis
  return analyzePageTheme();
}

// Enhanced detection with viewport sampling
function sampleViewportColors() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const sampleSize = 50;
  
  canvas.width = sampleSize;
  canvas.height = sampleSize;
  
  // Take a screenshot would require additional permissions
  // Alternative: sample computed styles of grid points
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  let lightPixels = 0;
  let totalPixels = 0;
  
  for (let x = 0; x < sampleSize; x++) {
    for (let y = 0; y < sampleSize; y++) {
      const screenX = (x / sampleSize) * viewportWidth;
      const screenY = (y / sampleSize) * viewportHeight;
      const element = document.elementFromPoint(screenX, screenY);
      
      if (element) {
        const bgColor = getElementBackgroundColor(element);
        if (isLightColor(bgColor)) {
          lightPixels++;
        }
        totalPixels++;
      }
    }
  }
  
  return lightPixels / totalPixels > 0.5 ? 'light' : 'dark';
}

// Main detection function
function detectPageTheme() {
  const basicTheme = detectThemeAdvanced();
  const sampledTheme = sampleViewportColors();
  
  // Combine results for higher accuracy
  if (basicTheme === sampledTheme) {
    return basicTheme;
  }
  
  // If conflicting, prefer sampled result as it's more comprehensive
  return sampledTheme;
}

// Send result to background script
const theme = detectPageTheme();
chrome.runtime.sendMessage({
  type: 'THEME_DETECTED',
  theme: theme,
  url: window.location.href
});
```


### **Background Script (background.js)**

```javascript
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'THEME_DETECTED') {
    // Store the result
    chrome.storage.local.set({
      [`theme_${sender.tab.id}`]: {
        theme: message.theme,
        url: message.url,
        timestamp: Date.now()
      }
    });
    
    // Update extension icon based on detected theme
    chrome.action.setIcon({
      tabId: sender.tab.id,
      path: message.theme === 'dark' ? 'icon_dark.png' : 'icon_light.png'
    });
  }
});
```


## Enhanced Accuracy Techniques

### **Handle Edge Cases**

1. **Transparent Backgrounds**: Traverse up the DOM tree to find the actual background color[^7][^8]
2. **CSS Variables**: Check for theme-related CSS custom properties[^9]
3. **System Color Scheme**: Detect if the page respects `prefers-color-scheme`[^10][^11]

### **Performance Optimization**

- Limit element sampling to avoid performance issues[^1]
- Use `requestIdleCallback` for non-blocking analysis
- Cache results per domain to reduce repeated calculations


### **Reliability Improvements**

- **Multiple sampling methods**: Combine DOM analysis with viewport sampling[^12]
- **Weighted scoring**: Give more importance to larger, more visible elements
- **Threshold adjustment**: Fine-tune the luminance threshold (0.5) based on testing
- **Error handling**: Gracefully handle pages with unusual styling or blocked access

This approach provides a robust foundation for detecting light/dark themes by analyzing actual rendered colors rather than just CSS properties, making it reliable across various website implementations and styling approaches.[^13][^14][^15]

<div style="text-align: center">⁂</div>

[^1]: https://www.quanzhanketang.com/jsref/jsref_getcomputedstyle.html

[^2]: https://www.w3schools.com/jsref/jsref_getcomputedstyle.asp

[^3]: https://www.javascripttutorial.net/javascript-dom/javascript-getcomputedstyle/

[^4]: https://www.101computing.net/colour-luminance-and-contrast-ratio/

[^5]: https://stackoverflow.com/questions/596216/formula-to-determine-perceived-brightness-of-rgb-color

[^6]: https://dev.to/apisurfer/relative-color-luminance-1ef0

[^7]: https://www.sitelint.com/blog/how-to-get-the-actual-real-background-color-of-an-html-element

[^8]: https://stackoverflow.com/questions/22876295/getcomputedstyle-gives-transparent-instead-of-actual-background-color

[^9]: https://pepelsbey.dev/articles/native-light-dark/

[^10]: https://www.hanselman.com/blog/how-to-detect-if-the-users-os-prefers-dark-mode-and-change-your-site-with-css-and-js

[^11]: https://web.dev/articles/light-dark

[^12]: https://stackoverflow.com/questions/2541481/get-average-color-of-image-via-javascript

[^13]: https://chromewebstore.google.com/detail/dark-night-mode/bhbekkddpbpbibiknkcjamlkhoghieie

[^14]: https://dev.to/arbaoui_mehdi/extract-colors-from-a-website-url-and-generate-a-csssass-code-palette-2jid

[^15]: https://folge.me/tools/website-color-extractor

[^16]: https://stackoverflow.com/questions/54210265/extract-color-palette-of-a-webpage

[^17]: https://www.ijraset.com/research-paper/finding-the-most-dominant-color-in-an-image

[^18]: https://stackoverflow.com/questions/77806570/how-to-get-os-dark-light-setting-in-chrome-extension-mv3-background-js

[^19]: https://www.nature.com/articles/s41598-023-48689-y

[^20]: https://chromewebstore.google.com/detail/dark-mode/declgfomkjdohhjbcfemjklfebflhefl?hl=en

[^21]: https://stackoverflow.com/questions/14658236/dominant-color-of-an-image

[^22]: https://vinova.sg/javascript-color-viewer-applications-development-guide-in-2025/

[^23]: https://www.sciencedirect.com/science/article/pii/S2214914720304608

[^24]: https://darkreader.org

[^25]: https://dev.to/producthackers/creating-a-color-palette-with-javascript-44ip

[^26]: https://github.com/lovell/sharp/issues/640

[^27]: https://www.reddit.com/r/gnome/comments/vmdbzt/how_to_make_websites_detectuse_dark_mode_if_its/

[^28]: https://www.clarifai.com/blog/create-color-schemes-from-any-image-with-clarifai

[^29]: https://developer.chrome.com/docs/devtools/rendering/apply-effects

[^30]: https://www.reddit.com/r/webdev/comments/t5uyth/how_do_you_pick_color_schemes_for_your_website/

[^31]: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/yhccnuI4ScM

[^32]: https://garagefarm.net/blog/color-histograms-demystified-from-theory-to-practical-image-analysis

[^33]: https://github.com/leeoniya/RgbQuant.js/

[^34]: https://www.sitepoint.com/javascript-generate-lighter-darker-color/

[^35]: https://www.geeksforgeeks.org/javascript/javascript-window-getcomputedstyle-method/

[^36]: https://developers.arcgis.com/javascript/latest/sample-code/visualization-histogram-color/

[^37]: https://css-tricks.com/using-javascript-to-adjust-saturation-and-brightness-of-rgb-colors/

[^38]: https://developer.mozilla.org/en-US/docs/Web/API/Window/getComputedStyle

[^39]: https://www.youtube.com/watch?v=z9TAFozkdG8

[^40]: https://forum.image.sc/t/color-histogram-data-extraction/20878

[^41]: https://gist.github.com/jfsiii/5641126

[^42]: https://forum.knime.com/t/color-histogram-javascript-color/28877

[^43]: https://www.reddit.com/r/shopify/comments/ndh22q/i_made_a_chrome_extension_to_detect_any_shopify/

[^44]: https://cssence.com/2024/six-levels-of-dark-mode/

[^45]: https://learn.microsoft.com/en-us/azure/ai-services/computer-vision/concept-detecting-color-schemes

[^46]: https://developer.chrome.com/blog/auto-dark-theme

[^47]: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark

[^48]: https://github.com/akamhy/imagedominantcolor

[^49]: https://stackoverflow.com/questions/41961037/is-there-a-way-to-detect-if-chromes-devtools-are-using-dark-mode

[^50]: https://stackoverflow.com/questions/7772510/main-color-detection-in-python

[^51]: https://dev.to/bryce/detecting-dark-mode-on-every-request-21b2

[^52]: https://www.cdgi.com/2024/04/web-design-dark-vs-light-mode/

[^53]: https://onlinejpgtools.com/find-dominant-jpg-colors

[^54]: https://chromewebstore.google.com/detail/whatruns/cmkdbmfndkfgebldhnkbfhlneefdaaip?hl=en

[^55]: https://www.reddit.com/r/webdev/comments/c3k0ef/which_is_more_overall_better_a_light_website_or_a/

[^56]: https://cloud.google.com/vision/docs/detecting-properties

[^57]: https://chromewebstore.google.com/detail/wappalyzer-technology-pro/gppongmhjkpfnbhagpmjfkannfbllamg?hl=en

[^58]: https://groups.google.com/a/chromium.org/g/chromium-extensions/c/vq4F0YtmA5U

[^59]: https://css-tricks.com/almanac/properties/c/color-scheme/

