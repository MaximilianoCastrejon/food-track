import express from "express";
import {
  getProducts,
  createProduct,
  deleteProduct,
  getProductById,
  updateProduct,
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/client.js";

const router = express.Router();

router.route("/products").get(getProducts).post(createProduct);
router
  .route("/products/:id")
  .delete(deleteProduct)
  .patch(updateProduct)
  .get(getProductById);
router.route("/products/categories").get(getAllCategories).post(createCategory);
router
  .route("/products/categories/:id")
  .get(getCategory)
  .patch(updateCategory)
  .delete(deleteCategory);
export default router;
