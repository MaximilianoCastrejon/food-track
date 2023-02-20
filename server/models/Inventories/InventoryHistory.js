import mongoose from "mongoose";

// Daily registry

// Items como refrescos o botellas de agua revendidos tienen ingrediente su propio nombre
// usedUnits pueden verse afectados por ordenes,
// Front-end GET a list of products, ingredient, and size from Order. Find Recipes units and update date's InventoryHistory
// There are some calculated daily and some that are not (i.e. cleaning material, oil, gas, etc)
const InventoryHistorySchema = mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    expenses: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Expense",
    },
    beginningInventory: { type: Number, required: true },
    endingInventory: { type: Number },
    usedUnits: { type: Number, default: 0 },
    wastedUnits: { type: Number, default: 0 },
  },
  { timestamps: true, timezone: "UTC" }
);

InventoryHistorySchema.pre("save", function (next) {
  if (!this.endingInventory) {
    this.endingInventory = this.beginningInventory;
  }
  next();
});

const InventoryHistory = mongoose.model(
  "InventoryHistory",
  InventoryHistorySchema
);
export default InventoryHistory;
