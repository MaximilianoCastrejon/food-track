import mongoose from "mongoose";

// Register each day beginning inventory
// Make business expenses table
// (for discrepancies between total amount of ingredients used and ending inventory
// in case some ingredients were purchased in the same day)
// Get yesterday's ending inventory to fill out for today's beginning
// Any difference from yesterday's to today's will be considered yesterday's waste
const InventoryHistorySchema = mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    unitCost: Number,
    unitsUsed: Number,
    purchasedUnits: Number,
    beginningInventory: Number,
    endingInventory: Number,
    wastedUnits: Number,
    wasteCost: Number,
    thresholdLevel: Number,
  },
  { timestamp: true }
);

const InventoryHistory = mongoose.model(
  "InventoryHistory",
  InventoryHistorySchema
);
export default InventoryHistory;
