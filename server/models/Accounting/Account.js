import mongoose from "mongoose";

const AccountSchema = mongoose.Schema({
  cash: Number,
  createdAt: { type: Date, default: Date.now() },
});

const Account = mongoose.model("Account", AccountSchema);
export default Account;
