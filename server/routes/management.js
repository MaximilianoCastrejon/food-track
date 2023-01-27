import express from "express";
import * as managementController from "../controllers/management.js";

const router = express.Router();

router
  .route("/inventory/items")
  .get(managementController.getAllInventoryItems)
  .post(managementController.createInventoryItem);
router
  .route("/inventory/items/:id")
  .get(managementController.getInventoryItem)
  .patch(managementController.updateInventoryItem)
  .delete(managementController.deleteInventoryItem);

// I dont need to access or query all registries at once
router
  .route("/inventory/items/history/:id")
  .get(managementController.getInventoryItemHistory);
router
  .route("/inventory/history")
  .get(managementController.getAllInventoryHistory)
  .post(managementController.createInventoryHistory);
router
  .route("/inventory/history/:id")
  .get(managementController.getInventoryHistory)
  .patch(managementController.updateInventoryHistory)
  .delete(managementController.deleteInventoryHistory);

router
  .route("/inventory/types")
  .get(managementController.getAllInventoryTypes)
  .post(managementController.createInventoryType);
router
  .route("/inventory/types/:id")
  .patch(managementController.updateInventoryType)
  .delete(managementController.deleteInventoryType)
  .get(managementController.getInventoryType);

router.route("/inventory/types/:typeId/history").get();

export default router;
