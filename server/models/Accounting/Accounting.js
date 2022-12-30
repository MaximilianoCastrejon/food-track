const mongoose = require("mongoose");

const currencySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  symbol: {
    type: String,
    required: true,
    unique: true,
  },
});

const Currency = mongoose.model("Currency", currencySchema);

const accountTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
});

const AccountType = mongoose.model("AccountType", accountTypeSchema);

const accountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AccountType",
  },
  balance: {
    type: Number,
    required: true,
    default: 0,
  },
  currency: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Currency",
  },
});

const Account = mongoose.model("Account", accountSchema);

const transactionTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
});

const TransactionType = mongoose.model(
  "TransactionType",
  transactionTypeSchema
);

const transactionSchema = new mongoose.Schema({
  type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TransactionType",
  },
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
  },
  description: {
    type: String,
  },
});

transactionSchema.pre("save", function (next) {
  // Update the balance of the "from" and "to" accounts when a transaction is created
  Account.findByIdAndUpdate(
    this.from,
    { $inc: { balance: -this.amount } },
    (err, updatedAccount) => {
      if (err) {
        return next(err);
      }
      if (!updatedAccount) {
        return next(new Error(`Account with id ${this.from} not found`));
      }
    }
  );
  Account.findByIdAndUpdate(
    this.to,
    { $inc: { balance: this.amount } },
    (err, updatedAccount) => {
      if (err) {
        return next(err);
      }
      if (!updatedAccount) {
        return next(new Error(`Account with id ${this.to} not found`));
      }
    }
  );
  next();
});

const Transaction = mongoose.model("Transaction", transactionSchema);
