import mongoose from "mongoose";

const AccountSchema = mongoose.Schema({
  balance: Number,
  createdAt: {
    type: Date,
    default: Date.now(),
    validate: {
      validator: async function (date) {
        const dateNotTime = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        );
        const duplicate = await Account.find({ createdAt: dateNotTime });
        if (duplicate) {
          return false;
        }
        return true;
      },
    },
  },
});

const Account = mongoose.model("Account", AccountSchema);
export default Account;
