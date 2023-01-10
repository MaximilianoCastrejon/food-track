import mongoose from "mongoose";

const ProductStatSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  yearlySalesTotal: {
    type: Number,
    required: true,
  },
  yearlyTotalSoldUnits: {
    type: Number,
    required: true,
  },
  monthlyData: [
    {
      month: {
        type: String,
        required: true,
      },
      totalSales: {
        type: Number,
        required: true,
      },
      totalUnits: {
        type: Number,
        required: true,
      },
    },
  ],
  dailyData: [
    {
      date: {
        type: Date,
        required: true,
      },
      totalSales: {
        type: Number,
        required: true,
      },
      totalUnits: {
        type: Number,
        required: true,
      },
      storeOpen: {
        type: Boolean,
        required: true,
      },
    },
  ],
});

const ProductsStat = mongoose.model("ProductsStat", ProductStatSchema);
export default ProductsStat;
