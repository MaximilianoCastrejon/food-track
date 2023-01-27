import mongoose from "mongoose";

const TransactionSchema = mongoose.Schema({
  type: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TransactionTypes",
    required: true,
  },
  value: Number,
});

const TransactionTypesSchema = mongoose.Schema({
  type: String, //expense, sale
});
