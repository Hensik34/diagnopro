const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

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

/**
 * Generates a PDF buffer for a report by rendering the public report download
 * page in headless Chrome using CLIENT_URL from environment.
 *
 * @param {string} reportId The UUID of the report
 * @param {string} downloadToken The JWT token authorizing public view of the report
 * @returns {Promise<Buffer>} The PDF file buffer
 */
async function generateReportPdf(reportId, downloadToken) {
  const clientUrl = (process.env.CLIENT_URL || "").trim();
  if (!clientUrl) {
    const configError = "Missing CLIENT_URL in environment for PDF generation.";
    logPdfDebug(configError);
    throw new Error(configError);
  }

  const baseUrl = clientUrl.replace(/\/+$/, "");
  const url = `${baseUrl}/public/report/${reportId}/download?token=${downloadToken}&print=true`;

  logPdfDebug("generateReportPdf started", { reportId, url });

  let browser;
  try {
    logPdfDebug("Launching Puppeteer...");
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-web-security"
      ]
    });

    logPdfDebug("Opening new page...");
    const page = await browser.newPage();

    // Set viewport to A4 aspect ratio at higher resolution for quality
    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 2
    });

    // Navigate to CLIENT_URL-based public report print page,
    // waiting for network idle to ensure image/barcode loading
    logPdfDebug(`Navigating to URL: ${url}`);
    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 30000
    });

    logPdfDebug("Navigation completed. Waiting short delay for final render (500ms)...");
    // Additional short delay to let layout compute/fonts render completely
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Print to PDF with exact A4 sizing and zero margins
    logPdfDebug("Printing to PDF...");
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

    logPdfDebug(`PDF generated successfully. Size: ${pdfBuffer ? pdfBuffer.length : 0} bytes`);
    return Buffer.from(pdfBuffer);
  } catch (error) {
    logPdfDebug("PDF generation failed with error", { error: error.message, stack: error.stack });
    console.error(`[PDF Generator] Generation failed for report ${reportId}:`, error);
    throw error;
  } finally {
    if (browser) {
      logPdfDebug("Closing Puppeteer browser.");
      await browser.close();
    }
  }
}

module.exports = {
  generateReportPdf
};
