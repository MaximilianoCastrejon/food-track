import express from "express";
import * as productController from "../controllers/client.js";
import { productTransactionMiddleware } from "../middleware/postProduct.js";

const router = express.Router();

router
  .route("/products")
  .get(productController.getProducts)
  .post(productTransactionMiddleware, productController.createProduct);
router
  .route("/products/:id")
  .delete(productController.deleteProduct)
  .patch(productController.updateProduct)
  .get(productController.getProductById);

router
  .route("/products/:id/prices")
  .get(productController.getPrices)
  .post(productTransactionMiddleware, productController.createPrices);

router
  .route("/products/:prodId/prices/:priceId")
  .get(productController.getPrice)
  .patch(productController.updatePrices)
  .delete(productController.deletePrices);

router
  .route("/products/:id/ingredients")
  .get(productController.getAllRecipies)
  .post(productTransactionMiddleware, productController.createRecipie);
router
  .route("/products/:prodId/ingredients/:ingredientId")
  .get(productController.getRecipie)
  .patch(productController.updateRecipie)
  .delete(productController.deleteRecipie);

router
  .route("/packages")
  .get(productController.getAllPackageOptions)
  .post(productController.createPackageOption);
router
  .route("/packages/:id")
  .get(productController.getPackageOption)
  .put(productController.updatePackageOption)
  .delete(productController.deletePackageOption);

router
  .route("/categories")
  .get(productController.getAllCategories)
  .post(productController.createCategory);
router
  .route("/categories/:id")
  .get(productController.getCategory)
  .patch(productController.updateCategory)
  .delete(productController.deleteCategory);

router
  .route("/extras")
  .get(productController.getAllExtras)
  .post(productController.createExtra);
router
  .route("/extras/:id")
  .get(productController.getExtra)
  .patch(productController.updateExtra)
  .delete(productController.deleteExtra);
export default router;
