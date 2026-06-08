const CollectionTracking = require("../models/CollectionTracking");
const User = require("../models/User");
const { uploadBase64ToCloudinary } = require("../utils/upload");

/**
 * Save a base64 image to Cloudinary under the branch's collection-tracking folder
 * @param {string} base64String - Full data URI
 * @param {string} prefix - Filename prefix (e.g., 'start', 'end', 'bike')
 * @param {string} branchId - Branch UUID for folder organization
 * @returns {Promise<string|null>} Cloudinary secure URL or null
 */
async function saveBase64Image(base64String, prefix, branchId) {
  if (!base64String || !base64String.startsWith("data:image/")) return null;

  try {
    const url = await uploadBase64ToCloudinary(
      base64String,
      prefix,
      branchId,
      "collection-tracking"
    );
    return url;
  } catch (error) {
    console.error("Failed to upload collection tracking image:", error.message);
    return null;
  }
}

/**
 * GET /collection-tracking
 * List all records with filters (admin view)
 */
exports.getAll = async (req, res) => {
  try {
    const { staff_id, branch_id, date_from, date_to, date } = req.query;
    const records = await CollectionTracking.getAll({
      staff_id,
      branch_id,
      date_from,
      date_to,
      date,
    });
    res.json({ message: "Records fetched", data: records });
  } catch (err) {
    console.error("Get collection tracking error:", err);
    res.status(500).json({ error: "Failed to fetch records" });
  }
};

/**
 * GET /collection-tracking/today
 * Get today's records for the logged-in staff (multiple per day)
 */
exports.getToday = async (req, res) => {
  try {
    const records = await CollectionTracking.getTodayByStaff(req.user.id);
    res.json({ message: "Today's records", data: records });
  } catch (err) {
    console.error("Get today tracking error:", err);
    res.status(500).json({ error: "Failed to fetch today's records" });
  }
};

/**
 * GET /collection-tracking/my-records
 * Get all records for the logged-in staff (with optional date filters)
 */
exports.getMyRecords = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    const records = await CollectionTracking.getAll({
      staff_id: req.user.id,
      date_from,
      date_to,
    });
    res.json({ message: "My records fetched", data: records });
  } catch (err) {
    console.error("Get my records error:", err);
    res.status(500).json({ error: "Failed to fetch your records" });
  }
};

/**
 * GET /collection-tracking/summary
 * Get salary summary for a staff member over a date range
 */
exports.getSummary = async (req, res) => {
  try {
    const { staff_id, date_from, date_to } = req.query;
    if (!staff_id || !date_from || !date_to) {
      return res.status(400).json({ error: "staff_id, date_from, and date_to are required" });
    }
    const summary = await CollectionTracking.getSalarySummary(staff_id, date_from, date_to);
    res.json({ message: "Summary fetched", data: summary });
  } catch (err) {
    console.error("Get summary error:", err);
    res.status(500).json({ error: "Failed to fetch summary" });
  }
};

/**
 * GET /collection-tracking/staff-list
 * Get list of staff users for admin dropdown
 */
exports.getStaffList = async (req, res) => {
  try {
    const adminId = req.user?.id;
    const users = await User.getAllUsers(adminId);
    const staff = users.filter(
      (u) => u.is_active && (u.role === "staff" || u.role === "lab_technician")
    );
    res.json({
      message: "Staff list fetched",
      data: staff.map((u) => ({
        id: u.id,
        firstname: u.firstname,
        lastname: u.lastname,
        role: u.role,
      })),
    });
  } catch (err) {
    console.error("Get staff list error:", err);
    res.status(500).json({ error: "Failed to fetch staff list" });
  }
};

/**
 * GET /collection-tracking/:id
 * Get a single record
 */
exports.getById = async (req, res) => {
  try {
    const record = await CollectionTracking.getById(req.params.id);
    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.json({ message: "Record fetched", data: record });
  } catch (err) {
    console.error("Get tracking by id error:", err);
    res.status(500).json({ error: "Failed to fetch record" });
  }
};

/**
 * POST /collection-tracking
 * Create a new tracking record (staff can create multiple per day)
 */
exports.create = async (req, res) => {
  try {
    const {
      start_km,
      end_km,
      start_meter_image,
      end_meter_image,
      bike_image,
      visit_charge,
      per_km_rate,
      branch_id,
      date,
    } = req.body;

    // Upload images to Cloudinary under the branch's collection-tracking folder
    const startImgPath = await saveBase64Image(start_meter_image, "start", branch_id);
    const endImgPath = await saveBase64Image(end_meter_image, "end", branch_id);
    const bikeImgPath = await saveBase64Image(bike_image, "bike", branch_id);

    // If no per_km_rate provided, use user's petrol_price_per_km
    let rate = per_km_rate;
    if (rate == null || rate === undefined) {
      const userRecord = await User.findUserById(req.user.id);
      rate = userRecord?.petrol_price_per_km || 0;
    }

    const record = await CollectionTracking.create({
      staff_id: req.user.id,
      branch_id,
      date,
      start_km,
      end_km,
      start_meter_image: startImgPath,
      end_meter_image: endImgPath,
      bike_image: bikeImgPath,
      visit_charge,
      per_km_rate: rate,
    });

    res.status(201).json({ message: "Record created", data: record });
  } catch (err) {
    console.error("Create tracking error:", err);
    res.status(500).json({ error: "Failed to create record" });
  }
};

/**
 * PUT /collection-tracking/:id
 * Update a tracking record (staff enters end KM, admin edits)
 */
exports.update = async (req, res) => {
  try {
    const existing = await CollectionTracking.getById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: "Record not found" });
    }

    const {
      start_km,
      end_km,
      start_meter_image,
      end_meter_image,
      bike_image,
      visit_charge,
      per_km_rate,
    } = req.body;

    // Use existing record's branch_id for Cloudinary folder
    const branchId = existing.branch_id;

    // Upload images to Cloudinary under the branch's collection-tracking folder
    const startImgPath = await saveBase64Image(start_meter_image, "start", branchId);
    const endImgPath = await saveBase64Image(end_meter_image, "end", branchId);
    const bikeImgPath = await saveBase64Image(bike_image, "bike", branchId);

    const record = await CollectionTracking.update(req.params.id, {
      start_km,
      end_km,
      start_meter_image: startImgPath || undefined,
      end_meter_image: endImgPath || undefined,
      bike_image: bikeImgPath || undefined,
      visit_charge,
      per_km_rate,
    });

    res.json({ message: "Record updated", data: record });
  } catch (err) {
    console.error("Update tracking error:", err);
    res.status(500).json({ error: "Failed to update record" });
  }
};

/**
 * DELETE /collection-tracking/:id
 * Delete a tracking record (admin only)
 */
exports.delete = async (req, res) => {
  try {
    const result = await CollectionTracking.delete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.json({ message: "Record deleted" });
  } catch (err) {
    console.error("Delete tracking error:", err);
    res.status(500).json({ error: "Failed to delete record" });
  }
};
