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
    ]
  });

  const resolved = [];
  for (const r of records) {
    const plain = r.get({ plain: true });
    let name = plain.test?.test_name || null;
    let code = plain.test?.test_code || null;
    let category = plain.test?.category || null;

    if (plain.package_id && !plain.test_id) {
      const rows = await sequelize.query(
        "SELECT package_name, package_code, category FROM test_packages WHERE id = :packageId",
        {
          replacements: { packageId: plain.package_id },
          type: sequelize.QueryTypes.SELECT
        }
      );
      const pkg = rows && rows.length > 0 ? rows[0] : null;
      if (pkg) {
        name = pkg.package_name;
        code = pkg.package_code;
        category = pkg.category || "Package";
      } else {
        name = "Unknown Package";
        code = "PKG";
        category = "Package";
      }
    }

    resolved.push({
      ...plain,
      test_name: name,
      test_code: code,
      test_category: category,
      package_name: plain.package_id ? name : null,
      package_code: plain.package_id ? code : null,
    });
  }

  return resolved;
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
