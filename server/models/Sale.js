import mongoose from "mongoose";
import User from "./User.js"; //Customers collection

const SaleSchema = new mongoose.Schema({
  clientId: { type: mongoose.Types.ObjectId, ref: User },
});

const Sale = mongoose.model("Sale", SaleSchema);

export default Sale;
