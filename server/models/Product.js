import mongoose from "mongoose";

const ProductSchema = mongoose.Schema(
  {
    name: { type: String },
    price: Number,
    description: String,
    category: String,
    rating: Number,
    supply: Number,
  },
  { timestamps: true }
);

// const Product = mongoose.model("Product", ProductSchema);
// export default Product;
