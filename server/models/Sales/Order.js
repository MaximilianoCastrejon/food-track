import mongoose from "mongoose";
import { Expense } from "../Accounting/Expenses.js";
import InventoryHistory from "../Inventories/InventoryHistory.js";
import InventoryItem from "../Inventories/InventoryItem.js";
import Extras from "../Products/Extras.js";
import PackageOption from "../Products/PackageOption.js";
import { Product, ProductPrice, Recipe } from "../Products/Product.js";

// TODO: add packages
const OrderSchema = new mongoose.Schema(
  {
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: function () {
            return !this.packages || this.packages.length === 0;
          },
        },
        size: {
          type: String,
          enum: ["small", "medium", "large", "fixed"],
          required: true,
        },
        quantity: {
          type: Number,
          default: 0,
          required: true,
        },
        excludedIngredients: {
          type: [mongoose.Schema.Types.ObjectId],
          ref: "Recipe",
        },
      },
    ],
    packages: {
      type: [
        {
          package: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PackageOption",
            required: function () {
              return !this.products || this.products.length === 0;
            },
          },
          packageProducts: {
            type: [
              {
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
                quantity: {
                  type: Number,
                  default: 0,
                  required: true,
                },
                excludedIngredients: {
                  type: [mongoose.Schema.Types.ObjectId],
                  ref: "Recipe",
                },
              },
            ],
          },
          quantity: {
            type: Number,
            default: 0,
            required: true,
          },
        },
      ],
    },
    extras: [
      {
        item: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Extras",
        },
        quantity: {
          type: Number,
        },
      },
    ],
  },
  { timestamps: true }
);

export const ExcludedIngredientsSchema = mongoose;

// Validate products have category and don't exceed maxCount

// Update inventory (products & packages)
OrderSchema.pre("save", async function (next) {
  const packageProducts = [
    ...this.packages.map((option) => {
      option.packageProducts.map((product) => {
        return (product.quantity *= option.quantity);
      });
      return option.packageProducts;
    }),
  ];
  const productList = [...this.products, ...packageProducts];
  for (const product of productList) {
    const recipe = await Recipe.find({
      product: product.product,
      size: product.size,
    });
    for (const ingredient of recipe) {
      const excluded = new Map(
        product.excludedIngredients.map((id) => {
          return id;
        })
      );
      if (!excluded.has(ingredient.ingredient)) {
        await InventoryHistory.findOneAndUpdate(
          { item: ingredient.ingredient, createdAt: this.createdAt },
          { $inc: { unitsUsed: -ingredient.units * product.quantity } }
        );
        await InventoryItem.findByIdAndUpdate(ingredient._id, {
          $inc: { currentLevel: -ingredient.units * product.quantity },
        });
      }
    }
    // const price = await ProductPrice.findOne({
    //   product: product.product,
    //   size: product.size,
    // });
  }
  next();
});

OrderSchema.methods.updateInventory = async function (cb) {
  const packageProducts = [
    ...this.packages.map((option) => {
      option.packageProducts.map((product) => {
        return (product.quantity *= option.quantity);
      });
      return option.packageProducts;
    }),
  ];
  const productList = [...this.products, ...packageProducts];
  for (const product of productList) {
    const recipe = await Recipe.find({
      product: product.product,
      size: product.size,
    });
    for (const ingredient of recipe) {
      const excluded = new Map(
        product.excludedIngredients.map((id) => {
          return id;
        })
      );
      if (!excluded.has(ingredient.ingredient)) {
        const ingredientName = await InventoryItem.findById(
          ingredient.ingredient
        );
        const expenses = await Expense.find({
          sourceName: ingredientName.name,
          createdAt: this.createdAt,
        }).select("units");
        let unitsPurchased = 0;
        if (expenses) {
          unitsPurchased = expenses.reduce((acc, expense) => {
            return (acc += expense.units);
          }, 0);
        }
        const invRegistry = await InventoryHistory.findOneAndUpdate(
          { item: ingredient.ingredient, createdAt: this.createdAt },
          {
            $inc: {
              unitsUsed: ingredient.units * product.quantity,
              endingInventory: -ingredient.units * product.quantity,
            },
          }
        );
        let inventoriesMarginalChange = 0;
        if (!invRegistry) {
          this.createdAt;
          const prevRegistry = await InventoryHistory.findOne({
            item: ingredient.ingredient,
            createdAt: { $lt: this.createdAt },
          });
          const newRegistry = await InventoryHistory.create({
            item: ingredient.ingredient,
            createdAt: this.createdAt,
            beginningInventory: prevRegistry?.endingInventory,
            unitsUsed: ingredient.units * product.quantity,
            endingInventory:
              prevRegistry?.endingInventory -
              ingredient.units * product.quantity,
          });
          inventoriesMarginalChange =
            prevRegistry?.endingInventory - newRegistry.endingInventory;
        }
        await InventoryHistory.updateMany(
          { item: ingredient.ingredient, createdAt: { $gt: this.createdAt } },
          {
            $inc: {
              beginningInventory: inventoriesMarginalChange,
              endingInventory: inventoriesMarginalChange,
            },
          }
        );
        const invItem = await InventoryItem.findByIdAndUpdate(ingredient._id, {
          $inc: { currentLevel: -ingredient.units * product.quantity },
        });
      }
    }
  }
};

OrderSchema.methods.updateSales;

// Updates customer loyalty tier with each new order with their ID
// TODO: decide if I neew to do this as middleware or calculate it in route with addLoyaltyPoints CustomerSchema method
// OrderSchema.pre("save", async function (next) {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     // Get the customer associated with this order
//     const customer = await Customer.findById(this.customer);

//     // Calculate the total value of all orders placed by the customer
//     const totalOrderValue = await Order.aggregate([
//       { $match: { customer: customer._id } },
//       {
//         $group: {
//           _id: "$customer",
//           totalOrderValue: { $sum: "$totalPrice" },
//         },
//       },
//     ]);

//     // Update the customer's loyalty tier based on the total order value
//     const loyaltyTier = await LoyaltyTier.findOne({
//       minValue: { $lte: totalOrderValue },
//       maxValue: { $gte: totalOrderValue },
//     });
//     customer.loyaltyTier = loyaltyTier._id;
//     await customer.save();

//     next();
//     await session.commitTransaction();
//   } catch (error) {
//     await session.abortTransaction();
//     throw error;
//   } finally {
//     session.endSession();
//   }
//   next();
// });

const Order = mongoose.model("Order", OrderSchema);
export default Order;
