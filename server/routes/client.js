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

router.route("/products/:id/inventory").delete().patch().get();

router.route("/packages").get().post();
router.route("/packages/:id").get().patch().delete();

router.route("/packages/:packageId/options/:categoryId").get().patch().delete();

router.route("/products/categories").patch();

router.route("/categories").get(getAllCategories).post(createCategory);
router
  .route("/categories/:id")
  .get(getCategory)
  .patch(updateCategory)
  .delete(deleteCategory);
export default router;
