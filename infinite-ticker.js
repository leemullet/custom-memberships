/*
 * INFINITE TICKER IMPLEMENTATION TODO LIST
 * ========================================
 *
 * STEP 1: ADD THE SCRIPT
 * - [ ] Include the InfiniteTicker JavaScript file in your project
 * - [ ] Add <script src="https://yytjx2.csb.app/infinite-ticker.js"></script> before closing </body>
 *
 * STEP 2: HTML STRUCTURE
 * - [ ] Create wrapper element with class "ticker"
 * - [ ] Add ticker items inside with class "ticker-item"
 * - [ ] Basic structure:
 *       <div class="ticker">
 *         <div class="ticker-item">Content 1</div>
 *         <div class="ticker-item">Content 2</div>
 *         <div class="ticker-item">Content 3</div>
 *       </div>
 *
 * STEP 3: OPTIONAL HTML ATTRIBUTES (add to .ticker element)
 * - [ ] ticker-speed="50" - Set animation speed (pixels per second)
 * - [ ] ticker-gap="20" - Set space between items (pixels)
 * - [ ] ticker-direction="left" - Direction: "left" or "right"
 * - [ ] ticker-pause-on-hover="true" - Enable/disable hover pause
 * - [ ] ticker-pause-on-focus="true" - Enable/disable focus pause
 *
 * STEP 4: WEBFLOW SPECIFIC (if using Webflow)
 * - [ ] Add "ticker" class to a wrapper wrapping the Collection List wrapper
 * - [ ] Add "ticker-item" class to Collection Item within the CMS setup
 * - [ ] Set Collection List to show ALL items (no limit)
 *
 * STEP 5: BASIC CSS
 * - [ ] Style .ticker container (width, height, background)
 * - [ ] Style .ticker-item elements (padding, fonts, colors)
 *
 * That's it! The script auto-initializes when the page loads.
 */

class InfiniteTicker {
    constructor(options = {}) {
      this.options = {
        selector: ".ticker",
        itemSelector: ".ticker-item",
        speed: 50,
        gap: 20,
        direction: "left",
        pauseOnHover: true,
        pauseOnFocus: true,
        debug: false, // Set to true to enable debug logging
        responsive: {
          mobile: { maxWidth: 768, gap: 10, speed: 40 },
          tablet: { maxWidth: 1024, gap: 15, speed: 45 },
        },
        ...options,
      };
  
      this.tickers = [];
      this.animationFrameId = null;
      this.isInitialized = false;
  
      this.init();
    }
  
    // Debug logging helper
    log(...args) {
      if (this.options.debug) {
        console.log(...args);
      }
    }
  
    warn(...args) {
      console.warn(...args);
    }
  
    error(...args) {
      console.error(...args);
    }
  
    init() {
      const elements = document.querySelectorAll(this.options.selector);
  
      if (elements.length === 0) {
        this.warn(`No elements found with selector: ${this.options.selector}`);
        return;
      }
  
      elements.forEach((element) => this.setupTicker(element));
      this.setupEventListeners();
      this.startAnimation();
      this.isInitialized = true;
    }
  
    setupTicker(element) {
      const ticker = {
        element,
        container: null,
        items: [],
        isPaused: false,
        currentOffset: 0,
        containerWidth: 0,
        itemsWidth: 0,
        config: this.getElementConfig(element),
      };
  
      this.createTickerStructure(ticker);
      this.calculateDimensions(ticker);
      this.cloneItemsForInfiniteScroll(ticker);
      this.setupAccessibility(ticker);
      this.setupInteractionListeners(ticker);
  
      this.tickers.push(ticker);
    }
  
    getElementConfig(element) {
      const responsive = this.getResponsiveConfig();
  
      return {
        speed:
          parseFloat(element.getAttribute("ticker-speed")) ||
          responsive.speed ||
          this.options.speed,
        gap:
          parseInt(element.getAttribute("ticker-gap")) ||
          responsive.gap ||
          this.options.gap,
        direction:
          element.getAttribute("ticker-direction") || this.options.direction,
        pauseOnHover:
          element.getAttribute("ticker-pause-on-hover") !== "false" &&
          this.options.pauseOnHover,
        pauseOnFocus:
          element.getAttribute("ticker-pause-on-focus") !== "false" &&
          this.options.pauseOnFocus,
      };
    }
  
    getResponsiveConfig() {
      const width = window.innerWidth;
      const { mobile, tablet } = this.options.responsive;
  
      if (width <= mobile.maxWidth) return mobile;
      if (width <= tablet.maxWidth) return tablet;
      return {};
    }
  
    createTickerStructure(ticker) {
      const { element, config } = ticker;
      const tickerItems = element.querySelectorAll(this.options.itemSelector);
  
      if (tickerItems.length === 0) {
        this.error(
          'No ticker items found. Make sure Collection Items have the "ticker-item" class.'
        );
        return;
      }
  
      ticker.originalItems = Array.from(tickerItems);
  
      // Create new container
      ticker.container = document.createElement("div");
      ticker.container.className = "ticker-container";
      ticker.container.style.cssText = `
        display: flex;
        align-items: center;
        gap: ${config.gap}px;
        will-change: transform;
        position: relative;
      `;
  
      // Setup main element
      element.style.cssText = `
        position: relative;
        overflow: hidden;
        width: 100%;
      `;
  
      // Clear element and add container
      element.innerHTML = "";
      element.appendChild(ticker.container);
  
      // Add original items to container
      ticker.originalItems.forEach((item) => {
        const itemClone = item.cloneNode(true);
        itemClone.style.cssText += `
          flex-shrink: 0;
          white-space: nowrap;
        `;
        ticker.container.appendChild(itemClone);
      });
    }
  
    calculateDimensions(ticker) {
      // Force layout calculation
      ticker.element.offsetHeight;
  
      ticker.containerWidth = ticker.element.offsetWidth;
  
      // Calculate the width of one complete set of items
      let totalItemWidth = 0;
      const items = ticker.container.children;
  
      for (let i = 0; i < ticker.originalItems.length; i++) {
        if (items[i]) {
          totalItemWidth += items[i].offsetWidth;
          if (i < ticker.originalItems.length - 1) {
            totalItemWidth += ticker.config.gap;
          }
        }
      }
  
      ticker.singleSetWidth = totalItemWidth;
      this.log("Container width:", ticker.containerWidth);
      this.log("Single set width:", ticker.singleSetWidth);
    }
  
    cloneItemsForInfiniteScroll(ticker) {
      const { container, containerWidth, singleSetWidth } = ticker;
  
      // Remove existing clones
      const existingClones = container.querySelectorAll(".ticker-clone");
      existingClones.forEach((clone) => clone.remove());
  
      // Calculate how many complete sets we need to fill the screen + buffer
      const setsNeeded = Math.ceil((containerWidth * 2) / singleSetWidth) + 2;
      this.log("Sets needed for infinite scroll:", setsNeeded);
  
      // Clone original items multiple times
      for (let set = 0; set < setsNeeded; set++) {
        ticker.originalItems.forEach((item) => {
          const clone = item.cloneNode(true);
          clone.classList.add("ticker-clone");
          clone.setAttribute("aria-hidden", "true");
          clone.style.cssText += `
            flex-shrink: 0;
            white-space: nowrap;
          `;
          container.appendChild(clone);
        });
      }
  
      // Update total width
      ticker.totalWidth = container.scrollWidth;
  
      // Set initial position based on direction
      if (ticker.config.direction === "right") {
        ticker.currentOffset = -singleSetWidth;
      } else {
        ticker.currentOffset = 0;
      }
  
      this.log("Total width after cloning:", ticker.totalWidth);
      this.log("Initial offset:", ticker.currentOffset);
    }
  
    setupAccessibility(ticker) {
      const { element } = ticker;
  
      element.setAttribute("role", "marquee");
      element.setAttribute("aria-live", "off");
      element.setAttribute("aria-label", "Scrolling content");
  
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        ticker.config.speed = 0;
      }
    }
  
    setupInteractionListeners(ticker) {
      const { element, config } = ticker;
  
      // Clean hover handling
      if (config.pauseOnHover) {
        const handleMouseEnter = () => {
          ticker.isPaused = true;
          element.style.cursor = "pointer";
        };
  
        const handleMouseLeave = () => {
          ticker.isPaused = false;
          element.style.cursor = "default";
        };
  
        // Remove existing listeners
        if (ticker.mouseEnterHandler) {
          element.removeEventListener("mouseenter", ticker.mouseEnterHandler);
          element.removeEventListener("mouseover", ticker.mouseEnterHandler);
        }
        if (ticker.mouseLeaveHandler) {
          element.removeEventListener("mouseleave", ticker.mouseLeaveHandler);
          element.removeEventListener("mouseout", ticker.mouseLeaveHandler);
        }
  
        // Add listeners
        element.addEventListener("mouseenter", handleMouseEnter, {
          passive: true,
        });
        element.addEventListener("mouseleave", handleMouseLeave, {
          passive: true,
        });
        element.addEventListener("mouseover", handleMouseEnter, {
          passive: true,
        });
        element.addEventListener("mouseout", handleMouseLeave, { passive: true });
  
        // Store references
        ticker.mouseEnterHandler = handleMouseEnter;
        ticker.mouseLeaveHandler = handleMouseLeave;
      }
  
      // Focus handling
      if (config.pauseOnFocus) {
        const handleFocusIn = () => {
          ticker.isPaused = true;
        };
  
        const handleFocusOut = () => {
          ticker.isPaused = false;
        };
  
        element.addEventListener("focusin", handleFocusIn);
        element.addEventListener("focusout", handleFocusOut);
  
        ticker.focusInHandler = handleFocusIn;
        ticker.focusOutHandler = handleFocusOut;
      }
  
      // Ensure element can receive mouse events
      element.style.pointerEvents = "auto";
    }
  
    setupEventListeners() {
      let resizeTimeout;
  
      window.addEventListener("resize", () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => this.handleResize(), 250);
      });
  
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          this.stopAnimation();
        } else {
          this.startAnimation();
        }
      });
    }
  
    handleResize() {
      this.log("Handling resize...");
      this.tickers.forEach((ticker) => {
        ticker.config = this.getElementConfig(ticker.element);
        ticker.container.style.gap = `${ticker.config.gap}px`;
        this.calculateDimensions(ticker);
        this.cloneItemsForInfiniteScroll(ticker);
      });
    }
  
    startAnimation() {
      if (this.animationFrameId) return;
  
      let lastTime = 0;
      const animate = (currentTime) => {
        if (lastTime === 0) lastTime = currentTime;
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;
  
        this.tickers.forEach((ticker) => this.updateTicker(ticker, deltaTime));
        this.animationFrameId = requestAnimationFrame(animate);
      };
  
      this.animationFrameId = requestAnimationFrame(animate);
    }
  
    stopAnimation() {
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    }
  
    updateTicker(ticker, deltaTime) {
      if (ticker.isPaused || ticker.config.speed === 0 || !ticker.singleSetWidth)
        return;
  
      const { container, config, singleSetWidth } = ticker;
      const movement = (config.speed * deltaTime) / 1000;
  
      if (config.direction === "left") {
        ticker.currentOffset -= movement;
        if (ticker.currentOffset <= -singleSetWidth) {
          ticker.currentOffset += singleSetWidth;
        }
      } else {
        ticker.currentOffset += movement;
        if (ticker.currentOffset >= 0) {
          ticker.currentOffset = -singleSetWidth;
        }
      }
  
      // Apply transform
      container.style.transform = `translateX(${ticker.currentOffset}px)`;
    }
  
    // Public methods
    pause(selector = null) {
      this.tickers
        .filter((ticker) => !selector || ticker.element.matches(selector))
        .forEach((ticker) => {
          ticker.isPaused = true;
        });
    }
  
    resume(selector = null) {
      this.tickers
        .filter((ticker) => !selector || ticker.element.matches(selector))
        .forEach((ticker) => {
          ticker.isPaused = false;
        });
    }
  
    setSpeed(speed, selector = null) {
      this.tickers
        .filter((ticker) => !selector || ticker.element.matches(selector))
        .forEach((ticker) => {
          ticker.config.speed = speed;
        });
    }
  
    // Enable/disable debug logging
    enableDebug() {
      this.options.debug = true;
    }
  
    disableDebug() {
      this.options.debug = false;
    }
  
    destroy() {
      this.stopAnimation();
  
      this.tickers.forEach((ticker) => {
        // Remove event listeners
        if (ticker.mouseEnterHandler) {
          ticker.element.removeEventListener("mouseenter", ticker.mouseEnterHandler);
          ticker.element.removeEventListener("mouseover", ticker.mouseEnterHandler);
        }
        if (ticker.mouseLeaveHandler) {
          ticker.element.removeEventListener("mouseleave", ticker.mouseLeaveHandler);
          ticker.element.removeEventListener("mouseout", ticker.mouseLeaveHandler);
        }
        if (ticker.focusInHandler) {
          ticker.element.removeEventListener("focusin", ticker.focusInHandler);
        }
        if (ticker.focusOutHandler) {
          ticker.element.removeEventListener("focusout", ticker.focusOutHandler);
        }
  
        if (ticker.element) {
          ticker.element.removeAttribute("style");
          ticker.element.innerHTML = "";
  
          // Restore original items
          ticker.originalItems.forEach((item) => {
            ticker.element.appendChild(item);
          });
        }
      });
  
      this.tickers = [];
      this.isInitialized = false;
    }
  }
  
  // Clean Webflow initialization
  function initializeWebflowTicker() {
    const tryInitialize = () => {
      const tickerElements = document.querySelectorAll(".ticker");
  
      if (tickerElements.length === 0) {
        console.warn("No ticker elements found");
        return false;
      }
  
      // Check if ticker items exist
      let hasTickerItems = false;
      tickerElements.forEach((element) => {
        if (element.querySelectorAll(".ticker-item").length > 0) {
          hasTickerItems = true;
        }
      });
  
      if (!hasTickerItems) {
        console.warn("No ticker items found, waiting for CMS content...");
        return false;
      }
  
      // Initialize with debug disabled by default
      window.webflowTicker = new InfiniteTicker({
        selector: ".ticker",
        itemSelector: ".ticker-item",
        speed: 50,
        gap: 20,
        direction: "left",
        pauseOnHover: true,
        debug: false, // Set to true if you need debugging
        responsive: {
          mobile: { maxWidth: 768, gap: 10, speed: 30 },
          tablet: { maxWidth: 1024, gap: 15, speed: 40 },
        },
      });
  
      console.log("Ticker initialized successfully!");
      return true;
    };
  
    // Try immediately
    if (tryInitialize()) return;
  
    // Retry with backoff
    let attempts = 0;
    const maxAttempts = 10;
  
    const retryInitialization = () => {
      attempts++;
  
      if (tryInitialize() || attempts >= maxAttempts) {
        if (attempts >= maxAttempts) {
          console.error("Failed to initialize ticker after maximum attempts");
        }
        return;
      }
  
      setTimeout(retryInitialization, 500);
    };
  
    setTimeout(retryInitialization, 500);
  }
  
  // Auto-initialize
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeWebflowTicker);
  } else {
    initializeWebflowTicker();
  }
  
  // Export for module systems
  if (typeof module !== "undefined" && module.exports) {
    module.exports = InfiniteTicker;
  }
  if (typeof window !== "undefined") {
    window.InfiniteTicker = InfiniteTicker;
  }
  
  // Usage examples:
  // 
  // Enable debug logging:
  // window.webflowTicker.enableDebug();
  // 
  // Disable debug logging:
  // window.webflowTicker.disableDebug();
  // 
  // Create ticker with debug enabled:
  // new InfiniteTicker({ debug: true });
