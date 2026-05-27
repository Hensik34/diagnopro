const { Inventory } = require("./index");

// Get all inventory items for a branch
exports.getAll = async (branchId) => {
  return await Inventory.findAll({
    where: { branch_id: branchId },
    order: [["category", "ASC"], ["name", "ASC"]],
    raw: true,
  });
};

// Get item by ID
exports.getById = async (id) => {
  return await Inventory.findByPk(id, { raw: true });
};

// Create new inventory item
exports.create = async (data) => {
  const { name, category, quantity = 0, alert_threshold = 0, unit = "packs", branch_id } = data;

  return await Inventory.create({
    name, category, quantity, alert_threshold, unit, branch_id,
    last_restocked: quantity > 0 ? new Date() : null,
  });
};

// Update inventory item
exports.update = async (id, data) => {
  const [count, [updated]] = await Inventory.update(data, {
    where: { id },
    returning: true,
  });
  return updated ? updated.toJSON() : null;
};

// Add stock (restock) — increments quantity
exports.addStock = async (id, addQuantity) => {
  const item = await Inventory.findByPk(id);
  if (!item) return null;

  item.quantity = (item.quantity || 0) + addQuantity;
  item.last_restocked = new Date();
  await item.save();
  return item.toJSON();
};

// Delete inventory item
exports.delete = async (id) => {
  const deleted = await Inventory.destroy({ where: { id } });
  return deleted ? { id } : null;
};
