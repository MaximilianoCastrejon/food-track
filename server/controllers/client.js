import { Product, ProductPrice, Recipe } from "../models/Products/Product.js";
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
    numericFilters,
    projection,
    sort,
    page,
    offset,
  } = req.query;

  const queryObject = {};
  const numQuery = {};
  const idFields = [];
  const structureQuery = {};
  /* Query params */

  const stringParams = [];
  const fields = [
    { name: "name", value: name, options: nameOptions },
    { name: "description", value: description, options: descriptionOptions },
  ];

  for (const field of fields) {
    if (field.value) {
      stringParams.push({
        [field.name]: field.value,
        [`${field.name}Options`]: field.options,
      });
    }
  }

  if (category) {
    idFields.push({ id: category, fieldName: "category" });
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
  if (idFields.length !== 0) {
    queryObject.idFields = idFields;
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

  res.status(StatusCodes.OK).json(queryProducts);
};

export const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id);
  const recipe = await Recipe.find({
    product: req.params.id,
  })
    .select("-product")
    .populate("ingredient");
  const prices = await ProductPrice.find({ product: req.params.id }).select(
    "-product"
  );

  if (!product || !recipe || !prices) {
    throw new NotFoundError("Some data could not be retrieved");
  }
  res.status(StatusCodes.OK).json({ product, Recipe, prices });
};

// Create the product
// Create prices
// Create Recipe
// Create prod stats
export const createProduct = async (req, res) => {
  const { name, description, categoryId } = req.body;
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
  result.product = await Product.create(createProd);
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
  if (name) {
    updateProd.name = name;
  }
  if (description) {
    updateProd.description = description;
  }
  if (category) {
    updateProd.category = category;
  }
  console.log(req.params.id);
  const result = await Product.findByIdAndUpdate(
    req.params.id,
    { updateProd },
    {
      new: true,
    }
  );
  if (!result) {
    throw new NotFoundError("No product was found with that ID");
  }

  res.status(StatusCodes.OK).json(result);
};

/********************************* PRODUCT PRICES *********************************/

export const getPrices = async (req, res) => {
  const { size, numericFilters, projection, sort, page, offset, populate } =
    req.query;
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
  if (idFields.length !== 0) {
    queryObject.idFields = idFields;
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

export const createPrices = async (req, res) => {
  const { prices } = req.body;
  const product = req.params.id;
  // "productPrices":[
  //   {"product": "63eaba002b31aac6376c3049", "prices":{"small": 30, "medium": 50, "large": 90}},
  // ]

  const priceData = [];
  for (const [size, price] of Object.entries(prices)) {
    let result = await ProductPrice.create({
      product: product,
      price: price,
      size: size,
    });
    console.log("result", result);
    priceData.push(result);
  }

  res.status(StatusCodes.CREATED).json(priceData);
};
export const deletePrices = async (req, res) => {
  const prodId = req.params.id;
  const deleted = await ProductPrice.deleteMany({ product: prodId });
  res.status(StatusCodes.OK).json(deleted);
};
export const deletePrice = async (req, res) => {
  const { prodId, priceId } = req.params;
  const deleted = await ProductPrice.findByIdAndDelete(priceId).catch(() => {
    throw new NotFoundError("No registry found with that ID");
  });
  res.status(StatusCodes.OK).json(deleted);
};
export const updatePrice = async (req, res) => {};

/********************************* PRODUCT RECIPE *********************************/
export const getAllRecipes = async (req, res) => {
  const {
    ingredient,
    size,
    numericFilters,
    projection,
    sort,
    page,
    offset,
    populate,
  } = req.query;
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
  if (populate) {
    console.log("populate", populate);
    structureQuery.populate = populate;
  }
  if (stringParams.length > 0) {
    /* String and num objects to build query*/

    queryObject.stringParams = stringParams;
  }

  if (numericFilters) {
    numQuery.numericFilters = numericFilters;
    numQuery.options = ["units"];
  }
  if (idFields.length !== 0) {
    queryObject.idFields = idFields;
  }

  if (Object.keys(numQuery).length !== 0) {
    queryObject.numQuery = numQuery;
  }
  const queryProducts = await buildQuery(Recipe, queryObject, structureQuery);

  if (!queryProducts) {
    throw new NotFoundError("No documents found");
  }
  res.status(StatusCodes.OK).json(queryProducts);
};
// Call this many times to be able to update usedUnits
export const getRecipeIngredient = async (req, res) => {
  const { prodId, ingredientId } = req.params;
  const { size } = req.body;
  const queryObject = {};
  if (size) {
    queryObject.size = size;
  }
  const result = await Recipe.findOne({
    product: prodId,
    ingredient: ingredientId,
    queryObject,
  });
  res.status(StatusCodes.OK).json(result);
};

export const createRecipeIngredient = async (req, res) => {
  const { ingredients } = req.body;
  const product = req.params.id;
  const recipePromises = ingredients.map(async (ingredient) => {
    if (!validateObject(ingredient, ["id", "units"])) {
      throw new BadRequestError(
        "Please provide all of the fields required for every ingredient"
      );
    }
    const recipeData = [];
    for (const [size, value] of Object.entries(ingredient.units)) {
      let result = await Recipe.create({
        product: product,
        ingredient: ingredient.id,
        size: size,
        units: value,
      });
      // console.log("result", result);
      recipeData.push(result);
    }
    // console.log("recipeData", recipeData);
    return recipeData;
  });

  function validateObject(obj, keys) {
    return keys.every((key) => obj.hasOwnProperty(key) && obj[key]);
  }

  const resolvedPromises = await Promise.all(recipePromises);
  res.status(StatusCodes.CREATED).json(resolvedPromises);
};
export const deleteRecipe = async (req, res) => {
  const prodId = req.params.id;
  await Recipe.deleteMany({ product: prodId }).catch((err) => {
    throw new CustomAPIError(
      "An error ocurred during the deletion of your Recipe"
    );
  });
  res.status(StatusCodes.OK).json({ msg: "Deletion Successful" });
};
export const deleteRecipeIngredient = async (req, res) => {
  const { prodId, ingredientId } = req.params;
  const deleted = await Recipe.findOneAndDelete({
    product: prodId,
    ingredient: ingredientId,
  });
  if (!deleted) {
    throw new CustomAPIError(
      "An error ocurred during the deletion of your Recipe"
    );
  }
  res.status(StatusCodes.OK).json(deleted);
};
export const updateRecipe = async (req, res) => {
  const { size, units } = req.body;
  const { prodId, ingredientId } = req.params;
  const updateObject = {};
  if (size) {
    updateObject.size = size;
  }
  if (units) {
    updateObject.units = units;
  }
  const updated = await Recipe.findOneAndUpdate(
    {
      product: prodId,
      ingredient: ingredientId,
    },
    { updateObject }
  );
  res.status(StatusCodes.OK).json(updated);
};

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
    req.params.id,
    updateQuery,
    { new: true }
  );
  res.status(StatusCodes.OK).json({ updatedCategory });
};

export const deleteCategory = async (req, res) => {
  const deletedCategory = await Category.findByIdAndDelete(req.params.id).catch(
    (err) => {
      throw new CustomAPIError("Your category could not be deleted ");
    }
  );
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
  const queryExperiments = await PackageOption.findOne({
    // _id: req.params.id,
    "options.size": "fixed",
  });
  console.log("queryExperiments", queryExperiments.options);
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

  // const uniqueCategories = new Set();
  options.map((option) => {
    if (!option.category || !option.size || !option.maxCount) {
      throw new BadRequestError(
        "Please provide all of the three fields for your option"
      );
    }
    // const compoundKey = `${option.category}-${option.size}`;
    // if (uniqueCategories.has(compoundKey)) {
    //   // The combination of category and size is not unique
    //   throw new BadRequestError(
    //     "The same size for the same category was introduced more than once. Please choose only one of your options"
    //   );
    // } else {
    //   uniqueCategories.add(compoundKey);
    // }
  });

  const createdPackage = await PackageOption.create({
    name: name,
    price: price,
    options: options,
  });
  res.status(StatusCodes.CREATED).json(createdPackage);
};

export const updatePackageOption = async (req, res) => {
  const packageId = req.params.id;
  const { /*name, price, updateOptions, whereOptions*/ packageData } = req.body;

  // const updateObject = {
  //   name: "Package 1",
  //   price: 207,
  //   options: [
  //     { category: "new_category_id", size: "small", maxCount: 3 },
  //     { category: "new_category_id", size: "large", maxCount: 1 },
  //     { category: "new_category_id", size: "medium", maxCount: 4 },
  //   ],
  // };
  // let updatePackage = {};

  // if (name) {
  //   updatePackage.name = name;
  // }
  // if (price) {
  //   updatePackage.price = price;
  // }
  // const arrayFilters = [];
  // if (updateOptions) {
  //   if (!areArraysEqual(updateOptions, whereOptions)) {
  //     throw new BadRequestError(
  //       "Provide the same amount of updated objects as the amount of objects to update"
  //     );
  //   }

  //   // const options = [];

  //   // for (let i = 0; i < updateOptions.length; i++) {
  //   //   options.push(`category${i}`);
  //   //   for (let j = 0; j < m; j++) {
  //   //     options.push(`size${j}`);
  //   //     const result = `options.$[${options.join("].$[")}]`;
  //   //     //"options.$[category1].$[size1]"
  //   //     updatePackage = { ...updatePackage, result: updateOptions[i].size };
  //   //     arrayFilters.push({ options: whereOptions[filter].category });
  //   //     arrayFilters.push({ size1: whereOptions[filter].size });

  //   //     console.log(result);
  //   //     options.pop();
  //   //   }
  //   //   options.pop();
  //   // }

  //   const collection = PackageOption;
  //   const documentId = packageId;
  //   const arrayName = "options";
  //   const updateSpecs = [
  //     {
  //       identifier: "$[size1].maxCount",
  //       filter: { size: "small" },
  //       updates: { maxCount: 2 },
  //     },
  //     {
  //       identifier: "$[color2].stock",
  //       filter: { color: "red" },
  //       updates: { stock: 5 },
  //     },
  //   ];

  //   await updateArrayOfObjects(collection, documentId, arrayName, updateSpecs)
  //     .then((result) => {
  //       console.log(result);
  //     })
  //     .catch((error) => {
  //       console.error(error);
  //     });

  //   const updateArrayOfObjects = async (
  //     collection,
  //     documentId,
  //     arrayName,
  //     updateSpecs
  //   ) => {
  //     return collection.updateOne(
  //       { _id: documentId },
  //       {
  //         $set: updateSpecs.reduce((acc, spec) => {
  //           const { identifier, filter, updates } = spec;
  //           acc[arrayName + "." + identifier] = {
  //             $set: updates,
  //           };
  //           return acc;
  //         }, {}),
  //       },
  //       {
  //         arrayFilters: updateSpecs.map((spec) => {
  //           const { identifier, filter } = spec;
  //           return { [identifier]: filter };
  //         }),
  //       }
  //     );
  //   };

  // const result = await Collection.updateMany(
  //   {},
  //   { $set: update },
  //   { arrayFilters: update.arrayFilters }
  // );

  // { arrayFilters: [
  //   { "category1": "0as98d09as09b0dfb09s8df09" },
  //   { "size": "small" } ] }

  //   "options.$[category2].$[size]": "small"
  //   { arrayFilters: [
  //     { "category2": "0s9hs80df789f6709dgn7689" },
  //     { "size": "medium" } ] }

  //     "options.$[category1].$[size].maxCount": 2
  //     { arrayFilters: [
  //       { "category1": "0as98d09as09b0dfb09s8df09" },
  //       { "size": "small" } ] }
  //     "options.$[category2].$[size].maxCount": 4
  //     { arrayFilters: [
  //       { "category2": "0s9hs80df789f6709dgn7689" },
  //       { "size": "medium" } ] }
  // }

  // const uniqueCategories = new Set();
  // options.map((option) => {
  //   if (!option.category || !option.size || !option.maxCount) {
  //     throw new BadRequestError(
  //       "Please provide all of the three fields for your option"
  //     );
  //   }
  //   const compoundKey = `${option.category}-${option.size}`;
  //   if (uniqueCategories.has(compoundKey)) {
  //     // The combination of category and size is not unique
  //     throw new BadRequestError(
  //       "The same size for the same category was introduced more than once. Please choose only one of your options"
  //     );
  //   } else {
  //     uniqueCategories.add(compoundKey);
  //   }
  // });
  // updatePackage.options = options;

  const result = await PackageOption.findByIdAndUpdate(
    packageId,
    { $set: packageData },
    {
      new: true,
    }
  ).catch((err) => {
    console.log(err);
  });
  console.log(packageData);
  res.status(StatusCodes.OK).json(result);
};

const areArraysEqual = (array1, array2) => {
  if (array1.length !== array2.length) {
    return false;
  }
  for (let i = 0; i < array1.length; i++) {
    const obj1 = array1[i];
    const obj2 = array2[i];
    const obj1Keys = Object.keys(obj1);
    const obj2Keys = Object.keys(obj2);
    if (obj1Keys.length !== obj2Keys.length) {
      return false;
    }
    for (let j = 0; j < obj1Keys.length; j++) {
      const key = obj1Keys[j];
      if (!obj2.hasOwnProperty(key) || obj1[key] !== obj2[key]) {
        return false;
      }
    }
  }
  return true;
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
