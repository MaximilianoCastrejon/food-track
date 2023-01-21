import mongoose from "mongoose";
import { ProductIngredient } from "../Products/Product.js";
import InventoryHistory from "./InventoryHistory.js";

// Display as columns. Y axis = units, X axis = all
const InventoryItemSchema = mongoose.Schema({
  name: String,
  type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InventoryType",
    required: true,
  },
  unitOfMeasurement: String,
  currentLevel: Number,
  thresholdLevel: Number,
});

InventoryItemSchema.pre("remove", function (next) {
  ProductIngredient.deleteMany({ ingredient: this._id });
  InventoryHistory.deleteMany({ item: this._id }, next);
});

const InventoryItem = mongoose.model("InventoryItem", InventoryItemSchema);
export default InventoryItem;
