import express from "express";
import * as salesController from "../controllers/sales.js";
const router = express.Router();

router
  .route("/orders")
  .get(salesController.getAllOrders)
  .post(salesController.createOrder);
router.route("/orders/:id").patch(salesController.updateOrder);

router.route("/orders/:orderId/packages/:packageId/products/:productId").post();

router.route("/").get().post();
router.route("/:id").get().patch().delete();

export default router;
