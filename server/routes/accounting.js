import express from "express";
import {
  createExpense,
  createExpenseConcept,
  getAllExpenseConcepts,
  getAllExpenses,
} from "../controllers/accounting.js";

const router = express.Router();

router.route("/balance").get().post();
router.route("/balance/:id").get().post();

router.route("/expenses").get(getAllExpenses).post(createExpense);
router.route("/expenses/:id").get().patch().delete();

router
  .route("/expenses/concepts")
  .get(getAllExpenseConcepts)
  .post(createExpenseConcept);
router.route("/expenses/concepts/:id").get().patch().delete();

export default router;
