import mongoose from "mongoose";
import InventoryHistory from "../Inventories/InventoryHistory.js";

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
  sourceName: {
    type: String,
    required: true,
  },
  concept: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ExpenseConcept",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    // validate: {
    //   validator: async function (date) {
    //     const inventoryRegistry = new Date(
    //       date.getFullYear(),
    //       date.getMonth(),
    //       date.getDate()
    //     );
    //     const sameAsSomeInventoryRegistryDate = await InventoryHistory.find({
    //       createdAt: inventoryRegistry,
    //     }).select("createdAt");
    //     console.log(
    //       "sameAsSomeInventoryRegistryDate",
    //       sameAsSomeInventoryRegistryDate
    //     );
    //     return sameAsSomeInventoryRegistryDate !== null;
    //   },
    // },
  },
  updatedAt: { type: Date, default: Date.now() },

  // any other relevant fields
});

// ExpenseSchema.pre("save", async function () {});
// ExpenseSchema.pre("update");

const ExpenseConcept = mongoose.model("ExpenseConcept", ExpenseConceptSchema);
const Expense = mongoose.model("Expense", ExpenseSchema);
export { Expense, ExpenseConcept };
