const { Op } = require("sequelize");
const { TestField, UserTestField, sequelize } = require("./index");

function isMissingColumnError(err) {
  return err && (err.original?.code === "42703" || err.parent?.code === "42703");
}

// Get all fields for a test with optional branch-specific overrides
exports.getFieldsByTestId = async (testId, branchId = null) => {
  const defaultFields = await TestField.findAll({
    where: { test_id: testId },
    order: [["order_index", "ASC"], ["created_at", "ASC"]],
    raw: true,
  });

  if (!branchId) return defaultFields;

  let branchFields = [];
  try {
    branchFields = await UserTestField.findAll({
      where: { test_id: testId, branch_id: branchId },
      order: [["order_index", "ASC"], ["created_at", "ASC"]],
      raw: true,
    });
  } catch (err) {
    // Backward compatibility: if branch_test_fields is missing newly-added columns,
    // return base test_fields instead of failing the API.
    if (isMissingColumnError(err)) {
      return defaultFields;
    }
    throw err;
  }

  if (branchFields.length === 0) return defaultFields;

  const overrideMap = new Map(
    branchFields.filter((f) => f.test_field_id).map((f) => [f.test_field_id, f])
  );

  const mergedDefaults = defaultFields.map((field) => {
    const override = overrideMap.get(field.id);
    if (!override) return field;
    return {
      ...field,
      field_name: override.field_name ?? field.field_name,
      unit: override.unit ?? field.unit,
      min_value: override.min_value ?? field.min_value,
      max_value: override.max_value ?? field.max_value,
      input_type: override.input_type ?? field.input_type,
      options: override.options ?? field.options,
      order_index: override.order_index ?? field.order_index,
      field_type: override.field_type ?? field.field_type,
      formula: override.formula ?? field.formula,
      depends_on: override.depends_on ?? field.depends_on,
      section_group: override.section_group ?? field.section_group,
      has_branch_override: true,
    };
  });

  const customBranchFields = branchFields
    .filter((f) => !f.test_field_id)
    .map((f) => ({ ...f, id: f.id, has_branch_override: true }));

  return [...mergedDefaults, ...customBranchFields].sort((a, b) => {
    const ao = a.order_index ?? 0;
    const bo = b.order_index ?? 0;
    return ao - bo;
  });
};

// Get fields for multiple tests
exports.getFieldsByTestIds = async (testIds, branchId = null) => {
  if (!testIds || testIds.length === 0) return [];

  const defaultFields = await TestField.findAll({
    where: { test_id: { [Op.in]: testIds } },
    order: [["test_id", "ASC"], ["order_index", "ASC"], ["created_at", "ASC"]],
    raw: true,
  });

  if (!branchId) return defaultFields;

  let branchFields = [];
  try {
    branchFields = await UserTestField.findAll({
      where: { test_id: { [Op.in]: testIds }, branch_id: branchId },
      order: [["test_id", "ASC"], ["order_index", "ASC"], ["created_at", "ASC"]],
      raw: true,
    });
  } catch (err) {
    // Backward compatibility: if branch_test_fields is missing newly-added columns,
    // return base test_fields instead of failing the API.
    if (isMissingColumnError(err)) {
      return defaultFields;
    }
    throw err;
  }

  if (branchFields.length === 0) return defaultFields;

  const overrideMap = new Map(
    branchFields
      .filter((f) => f.test_field_id)
      .map((f) => [`${f.test_id}:${f.test_field_id}`, f])
  );

  const mergedDefaults = defaultFields.map((field) => {
    const override = overrideMap.get(`${field.test_id}:${field.id}`);
    if (!override) return field;
    return {
      ...field,
      field_name: override.field_name ?? field.field_name,
      unit: override.unit ?? field.unit,
      min_value: override.min_value ?? field.min_value,
      max_value: override.max_value ?? field.max_value,
      input_type: override.input_type ?? field.input_type,
      options: override.options ?? field.options,
      order_index: override.order_index ?? field.order_index,
      field_type: override.field_type ?? field.field_type,
      formula: override.formula ?? field.formula,
      depends_on: override.depends_on ?? field.depends_on,
      section_group: override.section_group ?? field.section_group,
      has_branch_override: true,
    };
  });

  const customBranchFields = branchFields
    .filter((f) => !f.test_field_id)
    .map((f) => ({ ...f, id: f.id, has_branch_override: true }));

  return [...mergedDefaults, ...customBranchFields].sort((a, b) => {
    if (a.test_id === b.test_id) {
      const ao = a.order_index ?? 0;
      const bo = b.order_index ?? 0;
      return ao - bo;
    }
    return a.test_id.localeCompare(b.test_id);
  });
};

// Get a single field by id
exports.getFieldById = async (id) => {
  return await TestField.findByPk(id, { raw: true });
};

// Bulk set fields for a test (replace all)
exports.setFieldsForTest = async (testId, fields, branchId = null, userRole = null) => {
  const t = await sequelize.transaction();
  try {
    if (userRole === "admin") {
      await TestField.destroy({ where: { test_id: testId }, transaction: t });

      const inserted = [];
      for (let i = 0; i < fields.length; i++) {
        const f = fields[i];
        const record = await TestField.create({
          test_id: testId,
          field_name: f.field_name,
          unit: f.unit ?? null,
          min_value: f.min_value != null ? f.min_value : null,
          max_value: f.max_value != null ? f.max_value : null,
          input_type: f.input_type || "number",
          options: f.options ?? null,
          order_index: f.order_index != null ? f.order_index : i,
          field_type: f.field_type || "input",
          formula: f.formula ?? null,
          depends_on: f.depends_on ?? null,
          section_group: f.section_group ?? null,
          reference_rules: f.reference_rules ?? null,
          critical_rules: f.critical_rules ?? null,
          is_mandatory: f.is_mandatory != null ? f.is_mandatory : true,
        }, { transaction: t });
        inserted.push(record.toJSON());
      }

      await t.commit();
      return inserted;
    }

    if (!branchId) {
      throw new Error("branch_id is required for branch field overrides");
    }

    await UserTestField.destroy({
      where: { test_id: testId, branch_id: branchId },
      transaction: t,
    });

    const inserted = [];
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      const record = await UserTestField.create({
        branch_id: branchId,
        test_id: testId,
        test_field_id: f.test_field_id || f.id || null,
        field_name: f.field_name,
        unit: f.unit ?? null,
        min_value: f.min_value != null ? f.min_value : null,
        max_value: f.max_value != null ? f.max_value : null,
        input_type: f.input_type || "number",
        options: f.options ?? null,
        order_index: f.order_index != null ? f.order_index : i,
        field_type: f.field_type || "input",
        formula: f.formula ?? null,
        depends_on: f.depends_on ?? null,
        section_group: f.section_group ?? null,
        reference_rules: f.reference_rules ?? null,
        critical_rules: f.critical_rules ?? null,
        is_mandatory: f.is_mandatory != null ? f.is_mandatory : true,
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
