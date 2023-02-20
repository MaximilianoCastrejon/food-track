import mongoose from "mongoose";
import InventoryItem from "./InventoryItem.js";

const InventoryTypeSchema = mongoose.Schema({
  name: { type: String, unique: true, required: true },
});

InventoryTypeSchema.pre("remove", async function (next) {
  await InventoryItem.deleteMany({ type: this._id });
  next();
});

const InventoryType = mongoose.model("InventoryType", InventoryTypeSchema);
export default InventoryType;
