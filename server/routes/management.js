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

router
  .route("/inventory/history")
  .get(managementController.getAllInventoryHistory)
  .post();
router.route("/inventory/:id/history").get().post();

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
