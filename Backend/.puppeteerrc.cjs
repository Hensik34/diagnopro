const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Configures Puppeteer to download and find Chrome in a directory inside the project workspace.
  // This is required for environments like Render where the default home cache directory (~/.cache) 
  // is not copied from the build environment to the execution container.
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
