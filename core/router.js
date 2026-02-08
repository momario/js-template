import config from '/js-template/config/config.js';

class Router {
  constructor() {
    this.routes = {};
    this.baseUrl = config.baseUrl;
    this.allowedUrls = config.allowedUrls;

    // Make router instance globally available
    window.router = this;

    // Set up event listeners for navigation
    window.addEventListener('popstate', this.handleRouteChange.bind(this));
    document.addEventListener('click', this.handleLinkClick.bind(this));

    // Initialize with current URL
    this.handleRouteChange();
  }

  handleLinkClick(e) {
    // Handle internal navigation links
    if (e.target.tagName === 'A' && e.target.getAttribute('data-internal') === 'true') {
      e.preventDefault();
      const url = e.target.getAttribute('href');
      this.navigateTo(url);
    }
  }

  navigateTo(url) {
    history.pushState(null, null, url);
    this.handleRouteChange();
  }

  // Redirect function that can be used from anywhere
  redirect(controller, action, params = {}) {
    let url = `${this.baseUrl}/${controller}/${action}`;

    // Add query parameters if provided
    if (Object.keys(params).length > 0) {
      const queryString = Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      url += `?${queryString}`;
    }

    console.log(`Redirecting to: ${url}`);
    this.navigateTo(url);
    return true;
  }

  handleRouteChange() {
    // Extract path from URL
    const path = window.location.pathname;

    // Check if we're on the base path
    if (path === this.baseUrl || path === `${this.baseUrl}/`) {
      // Redirect to mainUrl
      this.redirectToMain();
      return;
    }

    // For paths like /js-template/x/main
    if (path.startsWith(this.baseUrl)) {
      const pathWithoutBase = path.slice(this.baseUrl.length);
      const pathParts = pathWithoutBase.split('/').filter(part => part !== '');

      if (pathParts.length >= 2) {
        const controllerName = pathParts[0];
        const actionName = pathParts[1];

        // Prüfen, ob Controller/Action erlaubt sind
        if (!this.isRouteAllowed(controllerName, actionName)) {
          this.showNotAllowedPage(controllerName, actionName);
          return;
        }

        this.loadController(controllerName, actionName);
        return;
      }
    }

    // If we reach here, show 404
    this.show404Page();
  }

  redirectToMain() {
    if (config.mainUrl) {
      console.log(`Redirecting to main URL: ${config.mainUrl}`);
      this.navigateTo(config.mainUrl);
    } else {
      this.showDefaultPage();
    }
  }

  showDefaultPage() {
    document.getElementById('app').innerHTML = `
        <h1>Welcome to the JS Template App</h1>
      `;
  }

  showNotAllowedPage(controller, action) {
    document.getElementById('app').innerHTML = `
    <h1>403 - Not Allowed</h1>
    <p>Controller <strong>${controller}</strong> or action <strong>${action}</strong> is not allowed.</p>
  `;
    console.error(`Controller/Action not allowed: ${controller}/${action}`);
  }


  show404Page() {
    document.getElementById('app').innerHTML = '<h1>404 - Page Not Found</h1><p>The requested resource could not be found.</p>';
    console.error('Route not found:', window.location.pathname);
  }

  isRouteAllowed(controller, action) {
    // Prüfen, ob Controller existiert
    if (!this.allowedUrls[controller]) return false;

    // Prüfen, ob Action im Array steht
    return this.allowedUrls[controller].includes(action);
  }

  async loadController(controllerName, actionName) {
    try {
      console.log(`Loading controller: ${controllerName}, action: ${actionName}`);

      // Dynamically import the controller module
      const controllerModule = await import(`${this.baseUrl}/controllers/${controllerName}.js`);
      const ControllerClass = controllerModule.default;

      // Create an instance of the controller
      const controller = new ControllerClass();

      // Pass router instance to the controller
      controller.router = this;

      // Check if the action exists
      if (typeof controller[actionName] === 'function') {
        controller[actionName]();
      } else {
        console.error(`Action '${actionName}' not found in controller '${controllerName}'`);
        this.show404Page();
      }
    } catch (error) {
      console.error(`Failed to load controller: ${controllerName}`, error);
      console.error("Error details:", error);
      this.show404Page();
    }
  }

  async loadView(viewName) {
    try {
      console.log(`Loading view: ${viewName}`);

      // Fetch the HTML file directly
      const response = await fetch(`./views/${viewName}.html`);

      if (!response.ok) {
        throw new Error(`Failed to load view: ${viewName}`);
      }

      const viewContent = await response.text();
      document.getElementById('app').innerHTML = viewContent;

      return viewContent;
    } catch (error) {
      console.error(`Failed to load view: ${viewName}`, error);
      document.getElementById('app').innerHTML = '<p>Failed to load view</p>';
      return '<p>Failed to load view</p>';
    }
  }

}

// Initialize the router when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new Router();
});