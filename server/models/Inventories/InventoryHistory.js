import mongoose from "mongoose";

// Daily registry

// Items como refrescos o botellas de agua revendidos tienen ingrediente su propio nombre
// usedUnits pueden verse afectados por ordenes,
// Front-end GET a list of products, ingredient, and size from Order. Find recipies units and update date's InventoryHistory
const InventoryHistorySchema = mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    beginningInventory: { type: Number, required: true },
    endingInventory: Number,
    usedUnits: Number,
    wastedUnits: Number,
    createdAt: { type: Date, default: Date.now() },
    updatedAt: { type: Date, default: Date.now() },
  }
  // { timestamps: true }
);

const InventoryHistory = mongoose.model(
  "InventoryHistory",
  InventoryHistorySchema
);
export default InventoryHistory;
