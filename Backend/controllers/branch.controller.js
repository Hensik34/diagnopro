const Branch = require("../models/Branch");
const Doctor = require("../models/Doctor");

// GET ALL BRANCHES (user's or doctor's branches)
exports.getAllBranches = async (req, res) => {
  try {
    const { id, source } = req.user;

    let branches;
    if (source === "doctor") {
      // Direct doctor login — fetch from doctor_branches
      branches = await Doctor.getDoctorBranches(id);
      // Add user_role for compatibility
      branches = branches.map(b => ({ ...b, user_role: "doctor" }));
    } else {
      branches = await Branch.getAllBranches(id);
    }

    res.json({
      message: "Branches retrieved successfully",
      count: branches.length,
      data: branches
    });
  } catch (err) {
    console.error("Get branches error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET USER'S BRANCHES (handles both user and doctor login)
exports.getUserBranches = async (req, res) => {
  try {
    const { id, source } = req.user; // From auth middleware

    let branches;
    if (source === "doctor") {
      branches = await Doctor.getDoctorBranches(id);
      branches = branches.map(b => ({ ...b, user_role: "doctor" }));
    } else {
      branches = await Branch.getUserBranches(id);
    }

    res.json({
      message: "User branches retrieved successfully",
      count: branches.length,
      data: branches
    });
  } catch (err) {
    console.error("Get user branches error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET BRANCH BY ID
exports.getBranchById = async (req, res) => {
  try {
    const { id } = req.params;

    const branch = await Branch.getBranchById(id);

    if (!branch) {
      return res.status(404).json({ error: "Branch not found" });
    }

    res.json({
      message: "Branch retrieved successfully",
      data: branch
    });
  } catch (err) {
    console.error("Get branch error:", err);
    res.status(500).json({ error: err.message });
  }
};

// CREATE BRANCH
exports.createBranch = async (req, res) => {
  try {
    const { name, location, city, state, postal_code, phone, email, latitude, longitude, geofence_radius_meters } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validation
    if (!name || !location) {
      return res.status(400).json({ error: "name and location are required" });
    }

    const branch = await Branch.createBranch({
      name,
      location,
      city,
      state,
      postal_code,
      phone,
      email,
      latitude: latitude != null ? parseFloat(latitude) : null,
      longitude: longitude != null ? parseFloat(longitude) : null,
      geofence_radius_meters: geofence_radius_meters != null ? parseInt(geofence_radius_meters, 10) : 150,
    });

    // Auto-link the creating user to this branch
    await Branch.assignUserToBranch(userId, branch.id, userRole === 'admin' ? 'admin' : userRole);

    res.status(201).json({
      message: "Branch created successfully",
      data: branch
    });
  } catch (err) {
    console.error("Create branch error:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE BRANCH
exports.updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, city, state, postal_code, phone, email, latitude, longitude, geofence_radius_meters } = req.body;

    const branch = await Branch.updateBranch(id, {
      name,
      location,
      city,
      state,
      postal_code,
      phone,
      email,
      latitude: latitude !== undefined ? (latitude != null ? parseFloat(latitude) : null) : undefined,
      longitude: longitude !== undefined ? (longitude != null ? parseFloat(longitude) : null) : undefined,
      geofence_radius_meters: geofence_radius_meters !== undefined ? (geofence_radius_meters != null ? parseInt(geofence_radius_meters, 10) : 150) : undefined,
    });

    if (!branch) {
      return res.status(404).json({ error: "Branch not found" });
    }

    res.json({
      message: "Branch updated successfully",
      data: branch
    });
  } catch (err) {
    console.error("Update branch error:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE BRANCH
exports.deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Branch.deleteBranch(id);

    if (!result) {
      return res.status(404).json({ error: "Branch not found" });
    }

    res.json({
      message: "Branch deleted successfully",
      data: result
    });
  } catch (err) {
    console.error("Delete branch error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ASSIGN USER TO BRANCH
exports.assignUserToBranch = async (req, res) => {
  try {
    const { user_id, branch_id, role } = req.body;

    if (!user_id || !branch_id) {
      return res.status(400).json({ error: "user_id and branch_id are required" });
    }

    const assignment = await Branch.assignUserToBranch(user_id, branch_id, role || "staff");

    res.status(201).json({
      message: "User assigned to branch successfully",
      data: assignment
    });
  } catch (err) {
    console.error("Assign user to branch error:", err);
    res.status(500).json({ error: err.message });
  }
};

// REMOVE USER FROM BRANCH
exports.removeUserFromBranch = async (req, res) => {
  try {
    const { user_id, branch_id } = req.body;

    if (!user_id || !branch_id) {
      return res.status(400).json({ error: "user_id and branch_id are required" });
    }

    const result = await Branch.removeUserFromBranch(user_id, branch_id);

    if (!result) {
      return res.status(404).json({ error: "User not assigned to this branch" });
    }

    res.json({
      message: "User removed from branch successfully"
    });
  } catch (err) {
    console.error("Remove user from branch error:", err);
    res.status(500).json({ error: err.message });
  }
};
