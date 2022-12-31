import Product from "../models/Product.js";
import ProductCategory from "../models/Product.js";
import ProductSize from "../models/Product.js";
import ProductIngredient from "../models/Product.js";
import Category from "../models/Products/Category.js";
import RawIngredient from "../models/Inventories/Ingredient.js";
import {
  buildQuery,
  buildPagination,
  buildProjection,
  applySorting,
  applyProjection,
  applyPagination,
} from "../utils/query-helpers.js";
import ProductStat from "../models/ProductStat.js";
import { StatusCodes } from "http-status-codes";

export const getProducts = async (req, res) => {
  const { sort, onlyShow } = req.query;

  const query = buildQuery(req.query);
  const pagination = await buildPagination(query, req.query);
  const projection = buildProjection(onlyShow);

  //TODO: aggregate function = SQL join
  let result = Product.find(query);
  result = applySorting(result, sort);
  result = applyProjection(result, projection);
  result = applyPagination(result, pagination);

  const products = await result;
  const totalDocuments = await Product.countDocuments(query);
  const totalPages = Math.ceil(totalDocuments / pagination.limit);

  // QUERY PRODUCT STATS
  const statsQuery = {};
  statsQuery.productId = products.map((item) => item._id);
  const productStats = await ProductStat.find(statsQuery).populate("productId");

  // const productsWithStats = await Promise.all(
  //   products.map(async (product) => {
  //     const stat = await ProductStat.find({
  //       productId: product._id,
  //     });
  //     return { ...product._doc, stat };
  //   })
  // );

  res.status(StatusCodes.OK).json({
    prodQty: products.length,
    products,
    productStats,
    totalDocuments,
    totalPages,
  });
};

export const getProductById = (req, res) => {
  console.log(req.params.id);
  res.status(StatusCodes.OK).send("Ok");
};

export const getProductForm = async (req, res) => {
  // In the form I need a button to this route
  // The front loads the lists and the other fields (such as quantities per ingredient per product size)

  // query the ingredients, categories, and suppliers collections
  const ingredients = await Ingredient.find();
  const categories = await Category.find();
  const suppliers = await RawIngredient.find();

  // render the form that allows the user to select the ingredients, categories, and suppliers for the product
  res.render("products/add", { ingredients, categories, suppliers });
};

export const createProduct = async (req, res) => {
  const { prodName, description, categoryId, size, price, ingredients } =
    req.body;
  // "category" should be and ID from the rendered form
  // Ingredients should be a list

  const createProd = { name: prodName, description: description };
  const product = await Product.create(createProd);

  const createProdSize = { product: product._id, size: size, price: price };
  const prodSize = await ProductSize.create(createProdSize);

  const createProdCategory = { product: product._id, category: categoryId };
  const productCategory = await ProductCategory.create(createProdCategory);

  // Before creating the ingredients, we need to check if the category "hasSizes".
  // If not, send only one quantity per-ingredient
  // ALREADY DONE BY THE SCHEMA

  //TODO: create loop ingredients' list
  // "ingredients": [
  //   { "id": 1, "quantity": [{small: 3, medium: 5, large: 6}] },
  //   { "id": 2, "quantity": [{small: 3, medium: 5, large: 6}] },
  //   { "id": 3, "quantity": [{small: 3, medium: 5, large: 6}] }
  // ]
  const ingredientsList = await Promise.all(
    ingredients.map(async (ingredient) => {
      const createProdIngredient = {
        product: product._id,
        ingredient: ingredient.id,
        quantity: ingredient.quantity,
      };
      return await ProductIngredient.create(createProdIngredient);
    })
  );

  res.status(StatusCodes.OK).send("Ok");
};

export const deleteProduct = (req, res) => {
  res.status(StatusCodes.OK).send("Ok");
};
export const updateProduct = (req, res) => {
  res.status(StatusCodes.OK).send("Ok");
};

// Categories
export const getAllCategories = async (req, res) => {
  res.status(StatusCodes.OK).send({ category });
};
export const getCategory = async (req, res) => {
  res.status(StatusCodes.OK).send({ category });
};
export const createCategory = async (req, res) => {
  const { name, hasSizes } = req.body;
  const category = await Category.create({ name: name, hasSizes: hasSizes });

  res.status(StatusCodes.OK).send({ category });
};
export const updateCategory = async (req, res) => {
  res.status(StatusCodes.OK).send({ category });
};
export const deleteCategory = async (req, res) => {
  res.status(StatusCodes.OK).send({ category });
};
