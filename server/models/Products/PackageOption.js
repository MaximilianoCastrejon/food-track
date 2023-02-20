import mongoose from "mongoose";

// To retrieve and populate Product doc from orders (size prices and quantities), use Prod Id from package
// Each package should give an option to build it while the order is being written
const PackageOptionSchema = new mongoose.Schema({
  name: {
    type: String,
    index: true,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  options: [
    {
      category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        index: true,
        required: true,
      },
      size: {
        type: String,
        enum: ["small", "medium", "large", "fixed"],
        index: true,
        required: true,
      },
      maxCount: {
        type: Number,
        required: true,
      },
    },
  ],
});

PackageOptionSchema.index(
  { name: 1, "options.category": 1, "options.size": 1 },
  { unique: true }
);

const PackageOption = mongoose.model("PackageOption", PackageOptionSchema);
export default PackageOption;
