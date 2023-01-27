import mongoose from "mongoose";

// calculate total from inventory History
// Concepts: Inventory Expenses

const ExpenseConceptSchema = new mongoose.Schema({
  concept: {
    // Machinery, inventories, equipment
    type: String,
    required: true,
  },
});

const ExpenseSchema = new mongoose.Schema({
  value: {
    type: Number,
    required: true,
  },
  units: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  concept: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ExpenseConcept",
    required: true,
  },
  createdAt: { type: Date, default: Date.now() },
  updatedAt: { type: Date, default: Date.now() },

  // any other relevant fields
});

const ExpenseConcept = mongoose.model("ExpenseConcept", ExpenseConceptSchema);
const Expense = mongoose.model("Expense", ExpenseSchema);
export { Expense, ExpenseConcept };
