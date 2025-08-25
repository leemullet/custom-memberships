// ====================================
// CUSTOMIZABLE VARIABLES - Edit these for each website
// ====================================

const COOKIE_CONFIG = {
  cookieName: "cookieConsent", // Name of the cookie to store consent
  cookieExpireDays: 365, // How long the consent cookie lasts
  bannerDelay: 1000, // Delay before showing banner (in milliseconds)

  // CSS selectors using data attributes
  bannerSelector: "[data-cookie-banner]", // Use data-cookie-banner attribute
  acceptButtonSelector: "[data-cookie-accept]", // Use data-cookie-accept attribute

  // CSS classes to toggle
  showClass: "cookie-banner-show", // Class added when showing banner
  hideClass: "cookie-banner-hide", // Class added when hiding banner
};

// ====================================
// COOKIE CONSENT FUNCTIONALITY
// ====================================

// Check if user has already given consent
function hasUserConsented() {
  return getCookie(COOKIE_CONFIG.cookieName) === "true";
}

// Get cookie value by name
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}

// Set cookie with expiration
function setCookie(name, value, days) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

// Show the cookie banner
function showCookieBanner() {
  const banner = document.querySelector(COOKIE_CONFIG.bannerSelector);
  if (banner) {
    banner.classList.remove(COOKIE_CONFIG.hideClass);
    banner.classList.add(COOKIE_CONFIG.showClass);
  }
}

// Hide the cookie banner
function hideCookieBanner() {
  const banner = document.querySelector(COOKIE_CONFIG.bannerSelector);
  if (banner) {
    banner.classList.remove(COOKIE_CONFIG.showClass);
    banner.classList.add(COOKIE_CONFIG.hideClass);
  }
}

// Accept cookies and hide banner
function acceptCookies() {
  setCookie(COOKIE_CONFIG.cookieName, "true", COOKIE_CONFIG.cookieExpireDays);
  hideCookieBanner();

  // Optional: Fire custom event for tracking/analytics
  window.dispatchEvent(
    new CustomEvent("cookieConsentAccepted", {
      detail: { timestamp: new Date().toISOString() },
    })
  );
}

// Initialize the cookie consent system
function initCookieConsent() {
  // Only show banner if user hasn't consented yet
  if (!hasUserConsented()) {
    // Set up the accept button click handler
    const acceptButton = document.querySelector(
      COOKIE_CONFIG.acceptButtonSelector
    );
    if (acceptButton) {
      acceptButton.addEventListener("click", acceptCookies);
    }

    // Show banner after specified delay
    setTimeout(() => {
      showCookieBanner();
    }, COOKIE_CONFIG.bannerDelay);
  }
}

// ====================================
// UTILITY FUNCTIONS (for testing/debugging)
// ====================================

// Clear cookie consent (useful for testing)
function clearCookieConsent() {
  document.cookie = `${COOKIE_CONFIG.cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  console.log("Cookie consent cleared");
}

// Check consent status
function checkConsentStatus() {
  return {
    hasConsented: hasUserConsented(),
    cookieValue: getCookie(COOKIE_CONFIG.cookieName),
    cookieName: COOKIE_CONFIG.cookieName,
  };
}

// ====================================
// AUTO-INITIALIZATION
// ====================================

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCookieConsent);
} else {
  // DOM is already loaded
  initCookieConsent();
}
