import Mongoose from "mongoose";

// Data import
// import Product from "../models/Product.js";
// import ProductStat from "../models/ProductStat.js";
// import { dataProduct, dataProductStat } from "../data/mock_data.js";

export const connectDB = async (uri) => {
  Mongoose.set("strictQuery", false);
  return await Mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
    .then(() => {
      // Only add once
      // Product.insertMany(dataProduct);
      // ProductStat.insertMany(dataProductStat);
      // User.insertMany(dataUser);
    })
    .catch((err) => console.log({ err: err }));
};
