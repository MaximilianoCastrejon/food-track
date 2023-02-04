import mongoose from "mongoose";

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
  },
});

const Category = mongoose.model("Category", CategorySchema);
export default Category;
