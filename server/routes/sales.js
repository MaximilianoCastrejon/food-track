import express from "express";
import * as salesController from "../controllers/sales.js";
const router = express.Router();

router
  .route("/orders")
  .get(salesController.getAllOrders)
  .post(salesController.createOrder);
router
  .route("/orders/:id")
  .get(salesController.getOrder)
  .put(salesController.updateOrder)
  .delete(salesController.deleteOrder);
router
  .route("/customers")
  .get(salesController.getAllCustomers)
  .post(salesController.createCustomer);
router
  .route("/customers/:id")
  .get(salesController.getCustomer)
  .put(salesController.updateCustomer)
  .delete(salesController.deleteCustomer);

// router
//   .route("/customers/loyalty")
//   .get(salesController.getAllOrders)
//   .post(salesController.createOrder);
// router
//   .route("/customers/:id/loyalty/")
//   .get(salesController.getOrder)
//   .put(salesController.updateOrder)
//   .delete(salesController.deleteOrder);

// router
//   .route("/loyalty/tiers")
//   .get(salesController.getAllOrders)
//   .post(salesController.createOrder);
// router
//   .route("/loyalty/tiers/:id")
//   .get(salesController.getOrder)
//   .put(salesController.updateOrder)
//   .delete(salesController.deleteOrder);

router.route("/orders/:orderId/packages/:packageId/products/:productId").post();

router.route("/").get().post();
router.route("/:id").get().patch().delete();

export default router;
