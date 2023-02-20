import mongoose from "mongoose";
import { Product } from "./Product.js";

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    index: {
      unique: true,
      collation: {
        locale: "en",
        strength: 1,
      },
    },
    set: function (value) {
      return value.toLowerCase();
    },
    validate: {
      validator: function (value) {
        return /^[\w\s]+$/i.test(value);
      },
      message: (props) =>
        `'${props.value}' is not a valid name, please only use letters, numbers and spaces`,
    },
  },
});

CategorySchema.pre("findOneAndDelete", async function (next) {
  const products = await Product.deleteMany({ category: this._id }).catch(
    (err) => {
      console.log("err", err);
    }
  );
  next();
});

const Category = mongoose.model("Category", CategorySchema);
export default Category;
