import { StatusCodes } from "http-status-codes";
import RawIngredient from "../../models/Inventories/Ingredient.js";

// Ingredients
export const getAllIngredients = async (req, res) => {
  res.status(StatusCodes.OK).send({ msg: "OK" });
};
export const getIngredient = async (req, res) => {
  res.status(StatusCodes.OK).send({ msg: "OK" });
};
export const createIngredient = async (req, res) => {
  const { name, unit, type } = req.body;
  const category = await RawIngredient.create({
    name: name,
    hasSizes: hasSizes,
  });

  res.status(StatusCodes.OK).send({ category });
};
export const deleteIngredient = async (req, res) => {
  res.status(StatusCodes.OK).send({ msg: "OK" });
};
export const updateIngredient = async (req, res) => {
  res.status(StatusCodes.OK).send({ msg: "OK" });
};
