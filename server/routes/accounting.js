import express from "express";
import * as accountControllers from "../controllers/accounting.js";

const router = express.Router();

router.route("/balance").get().post();
router.route("/balance/:id").get().post();

router
  .route("/expenses")
  .get(accountControllers.getAllExpenses)
  .post(accountControllers.createExpense)
  .delete(accountControllers.deleteExpensesBySource);
router
  .route("/expenses/:id")
  .get(accountControllers.getExpenseById)
  .patch(accountControllers.updateExpense)
  .delete(accountControllers.deleteExpense);

router
  .route("/expenses/concepts")
  .get(accountControllers.getAllExpenseConcepts)
  .post(accountControllers.createExpenseConcept);
router
  .route("/expenses/concepts/:id")
  .patch(accountControllers.updateExpenseConcept)
  .delete(accountControllers.deleteExpenseConcept);

router
  .route("/income")
  .get(accountControllers.getAllIncomes)
  .post(accountControllers.createIncome)
  .delete(accountControllers.deleteIncomesBySource);
router
  .route("/income/:id")
  .get(accountControllers.getIncomeById)
  .patch(accountControllers.updateIncome)
  .delete(accountControllers.deleteIncome);

export default router;
