import {
  Product,
  ProductCategory,
  ProductSize,
  ProductIngredient,
} from "../models/Products/Product.js";
import ProductStat from "../models/Products/ProductStat.js";
import Category from "../models/Products/Category.js";
import { buildQuery } from "../utils/buildQuery.js";
import { StatusCodes } from "http-status-codes";
import { BadRequestError } from "../errors/bad-request.js";
import PackageOption from "../models/Products/PackageOption.js";
import { NotFoundError } from "../errors/not-found.js";
import mongoose from "mongoose";

/********************************* PRODUCTS *********************************/

export const getProducts = async (req, res) => {
  const {
    prodName,
    nameOptions,
    description,
    descriptionOptions,
    projection,
    sort,
    category,
    categoryOptions,
    ingredient,
    ingredientOptions,
    ingredientNumFields,
    size,
    sizeNumFields,
    page,
    offset,
  } = req.query;

  // const query = buildQuery(req.query);
  // const pagination = await buildPagination(query, req.query);
  // const projection = buildProjection(onlyShow);

  // let result = Product.find(query);
  const queryProduct = buildQuery(
    Product,
    { queryParams: { prodName, nameOptions, description } },
    { projection: projection, sort: sort, pagination: { page, offset } }
  );
  let result = Product.find({});
  // result = applySorting(result, sort);
  // result = applyProjection(result, projection);
  // result = applyPagination(result, pagination);

  const products = await result;
  // const productsData = await Promise.all(
  //   products.map(async (product) => {
  //     const category = await ProductCategory.findOne({
  //       product: product._id,
  //     })
  //       .select("-product")
  //       .populate("category");
  //     const ingredients = await ProductIngredient.find({
  //       product: product._id,
  //     })
  //       .select("-product")
  //       .populate("ingredient");
  //     const prices = await ProductSize.find({ product: product._id }).select(
  //       "-product"
  //     );

  //     return {
  //       product,
  //       category,
  //       ingredients,
  //       prices,
  //     };
  //   })
  // );

  // const totalDocuments = await Product.countDocuments();
  // const totalPages = Math.ceil(totalDocuments / pagination.limit);

  res.status(StatusCodes.OK).json({
    products,
    // productsData,
    // totalDocuments,
  });
};

export const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id);
  const category = await ProductCategory.find({
    product: req.params.id,
  })
    .select("-product")
    .populate("category");
  const ingredients = await ProductIngredient.find({
    product: req.params.id,
  })
    .select("-product")
    .populate("ingredient");
  const prices = await ProductSize.find({ product: req.params.id }).select(
    "-product"
  );

  res.status(StatusCodes.OK).send({ product, category, ingredients, prices });
};

export const createProduct = async (req, res) => {
  const { prodName, description, categoryId, sizePrices, ingredients } =
    req.body;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // "category" should be and ID from the rendered form
    // Ingredients should be a list
    const createProd = { name: prodName, description: description };
    const product = await Product.create([createProd], { session });

    // "sizePrices":[
    //   {"size": "small", "price": 200},
    //   {"size": "medium", "price": 250},
    //   {"size": "large", "price": 300},
    // ]
    const prodSizePrices = await Promise.all(
      sizePrices.map(async (item) => {
        const createProdSize = {
          product: product[0]._id,
          size: item.size,
          price: item.price,
        };
        return await ProductSize.create([createProdSize], { session });
      })
    );

    const createProdCategory = {
      product: product[0]._id,
      category: categoryId,
    };
    const productCategory = await ProductCategory.create([createProdCategory], {
      session,
    });

    // Before creating the ingredients, we need to check if the category "hasSizes".
    // If not, send only one quantity per-ingredient
    // ALREADY DONE BY THE SCHEMA

    //TODO: create loop ingredients' list
    // "ingredients": [
    //   { "id": 1, "quantity": [{small: 3, medium: 5, large: 6}] },
    //   { "id": 2, "quantity": [{small: 3, medium: 5, large: 6}] },
    //   { "id": 3, "quantity": [{small: 3, medium: 5, large: 6}] }
    // ]

    const category = Category.findById(categoryId);
    if (!category) {
      throw new NotFoundError("Category not found");
    }

    const ingredientsList = await Promise.all(
      ingredients.map(async (ingredient) => {
        if (category.hasSizes === "false") {
          ingredient.quantity = ingredient.quantity.small;
        }
        const createProdIngredient = {
          product: product[0]._id,
          ingredient: ingredient.id,
          quantity: ingredient.quantity,
        };
        return await ProductIngredient.create([createProdIngredient], {
          session,
        });
      })
    );

    const data = {
      product: product[0],
      prodSizePrices: prodSizePrices.map((size) => size[0]),
      productCategory: productCategory[0],
      ingredientsList: ingredientsList.map((ingredient) => ingredient[0]),
    };

    res.status(StatusCodes.OK).json(data);
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const deleteProduct = (req, res) => {
  const deletedProduct = Product.findByIdAndDelete(req.params.id);
  if (!deletedProduct) {
    throw new NotFoundError("Product was not found in the database");
  }
  res.status(StatusCodes.OK).send("Ok");
};

export const updateProduct = async (req, res) => {
  const { product, size, ingredients, category } = req.body;

  const updatedObject = {};

  if (product) {
    updatedObject.product = await Product.findByIdAndUpdate(req.params.id, {
      name: product.name,
      description: product.description,
    });
  }

  if (category) {
    updatedObject.categories = await ProductCategory.updateOne(
      { product: req.params.id },
      { category: category }
    );
    if (!updatedObject.categories) {
      throw new NotFoundError(
        "No product with that category was found in the Product category table"
      );
    }
  }

  if (size) {
    updatedObject.size = await ProductSize.updateOne(
      { product: req.params.id, size: size.size },
      { size: size.price }
    );
    if (!updatedObject.size) {
      throw new NotFoundError(
        "Not found in Product size table. Check the product id or size you are correct"
      );
    }
  }

  if (ingredients) {
    updatedObject.ingredient = await ProductIngredient.updateMany(
      { product: req.params.id, ingredient: ingredients.original },
      {
        $set: { ingredient: ingredients.new, quantity: ingredients.quantities },
      }
    );
    if (!updatedObject.ingredient) {
      throw new NotFoundError(
        "No product with that ingredients was found in the Product ingredients table"
      );
    }
  }

  res.status(StatusCodes.OK).send(updatedObject);
};

/********************************* PRODUCT INGREDIENTS *********************************/

export const getAllProductIngredients = (req, res) => {};

/********************************* PRODUCT SIZES *********************************/

/********************************* CATEGORIES *********************************/

// Order panel categories cards + packages + extras
export const getAllCategories = async (req, res) => {
  const categories = await Category.find({});
  res.status(StatusCodes.OK).json({ categories });
};
export const getCategory = async (req, res) => {
  const category = await Category.findById(req.params.id);
  res.status(StatusCodes.OK).json({ category });
};
export const createCategory = async (req, res) => {
  const { name, hasSizes } = req.body;
  const newCategory = {};
  if (hasSizes) {
    newCategory.hasSizes = hasSizes === "true" ? true : false;
  }
  const category = await Category.create({
    name: name,
    hasSizes: newCategory.hasSizes,
  });

  res.status(StatusCodes.OK).json({ category });
};
export const updateCategory = async (req, res) => {
  const { name, hasSizes } = req.body;

  if (!name || !hasSizes) {
    throw new BadRequestError(
      "You must provide a name and a hasSizes parameter"
    );
  }

  const updateQuery = {
    name: name,
    hasSizes: hasSizes === "true" ? true : false,
  };

  const updatedCategory = await Category.findByIdAndUpdate(
    { _id: req.params.id },
    updateQuery,
    { new: true }
  );
  res.status(StatusCodes.OK).json({ updatedCategory });
};
export const deleteCategory = async (req, res) => {
  const deletedCategory = await Category.findByIdAndDelete({
    _id: req.params.id,
  });
  await ProductCategory.findOneAndDelete({ category: deletedCategory._id });
  res.status(StatusCodes.OK).json({ deletedCategory });
};

/********************************* PACAKGES *********************************/

export const getAllPackageOptions = async (req, res) => {
  const {} = req.query;
  const packageQuery = await buildQuery(
    PackageOption,
    stringQuery,
    numQuery,
    projection,
    sort
  );
  const packages = await PackageOption.find({});

  res.status(StatusCodes.OK).json(packages);
};

export const getPackageOption = async (req, res) => {
  const foundPackage = await PackageOption.findById(req.params.id);
  if (!foundPackage) {
    throw new NotFoundError("Package option not found");
  }
  res.status(StatusCodes.OK).json(foundPackage);
};

export const createPackageOption = async (req, res) => {
  const { name, price, categories } = req.body;
  if (!categories.category || !categories.size || !categories.maxCount) {
    throw new BadRequestError(
      "Please provide at least one category for your package option. As well as the size of the product and how many of each size"
    );
  }

  const createdPackage = await PackageOption.create();
  res.status(StatusCodes.OK).json(foundPackage);
};
export const updatePackageOption = async (req, res) => {};
export const deletePackageOption = async (req, res) => {};

/********************************* PACKAGES CATEGORIES *********************************/

export const updatePackageCategory = async (req, res) => {
  const { packageId, categoryId } = req.params;
  const { maxCount, size, category } = req.body;
  const updateObject = {};
  if (maxCount) {
    updateObject.maxCount = maxCount;
  }
  if (size) {
    updateObject.size = size;
  }
  if (category) {
    updateObject.category = category;
  }

  const updatedDocument = await PackageOption.findOneAndUpdate(
    {
      _id: packageId,
      "categories.category": categoryId,
    },
    { $set: { "categories.$": updateObject } }
  );
  res.status(StatusCodes.OK).json(updatedDocument);
};

export const deletePackageCategory = async (req, res) => {
  const { packageId, categoryId } = req.params;

  const isDeleted = await PackageOption.findOneAndDelete({
    _id: packageId,
    "categories.category": categoryId,
  });
  if (!isDeleted) {
    throw new NotFoundError("No such category in this package");
  }
  res.status(StatusCodes.OK).json({ msg: "Sucessful deletion" });
};

/********************************* EXTRAS *********************************/

export const getAllExtras = async (req, res) => {};
export const getExtra = async (req, res) => {};
export const createExtra = async (req, res) => {
  const {} = req.body;
};
export const updateExtra = async (req, res) => {};
export const deleteExtra = async (req, res) => {};
