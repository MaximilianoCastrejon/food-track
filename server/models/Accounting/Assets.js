import mongoose from "mongoose";

const AssetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AssetCategory",
    required: true,
  },
  serialNumber: {
    type: String,
    required: true,
    unique: true,
  },
  model: {
    type: String,
    required: true,
  },
  manufacturer: {
    type: String,
    required: true,
  },
  purchaseDate: {
    type: Date,
    required: true,
  },
  purchasePrice: {
    type: Number,
    required: true,
  },
  warrantyExpiration: {
    type: Date,
    required: true,
  },
  currentValue: {
    type: Number,
    required: true,
  },
});

const AssetCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  depreciation: {
    type: Number,
    required: true,
  },
  usefulLife: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});

const Asset = mongoose.model("Asset", AssetSchema);
const AssetCategory = mongoose.model("AssetCategory", AssetCategorySchema);
export default { Asset, AssetCategory };
