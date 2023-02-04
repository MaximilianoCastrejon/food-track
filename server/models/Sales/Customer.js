import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
  },
  houseNumber: Number,
  streetName: String,
  county: String,
  municipality: String,
  state: String,
  description: String,
});

CustomerSchema.methods.addLoyaltyPoints = function (orderTotal) {
  this.loyaltyPoints += Math.floor(orderTotal);
  if (this.loyaltyPoints >= 1000 && this.loyaltyTier === "bronze") {
    this.loyaltyTier = "silver";
  } else if (this.loyaltyPoints >= 2500 && this.loyaltyTier === "silver") {
    this.loyaltyTier = "gold";
  } else if (this.loyaltyPoints >= 5000 && this.loyaltyTier === "gold") {
    this.loyaltyTier = "platinum";
  }
};

CustomerSchema.pre("save", function (next) {
  this.addLoyaltyPoints(
    this.orders.reduce((acc, order) => acc + order.total, 0)
  );
  next();
});

const LoyaltyTierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  position: {
    type: Number,
    unique: Number,
    min: 1,
    required: true,
  },
  minOrderValue: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    required: true,
  },
});

const CustomerLoyaltySchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  loyaltyTier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "LoyaltyTier",
    required: true,
  },
});
// cantidad, orden de paquete

const Customer = mongoose.model("Customer", CustomerSchema);
const LoyaltyTier = mongoose.model("LoyaltyTier", LoyaltyTierSchema);
const CustomerLoyalty = mongoose.model(
  "CustomerLoyalty",
  CustomerLoyaltySchema
);

export { Customer, LoyaltyTier, CustomerLoyalty };
