import express from "express";
import * as assetCategoryController from "../controllers/inventories/asset-category.js";
import * as assetsController from "../controllers/inventories/assets.js";
import * as cleaningSuppliesController from "../controllers/inventories/cleaning-supplies.js";
import * as ingredientsController from "../controllers/inventories/ingredients.js";
import * as marketingMaterialController from "../controllers/inventories/marketing-material.js";
import * as packagingController from "../controllers/inventories/packaging.js";
import * as storagedGoodsController from "../controllers/inventories/storaged-goods.js";
import { getAllInventory } from "../controllers/management.js";

const router = express.Router();

router.route("/inventory").get(getAllInventory);

router
  .route("/inventory/assets/category")
  .get(assetCategoryController.getAllAssetCategories)
  .post(assetCategoryController.createAssetCategory);
router
  .route("/inventory/assets/category/:id")
  .patch(assetCategoryController.updateAssetCategory)
  .delete(assetCategoryController.deleteAssetCategory)
  .get(assetCategoryController.getAssetCategory);

router
  .route("/inventory/cleaning")
  .get(cleaningSuppliesController.getAllCleaningSupplies)
  .post(cleaningSuppliesController.createCleaningSupplies);
router
  .route("/inventory/cleaning/:id")
  .patch(cleaningSuppliesController.updateCleaningSupplies)
  .delete(cleaningSuppliesController.deleteCleaningSupplies)
  .get(cleaningSuppliesController.getCleaningSupplies);

router
  .route("/inventory/marketing")
  .get(marketingMaterialController.getAllMarketingMaterial)
  .post(marketingMaterialController.createMarketingMaterial); // Maybe delete
router
  .route("/inventory/marketing/:id")
  .patch(marketingMaterialController.updateMarketingMaterial)
  .delete(marketingMaterialController.deleteMarketingMaterial)
  .get(marketingMaterialController.getMarketingMaterial);

router
  .route("/inventory/packaging")
  .get(packagingController.getAllPackaging)
  .post(packagingController.createPackaging);
router
  .route("/inventory/packaging/:id")
  .patch(packagingController.updatePackaging)
  .delete(packagingController.deletePackaging)
  .get(packagingController.getPackaging);

router
  .route("/inventory/storage")
  .get(storagedGoodsController.getAllStoragedGoods)
  .post(storagedGoodsController.createStoragedGood);
router
  .route("/inventory/storage/:id")
  .patch(storagedGoodsController.updateStoragedGood)
  .delete(storagedGoodsController.deleteStoragedGood)
  .get(storagedGoodsController.getStoragedGood);

router
  .route("/inventory/assets")
  .get(assetsController.getAllAssets)
  .post(assetsController.createAsset);
router
  .route("/inventory/assets/:id")
  .patch(assetsController.updateAsset)
  .delete(assetsController.deleteAsset)
  .get(assetsController.getAsset);

router
  .route("/inventory/ingredients")
  .get(ingredientsController.getAllIngredients)
  .post(ingredientsController.createIngredient);
router
  .route("/inventory/ingredients/:id")
  .patch(ingredientsController.updateIngredient)
  .delete(ingredientsController.deleteIngredient)
  .get(ingredientsController.getIngredient);

export default router;
