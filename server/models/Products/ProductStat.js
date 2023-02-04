import mongoose from "mongoose";

const ProductStatSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: function () {
      return !this.package && !this.extra;
    },
  },
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PackageOption",
    required: function () {
      return !this.product && !this.extra;
    },
  },
  extra: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Extras",
    required: function () {
      return !this.package && !this.product;
    },
  },
  type: {
    type: String,
    required: true,
    enum: ["product", "package", "extra"],
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
    },
  ],
});

const ProductStat = mongoose.model("ProductStat", ProductStatSchema);
export default ProductStat;
