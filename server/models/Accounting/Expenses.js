import mongoose from "mongoose";

// calculate total from inventory History
// Concepts: Inventory Expenses

const ExpenseConceptSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  concept: {
    type: String,
    required: true,
  },
  // any other relevant fields
});

const ExpenseSchema = new mongoose.Schema(
  {
    value: {
      type: Number,
      required: true,
    },
    concept: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Source",
      required: true,
    },
    sourceType: {
      type: String,
      required: true,
    },
    // any other relevant fields
  },
  { timestamps: true }
);

const ExpenseConcept = mongoose.model("ExpenseConcept", ExpenseConceptSchema);
const Expense = mongoose.model("Expense", ExpenseSchema);
export { Expense, ExpenseConcept };
