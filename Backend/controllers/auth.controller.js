const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Branch = require("../models/Branch");

// REGISTER - Self-registration (always creates admin/branch owner)
exports.register = async (req, res) => {
  const { firstname, lastname, email, password, phone } = req.body;

  // Validation
  if (!firstname || !lastname || !email || !password) {
    return res.status(400).json({ 
      error: "firstname, lastname, email, and password are required" 
    });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findUserByEmail(email);

    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Self-registered users are always admin (branch owner), created_by = null
    const user = await User.createUser(firstname, lastname, email, password, phone, "admin", 0, null);

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      user,
      token
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message });
  }
};

// CREATE SUB-USER - Admin creates staff/technician/doctor and links to branch
exports.createUser = async (req, res) => {
  const { firstname, lastname, email, password, phone, role, petrol_price_per_km, branch_id } = req.body;
  const adminId = req.user.id;

  // Validation
  if (!firstname || !lastname || !email || !password) {
    return res.status(400).json({ 
      error: "firstname, lastname, email, and password are required" 
    });
  }

  // Admins can only create non-admin roles via this endpoint
  const allowedRoles = ["staff", "lab_technician", "doctor"];
  if (role && !allowedRoles.includes(role)) {
    return res.status(400).json({ 
      error: `Invalid role. Allowed roles: ${allowedRoles.join(", ")}` 
    });
  }

  try {
    // Check if email already exists
    const existingUser = await User.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Create sub-user with created_by = admin's ID
    const user = await User.createUser(
      firstname, lastname, email, password, phone,
      role || "staff", petrol_price_per_km || 0, adminId
    );

    // If branch_id provided, link user to that branch
    // Otherwise, link to all of admin's branches
    if (branch_id) {
      await Branch.assignUserToBranch(user.id, branch_id, role || "staff");
    } else {
      const adminBranches = await Branch.getAllBranches(adminId);
      for (const branch of adminBranches) {
        await Branch.assignUserToBranch(user.id, branch.id, role || "staff");
      }
    }

    res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (err) {
    console.error("Create user error:", err);
    res.status(500).json({ error: err.message });
  }
};

// CHECK EMAIL - Check if email is already registered
exports.checkEmail = async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const existingUser = await User.findUserByEmail(email);
    res.json({ exists: !!existingUser });
  } catch (err) {
    console.error("Check email error:", err);
    res.status(500).json({ error: err.message });
  }
};

// LOGIN - Authenticate user and return token
exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Find user by email
    const user = await User.findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Verify password
    const isPasswordValid = await User.verifyPassword(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      },
      token
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET USER DETAILS
exports.getUserProfile = async (req, res) => {
  try {
    const { id } = req.user; // From auth middleware

    const user = await User.findUserById(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Profile retrieved successfully",
      data: user
    });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE USER DETAILS
exports.updateUserProfile = async (req, res) => {
  const { firstname, lastname, phone } = req.body;
  const { id } = req.user; // From auth middleware

  try {
    const user = await User.updateUserProfile(id, firstname, lastname, phone);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// ADMIN USER MANAGEMENT
// ==========================================

// GET ALL USERS (admin sees only their sub-users + self)
exports.getAllUsers = async (req, res) => {
  try {
    const adminId = req.user.id;
    const users = await User.getAllUsers(adminId);
    res.json({
      message: "Users retrieved successfully",
      count: users.length,
      data: users,
    });
  } catch (err) {
    console.error("Get all users error:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE USER (admin)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstname, lastname, phone, role, petrol_price_per_km } = req.body;

    const user = await User.updateUser(id, { firstname, lastname, phone, role, petrol_price_per_km });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "User updated successfully",
      data: user,
    });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: err.message });
  }
};

// TOGGLE USER STATUS (admin)
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Get current status
    const currentUser = await User.findUserById(id);
    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    let user;
    if (currentUser.is_active) {
      user = await User.deactivateUser(id);
    } else {
      user = await User.activateUser(id);
    }

    res.json({
      message: `User ${user.is_active ? 'activated' : 'deactivated'} successfully`,
      data: user,
    });
  } catch (err) {
    console.error("Toggle user status error:", err);
    res.status(500).json({ error: err.message });
  }
};