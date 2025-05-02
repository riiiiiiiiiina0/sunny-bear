/**
 * Content script for Light Theme extension
 * This script removes the light theme styles from the page
 */

(function () {
  console.log('Light Theme removal script running');

  // Remove the light theme styles
  removeLightThemeStyles();

  /**
   * Function to remove light theme styles from the current page
   */
  function removeLightThemeStyles() {
    const styles = document.querySelectorAll('#light-theme-extension-styles');
    styles.forEach((style) => {
      style.remove();
    });
  }
})();
