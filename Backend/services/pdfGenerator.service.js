const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const Report = require("../models/Report");

function logPdfDebug(message, data = null) {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` | Data: ${JSON.stringify(data, null, 2)}` : "";
  const logLine = `[${timestamp}] [PDF Generator] ${message}${dataStr}\n`;
  console.log(`[PDF Generator] ${message}`, data || "");
  try {
    const logFilePath = path.join(__dirname, "..", "whatsapp-debug.log");
    fs.appendFileSync(logFilePath, logLine, "utf8");
  } catch (e) {
    // Ignore log errors
  }
}

class Semaphore {
  constructor(max) {
    this.max = max;
    this.current = 0;
    this.queue = [];
  }

  async acquire(timeoutMs = 30000) {
    if (this.current < this.max) {
      this.current++;
      return true;
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.queue.findIndex(item => item.resolve === resolve);
        if (index !== -1) {
          this.queue.splice(index, 1);
        }
        reject(new Error("Queue wait timeout: PDF generator queue is full"));
      }, timeoutMs);

      this.queue.push({
        resolve: () => {
          clearTimeout(timeout);
          resolve(true);
        }
      });
    });
  }

  release() {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      next.resolve();
    } else {
      this.current--;
    }
  }
}

class PuppeteerManager {
  constructor() {
    this.browser = null;
    this.totalJobsProcessed = 0;
    this.activeJobs = 0;
    this.restartCount = 0;
    this.isLaunching = false;

    // Load configs from env
    this.poolSize = parseInt(process.env.PDF_POOL_SIZE || "3", 10);
    this.timeout = parseInt(process.env.PDF_TIMEOUT || "15000", 10);
    this.queueTimeout = parseInt(process.env.PDF_QUEUE_TIMEOUT || "30000", 10);
    this.maxJobs = parseInt(process.env.PDF_MAX_JOBS_PER_BROWSER || "100", 10);

    this.semaphore = new Semaphore(this.poolSize);
  }

  async getBrowser() {
    if (this.browser) return this.browser;

    if (this.isLaunching) {
      while (this.isLaunching) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      if (this.browser) return this.browser;
    }

    this.isLaunching = true;
    const start = Date.now();
    try {
      logPdfDebug("Launching persistent Puppeteer browser...");
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-web-security"
        ]
      });

      this.browser.on("disconnected", () => {
        logPdfDebug("Browser disconnected. Resetting instance.");
        this.browser = null;
      });

      logPdfDebug(`Persistent browser launched in ${Date.now() - start}ms`);
      this.isLaunching = false;
      return this.browser;
    } catch (e) {
      this.isLaunching = false;
      logPdfDebug("Failed to launch browser", { error: e.message });
      throw e;
    }
  }

  async recycle() {
    logPdfDebug("Recycling browser to prevent memory leaks...");
    const oldBrowser = this.browser;
    this.browser = null;
    this.totalJobsProcessed = 0;
    this.restartCount++;

    if (oldBrowser) {
      try {
        await oldBrowser.close();
      } catch (e) {
        logPdfDebug("Error closing old browser", { error: e.message });
      }
    }
  }

  async shutdown() {
    logPdfDebug("Closing browser gracefully on server shutdown...");
    if (this.browser) {
      const b = this.browser;
      this.browser = null;
      await b.close();
    }
  }
}

const manager = new PuppeteerManager();

/**
 * Generates a PDF buffer for a report by pre-injecting the report data
 * and rendering it locally using Puppeteer.
 *
 * @param {string} reportId The UUID of the report
 * @returns {Promise<Buffer>} The PDF file buffer
 */
async function generateReportPdf(reportId, attachMarketingPages) {
  const start = Date.now();
  let dbFetchTime = 0;
  let queueWaitTime = 0;
  let renderTime = 0;

  logPdfDebug("generateReportPdf started", { reportId });

  // 1. Fetch data directly from DB
  const dbStart = Date.now();
  const reportData = await Report.getReportById(reportId);
  dbFetchTime = Date.now() - dbStart;
  if (!reportData) {
    throw new Error(`Report ${reportId} not found in database`);
  }

  // Inject a signed download token into the report data so it can render the correct QR code URL
  const downloadToken = jwt.sign(
    { reportId: reportData.id },
    process.env.JWT_SECRET
  );
  reportData.download_token = downloadToken;

  // 2. Acquire a slot from the semaphore queue
  const queueStart = Date.now();
  await manager.semaphore.acquire(manager.queueTimeout);
  queueWaitTime = Date.now() - queueStart;

  let page;
  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const browser = await manager.getBrowser();
      const renderStart = Date.now();
      
      page = await browser.newPage();

      // Configure viewport matching A4 ratio at high quality
      await page.setViewport({
        width: 794,
        height: 1123,
        deviceScaleFactor: 2
      });

      // Pre-inject report JSON and CLIENT_URL into window context
      await page.evaluateOnNewDocument((data, clientUrl) => {
        window.__REPORT_DATA__ = data;
        window.__CLIENT_URL__ = clientUrl;
      }, reportData, process.env.CLIENT_URL || "");

      // Emulate print media to enforce A4 layout and exact print CSS colors
      await page.emulateMediaType('print');

      // Define local URL to navigate to. It will load locally from dist.
      const localFrontendUrl = process.env.PDF_RENDER_URL || `http://localhost:${process.env.PORT || 5000}`;
      let url = `${localFrontendUrl}/public/report/${reportId}/download?print=true`;
      if (attachMarketingPages !== undefined) {
        url += `&attach_marketing_pages=${attachMarketingPages}`;
      }

      logPdfDebug(`Navigating page (attempt ${attempts}) to: ${url}`);
      await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: manager.timeout
      });

      // Brief delay for React layout calculations to settle
      await new Promise(r => setTimeout(r, 450));

      logPdfDebug("Printing page to PDF...");
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "0px",
          bottom: "0px",
          left: "0px",
          right: "0px"
        },
        preferCSSPageSize: true
      });

      renderTime = Date.now() - renderStart;
      const totalTime = Date.now() - start;

      logPdfDebug("PDF generated successfully", {
        reportId,
        dbFetchTimeMs: dbFetchTime,
        queueWaitTimeMs: queueWaitTime,
        renderTimeMs: renderTime,
        totalTimeMs: totalTime,
        size: pdfBuffer ? pdfBuffer.length : 0,
        attempt: attempts
      });

      // Increment jobs processed & check recycling limit
      manager.totalJobsProcessed++;
      if (manager.totalJobsProcessed >= manager.maxJobs) {
        setImmediate(() => manager.recycle());
      }

      await page.close();
      manager.semaphore.release();

      return Buffer.from(pdfBuffer);
    } catch (err) {
      logPdfDebug(`PDF generation failed on attempt ${attempts}`, { error: err.message });
      if (page) {
        try {
          await page.close();
        } catch (e) {}
      }

      if (attempts >= maxAttempts) {
        manager.semaphore.release();
        throw err;
      }

      // Recycle browser immediately on transient failure and try again
      await manager.recycle();
    }
  }
}

module.exports = {
  generateReportPdf,
  shutdown: () => manager.shutdown()
};
