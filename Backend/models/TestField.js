const { Op } = require("sequelize");
const { TestField, UserTestField, sequelize } = require("./index");

// Get all fields for a test with optional user-specific overrides
exports.getFieldsByTestId = async (testId, userId = null) => {
  if (userId) {
    const userFields = await UserTestField.findAll({
      where: { test_id: testId, user_id: userId },
      order: [["order_index", "ASC"], ["created_at", "ASC"]],
      raw: true,
    });
    if (userFields.length > 0) return userFields;
  }

  return await TestField.findAll({
    where: { test_id: testId },
    order: [["order_index", "ASC"], ["created_at", "ASC"]],
    raw: true,
  });
};

// Get fields for multiple tests
exports.getFieldsByTestIds = async (testIds, userId = null) => {
  if (!testIds || testIds.length === 0) return [];

  if (userId) {
    const userFields = await UserTestField.findAll({
      where: { test_id: { [Op.in]: testIds }, user_id: userId },
      order: [["test_id", "ASC"], ["order_index", "ASC"], ["created_at", "ASC"]],
      raw: true,
    });

    const userOverrideTestIds = new Set(userFields.map((f) => f.test_id));
    const defaultTestIds = testIds.filter((id) => !userOverrideTestIds.has(id));

    let defaultFields = [];
    if (defaultTestIds.length > 0) {
      defaultFields = await TestField.findAll({
        where: { test_id: { [Op.in]: defaultTestIds } },
        order: [["test_id", "ASC"], ["order_index", "ASC"], ["created_at", "ASC"]],
        raw: true,
      });
    }

    return [...userFields, ...defaultFields];
  }

  return await TestField.findAll({
    where: { test_id: { [Op.in]: testIds } },
    order: [["test_id", "ASC"], ["order_index", "ASC"], ["created_at", "ASC"]],
    raw: true,
  });
};

// Get a single field by id
exports.getFieldById = async (id) => {
  return await TestField.findByPk(id, { raw: true });
};

// Bulk set fields for a test (replace all)
exports.setFieldsForTest = async (testId, fields, userId = null, userRole = null) => {
  const t = await sequelize.transaction();
  try {
    if (!userId || userRole === "admin") {
      await TestField.destroy({ where: { test_id: testId }, transaction: t });

      const inserted = [];
      for (let i = 0; i < fields.length; i++) {
        const f = fields[i];
        const record = await TestField.create({
          test_id: testId,
          field_name: f.field_name,
          unit: f.unit || null,
          min_value: f.min_value != null ? f.min_value : null,
          max_value: f.max_value != null ? f.max_value : null,
          input_type: f.input_type || "number",
          options: f.options || null,
          order_index: f.order_index != null ? f.order_index : i,
          field_type: f.field_type || "input",
          formula: f.formula || null,
          depends_on: f.depends_on || null,
          section_group: f.section_group || null,
        }, { transaction: t });
        inserted.push(record.toJSON());
      }

      await t.commit();
      return inserted;
    }

    // Non-admin: user-specific overrides
    await UserTestField.destroy({
      where: { test_id: testId, user_id: userId },
      transaction: t,
    });

    const inserted = [];
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      const record = await UserTestField.create({
        user_id: userId,
        test_id: testId,
        test_field_id: f.test_field_id || f.id || null,
        field_name: f.field_name,
        unit: f.unit || null,
        min_value: f.min_value != null ? f.min_value : null,
        max_value: f.max_value != null ? f.max_value : null,
        input_type: f.input_type || "number",
        options: f.options || null,
        order_index: f.order_index != null ? f.order_index : i,
        field_type: f.field_type || "input",
        formula: f.formula || null,
        depends_on: f.depends_on || null,
        section_group: f.section_group || null,
      }, { transaction: t });
      inserted.push(record.toJSON());
    }

    await t.commit();
    return inserted;
  } catch (err) {
    await t.rollback();
    throw err;
  }
};

// Add a single field to a test
exports.addField = async (testId, field) => {
  return await TestField.create({
    test_id: testId,
    field_name: field.field_name,
    unit: field.unit || null,
    min_value: field.min_value != null ? field.min_value : null,
    max_value: field.max_value != null ? field.max_value : null,
    input_type: field.input_type || "number",
    options: field.options || null,
    order_index: field.order_index != null ? field.order_index : 0,
    field_type: field.field_type || "input",
    formula: field.formula || null,
    depends_on: field.depends_on || null,
    section_group: field.section_group || null,
  });
};

// Update a single field
exports.updateField = async (id, data) => {
  const [count, [updated]] = await TestField.update(data, {
    where: { id },
    returning: true,
  });
  return updated ? updated.toJSON() : null;
};

// Delete a single field
exports.deleteField = async (id) => {
  const deleted = await TestField.destroy({ where: { id } });
  return deleted ? { id } : null;
};
