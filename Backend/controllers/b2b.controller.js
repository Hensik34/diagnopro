const B2BLab = require("../models/B2BLab");
const B2BOrder = require("../models/B2BOrder");
const B2BPayment = require("../models/B2BPayment");
const B2BAudit = require("../models/B2BAudit");

// ==========================================
// LAB MANAGEMENT
// ==========================================

exports.createLab = async (req, res) => {
  try {
    const lab = await B2BLab.createLab({ ...req.body, created_by: req.user.id });
    await B2BAudit.log({
      entity_type: 'lab', entity_id: lab.id, action: 'created',
      new_value: JSON.stringify(lab), performed_by: req.user.id, ip_address: req.ip
    });
    res.status(201).json({ message: "B2B Lab created", data: lab });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: "Lab code already exists" });
    console.error("Create B2B lab error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAllLabs = async (req, res) => {
  try {
    const labs = await B2BLab.getAllLabs(req.query.owner_branch_id || null);
    res.json({ message: "Labs retrieved", count: labs.length, data: labs });
  } catch (err) {
    console.error("Get labs error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getLabById = async (req, res) => {
  try {
    const lab = await B2BLab.getLabById(req.params.id);
    if (!lab) return res.status(404).json({ error: "Lab not found" });
    res.json({ message: "Lab retrieved", data: lab });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateLab = async (req, res) => {
  try {
    const old = await B2BLab.getLabById(req.params.id);
    if (!old) return res.status(404).json({ error: "Lab not found" });

    const lab = await B2BLab.updateLab(req.params.id, req.body, req.body.version);
    await B2BAudit.log({
      entity_type: 'lab', entity_id: lab.id, action: 'updated',
      old_value: JSON.stringify(old), new_value: JSON.stringify(lab),
      performed_by: req.user.id, ip_address: req.ip
    });
    res.json({ message: "Lab updated", data: lab });
  } catch (err) {
    if (err.message.includes('CONFLICT')) return res.status(409).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
};

exports.deleteLab = async (req, res) => {
  try {
    const result = await B2BLab.softDeleteLab(req.params.id);
    if (!result) return res.status(404).json({ error: "Lab not found" });
    await B2BAudit.log({
      entity_type: 'lab', entity_id: req.params.id, action: 'deleted',
      performed_by: req.user.id, ip_address: req.ip
    });
    res.json({ message: "Lab deactivated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// RATE LISTS
// ==========================================

exports.getRateList = async (req, res) => {
  try {
    const rates = await B2BLab.getRateList(req.params.labId);
    res.json({ message: "Rate list retrieved", count: rates.length, data: rates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.upsertRate = async (req, res) => {
  try {
    const rate = await B2BLab.upsertRate(
      req.params.labId, req.body.test_id, req.body.collection_price, req.body.processing_price
    );
    res.json({ message: "Rate saved", data: rate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.bulkUpsertRates = async (req, res) => {
  try {
    const results = await B2BLab.bulkUpsertRates(req.params.labId, req.body.rates);
    res.json({ message: "Rates saved", count: results.length, data: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteRate = async (req, res) => {
  try {
    const result = await B2BLab.deleteRate(req.params.labId, req.params.rateId);
    if (!result) return res.status(404).json({ error: "Rate not found" });
    res.json({ message: "Rate deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// ORDERS
// ==========================================

exports.createOrder = async (req, res) => {
  try {
    // Check credit limit
    const creditCheck = await B2BLab.checkCreditLimit(
      req.body.source_lab_id,
      req.body.tests?.reduce((sum, t) => sum + (parseFloat(t.processing_price) || 0), 0) || 0
    );
    if (!creditCheck.allowed) {
      return res.status(400).json({ error: creditCheck.reason, details: creditCheck });
    }

    // Check for duplicates
    if (req.body.patient_id && req.body.tests?.length) {
      const testIds = req.body.tests.map(t => t.test_id);
      const duplicates = await B2BOrder.checkDuplicateOrder(req.body.source_lab_id, req.body.patient_id, testIds);
      if (duplicates.length > 0) {
        return res.status(400).json({
          error: "Duplicate order detected for same patient/tests within 24 hours",
          duplicates
        });
      }
    }

    const order = await B2BOrder.createOrder({ ...req.body, created_by: req.user.id });

    await B2BAudit.log({
      entity_type: 'order', entity_id: order.id, action: 'created',
      new_value: JSON.stringify({ order_code: order.order_code, barcode: order.barcode }),
      performed_by: req.user.id, ip_address: req.ip
    });

    // Notify processing lab
    await B2BAudit.createNotification({
      user_id: null, type: 'sample_received',
      title: `New outsource order ${order.order_code}`,
      message: `${order.tests?.length || 0} tests from ${req.body.source_lab_name || 'partner lab'}`,
      order_id: order.id
    });

    res.status(201).json({ message: "Order created", data: order });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: "Duplicate test in order" });
    console.error("Create order error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    // B2B lab users can only see their own orders
    const filters = { ...req.query };
    if (req.user.source === 'b2b_lab' && req.user.b2b_lab_id) {
      filters.source_lab_id = req.user.b2b_lab_id;
    }
    const orders = await B2BOrder.getAllOrders(filters);
    res.json({ message: "Orders retrieved", count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await B2BOrder.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Access control: B2B lab users can only see their own orders
    if (req.user.source === 'b2b_lab' && req.user.b2b_lab_id && order.source_lab_id !== req.user.b2b_lab_id) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({ message: "Order retrieved", data: order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOrderByBarcode = async (req, res) => {
  try {
    const order = await B2BOrder.getOrderByBarcode(req.params.barcode);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order retrieved", data: order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const old = await B2BOrder.getOrderById(req.params.id);
    if (!old) return res.status(404).json({ error: "Order not found" });

    const order = await B2BOrder.updateOrderField(req.params.id, req.body, req.body.version);
    await B2BAudit.log({
      entity_type: 'order', entity_id: req.params.id, action: 'updated',
      old_value: JSON.stringify({ status: old.status }),
      new_value: JSON.stringify(req.body),
      performed_by: req.user.id, ip_address: req.ip
    });
    res.json({ message: "Order updated", data: order });
  } catch (err) {
    if (err.message.includes('CONFLICT')) return res.status(409).json({ error: err.message });
    res.status(500).json({ error: err.message });
  }
};

exports.receiveOrder = async (req, res) => {
  try {
    const order = await B2BOrder.receiveOrder(req.params.id, req.body.received_time);
    if (!order) return res.status(404).json({ error: "Order not found" });

    await B2BAudit.log({
      entity_type: 'order', entity_id: req.params.id, action: 'sample_received',
      performed_by: req.user.id, ip_address: req.ip
    });

    // Notify collection lab
    await B2BAudit.createNotification({
      b2b_lab_id: order.source_lab_id, type: 'sample_received',
      title: `Sample received: ${order.order_code}`,
      message: `Your sample has been received at the processing lab`,
      order_id: order.id
    });

    res.json({ message: "Sample received", data: order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await B2BOrder.cancelOrder(req.params.id, req.body.reason, req.user.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    await B2BAudit.log({
      entity_type: 'order', entity_id: req.params.id, action: 'cancelled',
      new_value: JSON.stringify({ reason: req.body.reason }),
      performed_by: req.user.id, ip_address: req.ip
    });

    res.json({ message: "Order cancelled", data: order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// PER-TEST STATUS
// ==========================================

exports.updateTestStatus = async (req, res) => {
  try {
    const { status, rejection_reason, report_id, report_version } = req.body;
    const oldTest = await B2BOrder.getOrderTest(req.params.testId);
    if (!oldTest) return res.status(404).json({ error: "Order test not found" });

    const test = await B2BOrder.updateTestStatus(req.params.testId, status, {
      rejection_reason, report_id, report_version
    });

    await B2BAudit.log({
      entity_type: 'order_test', entity_id: req.params.testId,
      action: 'status_changed',
      old_value: oldTest.status, new_value: status,
      performed_by: req.user.id, ip_address: req.ip
    });

    // Notifications based on status
    if (status === 'completed' || status === 'approved') {
      await B2BAudit.createNotification({
        b2b_lab_id: oldTest.source_lab_id, type: 'report_completed',
        title: `Report ready: ${oldTest.test_name}`,
        message: `Report for ${oldTest.test_name} (Order: ${oldTest.order_code}) is now ${status}`,
        order_id: oldTest.order_id
      });
    }
    if (status === 'rejected') {
      await B2BAudit.createNotification({
        b2b_lab_id: oldTest.source_lab_id, type: 'sample_rejected',
        title: `Test rejected: ${oldTest.test_name}`,
        message: rejection_reason || 'Test has been rejected',
        order_id: oldTest.order_id
      });
    }

    res.json({ message: "Test status updated", data: test });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// REPORT VERSIONS
// ==========================================

exports.uploadReportVersion = async (req, res) => {
  try {
    const { order_test_id, report_id, file_url, report_data, revision_reason } = req.body;

    // Get current version number
    const latest = await B2BOrder.getLatestReportVersion(order_test_id);
    const versionNumber = latest ? latest.version_number + 1 : 1;

    const version = await B2BOrder.createReportVersion({
      order_test_id, report_id, version_number: versionNumber,
      file_url, report_data, uploaded_by: req.user.id, revision_reason,
      status: 'uploaded'
    });

    // Update test's report version
    await B2BOrder.updateTestStatus(order_test_id, 'completed', { report_version: versionNumber });

    await B2BAudit.log({
      entity_type: 'report', entity_id: order_test_id,
      action: versionNumber > 1 ? 'report_revised' : 'report_uploaded',
      new_value: JSON.stringify({ version: versionNumber }),
      performed_by: req.user.id, ip_address: req.ip
    });

    res.status(201).json({ message: "Report version uploaded", data: version });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getReportVersions = async (req, res) => {
  try {
    const versions = await B2BOrder.getReportVersions(req.params.orderTestId);
    res.json({ message: "Report versions retrieved", data: versions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.approveReport = async (req, res) => {
  try {
    const version = await B2BOrder.approveReportVersion(req.params.versionId, req.user.id);
    if (!version) return res.status(404).json({ error: "Report version not found" });

    // Update test status to approved
    await B2BOrder.updateTestStatus(version.order_test_id, 'approved');

    await B2BAudit.log({
      entity_type: 'report', entity_id: version.order_test_id,
      action: 'report_approved', performed_by: req.user.id, ip_address: req.ip
    });

    res.json({ message: "Report approved", data: version });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.releaseReport = async (req, res) => {
  try {
    const version = await B2BOrder.releaseReportVersion(req.params.versionId, req.user.id);
    if (!version) return res.status(404).json({ error: "Report version not found" });

    await B2BAudit.log({
      entity_type: 'report', entity_id: version.order_test_id,
      action: 'report_released', performed_by: req.user.id, ip_address: req.ip
    });

    // Notify collection lab
    const test = await B2BOrder.getOrderTest(version.order_test_id);
    if (test) {
      await B2BAudit.createNotification({
        b2b_lab_id: test.source_lab_id, type: 'report_released',
        title: `Report released: ${test.test_name}`,
        message: `Report is now available for download`,
        order_id: test.order_id
      });
    }

    res.json({ message: "Report released", data: version });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// PAYMENTS
// ==========================================

exports.recordPayment = async (req, res) => {
  try {
    const payment = await B2BPayment.recordPayment({ ...req.body, created_by: req.user.id });
    await B2BAudit.log({
      entity_type: 'payment', entity_id: payment.id, action: 'payment_recorded',
      new_value: JSON.stringify({ type: payment.payment_type, amount: payment.amount }),
      performed_by: req.user.id, ip_address: req.ip
    });
    res.status(201).json({ message: "Payment recorded", data: payment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const payments = await B2BPayment.getPaymentsByLab(req.params.labId, req.query);
    res.json({ message: "Payments retrieved", count: payments.length, data: payments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getLabLedger = async (req, res) => {
  try {
    const ledger = await B2BPayment.getLabLedger(req.params.labId);
    if (!ledger) return res.status(404).json({ error: "Lab not found" });
    res.json({ message: "Ledger retrieved", data: ledger });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSettlementSummary = async (req, res) => {
  try {
    const summary = await B2BPayment.getSettlementSummary(req.query.owner_branch_id || null);
    res.json({ message: "Settlement summary", data: summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const payment = await B2BPayment.softDeletePayment(req.params.id);
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    await B2BAudit.log({
      entity_type: 'payment', entity_id: req.params.id, action: 'deleted',
      old_value: JSON.stringify(payment), performed_by: req.user.id, ip_address: req.ip
    });
    res.json({ message: "Payment deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// DASHBOARD
// ==========================================

exports.getDashboard = async (req, res) => {
  try {
    const stats = await B2BOrder.getDashboardStats(req.query.owner_branch_id || null);
    const tatBreaches = await B2BOrder.getTATBreachedTests(req.query.dest_branch_id || null);
    res.json({
      message: "Dashboard retrieved",
      data: { ...stats, tat_breached_tests: tatBreaches.slice(0, 10) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// NOTIFICATIONS
// ==========================================

exports.getNotifications = async (req, res) => {
  try {
    const filters = { ...req.query };
    if (req.user.source === 'b2b_lab' && req.user.b2b_lab_id) {
      filters.b2b_lab_id = req.user.b2b_lab_id;
    }
    const notifications = await B2BAudit.getNotifications(filters);
    res.json({ message: "Notifications retrieved", count: notifications.length, data: notifications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const n = await B2BAudit.markNotificationRead(req.params.id);
    if (!n) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Marked as read", data: n });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    const count = await B2BAudit.markAllNotificationsRead(req.user.id, req.query.b2b_lab_id);
    res.json({ message: `${count} notifications marked as read` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ==========================================
// AUDIT LOG
// ==========================================

exports.getAuditLog = async (req, res) => {
  try {
    const logs = await B2BAudit.getAuditLog(req.query);
    res.json({ message: "Audit log retrieved", count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
