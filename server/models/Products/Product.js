import mongoose from "mongoose";
import { NotFoundError } from "../../errors/not-found.js";
import InventoryItem from "../Inventories/InventoryItem.js";
import InventoryType from "../Inventories/InventoryType.js";
import ProductStat from "./ProductStat.js";

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
    index: true,
  },
  size: {
    type: String,
    enum: ["small", "medium", "large", "fixed"],
    required: true,
    index: true,
  },
  price: {
    type: Number,
    required: true,
  },
});

// Inventory updating
const RecipeSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
    index: true,
  },
  ingredient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InventoryItem",
    required: true,
    index: true,
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
    index: true,
    required: true,
  },
  units: {
    type: Number,
    required: true,
  },
});

RecipeSchema.index({ product: 1, ingredient: 1, size: 1 }, { unique: true });
ProductPriceSchema.index({ product: 1, size: 1 }, { unique: true });

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

ProductSchema.pre("deleteMany", async function (next) {
  await ProductPrice.deleteMany({ product: this._id });
  await Recipe.deleteMany({ product: this._id });
  await ProductStat.deleteOne({ product: this._id });
  next();
});
ProductSchema.pre("deleteOne", async function (next) {
  await ProductPrice.deleteMany({ product: this._id });
  await Recipe.deleteMany({ product: this._id });
  await ProductStat.deleteOne({ product: this._id });
  next();
});
ProductSchema.pre("findOneAndDelete", async function (next) {
  await ProductPrice.deleteMany({ product: this._id });
  await Recipe.deleteMany({ product: this._id });
  await ProductStat.deleteOne({ product: this._id });
  next();
});

const Product = mongoose.model("Product", ProductSchema);
const ProductPrice = mongoose.model("ProductPrice", ProductPriceSchema);
const Recipe = mongoose.model("Recipe", RecipeSchema);
export { Product, ProductPrice, Recipe };
