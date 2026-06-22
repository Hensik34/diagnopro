const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Branch = require("../models/Branch");
const Doctor = require("../models/Doctor");
const { PasswordResetOtp } = require("../models");
const { sendWelcomeEmail, sendOtpEmail } = require("../services/mail.service");

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

    // Also check doctors table
    const existingDoctor = await Doctor.findDoctorByEmail(email);
    if (existingDoctor) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Self-registered users are always admin (branch owner), created_by = null
    const user = await User.createUser(firstname, lastname, email, password, phone, "admin", 0, null);

    // Create JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, source: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Send welcome email (fire-and-forget — don't block the response)
    sendWelcomeEmail({ firstname, email: user.email }).catch((err) => {
      console.error("Failed to send welcome email:", err.message);
    });

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

// CREATE SUB-USER - Admin creates staff/technician and links to branch
// NOTE: Doctors are created via the doctor routes, NOT here anymore
exports.createUser = async (req, res) => {
  const { firstname, lastname, email, password, phone, role, petrol_price_per_km, branch_id } = req.body;
  const adminId = req.user.id;

  // Validation
  if (!firstname || !lastname || !email || !password) {
    return res.status(400).json({
      error: "firstname, lastname, email, and password are required"
    });
  }

  // Admins can only create non-admin, non-doctor roles via this endpoint
  // Doctors should be created via /doctors route
  const allowedRoles = ["staff", "lab_technician"];
  if (role && !allowedRoles.includes(role)) {
    return res.status(400).json({
      error: `Invalid role. Allowed roles: ${allowedRoles.join(", ")}. For doctors, use the Doctor Management page.`
    });
  }

  try {
    // Check if email already exists in users
    const existingUser = await User.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Also check doctors table
    const existingDoctor = await Doctor.findDoctorByEmail(email);
    if (existingDoctor) {
      return res.status(400).json({ error: "Email already registered as a doctor" });
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

// CHECK EMAIL - Check if email is already registered (in users OR doctors)
exports.checkEmail = async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const existingUser = await User.findUserByEmail(email);
    if (existingUser) {
      return res.json({ exists: true });
    }

    const existingDoctor = await Doctor.findDoctorByEmail(email);
    res.json({ exists: !!existingDoctor });
  } catch (err) {
    console.error("Check email error:", err);
    res.status(500).json({ error: err.message });
  }
};

// LOGIN - Unified login: check users table first, then doctors table
exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // ==========================================
    // STEP 1: Check users table first
    // ==========================================
    const user = await User.findUserByEmail(email);

    if (user) {
      // Check if user is active
      if (user.is_active === false) {
        return res.status(403).json({ error: "Your account has been deactivated. Please contact your administrator." });
      }

      // Verify password
      const isPasswordValid = await User.verifyPassword(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Get user's branches with their branch-specific roles
      const branches = await Branch.getUserBranches(user.id);

      // Create JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, source: "user" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      // If user is a doctor role, also get their linked doctor record
      let doctorProfile = null;
      if (user.role === "doctor" || branches.some(b => b.user_role === "doctor")) {
        doctorProfile = await Doctor.getDoctorByUserId(user.id);
      }

      return res.json({
        message: "Login successful",
        user: {
          id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          role: user.role,
          created_at: user.created_at
        },
        branches: branches.map(b => ({
          id: b.id,
          name: b.name,
          location: b.location,
          city: b.city,
          role: b.user_role
        })),
        doctorProfile,
        token
      });
    }

    // ==========================================
    // STEP 2: Not in users table — check doctors table
    // ==========================================
    const doctor = await Doctor.findDoctorByEmail(email);

    if (!doctor) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if doctor is active
    if (doctor.is_active === false) {
      return res.status(403).json({ error: "Your account has been deactivated. Please contact your administrator." });
    }

    // Check if doctor has a password set
    if (!doctor.password_hash) {
      return res.status(401).json({ error: "No login credentials set. Please contact your administrator to set up your password." });
    }

    // Verify doctor password
    const isDoctorPasswordValid = await Doctor.verifyPassword(password, doctor.password_hash);
    if (!isDoctorPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Get doctor's branches from doctor_branches table
    const doctorBranches = await Doctor.getDoctorBranches(doctor.id);

    // Create JWT token — role is always 'doctor', source is 'doctor'
    const token = jwt.sign(
      { id: doctor.id, email: doctor.email, role: "doctor", source: "doctor" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login successful",
      user: {
        id: doctor.id,
        firstname: doctor.firstname || doctor.name,
        lastname: doctor.lastname || "",
        email: doctor.email,
        role: "doctor",
        created_at: doctor.created_at
      },
      branches: doctorBranches.map(b => ({
        id: b.id,
        name: b.name,
        location: b.location,
        city: b.city,
        role: "doctor"
      })),
      doctorProfile: {
        id: doctor.id,
        title: doctor.title,
        name: doctor.name,
        specialization: doctor.specialization,
        commission_percentage: doctor.commission_percentage,
        phone: doctor.phone,
        email: doctor.email,
        signature_url: doctor.signature_url
      },
      token
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET USER DETAILS - Works for both users and doctors
exports.getUserProfile = async (req, res) => {
  try {
    const { id, source } = req.user; // From auth middleware

    if (source === "doctor") {
      // Doctor logged in directly
      const doctor = await Doctor.getDoctorById(id);
      if (!doctor) {
        return res.status(404).json({ error: "Doctor profile not found" });
      }

      return res.json({
        message: "Profile retrieved successfully",
        data: {
          id: doctor.id,
          firstname: doctor.firstname || doctor.name,
          lastname: doctor.lastname || "",
          email: doctor.email,
          phone: doctor.phone,
          role: "doctor",
          is_active: doctor.is_active,
          created_at: doctor.created_at,
          updated_at: doctor.updated_at
        }
      });
    }

    // Regular user
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
  const { id, source } = req.user; // From auth middleware

  try {
    if (source === "doctor") {
      // Update doctor profile directly
      const doctor = await Doctor.updateDoctor(id, {
        name: firstname && lastname ? `${firstname} ${lastname}`.trim() : undefined,
        phone
      });

      if (!doctor) {
        return res.status(404).json({ error: "Doctor profile not found" });
      }

      return res.json({
        message: "Profile updated successfully",
        user: {
          id: doctor.id,
          firstname: doctor.firstname || doctor.name,
          lastname: doctor.lastname || "",
          email: doctor.email,
          phone: doctor.phone,
          role: "doctor",
          created_at: doctor.created_at,
          updated_at: doctor.updated_at
        }
      });
    }

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

// ==========================================
// FORGOT PASSWORD FLOW
// ==========================================

// STEP 1: Request OTP — generates a 6-digit OTP and emails it
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    // Check if user exists (in users table OR doctors table)
    const user = await User.findUserByEmail(email);
    const doctor = !user ? await Doctor.findDoctorByEmail(email) : null;

    // Always return success — even if email not found (security best practice)
    if (!user && !doctor) {
      return res.json({
        message: "If this email is registered, you will receive a verification code shortly."
      });
    }

    // Invalidate any existing unused OTPs for this email
    await PasswordResetOtp.update(
      { is_used: true },
      { where: { email, is_used: false } }
    );

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const OTP_EXPIRY_MINUTES = 10;

    // Hash OTP before storing (like a password)
    const otpHash = await bcrypt.hash(otp, 10);

    // Store in database
    await PasswordResetOtp.create({
      email,
      otp_hash: otpHash,
      expires_at: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    });

    // Send OTP via email
    await sendOtpEmail(email, otp, OTP_EXPIRY_MINUTES);

    res.json({
      message: "If this email is registered, you will receive a verification code shortly."
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};

// STEP 2: Verify OTP — validates the OTP and returns a short-lived reset token
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  try {
    // Find the latest unused OTP for this email
    const otpRecord = await PasswordResetOtp.findOne({
      where: {
        email,
        is_used: false,
      },
      order: [["created_at", "DESC"]],
    });

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or expired OTP. Please request a new one." });
    }

    // Check if OTP has expired
    if (new Date() > new Date(otpRecord.expires_at)) {
      // Mark as used so it can't be retried
      await otpRecord.update({ is_used: true });
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    // Verify OTP hash
    const isOtpValid = await bcrypt.compare(otp, otpRecord.otp_hash);

    if (!isOtpValid) {
      return res.status(400).json({ error: "Invalid OTP. Please check and try again." });
    }

    // Mark OTP as used
    await otpRecord.update({ is_used: true });

    // Generate a short-lived reset token (15 minutes)
    const resetToken = jwt.sign(
      { email, purpose: "password_reset" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    res.json({
      message: "OTP verified successfully",
      resetToken,
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};

// STEP 3: Reset Password — uses the reset token to set a new password
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: "Token and new password are required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(400).json({ error: "Reset link has expired. Please request a new OTP." });
      }
      return res.status(400).json({ error: "Invalid reset token." });
    }

    if (decoded.purpose !== "password_reset") {
      return res.status(400).json({ error: "Invalid reset token." });
    }

    const { email } = decoded;

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Try updating in users table first
    const { User: UserModel } = require("../models");
    const [userCount] = await UserModel.update(
      { password_hash: passwordHash },
      { where: { email } }
    );

    if (userCount > 0) {
      return res.json({ message: "Password reset successfully. You can now log in with your new password." });
    }

    // Try doctors table
    const { Doctor: DoctorModel } = require("../models");
    const [doctorCount] = await DoctorModel.update(
      { password_hash: passwordHash },
      { where: { email } }
    );

    if (doctorCount > 0) {
      return res.json({ message: "Password reset successfully. You can now log in with your new password." });
    }

    return res.status(404).json({ error: "Account not found." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};

// GOOGLE LOGIN & REGISTRATION
exports.googleLogin = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: "Google idToken is required" });
  }

  try {
    // 1. Verify Google token via Google API tokeninfo endpoint
    let tokenInfo;
    
    // Node 18+ has global fetch, we'll try that first, with a fallback to native https
    if (typeof fetch !== 'undefined') {
      const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
      if (!response.ok) {
        return res.status(400).json({ error: "Invalid or expired Google token" });
      }
      tokenInfo = await response.json();
    } else {
      tokenInfo = await new Promise((resolve, reject) => {
        const https = require("https");
        https.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`, (response) => {
          let data = "";
          response.on("data", (chunk) => { data += chunk; });
          response.on("end", () => {
            if (response.statusCode !== 200) {
              reject(new Error("Invalid or expired Google token"));
            } else {
              try {
                resolve(JSON.parse(data));
              } catch (e) {
                reject(e);
              }
            }
          });
        }).on("error", (err) => reject(err));
      });
    }

    const { email, given_name, family_name } = tokenInfo;
    if (!email) {
      return res.status(400).json({ error: "Email not provided by Google account" });
    }

    // 2. Check if user already exists (users table)
    let user = await User.findUserByEmail(email);

    if (user) {
      if (user.is_active === false) {
        return res.status(403).json({ error: "Your account has been deactivated. Please contact your administrator." });
      }

      // Get user's branches with their branch-specific roles
      const branches = await Branch.getUserBranches(user.id);

      // Create JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, source: "user" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      // If user is a doctor role, also get their linked doctor record
      let doctorProfile = null;
      if (user.role === "doctor" || branches.some(b => b.user_role === "doctor")) {
        doctorProfile = await Doctor.getDoctorByUserId(user.id);
      }

      return res.json({
        message: "Login successful",
        user: {
          id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          role: user.role,
          created_at: user.created_at
        },
        branches: branches.map(b => ({
          id: b.id,
          name: b.name,
          location: b.location,
          city: b.city,
          role: b.user_role
        })),
        doctorProfile,
        token
      });
    }

    // 3. Check if they are in the doctors table directly
    const doctor = await Doctor.findDoctorByEmail(email);

    if (doctor) {
      if (doctor.is_active === false) {
        return res.status(403).json({ error: "Your account has been deactivated. Please contact your administrator." });
      }

      // Get doctor's branches from doctor_branches table
      const doctorBranches = await Doctor.getDoctorBranches(doctor.id);

      // Create JWT token — role is always 'doctor', source is 'doctor'
      const token = jwt.sign(
        { id: doctor.id, email: doctor.email, role: "doctor", source: "doctor" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.json({
        message: "Login successful",
        user: {
          id: doctor.id,
          firstname: doctor.firstname || doctor.name,
          lastname: doctor.lastname || "",
          email: doctor.email,
          role: "doctor",
          created_at: doctor.created_at
        },
        branches: doctorBranches.map(b => ({
          id: b.id,
          name: b.name,
          location: b.location,
          city: b.city,
          role: "doctor"
        })),
        doctorProfile: {
          id: doctor.id,
          title: doctor.title,
          name: doctor.name,
          specialization: doctor.specialization,
          commission_percentage: doctor.commission_percentage,
          phone: doctor.phone,
          email: doctor.email,
          signature_url: doctor.signature_url
        },
        token
      });
    }

    // 4. If neither exists, self-register the user as admin
    const crypto = require("crypto");
    const randomPassword = crypto.randomBytes(16).toString("hex");
    
    // Self-registered users are always admin (branch owner)
    const newUser = await User.createUser(
      given_name || email.split("@")[0] || "Google",
      family_name || "User",
      email,
      randomPassword,
      null, // phone
      "admin",
      0, // petrol price
      null // created by
    );

    // Create JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, source: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Send welcome email (fire-and-forget)
    sendWelcomeEmail({ firstname: newUser.firstname, email: newUser.email }).catch((err) => {
      console.error("Failed to send welcome email:", err.message);
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser.id,
        firstname: newUser.firstname,
        lastname: newUser.lastname,
        email: newUser.email,
        role: newUser.role,
        created_at: newUser.created_at
      },
      branches: [],
      doctorProfile: null,
      token
    });

  } catch (err) {
    console.error("Google login error:", err);
    return res.status(500).json({ error: err.message || "Failed to process Google sign in" });
  }
};