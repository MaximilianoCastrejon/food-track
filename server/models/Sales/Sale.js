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
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  valueOfOrder: { type: Number, required: true },
  valueOfProducts: { type: Number, required: true },
  valueOfPackages: { type: Number, required: true },
  valueOfExtras: { type: Number, required: true },
  discount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now() },
});

const Sale = mongoose.model("Sale", SaleSchema);
export default Sale;
