import mongoose from "mongoose";

const PackagingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
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

const Packaging = mongoose.model("Packaging", PackagingSchema);
export default Packaging;
