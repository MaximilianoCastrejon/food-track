import mongoose from "mongoose";
import InventoryHistory from "../Inventories/InventoryHistory.js";

const IncomeConceptSchema = mongoose.Schema({
  concept: String,
});
const IncomeSchema = mongoose.Schema({
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
    ref: "IncomeSource",
    require: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    validate: {
      validator: async function (date) {
        const inventoryRegistry = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        );
        const sameAsSomeInventoryRegistryDate = await InventoryHistory.find({
          createdAt: inventoryRegistry,
        }).select("createdAt");
        console.log(
          "sameAsSomeInventoryRegistryDate",
          sameAsSomeInventoryRegistryDate
        );
        return sameAsSomeInventoryRegistryDate !== null;
      },
    },
  },
  updatedAt: { type: Date, default: Date.now() },
});

const IncomeConcept = mongoose.model("IncomeConcept", IncomeConceptSchema);
const Income = mongoose.model("Income", IncomeSchema);
export { IncomeConcept, Income };
