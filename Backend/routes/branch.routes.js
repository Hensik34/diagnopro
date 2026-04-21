const express = require("express");
const router = express.Router();
const { authorize, authenticate, PERMISSIONS } = require("../middlewere/authorize");
const branchController = require("../controllers/branch.controller");

// ==========================================
// BRANCH ROUTES - RBAC Protected
// ==========================================

// Get all branches
router.get("/", authorize(PERMISSIONS.BRANCH_READ), branchController.getAllBranches);

// Get user's assigned branches (authenticated user's branches)
router.get("/user/branches", authenticate, branchController.getUserBranches);

// Get branch by ID
router.get("/:id", authorize(PERMISSIONS.BRANCH_READ), branchController.getBranchById);

// Create new branch
router.post("/", authorize(PERMISSIONS.BRANCH_CREATE), branchController.createBranch);

// Update branch
router.put("/:id", authorize(PERMISSIONS.BRANCH_UPDATE), branchController.updateBranch);

// Delete branch
router.delete("/:id", authorize(PERMISSIONS.BRANCH_DELETE), branchController.deleteBranch);

// Assign user to branch
router.post("/assign-user", authorize(PERMISSIONS.BRANCH_ASSIGN_USER), branchController.assignUserToBranch);

// Remove user from branch
router.post("/remove-user", authorize(PERMISSIONS.BRANCH_ASSIGN_USER), branchController.removeUserFromBranch);

module.exports = router;
