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
  getAllPackageOptions,
  getPackageOption,
  createPackageOption,
  updatePackageOption,
  deletePackageOption,
  getAllExtras,
  getExtra,
  createExtra,
  updateExtra,
  deleteExtra,
} from "../controllers/client.js";

const router = express.Router();

router.route("/products").get(getProducts).post(createProduct);
router
  .route("/products/:id")
  .delete(deleteProduct)
  .patch(updateProduct)
  .get(getProductById);

router.route("/products/:id/inventory").delete().patch().get();

router.route("/packages").get(getAllPackageOptions).post(createPackageOption);
router
  .route("/packages/:id")
  .get(getPackageOption)
  .patch(updatePackageOption)
  .delete(deletePackageOption);

router.route("/categories").get(getAllCategories).post(createCategory);
router
  .route("/categories/:id")
  .get(getCategory)
  .patch(updateCategory)
  .delete(deleteCategory);

router.route("/extras").get(getAllExtras).post(createExtra);
router
  .route("/extras/:id")
  .get(getExtra)
  .patch(updateExtra)
  .delete(deleteExtra);
export default router;
