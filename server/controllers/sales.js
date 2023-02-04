import { StatusCodes } from "http-status-codes";
import {
  Customer,
  CustomerLoyalty,
  LoyaltyTier,
} from "../models/Sales/Customer.js";
import Order from "../models/Sales/Order.js";
import Extras from "../models/Products/Extras.js";
import { Product, ProductPrice, Recipie } from "../models/Products/Product.js";
import PackageOption from "../models/Products/PackageOption.js";
import mongoose from "mongoose";
import { NotFoundError } from "../errors/not-found.js";
import { BadRequestError } from "../errors/bad-request.js";
import InventoryItem from "../models/Inventories/InventoryItem.js";
import Sale from "../models/Sales/Sale.js";

/********************************* ORDERS *********************************/

// query objects inside array field
export const getAllOrders = async (req, res) => {
  const { populate, numericFilters, sort, projection, page, offset } =
    req.query;

  const queryObject = {};
  const stringParams = [];
  const arrayStringParams = [];
  const numQuery = {};
  const arrNumQuery = {};
  const idFields = [];
  const structureQuery = {};
  /* Query params */

  /* Structure */
  if (projection) {
    structureQuery.projection = projection;
  }
  if (page || offset) {
    structureQuery.pagination = { page: page, limit: offset };
  }
  //Sort by item id
  if (sort) {
    structureQuery.sort = sort;
  }
  if (populate) {
    structureQuery.populate = populate;
  }
  /* String and num objects to build query*/
  if (numericFilters) {
    numQuery.numericFilters = numericFilters;
    numQuery.options = [];
  }

  if (stringParams.length > 0) {
    queryObject.stringParams = stringParams;
  }
  if (Object.keys(numQuery).length !== 0) {
    queryObject.numQuery = numQuery;
  }
  if (idFields.length > 0) {
    queryObject.idFields = idFields;
  }
  const queryProducts = await buildQuery(Order, queryObject, structureQuery);

  // {
  //     arrayFilters: [
  //       { product: mongoose.Types.ObjectId(productId) },
  //       { package: packageOptionId },
  //     ],
  // }

  res.status(StatusCodes.OK).json(queryProducts);
};

// Query products with category and size specified
// TODO: query products
export const createOrder = async (req, res) => {
  const { products, packages, extras } = req.body;

  const orderObject = {};
  const session = await mongoose.startSession();

  if (products) {
    orderObject.products = products;
  }
  if (packages) {
    orderObject.packages = packages;
  }
  if (extras) {
    orderObject.extras = extras;
  }
  session.startTransaction();
  try {
    const order = Order.create(orderObject, { session });
    if (!order) {
      throw new BadRequestError("Order was not created");
    }
    const loyatyTier = await CustomerLoyalty.find({});
    let valueOfProducts;
    let valueOfPackages;
    const transactionObj = {};
    if (products) {
      await Promise.all(
        products.map(async (obj) => {
          const productPrice = await ProductPrice.findOne({
            product: obj.product,
            size: obj.size,
          });
          valueOfProducts += productPrice.price;

          const productInventory = Recipie.find({
            product: obj.product,
          });
          productInventory.map((ingredient) => {
            InventoryItem;
          });
        })
      );
      transactionObj.valueOfProducts = valueOfProducts;
      await Promise.all(Product);
    }
    transactionObj.id = order._id;
    if (packages) {
      await Promise.all(
        packages.map(async (obj) => {
          const packageOpt = await PackageOption.findOne({
            package: obj.package,
          });
          valueOfPackages += packageOpt.price;
        })
      );
      transactionObj.valueOfPackages = valueOfPackages;
    }

    if (extras) {
      await Promise.all(
        extras.map(async (obj) => {
          const packageOpt = await Extras.findOne({
            ingredient: obj.ingredient,
          });
          valueOfPackages += packageOpt.price;
        })
      );
      transactionObj.valueOfPackages = valueOfPackages;
    }

    transactionObj.valueOfOrder =
      valueOfProducts + (await Sale.create({ order: order._id }));
    updateInventory(order);
    updateSales();

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  res.status(StatusCodes.OK).json({ sales });
};

// If I update orders,
export const updateOrder = async (req, res) => {
  // No err handleing because always sends whole resource
  const { products, packages, extras } = req.body;
  /*products: [
      product:
      quantity: 
      excludedIngredients:
      size: 
]*/
  /*packages: [
      package:
      packageProducts: [
        product:
        quantity:
        excludedIngredients:
        size:
        quantity:
        excludedIngredients: 
      ]
    ]*/
  const orderId = req.params.id;

  const updatedOrder = await Order.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        "products.$[product]": updateProducts,
        "packages.$[package]": updatePackage,
        "packages.$[package].packageProducts": updatePackageProducts,
        "extras.$[extra]": updateExtra,
      },
    },
    {
      arrayFilters: [
        { product: mongoose.Types.ObjectId(productId) },
        { package: packageOptionId },
      ],
    }
  );
  /*
  ////////////////////
  Update Sales registry
  ////////////////////
  */
  res.status(StatusCodes.OK).json({ sales });
};
export const deleteOrder = async (req, res) => {
  res.status(StatusCodes.OK).json({ sales });
};

/********************************* ORDER PRODUCTS *********************************/

// TODO: Handle all updating with if for request params
export const updateOrderPackageProduct = async (req, res) => {
  const { orderId, packageId, productId } = req.params;
  const { product, quantity, excludedIngredients, size } = req.body;
  const queryProduct = {
    _id: orderId,
    "packages.packageProducts": packageId,
    "packages.packageProduct.product": productId,
  };
  const updateObject = {};
  if (product) {
    updateObject.product = product;
  }
  if (quantity) {
    updateObject.quantity = quantity;
  }
  if (excludedIngredients) {
    updateObject.excludedIngredients = excludedIngredients;
  }
  if (size) {
    updateObject.size = size;
  }

  const updatedObject = await Order.findOneAndUpdate(
    queryProduct,
    updateObject
  );
  if (!updatedObject) {
    throw new NotFoundError(
      "That product is not part of this package or order"
    );
  }

  res.status(StatusCodes.OK).json(updatedObject);
};
export const deleteOrderPackageProduct = async (req, res) => {
  const { orderId, packageId, productId } = req.params;
  const queryProduct = {
    _id: orderId,
    "packages.packageProducts": packageId,
    "packages.packageProduct.product": productId,
  };

  const isDeleted = await Order.findOneAndDelete(queryProduct);

  if (!isDeleted) {
    throw new NotFoundError(
      "That product is not part of this package or order"
    );
  }

  res.status(StatusCodes.OK).json(updatedObject);
};

/********************************* ORDER PACKAGES *********************************/

export const updateOrderPackage = async (req, res) => {
  const { orderId, packageId, productId } = req.params;
  const { product, quantity, excludedIngredients, size } = req.body;
  const queryProduct = {
    _id: orderId,
    "packages.packageProducts": packageId,
    "packages.packageProduct.product": productId,
  };
  const updateObject = {};
  if (product) {
    updateObject.product = product;
  }
  if (quantity) {
    updateObject.quantity = quantity;
  }
  if (excludedIngredients) {
    updateObject.excludedIngredients = excludedIngredients;
  }
  if (size) {
    updateObject.size = size;
  }

  const updatedObject = await Order.findOneAndUpdate(
    queryProduct,
    updateObject
  );
  if (!updatedObject) {
    throw new NotFoundError(
      "That product is not part of this package or order"
    );
  }

  res.status(StatusCodes.OK).json(updatedObject);
};
export const deleteOrderPackage = async (req, res) => {
  const { orderId, packageId, productId } = req.params;
  const queryProduct = {
    _id: orderId,
    "packages.packageProducts": packageId,
    "packages.packageProduct.product": productId,
  };

  const isDeleted = await Order.findOneAndDelete(queryProduct);

  if (!isDeleted) {
    throw new NotFoundError(
      "That product is not part of this package or order"
    );
  }

  res.status(StatusCodes.OK).json(updatedObject);
};

/********************************* EXTRAS *********************************/

/********************************* CUSTOMERS *********************************/

export const getAllCustomers = async (req, res) => {
  const {
    firstName,
    firstNameOptions,
    lastName,
    lastNameOptions,
    email,
    emailOptions,
    phone,
    phoneOptions,
    houseNumber,
    houseNumberOptions,
    streetName,
    streetNameOptions,
    county,
    countyOptions,
    municipality,
    municipalityOptions,
    state,
    stateOptions,
    description,
    descriptionOptions,
  } = req.body;

  const stringParams = [];
  const fields = [
    { name: "firstName", value: firstName, options: firstNameOptions },
    { name: "lastName", value: lastName, options: lastNameOptions },
    { name: "email", value: email, options: emailOptions },
    { name: "phone", value: phone, options: phoneOptions },
    { name: "houseNumber", value: houseNumber, options: houseNumberOptions },
    { name: "streetName", value: streetName, options: streetNameOptions },
    { name: "county", value: county, options: countyOptions },
    { name: "municipality", value: municipality, options: municipalityOptions },
    { name: "state", value: state, options: stateOptions },
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
  const queryObject = {};
  const numQuery = {};
  const structureQuery = {};

  /* Structure */
  if (projection) {
    structureQuery.projection = projection;
  }
  if (page && offset) {
    structureQuery.pagination = { page: page, limit: offset };
  }
  //Sort by item id
  if (sort) {
    structureQuery.sort = sort;
  }
  if (populate) {
    structureQuery.populate = populate;
  }
  /* String and num objects to build query*/
  if (numericFilters) {
    numQuery.numericFilters = numericFilters;
    numQuery.options = [];
  }

  if (stringParams.length > 0) {
    queryObject.stringParams = stringParams;
  }
  if (Object.keys(numQuery).length !== 0) {
    queryObject.numQuery = numQuery;
  }
  if (Object.keys(objectId).length !== 0) {
    queryObject.objectId = objectId;
  }
  const queryResult = await buildQuery(Customer, queryObject, structureQuery);

  res.status(StatusCodes.OK).json(queryResult);
};

export const getCustomer = async (req, res) => {
  const sales = await Customer.find(/* User*/);
  res.status(StatusCodes.OK).json({ sales });
};
export const createCustomer = async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    houseNumber,
    streetName,
    county,
    municipality,
    state,
    description,
  } = req.body;
  if (!firstName) {
    throw new BadRequestError("Please provide the first name of the client");
  }
  const createCustomer = {
    firstName,
    lastName,
    email,
    phone,
    houseNumber,
    streetName,
    county,
    municipality,
    state,
    description,
  };

  const customer = await Customer.create(createCustomer);
  res.status(StatusCodes.OK).json(customer);
};

export const updateCustomer = async (req, res) => {
  const { action } = req.body;
  const customerId = req.params.id;
  let result;
  switch (action) {
    case "loyalty":
      break;
    case "customer":
      break;

    default:
      break;
  }
  const customerOrders = await Sale.find({ customer: customerId });
  let allTimeValue = 0;
  customerOrders.map((purchase) => {
    allTimeValue += purchase.valueOfOrder;
  });
  const customerLoyalty = await CustomerLoyalty.findOne({
    customer: customerId,
  }).populate("loyaltyTier");
  if (customerLoyalty) {
    const currentLoyaltyTier = customerLoyalty.loyaltyTier;
    const customerTotalOrderValue = allTimeValue;
    if (customerTotalOrderValue >= currentLoyaltyTier.minOrderValue) {
      const nextLoyaltyTier = await LoyaltyTier.findOne({
        minOrderValue: { $gt: currentLoyaltyTier.minOrderValue },
      });
      customerLoyalty.loyaltyTier = nextLoyaltyTier._id;
      await customerLoyalty.save();
    }
  }
  const sales = await Customer.find(/* User*/);
  res.status(StatusCodes.OK).json({ sales });
};
export const deleteCustomer = async (req, res) => {
  const sales = await Customer.find(/* User*/);
  res.status(StatusCodes.OK).json({ sales });
};

/********************************* LOYALTY TIERS *********************************/
export const createLoyalyTier = async (req, res) => {
  const { name, position, minOrderValue, discount } = req.body;
  res.status(StatusCodes.OK).json({ sales });
};
/********************************* CUSTOMER LOYALTY *********************************/
export const createCustomerTier = async (req, res) => {
  const { customerId } = req.body;
  const tier = await LoyaltyTier.findOne({ position: 1 });
  const customerTier = await LoyaltyTier.create({
    customer: customerId,
    tier: tier._id,
  });

  res.status(StatusCodes.OK).json(customerTier);
};
/********************************* SALES *********************************/

export const createSale = async (req, res) => {
  // GET latest Sale
  // UPDATE Sales with Orders since 'latest'
  // createdAt comes from order
  const { customerId, orderId, createdAt } = req.body;
  const createSale = {};

  const order = await Order.findById(orderId);
  createSale.valueOfProducts = await calculateValueOf_Products(order.products);
  createSale.valueOfPackages = await calculateValueOf_Packages(order.packages);
  createSale.valueOfExtras = await calculateValueOf_Extras(order.extras);
  createSale.valueOfOrder =
    createSale.valueOfProducts +
    createSale.valueOfPackages +
    createSale.valueOfExtras;
  createSale.createdAt = order.createdAt;
  const customer = CustomerLoyalty.findOne({ customer: customerId });
  createSale.discount = LoyaltyTier.findOne({ tier: customer.tier });

  for (const packageArr of order.packages) {
    for (const product of packageArr) {
    }
  }
  for (const item of order.extras) {
  }

  const sale = await Sale.create(createSale);
};

async function calculateValueOf_Products(products) {
  let result;
  for (const orderProduct of products) {
    const product = await Product.findOne({
      product: orderProduct._id,
      size: orderProduct.size,
    });
    result += product.price;
  }
  return result;
}
async function calculateValueOf_Packages(packages) {
  let result;
  for (const option of packages) {
    const packageOption = await PackageOption.findById(option.package);
    result += packageOption.price;
  }
}
async function calculateValueOf_Extras(extras) {}
