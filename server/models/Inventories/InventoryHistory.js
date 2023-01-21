import mongoose from "mongoose";

// Daily registry

// Items como refrescos o botellas de agua revendidos tienen ingrediente su propio nombre
// waste and used
const InventoryHistorySchema = mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    beginningInventory: Number,
    endingInventory: Number,
    usedUnits: Number,
    purchasedUnits: Number,
    purchasedCost: Number,
    wastedUnits: Number,
  },
  { timestamp: true }
);

const InventoryHistory = mongoose.model(
  "InventoryHistory",
  InventoryHistorySchema
);
export default InventoryHistory;
