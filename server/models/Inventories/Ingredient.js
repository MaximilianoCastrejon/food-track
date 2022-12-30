import mongoose from "mongoose";

const RawIngredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    index: {
      unique: true,
      collation: {
        locale: "en",
        strength: 1,
      },
    },
  },
  unit: {
    type: String,
    required: true,
  },
  amountUsed: {
    type: Number,
    required: true,
  },
  costPerUnit: {
    type: Number,
    required: true,
  },
  totalCost: {
    type: Number,
    required: true,
  },
  beginningInventory: {
    type: Number,
    required: true,
  },
  endingInventory: {
    type: Number,
    required: true,
  },
  thresholdInventoryLevels: {
    type: Number,
    required: true,
  },
  dailyConsumptionRate: {
    type: Number,
    required: true,
  },
  wasteQuantity: {
    type: Number,
    required: true,
  },
  wasteCost: {
    type: Number,
    required: true,
  },
});

const RawIngredient = mongoose.model("RawIngredient", RawIngredientSchema);
export default RawIngredient;
