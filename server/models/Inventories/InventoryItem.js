import mongoose from "mongoose";
import { Recipe } from "../Products/Product.js";
import InventoryHistory from "./InventoryHistory.js";

// Display as columns. Y axis = units, X axis = all
// Update current level when new InventoryHistory is created
const InventoryItemSchema = mongoose.Schema({
  name: {
    type: String,
    unique: true,
    require: true,
    set: function (value) {
      return value.toLowerCase();
    },
    validate: {
      validator: function (value) {
        return /^[\w\s]+$/i.test(value);
      },
      message: (props) =>
        `'${props.value}' is not a valid name, please only use letters, numbers and spaces`,
    },
  },
  type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InventoryType",
    required: true,
  },
  unitOfMeasurement: {
    type: String,
    require: true,
    enum: ["ml", "l", "c", "mg", "g", "kg", "lb", "oz", "unit"],
    set: function (value) {
      return value.toLowerCase();
    },
  },
  currentLevel: { type: Number, require: true },
  thresholdLevel: { type: Number, require: true },
});

InventoryItemSchema.pre("remove", function (next) {
  Recipe.deleteMany({ ingredient: this._id });
  InventoryHistory.deleteMany({ item: this._id });
  next();
});

const InventoryItem = mongoose.model("InventoryItem", InventoryItemSchema);
export default InventoryItem;
