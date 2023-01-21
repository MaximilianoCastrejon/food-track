import mongoose from "mongoose";

const IncomeConceptSchema = mongoose.Schema({
  concept: String,
});
const IncomeSchema = mongoose.Schema({
  concept: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "IncomeSource",
    require: true,
  },
  value: Number,
  createdAt: { type: Date, defautl: Date.now() },
});

const IncomeConcept = mongoose.model("IncomeConcept", IncomeConceptSchema);
const Income = mongoose.model("Income", IncomeSchema);
export { IncomeConcept, Income };
