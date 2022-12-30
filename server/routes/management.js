import express from "express";
import {
  createCleaningSupply,
  createCategory,
  createMarketingMaterial,
  createPackaging,
  createStoragedGood,
  createAsset,
  createAssetCategory,
} from "../controllers/management.js";

const router = express.Router();

router.route("/inventory").get();

router.route("/inventory/ingredients").get().post();
router.route("/inventory/ingredients/:id").patch().delete().get();

router.route("/inventory/cleaning").get();
router.route("/inventory/cleaning/:id").patch().delete().get();

router.route("/inventory/marketing").get(); // Maybe delete
router.route("/inventory/marketing/:id").patch().delete().get();

router.route("/inventory/packaging").get();
router.route("/inventory/packaging/:id").patch().delete().get();

router.route("/inventory/storage").get();
router.route("/inventory/storage/:id").patch().delete().get();

router.route("/inventory/assets").get();
router.route("/inventory/assets/:id").patch().delete().get();

export default router;
