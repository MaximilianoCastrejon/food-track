import mongoose from "mongoose";
import InventoryItem from "../Inventories/InventoryItem.js";
import InventoryType from "../Inventories/InventoryType.js";

const ExtrasSchema = new mongoose.Schema({
  ingredient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InventoryItem",
    unique: true,
    validate: {
      validator: async function (id) {
        const item = await InventoryItem.findById(id);
        const isIngredient = await InventoryType.findById(item.type);
        return isIngredient.name === "ingredient";
      },
      message:
        "The type of that item is not of 'ingredient' type, please provide only ingredients for Extras",
    },
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
});

const Extras = mongoose.model("Extras", ExtrasSchema);
export default Extras;
