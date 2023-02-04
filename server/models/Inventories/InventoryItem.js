import mongoose from "mongoose";
import { Recipie } from "../Products/Product.js";
import InventoryHistory from "./InventoryHistory.js";

// Display as columns. Y axis = units, X axis = all
// Update current level when new InventoryHistory is created
const InventoryItemSchema = mongoose.Schema({
  name: { type: String, unique: true, require: true },
  type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InventoryType",
    required: true,
  },
  unitOfMeasurement: { type: String, require: true },
  currentLevel: { type: Number, require: true },
  thresholdLevel: { type: Number, require: true },
});

InventoryItemSchema.pre("remove", function (next) {
  Recipie.deleteMany({ ingredient: this._id });
  InventoryHistory.deleteMany({ item: this._id }, next);
});

const InventoryItem = mongoose.model("InventoryItem", InventoryItemSchema);
export default InventoryItem;
