import mongoose from "mongoose";
import { NotFoundError } from "../../errors/not-found.js";
import InventoryItem from "../Inventories/InventoryItem.js";
import InventoryType from "../Inventories/InventoryType.js";

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      index: {
        unique: true,
        collation: {
          locale: "en",
          strength: 1,
        },
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// product + size -> PK
// Product price calculations
const ProductPriceSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  size: {
    type: String,
    enum: ["small", "medium", "large", "fixed"],
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
});

// Inventory updating
const RecipieSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
    unique: true,
  },
  ingredient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InventoryItem",
    required: true,
    unique: true,
    validate: {
      validator: async function (id) {
        const item = await InventoryItem.findById(id).populate("type");
        if (!item) {
          throw new NotFoundError("Item does not exist in inventory");
        }
        return item.type.name === "ingredient";
      },
      message:
        "The item is not of type 'ingredient'. Please create at least one in the 'inventory' section unser 'management'",
    },
  },
  size: {
    type: String,
    enum: ["small", "medium", "large", "fixed"],
    unique: true,
    required: true,
  },
  units: {
    type: Number,
    required: true,
  },
});

// If name + category + recipe || category + recipe were used as PK
// We should always make 3 , 1 for each size. Errors can happen

// const ProductSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//   },

//   category: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Category",
//     required: true,
//   },
//   recipe: {
//     type: String,
//     required: true,
//   },
//   ingredients: [
//     {
//       ingredient: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "Ingredient",
//         required: true,
//       },
//       quantity: {
//         small: {
//           type: Number,
//           required: function () {
//             return this.category.hasSizes === "true";
//           },
//         },
//         medium: {
//           type: Number,
//           required: function () {
//             return this.category.hasSizes === "true";
//           },
//         },
//         large: {
//           type: Number,
//           required: function () {
//             return this.category.hasSizes === "true";
//           },
//         },
//         fixed: {
//           type: Number,
//           required: function () {
//             return this.category.hasSizes === "false";
//           },
//         },
//       },
//     },
//   ],
//   sizes: [
//     {
//       size: {
//         type: String,
//         enum: ["small", "medium", "large", "fixed"],
//         required: true,
//       },
//       price: {
//         type: Number,
//         required: true,
//       },
//     },
//   ],
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

ProductSchema.pre("remove", async function () {
  await ProductPrice.deleteMany({ product: this._id });
  await Recipie.deleteMany({ product: this._id });
});

const Product = mongoose.model("Product", ProductSchema);
const ProductPrice = mongoose.model("ProductPrice", ProductPriceSchema);
const Recipie = mongoose.model("Recipie", RecipieSchema);
export { Product, ProductPrice, Recipie };
