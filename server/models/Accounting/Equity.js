import mongoose from "mongoose";

const ShareholderSchema = mongoose.Schema({
  shareholder: String,
  percentage: Number,
});

const EquityPayoutSchema = mongoose.Schema(
  {
    shareholder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shareholder",
      require: true,
    },
    value: Number,
  },
  { timestamp: true }
);

const Shareholder = mongoose.model("Shareholder", ShareholderSchema);
const EquityPayout = mongoose.model("EquityPayout", EquityPayoutSchema);
export { EquityPayout, Shareholder };
