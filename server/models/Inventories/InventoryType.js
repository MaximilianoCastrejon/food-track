import mongoose from "mongoose";

const InventoryTypeSchema = mongoose.Schema({
  name: { type: String, unique: true, required: true },
});

InventoryTypeSchema.pre("remove", function (next) {
  InventoryItem.deleteMany({ type: this._id }, next);
});

const InventoryType = mongoose.model("InventoryType", InventoryTypeSchema);
export default InventoryType;
