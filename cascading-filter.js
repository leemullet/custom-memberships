// Generic Cascading Dropdown Filter for Webflow Collections
// Place this code in your page's custom code section (before </body> tag)
// -- THIS SHOULD BE USED FOR FORM DROPDOWNS ONLY.

(function () {
  "use strict";

  // Configuration - Update these selectors to match your setup
  const CONFIG = {
    // Dropdown selectors
    dropdown1Select: 'select[name="dropdown1"]', // First level dropdown
    dropdown2Select: 'select[name="dropdown2"]', // Second level dropdown
    dropdown3Select: 'select[name="dropdown3"]', // Third level dropdown
    resetButton: "[data-reset-filters]",

    // Collection list items
    collectionItems: "[data-collection] .collection_item_wrap", // Target your collection item class

    // Data attributes for collection items (update these to match your text elements)
    collectionItemSelectors: {
      dropdown1: "[data-dropdown1]", // Add data-dropdown1 attribute to text element
      dropdown2: "[data-dropdown2]", // Add data-dropdown2 attribute to text element
      dropdown3: "[data-dropdown3]", // Add data-dropdown3 attribute to text element (can be multiple)
    },
  };

  // Global state
  let dataMap = {
    dropdown1Options: new Set(),
    dropdown2Options: new Map(), // dropdown1 -> Set of dropdown2 options
    dropdown3Options: new Map(), // "dropdown1|dropdown2" -> Set of dropdown3 options
    collectionItems: [], // Array of collection item data
  };

  let currentFilters = {
    dropdown1: "",
    dropdown2: "",
    dropdown3: "",
  };

  // Initialize when DOM is ready
  function init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initializeFilter);
    } else {
      initializeFilter();
    }
  }

  function initializeFilter() {
    console.log("Initializing cascading dropdown filter...");

    // Build data relationships from collection items
    buildDataMap();

    // Set up event listeners
    setupEventListeners();

    // Initial state - show all options
    updateAllDropdowns();

    console.log("Filter initialized successfully");
  }

  function buildDataMap() {
    const collectionElements = document.querySelectorAll(
      CONFIG.collectionItems
    );
    console.log(
      `Found ${collectionElements.length} potential collection items`
    );

    // Check which dropdowns actually exist on the page
    const hasDropdown1 = !!document.querySelector(CONFIG.dropdown1Select);
    const hasDropdown2 = !!document.querySelector(CONFIG.dropdown2Select);
    const hasDropdown3 = !!document.querySelector(CONFIG.dropdown3Select);

    console.log("Dropdown detection:", {
      hasDropdown1,
      hasDropdown2,
      hasDropdown3,
    });

    collectionElements.forEach((item, index) => {
      try {
        // Check for required elements based on available dropdowns
        const dropdown1Element = hasDropdown1
          ? item.querySelector(CONFIG.collectionItemSelectors.dropdown1)
          : null;
        const dropdown2Element = hasDropdown2
          ? item.querySelector(CONFIG.collectionItemSelectors.dropdown2)
          : null;
        const dropdown3Elements = hasDropdown3
          ? item.querySelectorAll(CONFIG.collectionItemSelectors.dropdown3)
          : [];

        // Debug logging
        console.log(`Collection item ${index}:`, {
          hasDropdown1: !!dropdown1Element,
          hasDropdown2: !!dropdown2Element,
          dropdown3Count: dropdown3Elements.length,
          itemHTML: item.outerHTML.substring(0, 200) + "...", // First 200 chars
        });

        // Determine minimum required elements based on available dropdowns
        let requiredElements = [];
        if (hasDropdown1 && !dropdown1Element)
          requiredElements.push("dropdown1");
        if (hasDropdown2 && !dropdown2Element)
          requiredElements.push("dropdown2");
        if (hasDropdown3 && dropdown3Elements.length === 0)
          requiredElements.push("dropdown3");

        if (requiredElements.length > 0) {
          console.warn(
            `Collection item ${index} missing required data elements:`,
            requiredElements
          );
          return;
        }

        // Get values, defaulting to empty string if dropdown doesn't exist
        const dropdown1Value = dropdown1Element
          ? dropdown1Element.textContent.trim()
          : "";
        const dropdown2Value = dropdown2Element
          ? dropdown2Element.textContent.trim()
          : "";
        const dropdown3Values =
          dropdown3Elements.length > 0
            ? Array.from(dropdown3Elements)
                .map((el) => el.textContent.trim())
                .filter((s) => s)
            : [];

        console.log(`Collection item ${index} data:`, {
          dropdown1Value,
          dropdown2Value,
          dropdown3Values,
        });

        // Build relationships only for existing dropdowns
        if (hasDropdown1 && dropdown1Value) {
          dataMap.dropdown1Options.add(dropdown1Value);
        }

        if (hasDropdown1 && hasDropdown2 && dropdown1Value && dropdown2Value) {
          if (!dataMap.dropdown2Options.has(dropdown1Value)) {
            dataMap.dropdown2Options.set(dropdown1Value, new Set());
          }
          dataMap.dropdown2Options.get(dropdown1Value).add(dropdown2Value);
        }

        if (
          hasDropdown1 &&
          hasDropdown2 &&
          hasDropdown3 &&
          dropdown1Value &&
          dropdown2Value &&
          dropdown3Values.length > 0
        ) {
          const combinedKey = `${dropdown1Value}|${dropdown2Value}`;
          if (!dataMap.dropdown3Options.has(combinedKey)) {
            dataMap.dropdown3Options.set(combinedKey, new Set());
          }
          dropdown3Values.forEach((value) => {
            dataMap.dropdown3Options.get(combinedKey).add(value);
          });
        }

        // Store collection item data for filtering
        dataMap.collectionItems.push({
          element: item,
          dropdown1: dropdown1Value,
          dropdown2: dropdown2Value,
          dropdown3: dropdown3Values,
        });
      } catch (error) {
        console.error(`Error processing collection item ${index}:`, error);
      }
    });

    console.log("Data map built:", {
      dropdown1Options: dataMap.dropdown1Options.size,
      dropdown2Options: dataMap.dropdown2Options.size,
      dropdown3Options: dataMap.dropdown3Options.size,
      collectionItems: dataMap.collectionItems.length,
    });
  }

  function setupEventListeners() {
    const dropdown1Select = document.querySelector(CONFIG.dropdown1Select);
    const dropdown2Select = document.querySelector(CONFIG.dropdown2Select);
    const dropdown3Select = document.querySelector(CONFIG.dropdown3Select);

    console.log("Setting up event listeners:", {
      dropdown1Select: !!dropdown1Select,
      dropdown2Select: !!dropdown2Select,
      dropdown3Select: !!dropdown3Select,
    });

    if (dropdown1Select) {
      dropdown1Select.addEventListener("change", handleDropdown1Change);
      console.log("Dropdown1 found and listener added");
    } else {
      console.warn(
        "Dropdown1 not found with selector:",
        CONFIG.dropdown1Select
      );
    }

    if (dropdown2Select) {
      dropdown2Select.addEventListener("change", handleDropdown2Change);
      console.log("Dropdown2 found and listener added");
    } else {
      console.warn(
        "Dropdown2 not found with selector:",
        CONFIG.dropdown2Select
      );
    }

    if (dropdown3Select) {
      dropdown3Select.addEventListener("change", handleDropdown3Change);
      console.log("Dropdown3 found and listener added");
    } else {
      console.warn(
        "Dropdown3 not found with selector:",
        CONFIG.dropdown3Select
      );
    }

    // Set up reset button
    const resetButton = document.querySelector(CONFIG.resetButton);
    if (resetButton) {
      resetButton.addEventListener("click", handleResetFilters);
      console.log("Reset button found and listener added");
    } else {
      console.warn("Reset button not found with selector:", CONFIG.resetButton);
    }
  }

  function handleDropdown1Change(event) {
    const selectedValue = event.target.value;
    console.log("Dropdown1 changed to:", selectedValue);
    currentFilters.dropdown1 = selectedValue;

    console.log("Current filters after dropdown1 change:", currentFilters);

    // Update dropdowns to show compatible options
    updateDropdown2();
    updateDropdown3();
    updateCollectionItems();

    // Only reset dropdown selects if the current selection is no longer valid
    const dropdown2Select = document.querySelector(CONFIG.dropdown2Select);
    const dropdown3Select = document.querySelector(CONFIG.dropdown3Select);

    if (dropdown2Select && currentFilters.dropdown2) {
      const availableDropdown2Options = getAvailableDropdown2Options();
      if (!availableDropdown2Options.has(currentFilters.dropdown2)) {
        currentFilters.dropdown2 = "";
        dropdown2Select.value = "";
      }
    }

    if (dropdown3Select && currentFilters.dropdown3) {
      const availableDropdown3Options = getAvailableDropdown3Options();
      if (!availableDropdown3Options.has(currentFilters.dropdown3)) {
        currentFilters.dropdown3 = "";
        dropdown3Select.value = "";
      }
    }
  }

  function handleDropdown2Change(event) {
    const selectedValue = event.target.value;
    currentFilters.dropdown2 = selectedValue;

    // Update dropdowns to show compatible options
    updateDropdown1();
    updateDropdown3();
    updateCollectionItems();

    // Only reset dropdown selects if the current selection is no longer valid
    const dropdown1Select = document.querySelector(CONFIG.dropdown1Select);
    const dropdown3Select = document.querySelector(CONFIG.dropdown3Select);

    if (dropdown1Select && currentFilters.dropdown1) {
      const availableDropdown1Options = getAvailableDropdown1Options();
      if (!availableDropdown1Options.has(currentFilters.dropdown1)) {
        currentFilters.dropdown1 = "";
        dropdown1Select.value = "";
      }
    }

    if (dropdown3Select && currentFilters.dropdown3) {
      const availableDropdown3Options = getAvailableDropdown3Options();
      if (!availableDropdown3Options.has(currentFilters.dropdown3)) {
        currentFilters.dropdown3 = "";
        dropdown3Select.value = "";
      }
    }
  }

  function handleDropdown3Change(event) {
    const selectedValue = event.target.value;
    currentFilters.dropdown3 = selectedValue;

    // Update dropdowns to show compatible options
    updateDropdown1();
    updateDropdown2();
    updateCollectionItems();
  }

  function handleResetFilters(event) {
    console.log("Reset filters clicked");

    // Clear all filters
    currentFilters.dropdown1 = "";
    currentFilters.dropdown2 = "";
    currentFilters.dropdown3 = "";

    // Reset all dropdown values
    const dropdown1Select = document.querySelector(CONFIG.dropdown1Select);
    const dropdown2Select = document.querySelector(CONFIG.dropdown2Select);
    const dropdown3Select = document.querySelector(CONFIG.dropdown3Select);

    if (dropdown1Select) dropdown1Select.selectedIndex = 0;
    if (dropdown2Select) dropdown2Select.selectedIndex = 0;
    if (dropdown3Select) dropdown3Select.selectedIndex = 0;

    // Show all options in all dropdowns
    updateAllDropdowns();

    // Show all collection items
    updateCollectionItems();

    console.log("All filters reset");
  }

  function updateDropdown1() {
    const dropdown1Select = document.querySelector(CONFIG.dropdown1Select);
    if (!dropdown1Select) return;

    const options = dropdown1Select.querySelectorAll('option:not([value=""])');
    const availableOptions = getAvailableDropdown1Options();

    options.forEach((option) => {
      const optionValue = option.textContent.trim();
      if (availableOptions.has(optionValue)) {
        option.style.display = "";
      } else {
        option.style.display = "none";
      }
    });
  }

  function updateDropdown2() {
    const dropdown2Select = document.querySelector(CONFIG.dropdown2Select);
    if (!dropdown2Select) return;

    const options = dropdown2Select.querySelectorAll('option:not([value=""])');
    const availableOptions = getAvailableDropdown2Options();

    options.forEach((option) => {
      const optionValue = option.textContent.trim();
      if (availableOptions.has(optionValue)) {
        option.style.display = "";
      } else {
        option.style.display = "none";
      }
    });
  }

  function updateDropdown3() {
    const dropdown3Select = document.querySelector(CONFIG.dropdown3Select);
    if (!dropdown3Select) return;

    const options = dropdown3Select.querySelectorAll('option:not([value=""])');
    const availableOptions = getAvailableDropdown3Options();

    options.forEach((option) => {
      const optionValue = option.textContent.trim();
      if (availableOptions.has(optionValue)) {
        option.style.display = "";
      } else {
        option.style.display = "none";
      }
    });
  }

  function getAvailableDropdown1Options() {
    if (!currentFilters.dropdown2 && !currentFilters.dropdown3) {
      return dataMap.dropdown1Options;
    }

    const available = new Set();

    dataMap.collectionItems.forEach((item) => {
      let matches = true;

      if (
        currentFilters.dropdown2 &&
        item.dropdown2 !== currentFilters.dropdown2
      ) {
        matches = false;
      }

      if (
        currentFilters.dropdown3 &&
        !item.dropdown3.includes(currentFilters.dropdown3)
      ) {
        matches = false;
      }

      if (matches) {
        available.add(item.dropdown1);
      }
    });

    return available;
  }

  function getAvailableDropdown2Options() {
    if (!currentFilters.dropdown1 && !currentFilters.dropdown3) {
      const allOptions = new Set();
      dataMap.dropdown2Options.forEach((options) => {
        options.forEach((option) => allOptions.add(option));
      });
      return allOptions;
    }

    const available = new Set();

    dataMap.collectionItems.forEach((item) => {
      let matches = true;

      if (
        currentFilters.dropdown1 &&
        item.dropdown1 !== currentFilters.dropdown1
      ) {
        matches = false;
      }

      if (
        currentFilters.dropdown3 &&
        !item.dropdown3.includes(currentFilters.dropdown3)
      ) {
        matches = false;
      }

      if (matches) {
        available.add(item.dropdown2);
      }
    });

    return available;
  }

  function getAvailableDropdown3Options() {
    if (!currentFilters.dropdown1 && !currentFilters.dropdown2) {
      const allOptions = new Set();
      dataMap.dropdown3Options.forEach((options) => {
        options.forEach((option) => allOptions.add(option));
      });
      return allOptions;
    }

    const available = new Set();

    dataMap.collectionItems.forEach((item) => {
      let matches = true;

      if (
        currentFilters.dropdown1 &&
        item.dropdown1 !== currentFilters.dropdown1
      ) {
        matches = false;
      }

      if (
        currentFilters.dropdown2 &&
        item.dropdown2 !== currentFilters.dropdown2
      ) {
        matches = false;
      }

      if (matches) {
        item.dropdown3.forEach((option) => available.add(option));
      }
    });

    return available;
  }

  function updateAllDropdowns() {
    updateDropdown1();
    updateDropdown2();
    updateDropdown3();
  }

  function updateCollectionItems() {
    dataMap.collectionItems.forEach((item) => {
      let show = true;

      // Only filter by dropdown1 if it exists and has a value
      if (
        currentFilters.dropdown1 &&
        item.dropdown1 &&
        item.dropdown1 !== currentFilters.dropdown1
      ) {
        show = false;
      }

      // Only filter by dropdown2 if it exists and has a value
      if (
        currentFilters.dropdown2 &&
        item.dropdown2 &&
        item.dropdown2 !== currentFilters.dropdown2
      ) {
        show = false;
      }

      // Only filter by dropdown3 if it exists and has a value
      if (
        currentFilters.dropdown3 &&
        item.dropdown3 &&
        item.dropdown3.length > 0 &&
        !item.dropdown3.includes(currentFilters.dropdown3)
      ) {
        show = false;
      }

      if (show) {
        item.element.style.display = "";
      } else {
        item.element.style.display = "none";
      }
    });

    // Update collection count if you have one
    updateCollectionCount();
  }

  function updateCollectionCount() {
    const visibleItems = dataMap.collectionItems.filter(
      (item) => item.element.style.display !== "none"
    ).length;

    // If you have a results count element, update it here
    const countElement = document.querySelector("[data-results-count]");
    if (countElement) {
      countElement.textContent = visibleItems;
    }

    console.log(
      `Showing ${visibleItems} of ${dataMap.collectionItems.length} items`
    );
  }

  // Initialize the filter
  init();
})();
