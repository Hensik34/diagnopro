const pricingService = require("../services/pricing.service");

exports.resolvePrices = async (req, res) => {
  try {
    const { testIds, branchId, doctorId, reportPriceListId } = req.body;
    if (!Array.isArray(testIds) || !branchId) {
      return res.status(400).json({ error: "testIds array and branchId are required" });
    }

    const resolved = await pricingService.resolveTestPrices(testIds, {
      branchId,
      doctorId: doctorId || null,
      reportPriceListId: reportPriceListId || null,
    });

    res.json(resolved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
