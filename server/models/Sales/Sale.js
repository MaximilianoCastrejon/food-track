import mongoose from "mongoose";
// UNITS ARE ALREADY IN QUANTITY
// unitsOfProducts: [
//     {
//       product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
//       units: Number,
//     },
//   ],
//   unitsOfCategories: [
//     {
//       category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
//       units: Number,
//     },
//   ],

const SaleSchema = mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  valueOfOrder: Number,
  valueOfProducts: Number,
  valueOfPackages: Number,
  valueOfExtras: Number,
  discount: Number,
  createdAt: { type: Date, default: Date.now() },
});

const Sale = mongoose.model("Sale", SaleSchema);
export default Sale;
