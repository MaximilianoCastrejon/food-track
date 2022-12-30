import { StatusCodes } from "http-status-codes";
import RawIngredient from "../models/Inventories/Ingredient.js";
import Category from "../models/Products/Category.js";

export const createIngredient = async (req, res) => {
  const { name, unit, type } = req.body;
  const category = await RawIngredient.create({
    name: name,
    hasSizes: hasSizes,
  });

  res.status(StatusCodes.OK).send({ category });
};

export const createCategory = async (req, res) => {
  const { name, hasSizes } = req.body;
  const category = await Category.create({ name: name, hasSizes: hasSizes });

  res.status(StatusCodes.OK).send({ category });
};
export const createCleaningSupply = async (req, res) => {
  res.status(StatusCodes.OK).send({ msg: "OK" });
};
export const createMarketingMaterial = async (req, res) => {
  res.status(StatusCodes.OK).send({ msg: "OK" });
};
export const createPackaging = async (req, res) => {
  res.status(StatusCodes.OK).send({ msg: "OK" });
};
export const createStoragedGood = async (req, res) => {
  res.status(StatusCodes.OK).send({ msg: "OK" });
};
export const createAsset = async (req, res) => {
  res.status(StatusCodes.OK).send({ msg: "OK" });
};
export const createAssetCategory = async (req, res) => {
  res.status(StatusCodes.OK).send({ msg: "OK" });
};
