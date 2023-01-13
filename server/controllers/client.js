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
    name,
    nameOptions,
    description,
    descriptionOptions,
    projection,
    sort,
    // category,
    // categoryOptions,
    // ingredient,
    // ingredientOptions,
    // ingredientNumFields,
    // size,
    // sizeNumFields,
    page,
    offset,
  } = req.query;

  const stringParams = [];
  if (name) {
    stringParams.push({ name, nameOptions });
  }
  if (description) {
    stringParams.push({ description, descriptionOptions });
  }

  const queryProducts = await buildQuery(
    Product,
    {
      stringParams,
    },
    { projection: projection, pagination: { page: page, limit: offset } }
  );

  const productsData = await Promise.all(
    queryProducts.map(async (product) => {
      const category = await ProductCategory.findOne({
        product: product._id,
      })
        .select("-product")
        .populate("category");
      const ingredients = await ProductIngredient.find({
        product: product._id,
      })
        .select("-product")
        .populate("ingredient");
      const prices = await ProductSize.find({ product: product._id }).select(
        "-product"
      );

      return {
        product,
        category,
        ingredients,
        prices,
      };
    })
  );

  // const totalDocuments = await Product.countDocuments();
  // const totalPages = Math.ceil(totalDocuments / pagination.limit);

  res.status(StatusCodes.OK).json({
    productsData,
    // products,
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
  const { product, sizes, ingredients, category, categorySizes } = req.body;

  const updatedObject = {};

  if (product) {
    updatedObject.product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name: product.name,
        description: product.description,
      },
      { new: true }
    );
    if (!updatedObject.product) {
      throw new NotFoundError("No product was found with that ID");
    }
  }

  //   const category = "5f9a35d33b39c9079c2b2f7a";
  // const sizes = [
  //   { name: "small", price: 4.99 },
  //   { name: "medium", price: 6.99 },
  //   { name: "large", price: 8.99 }
  // ];

  if (category) {
    //get the category information
    const newCategory = await Category.findById(category);
    if (newCategory) {
      throw new NotFoundError("Not category was found with that ID");
    }
    //get the old category information
    const oldCategory = await ProductCategory.findOne({
      product: req.params.id,
    });
    if (oldCategory) {
      throw new NotFoundError("No match of that product was found");
    }
    const categoryResult = await Category.findById(oldCategory.category);
    if (newCategory.hasSizes !== categoryResult.hasSizes) {
      if (newCategory.hasSizes) {
        //if the new category has sizes validate the sizes array
        if (!Array.isArray(categorySizes) || categorySizes.length !== 3) {
          throw new BadRequestError(
            "Expected an array of 3 values for categorySizes property"
          );
        }
      } else {
        //if the new category doesn't have categorySizes validate the categorySizes array
        if (!Array.isArray(categorySizes) || categorySizes.length !== 1) {
          throw new BadRequestError(
            "Expected only 1 'fixed' size for the categorySizes property"
          );
        }
      }
    }
    updateCategorySizes(newCategory, req.params.id, categorySizes);
    updatedObject.categories = await ProductCategory.updateOne(
      { product: req.params.id },
      { category: category },
      { new: true }
    );
    console.log("updatedObject", updatedObject);
    if (!updatedObject.categories) {
      throw new NotFoundError(
        "No product with that category was found in the Product category table"
      );
    }
  }

  async function updateCategorySizes(newCategory, productId, sizes) {
    if (sizes) {
      if (newCategory.hasSizes) {
        //update sizes and prices for each size
        await Promise.all(
          sizes.map(async (size) => {
            await ProductSize.updateOne(
              { product: productId, size: size.name },
              { $set: { price: size.price } }
            );
          })
        );
      } else {
        //update only the fixed size
        await ProductSize.updateOne(
          { product: productId, size: "fixed" },
          { $set: { price: sizes[0].price } }
        );
      }
    }
  }

  const newSizes = [];
  if (sizes) {
    const productCategory = await ProductCategory.findById(req.params.id);
    const category = await Category.findById(productCategory.category);
    if (category.hasSizes) {
      //validate the sizes array
      if (!Array.isArray(sizes) || sizes.length !== 3) {
        throw new BadRequestError(
          "Expected an array of 3 values for sizes property"
        );
      }
    } else {
      //validate the sizes array
      if (!Array.isArray(sizes) || sizes.length !== 1) {
        throw new BadRequestError(
          "Expected only 1 'fixed' size for the sizes property"
        );
      }
    }
    updateSizesAndPrices(category, req.params.id, sizes);
  }

  async function updateSizesAndPrices(category, productId, sizes) {
    if (category.hasSizes) {
      //update sizes and prices for each size
      await Promise.all(
        sizes.map(async (size) => {
          await ProductSize.updateOne(
            { product: productId, size: size.name },
            { $set: { price: size.price } }
          );
        })
      );
    } else {
      //update only the fixed size
      await ProductSize.updateOne(
        { product: productId, size: "fixed" },
        { $set: { price: sizes[0].price } }
      );
    }
  }
  // if (sizes) {
  //   const productCategory = ProductCategory.findById(req.params.id);
  //   const category = Category.findById(productCategory.category);
  //   updateSizesAndPrices(category , req.params.id, sizes)
  // }
  //   await Promise.all(sizes.map(async (size, price) => {
  //     console.log("prices", price)
  //     if(!price){
  //       throw
  //     }
  //     if(size.fixed){
  //       await ProductSize.deleteMany({product: req.params.id, size: {$in: ["small", "medium", "large"]}})
  //     }
  //     // if(Object.entries(size).forEach(([key, value]) => {key==="fixed"})){
  //     //   await ProductSize.deleteMany({product: req.params.id, size: {$in: ["small", "medium", "large"]}})
  //     // }
  //     i
  //   }))
  //   updatedObject.size = await ProductSize.updateOne(
  //     { product: req.params.id, size: size.size },
  //     { size: size.price }
  //   );
  //   if (!updatedObject.size) {
  //     throw new NotFoundError(
  //       "Not found in Product size table. Check the product id or size you are correct"
  //     );
  //   }
  // }

  const newIngredientsArr = [];
  if (ingredients) {
    await Promise.all(
      ingredients.map(async (ingredient) => {
        if (!ingredient.original) {
          throw new BadRequestError(
            "ID of ingredient to update was not provided"
          );
        }
        const setObject = {};
        if (ingredient.new) {
          setObject.ingredient = ingredient.new;
        }
        if (ingredient.quantities) {
          setObject.quantity = ingredient.quantities;
        }
        const newIngredient = await ProductIngredient.findOneAndUpdate(
          { product: req.params.id, ingredient: ingredient.original },
          {
            $set: setObject,
          },
          { new: true }
        );
        if (!newIngredient) {
          throw new NotFoundError(
            "No product with that ingredients was found in the Product ingredients table"
          );
        }
        newIngredientsArr.push(newIngredient);
      })
    );
  }
  if (ingredients) {
    updatedObject.ingredients = newIngredientsArr;
  }
  res.status(StatusCodes.OK).send(updatedObject);
};

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
