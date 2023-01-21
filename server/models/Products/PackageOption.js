import mongoose from "mongoose";

// To retrieve and populate Product doc from orders (size prices and quantities), use Prod Id from package
// Each package should give an option to build it while the order is being written
const PackageOptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  categories: [
    {
      category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
      },
      size: {
        type: String,
        enum: ["small", "medium", "large", "fixed"],
        required: true,
      },
      maxCount: {
        type: Number,
        required: true,
      },
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const PackageOption = mongoose.model("PackageOption", PackageOptionSchema);
export default PackageOption;
