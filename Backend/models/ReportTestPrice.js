const { ReportTestPrice, Test, PriceList, sequelize } = require("./index");

/**
 * Get all snapshotted prices for a report.
 */
exports.getPricesForReport = async (reportId) => {
  const records = await ReportTestPrice.findAll({
    where: { report_id: reportId },
    include: [
      {
        model: Test,
        as: "test",
        attributes: ["test_name", "test_code", "category"],
        required: false,
      }
    ],
    raw: true,
    nest: true,
  });

  return records.map(r => ({
    ...r,
    test_name: r.test?.test_name,
    test_code: r.test?.test_code,
    test_category: r.test?.category,
  }));
};

/**
 * Snapshot prices for a report. Removes old snapshots first.
 */
exports.snapshotPrices = async (reportId, resolvedPricesList) => {
  const transaction = await sequelize.transaction();
  try {
    // Delete existing snapshot first
    await ReportTestPrice.destroy({ where: { report_id: reportId }, transaction });

    // Format list for creation
    const snapshotRecords = resolvedPricesList.map(item => ({
      report_id: reportId,
      test_id: item.test_id || null,
      package_id: item.package_id || null,
      default_price: item.default_price || 0,
      applied_price: item.applied_price || 0,
      source: item.source || "default",
      source_id: item.source_id || null,
      price_list_version: item.price_list_version || null,
      is_manual_override: item.is_manual_override || false,
    }));

    const records = await ReportTestPrice.bulkCreate(snapshotRecords, { transaction });
    await transaction.commit();
    return records;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Delete snapshot.
 */
exports.deleteSnapshot = async (reportId) => {
  return await ReportTestPrice.destroy({ where: { report_id: reportId } });
};
