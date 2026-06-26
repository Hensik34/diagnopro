const { PriceList, PriceListItem, Test, sequelize } = require("./index");

/**
 * Get all price lists with optional branch_id filter.
 */
exports.getAllPriceLists = async (filters = {}) => {
  const where = {};
  if (filters.branch_id) {
    where.branch_id = filters.branch_id;
  }
  if (filters.is_active !== undefined) {
    where.is_active = filters.is_active;
  }

  return await PriceList.findAll({
    where,
    order: [["name", "ASC"], ["version", "DESC"]],
    raw: true,
  });
};

/**
 * Get a price list by ID with all its items (including test codes and names).
 */
exports.getPriceListById = async (id) => {
  const priceList = await PriceList.findByPk(id, { raw: true });
  if (!priceList) return null;

  const items = await PriceListItem.findAll({
    where: { price_list_id: id },
    include: [
      {
        model: Test,
        as: "test",
        attributes: ["test_name", "test_code", "category", "price"],
      }
    ],
    raw: true,
    nest: true,
  });

  // Format items nicely
  const formattedItems = items.map(item => ({
    id: item.id,
    price_list_id: item.price_list_id,
    test_id: item.test_id,
    price: item.price,
    discount_type: item.discount_type,
    discount_value: item.discount_value,
    test_name: item.test?.test_name,
    test_code: item.test?.test_code,
    test_category: item.test?.category,
    base_price: item.test?.price,
  }));

  return {
    ...priceList,
    items: formattedItems,
  };
};

/**
 * Create a new price list.
 */
exports.createPriceList = async (data) => {
  const { name, description, branch_id, is_active, version, effective_from, effective_to, created_by } = data;
  return await PriceList.create({
    name,
    description,
    branch_id,
    is_active: is_active !== false,
    version: version || 1,
    effective_from: effective_from || null,
    effective_to: effective_to || null,
    created_by,
  });
};

/**
 * Update a price list.
 */
exports.updatePriceList = async (id, data) => {
  const allowedFields = ["name", "description", "is_active", "version", "effective_from", "effective_to"];
  const updateObj = {};
  for (const [key, value] of Object.entries(data)) {
    if (allowedFields.includes(key) && value !== undefined) {
      updateObj[key] = value;
    }
  }

  const [count, [updated]] = await PriceList.update(updateObj, {
    where: { id },
    returning: true,
  });
  return updated ? updated.toJSON() : null;
};

/**
 * Delete a price list.
 */
exports.deletePriceList = async (id) => {
  const deleted = await PriceList.destroy({ where: { id } });
  return deleted ? { id } : null;
};

/**
 * Upsert price list items in bulk.
 */
exports.bulkUpsertItems = async (priceListId, items) => {
  const transaction = await sequelize.transaction();
  try {
    const results = [];
    for (const item of items) {
      const [record] = await PriceListItem.upsert({
        price_list_id: priceListId,
        test_id: item.test_id,
        price: item.price !== undefined ? item.price : null,
        discount_type: item.discount_type || "none",
        discount_value: item.discount_value || 0,
      }, { transaction, returning: true });
      results.push(record);
    }
    await transaction.commit();
    return results;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Delete price list item.
 */
exports.deleteItem = async (priceListId, testId) => {
  const deleted = await PriceListItem.destroy({
    where: { price_list_id: priceListId, test_id: testId }
  });
  return deleted ? { price_list_id: priceListId, test_id: testId } : null;
};
