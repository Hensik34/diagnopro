const { sequelize } = require("./index");

// Get all packages (default + branch overrides)
exports.getAllPackages = async (branchId = null) => {
  let query = "SELECT * FROM test_packages WHERE branch_id IS NULL";
  const replacements = {};

  if (branchId) {
    query += " OR branch_id = :branchId";
    replacements.branchId = branchId;
  }

  query += " ORDER BY package_name ASC";

  const rows = await sequelize.query(query, {
    replacements,
    type: sequelize.QueryTypes.SELECT
  });

  if (!branchId) {
    return rows.map(r => ({ ...r, has_branch_override: false }));
  }

  // Group by package_code, preferring branch override (non-null branch_id)
  const map = new Map();
  for (const row of rows) {
    const existing = map.get(row.package_code);
    if (!existing || row.branch_id !== null) {
      map.set(row.package_code, row);
    }
  }

  return Array.from(map.values()).map(r => ({
    ...r,
    has_branch_override: r.branch_id !== null && rows.some(allR => allR.package_code === r.package_code && allR.branch_id === null)
  }));
};

// Get package by ID
exports.getPackageById = async (id) => {
  const rows = await sequelize.query("SELECT * FROM test_packages WHERE id = :id", {
    replacements: { id },
    type: sequelize.QueryTypes.SELECT
  });
  return rows[0] || null;
};

// Create a new package
exports.createPackage = async (data) => {
  const { package_name, package_code, category, description, price, is_active, branch_id, test_ids } = data;
  const query = `
    INSERT INTO test_packages (id, package_name, package_code, category, description, price, is_active, branch_id, test_ids, created_at, updated_at)
    VALUES (gen_random_uuid(), :package_name, :package_code, :category, :description, :price, :is_active, :branch_id, :test_ids::jsonb, NOW(), NOW())
    RETURNING *
  `;
  const rows = await sequelize.query(query, {
    replacements: {
      package_name,
      package_code,
      category,
      description: description || null,
      price: price != null ? Number(price) : 0,
      is_active: is_active !== false,
      branch_id: branch_id || null,
      test_ids: JSON.stringify(test_ids || [])
    },
    type: sequelize.QueryTypes.SELECT
  });
  return rows[0] || null;
};

// Update package
exports.updatePackage = async (id, data, branchId = null, userRole = null) => {
  const { package_name, category, description, price, is_active, test_ids } = data;

  const current = await exports.getPackageById(id);
  if (!current) return null;

  // Admin updating a global package directly only when no branch context is provided
  if (userRole === "admin" && current.branch_id === null && !branchId) {
    const query = `
      UPDATE test_packages
      SET package_name = :package_name,
          category = :category,
          description = :description,
          price = :price,
          is_active = :is_active,
          test_ids = :test_ids::jsonb,
          updated_at = NOW()
      WHERE id = :id
      RETURNING *
    `;
    const rows = await sequelize.query(query, {
      replacements: {
        id,
        package_name: package_name !== undefined ? package_name : current.package_name,
        category: category !== undefined ? category : current.category,
        description: description !== undefined ? description : current.description,
        price: price !== undefined ? Number(price) : current.price,
        is_active: is_active !== undefined ? is_active : current.is_active,
        test_ids: JSON.stringify(test_ids !== undefined ? test_ids : (current.test_ids || []))
      },
      type: sequelize.QueryTypes.SELECT
    });
    return rows[0] || null;
  }

  // Branch-specific update/override logic
  if (!branchId) {
    throw new Error("branch_id is required for branch overrides");
  }

  // If already a branch-specific package, update it directly
  if (current.branch_id === branchId) {
    const query = `
      UPDATE test_packages
      SET package_name = :package_name,
          category = :category,
          description = :description,
          price = :price,
          is_active = :is_active,
          test_ids = :test_ids::jsonb,
          updated_at = NOW()
      WHERE id = :id
      RETURNING *
    `;
    const rows = await sequelize.query(query, {
      replacements: {
        id,
        package_name: package_name !== undefined ? package_name : current.package_name,
        category: category !== undefined ? category : current.category,
        description: description !== undefined ? description : current.description,
        price: price !== undefined ? Number(price) : current.price,
        is_active: is_active !== undefined ? is_active : current.is_active,
        test_ids: JSON.stringify(test_ids !== undefined ? test_ids : (current.test_ids || []))
      },
      type: sequelize.QueryTypes.SELECT
    });
    return rows[0] || null;
  }

  // Overriding a global package for this branch: insert a branch-specific copy
  const query = `
    INSERT INTO test_packages (id, package_name, package_code, category, description, price, is_active, branch_id, test_ids, created_at, updated_at)
    VALUES (gen_random_uuid(), :package_name, :package_code, :category, :description, :price, :is_active, :branch_id, :test_ids::jsonb, NOW(), NOW())
    RETURNING *
  `;
  const rows = await sequelize.query(query, {
    replacements: {
      package_name: package_name !== undefined ? package_name : current.package_name,
      package_code: current.package_code,
      category: category !== undefined ? category : current.category,
      description: description !== undefined ? description : current.description,
      price: price !== undefined ? Number(price) : current.price,
      is_active: is_active !== undefined ? is_active : current.is_active,
      branch_id: branchId,
      test_ids: JSON.stringify(test_ids !== undefined ? test_ids : (current.test_ids || []))
    },
    type: sequelize.QueryTypes.SELECT
  });
  return rows[0] || null;
};

// Delete a package
exports.deletePackage = async (id) => {
  const rows = await sequelize.query("DELETE FROM test_packages WHERE id = :id RETURNING *", {
    replacements: { id },
    type: sequelize.QueryTypes.SELECT
  });
  return rows[0] || null;
};
