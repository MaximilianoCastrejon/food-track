import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// product + size -> PK
const ProductSizeSchema = new mongoose.Schema({
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

// const IngredientSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

const ProductIngredientSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  ingredient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RawIngredient",
    required: true,
  },
  quantity: {
    small: {
      type: Number,
      required: function () {
        return this.product.category.hasSizes === true;
      },
    },
    medium: {
      type: Number,
      required: function () {
        return this.product.category.hasSizes === true;
      },
    },
    large: {
      type: Number,
      required: function () {
        return this.product.category.hasSizes === true;
      },
    },
    fixed: {
      type: Number,
      required: function () {
        return this.product.category.hasSizes === false;
      },
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

// ProductSchema.pre("save", function (next) {
//   // Decrement the quantity of each ingredient in the inventory when a product is ordered
//   this.ingredients.forEach((ingredient) => {
//     const reduce_by = this.ingredients.map((item) => {
//       const { ingredient, quantity } = item;

//       Ingredient.findByIdAndUpdate(
//         ingredient._id,
//         { $inc: { quantity: -quantity } },
//         (err, updatedIngredient) => {
//           if (err) {
//             return next(err);
//           }
//           if (!updatedIngredient) {
//             return next(
//               new Error(`Ingredient with id ${ingredient} not found`)
//             );
//           }
//         }
//       );
//     });
//   });
//   next();
// });

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
export default {
  Product,
  ProductSize,
  ProductCategory,
  ProductIngredient,
};
