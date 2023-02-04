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

//GET info from all registires or one
router
  .route("/inventory/history/registries")
  .get(managementController.getAllInventoryHistory);
router
  .route("/inventory/history/registries/:id")
  .get(managementController.getInventoryHistory)
  .patch(managementController.updateInventoryHistory);
// I dont need to access or query all registries at once
router
  .route("/inventory/history/items/")
  .post(managementController.createInventoryHistoryItem);
router
  .route("/inventory/history/items/:id")
  .delete(managementController.deleteInventoryHistoryItem);

router
  .route("/inventory/types")
  .get(managementController.getAllInventoryTypes)
  .post(managementController.createInventoryType);
router
  .route("/inventory/types/:id")
  .patch(managementController.updateInventoryType)
  .delete(managementController.deleteInventoryType)
  .get(managementController.getInventoryType);

router
  .route("/stats/")
  .get(managementController.getAllProductStats)
  .post(managementController.createProductStat);
router
  .route("/stats/:id")
  .get(managementController.getItemProductStats)
  .patch(/* From orders */)
  .delete(/* Entire item registry */);

export default router;
