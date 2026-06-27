const puppeteer = require("puppeteer");

/**
 * Generates a PDF buffer for a report by rendering the public report download page in headless Chrome.
 * 
 * @param {string} reportId The UUID of the report
 * @param {string} downloadToken The JWT token authorizing public view of the report
 * @returns {Promise<Buffer>} The PDF file buffer
 */
async function generateReportPdf(reportId, downloadToken) {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const url = `${clientUrl}/public/report/${reportId}/download?token=${downloadToken}&print=true`;
  
  console.log(`[PDF Generator] Launching Puppeteer to render: ${url}`);
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-web-security"
      ]
    });
    
    const page = await browser.newPage();
    
    // Set viewport to A4 aspect ratio at higher resolution for quality
    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 2
    });
    
    // Navigate to public report print page, waiting for network idle to ensure image/barcode loading
    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 30000
    });
    
    // Additional short delay to let layout compute/fonts render completely
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // Print to PDF with exact A4 sizing and zero margins
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
    
    console.log(`[PDF Generator] PDF successfully generated for report ${reportId}`);
    return pdfBuffer;
  } catch (error) {
    console.error(`[PDF Generator] Generation failed for report ${reportId}:`, error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = {
  generateReportPdf
};
