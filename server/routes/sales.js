import express from "express";
import * as salesController from "../controllers/sales.js";
import { saleTransactionMiddleware } from "../middleware/postSale.js";
const router = express.Router();

router
  .route("/orders")
  .get(salesController.getAllOrders)
  .post(saleTransactionMiddleware, salesController.createOrder);
router
  .route("/orders/:id")
  .get(salesController.getOrder)
  .put(salesController.updateOrder)
  .delete(salesController.deleteOrder);
router
  .route("/customers")
  .get(salesController.getAllOrders)
  .post(saleTransactionMiddleware, salesController.createOrder);
router
  .route("/customers/:id")
  .get(salesController.getOrder)
  .put(salesController.updateOrder)
  .delete(salesController.deleteOrder);

router
  .route("/customers/loyalty")
  .get(salesController.getAllOrders)
  .post(saleTransactionMiddleware, salesController.createOrder);
router
  .route("/customers/:id/loyalty/")
  .get(salesController.getOrder)
  .put(salesController.updateOrder)
  .delete(salesController.deleteOrder);
router
  .route("/loyalty/tiers")
  .get(salesController.getAllOrders)
  .post(saleTransactionMiddleware, salesController.createOrder);
router
  .route("/loyalty/tiers/:id")
  .get(salesController.getOrder)
  .put(salesController.updateOrder)
  .delete(salesController.deleteOrder);

router.route("/orders/:orderId/packages/:packageId/products/:productId").post();

router.route("/").get().post(saleTransactionMiddleware);
router.route("/:id").get().patch().delete();

export default router;
