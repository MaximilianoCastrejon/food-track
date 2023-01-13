import mongoose from "mongoose";
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
    description: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { strictPopulate: false }
);

// product + size -> PK
// Product price calculations
const ProductSizeSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
    unique: true,
  },
  size: {
    type: String,
    enum: ["small", "medium", "large", "fixed"],
    required: true,
    unique: true,
  },
  price: {
    type: Number,
    required: true,
  },
});

// Statistical analysis
// Registration of products from category
const ProductCategorySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
});

// Inventory updating
const ProductIngredientSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
    unique: true,
    sparse: true,
  },
  ingredient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InventoryItem",
    required: true,
    unique: true,
    sparse: true,
    validate: {
      validator: async function (id) {
        const item = await InventoryItem.findById(id);
        if (!item) {
          return false;
        }
        const type = await InventoryType.findById(item.type);
        if (!type) {
          return false;
        }
        return type.name === "ingredient";
      },
      message:
        "The item is not of type 'ingredient'. Please create at least one in the 'inventory' section unser 'management'",
    },
  },
  quantity: {
    small: {
      type: Number,
    },
    medium: {
      type: Number,
    },
    large: {
      type: Number,
    },
    fixed: {
      type: Number,
    },
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
  await ProductSize.deleteMany({ product: this._id });
  await ProductCategory.findOneAndDelete({ product: this._id });
  await ProductIngredient.deleteMany({ product: this._id });
});

const Product = mongoose.model("Product", ProductSchema);
const ProductSize = mongoose.model("ProductSize", ProductSizeSchema);
const ProductCategory = mongoose.model(
  "ProductCategory",
  ProductCategorySchema
);
const ProductIngredient = mongoose.model(
  "ProductIngredient",
  ProductIngredientSchema
);
export { Product, ProductSize, ProductCategory, ProductIngredient };
