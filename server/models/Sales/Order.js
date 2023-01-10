import mongoose from "mongoose";
import InventoryItem from "../Inventories/InventoryItem.js";
import Extras from "../Products/Extras.js";
import { Product, ProductIngredient } from "../Products/Product.js";

// TODO: add packages
const OrderSchema = new mongoose.Schema(
  {
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          unique: true,
          required: function () {
            return !this.packages || this.packages.length === 0;
          },
        },
        quantity: {
          type: Number,
          default: 0,
          required: true,
        },
        excludedIngredients: {
          type: [mongoose.Schema.Types.ObjectId],
          ref: "InventoryItem",
          validate: {
            validator: async function (id) {
              // Check that the name field of each excluded ingredient is equal to "ingredient"
              const excludedIngredients = await InventoryItem.find({
                _id: { $in: id },
                name: "ingredient",
              });
              return excludedIngredients.length === id.length;
            },
            message:
              "One or more of the excluded ingredients does not have a name equal to 'ingredient'",
          },
        },

        size: {
          type: String,
          enum: ["small", "medium", "large", "fixed"],
          required: true,
          unique: true,
        },
      },
    ],
    packages: {
      type: [
        {
          package: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PackageOption",
            unique: true,
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
                  unique: true,
                  required: true,
                },
                quantity: {
                  type: Number,
                  default: 0,
                  required: true,
                },
                excludedIngredients: {
                  type: [mongoose.Schema.Types.ObjectId],
                  ref: "InventoryItem",
                  validate: {
                    validator: async function (value) {
                      // Check that the name field of each excluded ingredient is equal to "ingredient"
                      const excludedIngredients = await InventoryItem.find({
                        _id: { $in: value },
                        name: "ingredient",
                      });
                      return excludedIngredients.length === value.length;
                    },
                    message:
                      "One or more of the excluded ingredients does not have a name equal to 'ingredient'",
                  },
                },

                size: {
                  type: String,
                  enum: ["small", "medium", "large", "fixed"],
                  required: true,
                  unique: true,
                },
              },
            ],
          },
          quantity: {
            type: Number,
            default: 0,
            required: true,
          },
          excludedIngredients: [
            {
              type: String,
            },
          ],
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

// OrderSchema.pre("save", async function (next) {
//   // Get the product associated with this order
//   const product = await Product.findById(this.product);

//   // Adapt to data structure
//   // Decrement the inventory levels of each ingredient in the product by the quantity of the order
//   for (const ingredient of product.ingredients) {
//     await RawIngredient.findByIdAndUpdate(ingredient._id, {
//       $inc: { quantity: -ingredient.quantity * this.quantity },
//     });
//   }

//   next();
// });

/* Decrease "small" quantity of each ingredient of each product and decrease ingredients by quantity of "extras" */
// TODO: test performance. If bad, move non-frenquent updated data logic to updating route
// OrderSchema.pre("save", async function (next) {
//   const session = await mongoose.startSession();
//   session.startTransaction();
//   try {
//     // Decrement the inventory levels of each ingredient in each product in the order by the quantity of the order
//     for (const product of this.products) {
//       // Find the ProductIngredient document for the current product in the order
//       const dbProductIngredient = await ProductIngredient.findOne({
//         product: product.product,
//       });
//       if (!dbProductIngredient) continue;
//       console.log("dbProductIngredient", dbProductIngredient);
//       // Decrement the inventory levels of the ingredient in the product by the quantity of the product in the order
//       // await RawIngredient.findByIdAndUpdate(dbProductIngredient.ingredient, {
//       //   $inc: {
//       //     // TODO: Decide on the ingredient quantities structure. Default to small or check in product category if hasSisez to use "fixed"
//       //     quantity: -dbProductIngredient.quantity.small * product.quantity,
//       //   },
//       // });
//     }

//     // Decrement the inventory levels of each extra in the order by its quantity
//     for (const extra of this.extras) {
//       const extraDoc = await Extras.findById(extra);
//       if (!extraDoc) continue;

//       console.log("extraDoc", extraDoc);
//       if (extraDoc.productId) {
//         // Find the ProductIngredient document for the extra
//         const dbProductIngredient = await ProductIngredient.findOne({
//           product: extraDoc.productId,
//         });

//         // Decrement the inventory levels of the ingredient in the product by the quantity of the extra multiplied by the small value in the product ingredient
//         // await RawIngredient.findByIdAndUpdate(dbProductIngredient.ingredient, {
//         //   $inc: {
//         //     quantity: -dbProductIngredient.quantity.small * extraDoc.quantity,
//         //   },
//         // });
//       } else if (extraDoc.ingredientId) {
//         // Decrement the inventory levels of the ingredient extra by its quantity
//         await RawIngredient.findByIdAndUpdate(extraDoc.ingredientId, {
//           $inc: { quantity: -extraDoc.quantity },
//         });
//       }
//     }
//     // middleware function 1 goes here
//     next();
//     await session.commitTransaction();
//   } catch (error) {
//     await session.abortTransaction();
//     throw error;
//   } finally {
//     session.endSession();
//   }
// });

/*Update/create product daily stats */
// TODO: Add next.
// TODO: Update to increase sales by "packages" and "extras"
OrderSchema.pre("save", async function (next) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = this;

    for (const product of order.products) {
      const dbProduct = await Product.findById(product.product);
      if (!dbProduct) continue;
      // Calculate the total sales in cash for the product
      const totalSalesCash = dbProduct.price * product.quantity;
      console.log("totalSalesCash", totalSalesCash);

      // Calculate the total sales in units for the product
      const totalSalesUnits = product.quantity;
      console.log("totalSalesUnits", totalSalesUnits);

      // Check if the store was open on the day of the order
      const storeOpen = checkStoreOpen(order.createdAt);
      console.log("storeOpen", storeOpen);

      // Update the ProductStats document for the product
      // await ProductStats.updateOne(
      //   {
      //     productId: product.product,
      //     year: order.createdAt.getFullYear(),
      //   },
      //   {
      //     $inc: {
      //       yearlySalesTotal: totalSalesCash,
      //       yearlyTotalSoldUnits: totalSalesUnits,
      //       "monthlyData.$.totalSales": totalSalesCash,
      //       "monthlyData.$.totalUnits": totalSalesUnits,
      //       "dailyData.$.totalSales": totalSalesCash,
      //       "dailyData.$.totalUnits": totalSalesUnits,
      //     },
      //     $set: {
      //       "monthlyData.$.month": order.createdAt.getMonth() + 1,
      //       "dailyData.$.date": order.createdAt,
      //       "dailyData.$.storeOpen": storeOpen,
      //     },
      //   },
      //   { upsert: true }
      // );
    }
    next();
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

const addExcludedIngredientsBackToInventory = async (order) => {
  for (const orderItem of order) {
    if (!orderItem || orderItem.length === 0) continue;
    const { excludedIngredients } = orderItem.excludedIngredients;
    console.log(excludedIngredients);
    // if (!excludedIngredients || excludedIngredients.length === 0) continue;

    // Find the product document for the current product in the order
    // const ingredient_qty_list = await ProductIngredient.find({
    //   product: orderItem.product,
    // }).select(`ingredient quantity.${orderItem.size}`);
    // // TODO: Handle error if product wasn't found
    // if (!ingredientList) continue;

    // // Find the ingredients that were excluded from the product
    // const excludedIngredientObjects = ingredient_qty_list.filter((ingredient) =>
    //   excludedIngredients.includes(ingredient.ingredient)
    // );
    // console.log(excludedIngredientObjects);
    // // Add the excluded ingredients back to the inventory
    // for (const ingredient of excludedIngredientObjects) {
    //   await RawIngredient.findOneAndUpdate(
    //     { _id: ingredient.ingredient },
    //     { $inc: { quantity: ingredient.quantity } }
    //   );
    // }
  }
};

OrderSchema.pre("save", async function (next) {
  const session = await mongoose.startSession();
  session.startTransaction();

  // Add the excluded ingredients back to the inventory
  try {
    addExcludedIngredientsBackToInventory(this.products);
    addExcludedIngredientsBackToInventory(this.packages);
    next();
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

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
