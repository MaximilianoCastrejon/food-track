import express from "express";
import {
  getProducts,
  createProduct,
  deleteProduct,
  getProductById,
  updateProduct,
  createCategory,
} from "../controllers/client.js";

const router = express.Router();

router.route("/products").get(getProducts).post(createProduct);
router
  .route("/products/:id")
  .delete(deleteProduct)
  .patch(updateProduct)
  .get(getProductById);
router.route("/products/categories").post(createCategory);
export default router;
