import { StatusCodes } from "http-status-codes";
import RawIngredient from "../models/Inventories/Ingredient.js";
import Category from "../models/Products/Category.js";

// Assets categories
export const getAllInventory = async (req, res) => {
  res.status(StatusCodes.OK).send({ msg: "OK" });
};
