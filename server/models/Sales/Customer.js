import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
  },
  orders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
  ],
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
  minOrderValue: {
    type: Number,
    required: true,
  },
  discountPercentage: {
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
