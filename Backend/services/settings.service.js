const Settings = require("../models/Settings");
const Doctor = require("../models/Doctor");

/**
 * Settings Service - Business logic for branch settings management
 */
const SettingsService = {
  /**
   * Get settings by branch_id
   * @param {string} branchId - Branch ID
   * @returns {Promise<Object|null>} - Settings object
   */
  getSettingsByBranch: async (branchId) => {
    try {
      const settings = await Settings.getByBranchId(branchId);
      return settings;
    } catch (error) {
      console.error("Error in SettingsService.getSettingsByBranch:", error);
      throw error;
    }
  },

  /**
   * Upsert settings with letterhead and signatures
   * @param {string} branchId - Branch ID
   * @param {Object} data - Settings data
   * @returns {Promise<Object>} - Updated settings
   */
  upsertSettings: async (branchId, data) => {
    try {
      const settingsData = {
        branch_id: branchId,
        letterhead_url: data.letterhead_url,
        owner_signature_url: data.owner_signature_url,
        header_url: data.header_url,
        footer_url: data.footer_url,
        report_margin_top: data.report_margin_top,
        report_margin_bottom: data.report_margin_bottom,
        report_margin_left: data.report_margin_left,
        report_margin_right: data.report_margin_right,
        header_safe_area: data.header_safe_area,
        footer_safe_area: data.footer_safe_area,
        letterhead_detected_top: data.letterhead_detected_top,
        letterhead_detected_bottom: data.letterhead_detected_bottom,
        letterhead_detected_left: data.letterhead_detected_left,
        letterhead_detected_right: data.letterhead_detected_right,
        letterhead_margins_auto: data.letterhead_margins_auto,
        signature_1_url: data.signature_1_url,
        signature_1_label: data.signature_1_label,
        signature_2_url: data.signature_2_url,
        signature_2_label: data.signature_2_label,
        signature_3_url: data.signature_3_url,
        signature_3_label: data.signature_3_label,
        signature_4_url: data.signature_4_url,
        signature_4_label: data.signature_4_label,
        default_signature_index: data.default_signature_index,
        sample_id_format: data.sample_id_format,
        sample_id_reset_policy: data.sample_id_reset_policy,
        sample_id_fy_start_month: data.sample_id_fy_start_month,
        sample_id_start_number: data.sample_id_start_number,
      };
      
      const settings = await Settings.upsert(settingsData);
      return settings;
    } catch (error) {
      console.error("Error in SettingsService.upsertSettings:", error);
      throw error;
    }
  },

  /**
   * Remove/clear a specific image field
   * @param {string} branchId - Branch ID
   * @param {string} fieldName - Field to clear
   * @returns {Promise<Object|null>} - Updated settings
   */
  removeImage: async (branchId, fieldName) => {
    try {
      const settings = await Settings.clearField(branchId, fieldName);
      return settings;
    } catch (error) {
      console.error("Error in SettingsService.removeImage:", error);
      throw error;
    }
  },

  /**
   * Update doctor signature
   * @param {string} doctorId - Doctor ID
   * @param {string} filePath - Relative file path
   * @returns {Promise<Object>} - Updated doctor
   */
  updateDoctorSignature: async (doctorId, filePath) => {
    try {
      const doctor = await Doctor.getDoctorById(doctorId);
      if (!doctor) {
        throw new Error("Doctor not found");
      }

      const updatedDoctor = await Doctor.updateDoctor(doctorId, {
        signature_url: filePath
      });

      return updatedDoctor;
    } catch (error) {
      console.error("Error in SettingsService.updateDoctorSignature:", error);
      throw error;
    }
  },

  /**
   * Get doctor signature URL
   * @param {string} doctorId - Doctor ID
   * @returns {Promise<string|null>} - Signature URL
   */
  getDoctorSignature: async (doctorId) => {
    try {
      const doctor = await Doctor.getDoctorById(doctorId);
      return doctor?.signature_url || null;
    } catch (error) {
      console.error("Error in SettingsService.getDoctorSignature:", error);
      throw error;
    }
  }
};

module.exports = SettingsService;