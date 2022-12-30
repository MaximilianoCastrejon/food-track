import express from "express";
import { getUser } from "../controllers/general.js";
const router = express.Router();

// May need name refactoring
router.route("/").get().post(); //Routes that do not require params
router.route("/user/:id").get(getUser);

export default router;
