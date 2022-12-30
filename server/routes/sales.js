import express from "express";
import { getSales, getUserSales } from "../controllers/sales.js";
const router = express.Router();

router.route("/").get(getSales).post(); //Routes that do not require params
router.route("/id").get(getUserSales).patch().delete();

export default router;
