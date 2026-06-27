const { Op } = require("sequelize");
const { Test, UserTest, PriceList, PriceListItem, DoctorPriceListAssignment, DoctorTestPrice, PriceAuditLog, sequelize } = require("../models/index");
const ReportTestPriceHelper = require("../models/ReportTestPrice");

/**
 * Centrally enforced rounding helper.
 * Rounds to 2 decimal places.
 */
const roundPrice = (value) => {
  if (value == null) return 0;
  return Math.round(Number(value) * 100) / 100;
};

exports.roundPrice = roundPrice;

/**
 * Central logic to apply pricing from price list items.
 */
const applyListItem = (item, basePrice) => {
  const priceVal = item.price;
  if (priceVal !== null && priceVal !== undefined) {
    return Number(priceVal);
  }
  if (item.discount_type === "percent") {
    return Number(basePrice) * (1 - Number(item.discount_value || 0) / 100);
  }
  if (item.discount_type === "amount") {
    return Number(basePrice) - Number(item.discount_value || 0);
  }
  return Number(basePrice);
};

/**
 * Resolves the effective price for a single test.
 *
 * @param {string} testId
 * @param {Object} options
 * @param {string} options.branchId
 * @param {string} [options.doctorId]
 * @param {string} [options.reportPriceListId]
 * @returns {Object}
 */
exports.resolveTestPrice = async (testId, { branchId, doctorId, reportPriceListId }) => {
  const calculation = [];
  
  // Step 1: Global default
  const test = await Test.findByPk(testId, { attributes: ["price", "id"], raw: true });
  if (!test) {
    throw new Error(`Test with id ${testId} not found`);
  }
  const globalPrice = Number(test.price || 0);
  let resolvedPrice = globalPrice;
  let source = "default";
  let sourceId = testId;
  let priceListVersion = null;
  
  calculation.push(`Global Default: ₹${globalPrice}`);
  
  // Step 2: Branch override (UserTest table is branch_tests)
  let basePrice = globalPrice;
  if (branchId) {
    const branchTest = await UserTest.findOne({
      where: { branch_id: branchId, test_id: testId },
      attributes: ["price", "id"],
      raw: true,
    });
    if (branchTest && branchTest.price !== null) {
      const branchPrice = Number(branchTest.price);
      resolvedPrice = branchPrice;
      source = "branch";
      sourceId = branchTest.id;
      calculation.push(`Branch Default: ₹${branchPrice}`);
      basePrice = branchPrice;
    } else {
      calculation.push(`Branch Default: No Override (Falls back to Global: ₹${globalPrice})`);
    }
  }

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  
  // Step 3: Complete replacement report price list
  if (reportPriceListId) {
    calculation.push(`Report Price List Selected: Checking Price List ID ${reportPriceListId}`);
    const item = await PriceListItem.findOne({
      where: { price_list_id: reportPriceListId, test_id: testId },
      raw: true,
    });
    
    if (item) {
      const resolvedFromList = applyListItem(item, basePrice);
      const activeList = await PriceList.findByPk(reportPriceListId, { attributes: ["name", "version"], raw: true });
      resolvedPrice = resolvedFromList;
      source = "price_list";
      sourceId = reportPriceListId;
      priceListVersion = activeList ? activeList.version : null;
      const listName = activeList ? activeList.name : "Report List";
      calculation.push(`Report Price List '${listName}' v${priceListVersion || 1}: ₹${roundPrice(resolvedFromList)}`);
    } else {
      calculation.push(`Report Price List: No item override found (Falls back to Branch/Global: ₹${basePrice})`);
    }
  } else if (doctorId) {
    calculation.push(`Doctor Selected: Checking pricing for Doctor ID ${doctorId}`);
    
    // Step 3a: Doctor's assigned price list for this branch
    let docListResolved = false;
    let docListPrice = resolvedPrice;
    let docListSourceId = null;
    let docListVersion = null;
    let docListName = "";
    
    if (branchId) {
      const assignment = await DoctorPriceListAssignment.findOne({
        where: { doctor_id: doctorId, branch_id: branchId },
        raw: true,
      });
      if (assignment) {
        const priceList = await PriceList.findOne({
          where: {
            id: assignment.price_list_id,
            is_active: true,
            [Op.and]: [
              {
                [Op.or]: [
                  { effective_from: null },
                  { effective_from: { [Op.lte]: today } }
                ]
              },
              {
                [Op.or]: [
                  { effective_to: null },
                  { effective_to: { [Op.gte]: today } }
                ]
              }
            ]
          },
          raw: true,
        });
        
        if (priceList) {
          const item = await PriceListItem.findOne({
            where: { price_list_id: priceList.id, test_id: testId },
            raw: true,
          });
          if (item) {
            docListPrice = applyListItem(item, basePrice);
            docListSourceId = priceList.id;
            docListVersion = priceList.version;
            docListName = priceList.name;
            docListResolved = true;
          }
        }
      }
    }
    
    if (docListResolved) {
      resolvedPrice = docListPrice;
      source = "doctor_list";
      sourceId = docListSourceId;
      priceListVersion = docListVersion;
      calculation.push(`Doctor Assigned Price List '${docListName}' v${docListVersion}: ₹${roundPrice(docListPrice)}`);
    } else {
      calculation.push("Doctor Assigned Price List: None active or no test item override found");
    }
    
    // Step 3b: Doctor individual override (wins over assigned list)
    if (branchId) {
      const override = await DoctorTestPrice.findOne({
        where: { doctor_id: doctorId, test_id: testId, branch_id: branchId },
        raw: true,
      });
      if (override) {
        resolvedPrice = Number(override.price);
        source = "doctor_override";
        sourceId = override.id;
        priceListVersion = null;
        calculation.push(`Doctor Individual Override: ₹${resolvedPrice}`);
      }
    }
  }
  
  // Clamp and round final price
  const finalPrice = roundPrice(Math.max(0, resolvedPrice));
  
  return {
    default_price: basePrice,
    applied_price: finalPrice,
    source,
    source_id: sourceId,
    price_list_version: priceListVersion,
    calculation,
  };
};

/**
 * Batch-resolves prices for multiple tests.
 * Returns Map<testId, ResolvedPrice>
 */
exports.resolveTestPrices = async (testIds, options) => {
  const results = {};
  await Promise.all(
    testIds.map(async (testId) => {
      try {
        results[testId] = await exports.resolveTestPrice(testId, options);
      } catch (err) {
        results[testId] = {
          default_price: 0,
          applied_price: 0,
          source: "default",
          source_id: null,
          price_list_version: null,
          calculation: [`Error: ${err.message}`],
        };
      }
    })
  );
  return results;
};

/**
 * Applies a manual override on top of a resolved price.
 */
exports.applyManualOverride = (resolvedPrice, customPrice) => {
  const finalPrice = roundPrice(Math.max(0, customPrice));
  return {
    ...resolvedPrice,
    applied_price: finalPrice,
    source: "manual",
    is_manual_override: true,
  };
};

/**
 * Bulk-inserts into report_test_prices (frozen snapshot).
 */
exports.snapshotPrices = async (reportId, items) => {
  return await ReportTestPriceHelper.snapshotPrices(reportId, items);
};

/**
 * Logs a price change to price_audit_log.
 */
exports.logPriceChange = async ({ reportId, testId, oldPrice, newPrice, source, changedBy, reason }) => {
  return await PriceAuditLog.create({
    report_id: reportId,
    test_id: testId || null,
    old_price: oldPrice,
    new_price: newPrice,
    source: source,
    changed_by: changedBy,
    reason: reason || null,
  });
};
