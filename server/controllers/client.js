import { Product, ProductPrice, Recipie } from "../models/Products/Product.js";
import ProductStat from "../models/Products/ProductStat.js";
import Category from "../models/Products/Category.js";
import { buildQuery } from "../utils/buildQuery.js";
import { StatusCodes } from "http-status-codes";
import { BadRequestError } from "../errors/bad-request.js";
import { CustomAPIError } from "../errors/index.js";
import PackageOption from "../models/Products/PackageOption.js";
import { NotFoundError } from "../errors/not-found.js";
import mongoose from "mongoose";
import Extras from "../models/Products/Extras.js";
import InventoryItem from "../models/Inventories/InventoryItem.js";

/********************************* PRODUCTS *********************************/

export const getProducts = async (req, res) => {
  const {
    name,
    nameOptions,
    description,
    descriptionOptions,
    category,
    categoryOptions,
    numericFilters,
    projection,
    sort,
    page,
    offset,
  } = req.query;

  const queryObject = {};
  const numQuery = {};
  const structureQuery = {};
  /* Query params */

  const stringParams = [];
  const fields = [
    { name: "name", value: name, options: nameOptions },
    { name: "description", value: description, options: descriptionOptions },
    { name: "category", value: category, options: categoryOptions },
  ];

  for (const field of fields) {
    if (field.value) {
      stringParams.push({
        [field.name]: field.value,
        [`${field.name}Options`]: field.options,
      });
    }
  }

  /* Structure */
  if (projection) {
    structureQuery.projection = projection;
  }
  if (page && offset) {
    structureQuery.pagination = { page: page, limit: offset };
  }
  if (sort) {
    structureQuery.sort = sort;
  }

  /* String and num objects to build query*/

  if (stringParams.length > 0) {
    queryObject.stringParams = stringParams;
  }

  if (numericFilters) {
    numQuery.numericFilters = numericFilters;
    numQuery.options = [];
  }
  if (Object.keys(numQuery).length !== 0) {
    queryObject.numQuery = numQuery;
  }
  const queryProducts = await buildQuery(Product, queryObject, structureQuery);

  if (!queryProducts) {
    throw new NotFoundError("No documents found");
  }

  // const totalDocuments = await Product.countDocuments();
  // const totalPages = Math.ceil(totalDocuments / pagination.limit);

  res.status(StatusCodes.OK).json({
    queryProducts,
  });
};

export const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id);
  const ingredients = await Recipie.find({
    product: req.params.id,
  })
    .select("-product")
    .populate("ingredient");
  const prices = await ProductPrice.find({ product: req.params.id }).select(
    "-product"
  );

  res.status(StatusCodes.OK).send({ product, category, ingredients, prices });
};

export const createProduct = async (req, res) => {
  const { name, description, categoryId } = req.body;
  const transaction = req.transaction;
  const result = {};
  // "category" should be and ID from the rendered form
  // Ingredients should be a list
  if (!name || !description || !categoryId) {
    throw new BadRequestError(
      "Plase provide all of the necessary fiels to create your product"
    );
  }
  const createProd = {
    name: name,
    description: description,
    category: categoryId,
  };
  result.product = await Product.create(createProd, { session });
  transaction.commitTransaction();
  res.status(StatusCodes.CREATED).json(result);
};

export const deleteProduct = async (req, res) => {
  const deletedProduct = await Product.findByIdAndDelete(req.params.id);
  if (!deletedProduct) {
    throw new NotFoundError("Product was not found in the database");
  }
  res.status(StatusCodes.OK).send(deletedProduct);
};

export const updateProduct = async (req, res) => {
  const { name, description, category } = req.body;

  const updateProd = {};
  const messages = {};
  if (name) {
    updateProd.name = name;
  }
  if (description) {
    updateProd.description = description;
  }
  if (category) {
    updateProd.category = category;
  }

  const result = await Product.findByIdAndUpdate(req.params.id, updateProd, {
    new: true,
  });
  if (!result.product) {
    throw new NotFoundError("No product was found with that ID");
  }

  res.status(StatusCodes.OK).send(result);
};

/********************************* PRODUCT PRICES *********************************/

export const getPrices = async (req, res) => {
  const { size, numericFilters } = req.body;
  const product = req.params.id;

  const queryObject = {};
  const stringParams = [];
  const idFields = [];
  const numQuery = {};
  const structureQuery = {};
  /* Query params */
  if (product) {
    idFields.push({ id: product, fieldName: "product" });
  }
  if (size) {
    stringParams.push({ size, sizeOptions });
  }
  /* Structure */
  if (projection) {
    structureQuery.projection = projection;
  }
  if (page && offset) {
    structureQuery.pagination = { page: page, limit: offset };
  }
  if (sort) {
    structureQuery.sort = sort;
  }

  /* String and num objects to build query*/

  if (stringParams.length > 0) {
    queryObject.stringParams = stringParams;
  }

  if (numericFilters) {
    numQuery.numericFilters = numericFilters;
    numQuery.options = ["price"];
  }
  if (Object.keys(numQuery).length !== 0) {
    queryObject.numQuery = numQuery;
  }
  const queryProducts = await buildQuery(
    ProductPrice,
    queryObject,
    structureQuery
  );

  if (!queryProducts) {
    throw new NotFoundError("No documents found");
  }
};

export const createPrices = async (req, res) => {
  const { size, price } = req.body;
  const product = req.params.id;
  const transaction = req.transaction;
  // "prices":[
  //   {"size": "small", "price": 200},
  //   {"size": "medium", "price": 250},
  //   {"size": "large", "price": 300},
  // ]
  if (!size || !price) {
    throw new BadRequestError(
      "Please provide both the size and price for the presentations of this product"
    );
  }
  const createProdSize = {
    product: product,
    size: size,
    price: price,
  };
  const result = await ProductPrice.create(createProdSize, {
    transaction,
  });

  transaction.commitTransaction();
  res.status(StatusCodes.CREATED).json(result);
};
export const deletePrices = async (req, res) => {};
export const updatePrices = async (req, res) => {};

/********************************* PRODUCT RECIPIE *********************************/
export const getAllRecipies = async (req, res) => {
  const { ingredient, size, numericFilters } = req.body;
  const product = req.params.id;

  const queryObject = {};
  const stringParams = [];
  const idFields = [];
  const numQuery = {};
  const structureQuery = {};
  /* Query params */
  if (product) {
    idFields.push({ id: product, fieldName: "product" });
  }
  if (ingredient) {
    idFields.push({ id: ingredient, fieldName: "ingredient" });
  }
  if (size) {
    stringParams.push({ size, sizeOptions });
  }
  /* Structure */
  if (projection) {
    structureQuery.projection = projection;
  }
  if (page && offset) {
    structureQuery.pagination = { page: page, limit: offset };
  }
  if (sort) {
    structureQuery.sort = sort;
  }

  /* String and num objects to build query*/

  if (stringParams.length > 0) {
    queryObject.stringParams = stringParams;
  }

  if (numericFilters) {
    numQuery.numericFilters = numericFilters;
    numQuery.options = ["units"];
  }
  if (Object.keys(numQuery).length !== 0) {
    queryObject.numQuery = numQuery;
  }
  const queryProducts = await buildQuery(
    ProductPrice,
    queryObject,
    structureQuery
  );

  if (!queryProducts) {
    throw new NotFoundError("No documents found");
  }
  res.status(StatusCodes.OK).json(queryProducts);
};
// Call this many times to be able to update usedUnits
export const getRecipie = async (req, res) => {
  const { prodId, ingredientId } = req.params;
  const { size } = req.body;

  const result = Recipie.findOne({ product: prodId, ingredient: ingredientId });
};
export const createRecipie = async (req, res) => {
  const { ingredient, size, units } = req.body;
  const product = req.params.id;
  const transaction = req.transaction;

  const createProdIngredient = {
    product: product,
    ingredient: ingredient.id,
    size: size,
    units: units,
  };
  const result = await Recipie.create(createProdIngredient, {
    session,
  });
  if (result) {
    throw new CustomAPIError(
      "An error ocurred during the creation of your ingredient list"
    );
  }
  transaction.commitTransaction();
  res.status(StatusCodes.CREATED).json(result);
};
export const deleteRecipie = async (req, res) => {
  const { action } = req.query;
  const { prodId, ingredientId } = req.params;
  switch (action) {
    case "recipieIngredient":
      break;
    case "product":
      break;

    default:
      break;
  }
};
export const updateRecipie = async (req, res) => {};
/********************************* CATEGORIES *********************************/

// Order panel categories cards + packages + extras
export const getAllCategories = async (req, res) => {
  const categories = await Category.find({});
  res.status(StatusCodes.OK).json({ categories });
};
export const getCategory = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    throw new NotFoundError("That category is not in the database");
  }
  res.status(StatusCodes.OK).json({ category });
};
export const createCategory = async (req, res) => {
  const { name } = req.body;
  if (!name) {
    throw new BadRequestError(
      "Please provide a name and check if the category has sizes"
    );
  }
  const category = await Category.create({
    name: name,
  });

  res.status(StatusCodes.OK).json({ category });
};
export const updateCategory = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    throw new BadRequestError("You must provide a name parameter");
  }

  const updateQuery = {
    name: name,
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
  res.status(StatusCodes.OK).json(deletedCategory);
};

/********************************* PACAKGES *********************************/

export const getAllPackageOptions = async (req, res) => {
  const { name, nameOptions, numericFilters, projection, sort, page, offset } =
    req.query;
  const queryObject = {};
  const stringParams = [];
  const numQuery = {};
  const structureQuery = {};
  /* Query params */
  if (name) {
    stringParams.push({ name, nameOptions });
  }
  /* Structure */
  if (projection) {
    structureQuery.projection = projection;
  }
  if (page && offset) {
    structureQuery.pagination = { page: page, limit: offset };
  }
  if (sort) {
    structureQuery.sort = sort;
  }

  /* String and num objects to build query*/

  if (stringParams.length > 0) {
    queryObject.stringParams = stringParams;
  }

  if (numericFilters) {
    numQuery.numericFilters = numericFilters;
    numQuery.options = ["price"];
  }
  if (Object.keys(numQuery).length !== 0) {
    queryObject.numQuery = numQuery;
  }
  const packageQuery = await buildQuery(
    PackageOption,
    queryObject,
    structureQuery
  );

  if (!packageQuery) {
    throw new NotFoundError("Not packages were found");
  }
  res.status(StatusCodes.OK).json(packageQuery);
};

export const getPackageOption = async (req, res) => {
  const foundPackage = await PackageOption.findById(req.params.id);
  if (!foundPackage) {
    throw new NotFoundError("Package option not found");
  }
  res.status(StatusCodes.OK).json(foundPackage);
};

// if small and large, make 2:
// {categories: [
//   {category: "32n2jnk34jb34523nk52", size: "small", maxCount: 1},
//   {category: "32n2jnk34jb34523nk52", size: "large", maxCount: 1}
// ],
//   name: "something",
//   price: 205 }

export const createPackageOption = async (req, res) => {
  const { name, price, options } = req.body;

  if (!name || !price || !options.length > 0) {
    throw new BadRequestError(
      "You need a name, a price and at least one option for your package"
    );
  }

  const uniqueCategories = new Set();
  options.map((option) => {
    if (!option.category || !option.size || !option.maxCount) {
      throw new BadRequestError(
        "Please provide all of the three fields for your option"
      );
    }
    const compoundKey = `${option.category}-${option.size}`;
    if (uniqueCategories.has(compoundKey)) {
      // The combination of category and size is not unique
      throw new BadRequestError(
        "The same size for the same category was introduced more than once. Please choose only one of your options"
      );
    } else {
      uniqueCategories.add(compoundKey);
    }
  });

  const createdPackage = await PackageOption.create({
    name: name,
    price: price,
    options: options,
  });
  res.status(StatusCodes.CREATED).json(createdPackage);
};

export const updatePackageOption = async (req, res) => {
  const id = req.params.id;
  const { name, price, options } = req.body;

  // const updateObject = {
  //   name: "Package 1",
  //   price: 207,
  //   options: [
  //     { category: "new_category_id", size: "small", maxCount: 3 },
  //     { category: "new_category_id", size: "large", maxCount: 1 },
  //     { category: "new_category_id", size: "medium", maxCount: 4 },
  //   ],
  // };
  if (!name || !price || !options) {
    throw BadRequestError(
      "Please provide all the information of your updated resourse"
    );
  }
  const updatePackage = {};
  updatePackage.name = name;
  updatePackage.price = price;

  const uniqueCategories = new Set();
  options.map((option) => {
    if (!option.category || !option.size || !option.maxCount) {
      throw new BadRequestError(
        "Please provide all of the three fields for your option"
      );
    }
    const compoundKey = `${option.category}-${option.size}`;
    if (uniqueCategories.has(compoundKey)) {
      // The combination of category and size is not unique
      throw new BadRequestError(
        "The same size for the same category was introduced more than once. Please choose only one of your options"
      );
    } else {
      uniqueCategories.add(compoundKey);
    }
  });
  updatePackage.options = options;

  const result = await PackageOption.findByIdAndUpdate(id, updatePackage, {
    new: true,
  });

  res.status(StatusCodes.OK).json(result);
};
// const option = {
// option:{
//   category: "63b1a51b374461ccaea1d494",
//   size: "small",
//   maxCount: 3 ,
// };
// result.upadtedOptions = [];
// if (options) {
//   await Promise.all(async (option) => {
//     //Make a search, update maxCount or upsert object
//     if (!option.oldCategory || !option.oldSize) {
//       throw new BadRequestError(
//         "Expected the ID of the category to update and the size to update, received none"
//       );
//     }
//     const setObject = {};
//     if (option.category) {
//       setObject.category = option.category;
//     }
//     if (option.size) {
//       setObject.size = option.size;
//     }
//     if (option.maxCount) {
//       setObject.maxCount = option.maxCount;
//     }
//     const packageOption = await PackageOption.findOneAndUpdate(
//       {
//         _id: id,
//         "categories.category": option.oldCategory,
//         "categories.size": option.oldSize,
//       },
//       setObject,
//       { new: true }
//     );
//     if (!packageOption) {
//       const upsertOption = await PackageOption.findOneAndUpdate(
//         { _id: id },
//         { $addToSet: { categories: setObject } },
//         { new: true }
//       );
//       if (!upsertOption) {
//         throw new CustomAPIError("Your option could not be inserted");
//       }
//       return result.upadtedOptions.push(upsertOption);
//     }
//     result.upadtedOptions.push(packageOption);
//   });
// }

// if (options) {
//   await Promise.all(
//     options.map(async (option) => {
//       if (!option.oldCategory || !option.oldSize) {
//         throw new BadRequestError(
//           "Expected the ID of the category to update and the size to update, received none"
//         );
//       }
//       const setObject = {};
//       if (option.category) {
//         setObject["categories.$.category"] = option.category;
//       }
//       if (option.size) {
//         setObject["categories.$.size"] = option.size;
//       }
//       if (option.maxCount) {
//         setObject["categories.$.maxCount"] = option.maxCount;
//       }

//       // check if we need to update or insert a new element
//       const packageOption = await PackageOption.updateOne(
//         {
//           _id: id,
//           "categories.category": option.oldCategory,
//           "categories.size": option.oldSize,
//         },
//         { $set: setObject },
//         { new: true }
//       );
//       if (packageOption.modifiedCount === 0) {
//         // add a new element to the array
//         const upsertOption = await PackageOption.updateOne(
//           {
//             _id: id,
//             "categories.category": option.oldCategory,
//             "categories.size": option.oldSize,
//           },
//           { $addToSet: { categories: setObject } },
//           { new: true }
//         );
//         console.log("setObject", setObject);
//         if (upsertOption.modifiedCount === 0) {
//           throw new CustomAPIError("Your option could not be inserted");
//         }
//       }
//       result.upadtedOptions.push(packageOption);
//     })
//   );
// }

export const deletePackageOption = async (req, res) => {
  const deletedPackage = await PackageOption.findByIdAndDelete(req.params.id);
  res.status(StatusCodes.OK).json(deletedPackage);
};

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
/* You can only create extras for ingredients. If the customer asks for extra fries or extra boneless.
Create another product above 'large'. If large boneless have 12 pieces, but customer wants 16
Make a boneless product for that recipe (spiciy, lemmon pepper, etc) with 16 pieces and fixed size*/

export const getAllExtras = async (req, res) => {
  const extras = await Extras.find({})
    .populate("ingredient")
    .select(
      "-ingredient.currentLevel -ingredient.thresholdLevel -ingredient.type"
    );
  res.status(StatusCodes.OK).json(data);
};
export const getExtra = async (req, res) => {
  const extras = await Extras.findById(req.params.id);
  const info = await InventoryItem.findById(extras.ingredient);
  res.status(StatusCodes.OK).json({ extras, info });
};
export const createExtra = async (req, res) => {
  const { ingredient, price, quantity } = req.body;
  if (!ingredient || !price || !quantity) {
    throw new BadRequestError(
      "Please provide all of the fields necessary to create a new 'Extras' document"
    );
  }
  const newExtra = await Extras.create({ ingredient, price, quantity });
  res.status(StatusCodes.OK).json(newExtra);
};
export const updateExtra = async (req, res) => {
  const { ingredient, price, quantity } = req.body;
};
export const deleteExtra = async (req, res) => {};
