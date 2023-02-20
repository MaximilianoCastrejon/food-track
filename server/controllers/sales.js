import { StatusCodes } from "http-status-codes";
import {
  Customer,
  CustomerLoyalty,
  LoyaltyTier,
} from "../models/Sales/Customer.js";
import Order from "../models/Sales/Order.js";
import Extras from "../models/Products/Extras.js";
import { Product, ProductPrice, Recipe } from "../models/Products/Product.js";
import PackageOption from "../models/Products/PackageOption.js";
import mongoose from "mongoose";
import { NotFoundError } from "../errors/not-found.js";
import { BadRequestError } from "../errors/bad-request.js";
import InventoryItem from "../models/Inventories/InventoryItem.js";
import Sale from "../models/Sales/Sale.js";
import Account from "../models/Accounting/Account.js";

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
  const orders = await buildQuery(Order, queryObject, structureQuery);
  if (!orders) {
    throw new NotFoundError("No orders found");
  }
  res.status(StatusCodes.OK).json(orders);
};

export const getOrder = async (req, res) => {};

// Query products with category and size specified
// TODO: query products
// Get customers
// Select customer
// Get loyalty
// Get latest update
// Get order items since last update
// Get products in orders
// Get ingredients
// Get extras
// Create and update Inventory History registries
// Get package prices
// Get product prices
// Get extras prices
// Create sale with order, value, discount and customer
// Update InventoryItem current level
// Update Income
// Update account
// Update customer loyalty tier
export const createOrder = async (req, res) => {
  const { products, packages, extras } = req.body;

  const orderObject = {};

  if (products) {
    orderObject.products = products;
  }
  if (packages) {
    for (const pack of packages) {
      await validatePackageProducts(pack.package, pack.packageProducts);
    }
    orderObject.packages = packages;
  }
  if (extras) {
    orderObject.extras = extras;
  }
  const order = await Order.create(orderObject);
  if (!order) {
    throw new BadRequestError("Order was not created");
  }

  // Update Inventory Item current level
  res.status(StatusCodes.OK).json(order);
};

// const schema = await PackageOption.findById(pkg.package);
// [{[]}]
// for (const pkg of packages) {
//   validateArrays(pkg.options, schema.options);
// }
// validatePackages(packages, schema);
// function validateArrays(arr1, arr2, field1, field2) {
//   if (arr1.length !== arr2.length) {
//     return false; // Arrays are not of equal size
//   }

//   const field2Values = new Set(arr2.map((obj) => obj[field1]));

//   for (const obj1 of arr1) {
//     const matchingObj2 = arr2.find((obj2) => obj2[field1] === obj1[field1]);

//     if (!matchingObj2 || matchingObj2[field2] !== obj1[field2]) {
//       return false; // No matching object found or field values do not match
//     }

//     field2Values.delete(matchingObj2[field1]);
//   }

//   return field2Values.size === 0; // All values in field1 in arr2 were matched
// }

// async function validatePackages(packages) {
//   for (const pkg of packages) {
//     if (pkg.options.length() !== schema.options.length()) {
//       throw new BadRequestError(
//         "Complete your package or select another one that provides the options you selected"
//       );
//     }
//     const packageCategories = new Set();
//     const packageQuantities = new Set();
//     packageCategories.add(
//       pkg.options.map((option) => {
//         return option.category;
//       })
//     );

//     schema.options.forEach((element) => {
//       element.maxCount;
//       if (!packageCategories.has(element.category)) {
//         throw new BadRequestError(
//           "Please select only products with categories contemplated for this package"
//         );
//       }
//     });
//   }
// }

// If I update orders,
export const updateOrder = async (req, res) => {
  // No err handleling because always sends whole resource
  const {
    productId,
    prodQty,
    prodSize,
    prodExcluded,
    packageId,
    packageProdIds,
    packageProdSizes,
    packageQty,
    extras,
    newOrder,
    createdAt,
  } = req.body;
  const orderId = req.params.id;

  /*
  "newOrder":[
    "products": [{},{}],
    "packages": [{},{}],
    "extras": []
    ]  */

  const productArr = new Map();
  const packageArr = new Map();

  for (const item of newOrder) {
    if (item.product) {
      productArr.set(item.where.id, item.product);
    } else if (item.package) {
      packageArr.set(item.where.id, item.package);
    }
  }

  const prodArrFields = ["quantity", "size", "excludedIngredients"];
  let updateOrder;
  let query = { $or: [] };
  arrayFilters = [];
  if (productId) {
    if (prodQty) {
      updateOrder = { ...updateOrder, "products.$.quantity": prodQty };
    }
    if (prodSize) {
      updateOrder = { ...updateOrder, "products.$.size": prodSize };
    }
    if (prodExcluded) {
      updateOrder = {
        ...updateOrder,
        $set: { "products.$.excludedIngredients": prodExcluded },
      };
    }
  }
  if (packageId) {
    if (packageQty) {
      updateOrder = {
        ...updateOrder,
        "packages.$[].packageProducts.$[pacakgeFilter].quantity": packageQty,
      };
    }
    if (prodSize) {
      updateOrder = {
        ...updateOrder,
        "packages.$[].packageProducts.$[pacakgeFilter].size": prodSize,
      };
    }
    if (prodExcluded) {
      updateOrder = {
        ...updateOrder,
        $set: {
          "packages.$[].packageProducts.$[pacakgeFilter].excludedIngredients":
            prodExcluded,
        },
      };
    }
    for (const prodId in packageProdIds) {
      query.$or.push({ "packages.packageProducts.product": prodId });
      arrayFilters.push({ "pacakgeFilter.product": prodId });
    }
    arrayFilters.push({ "pacakgeFilter.size": packageProdSizes });
    // {
    //   ...query,
    //   "packages.packageProducts": {
    //     $elemMatch: {
    //       product: { $in: packageProdId},
    //       size: {},
    //     },
    //   },
  }

  console.log("updateOrder", updateOrder);
  console.log("query", query);
  const updatedOrder = await Order.findOneAndUpdate(
    { _id: orderId, query },
    {
      updateOrder,
    },
    { arrayFilters, new: true }
  );

  if (createdAt) {
  }

  /*
  ////////////////////
  Update InventoryHistory, InventoryItem, Expenses, Income, Sales, Account Balance, Customer Loyalty
  ////////////////////
  */
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (createdAt) {
      /*
      ////////////////////
      QUERY ALL ITEMS FROM PRODUCTS OF UPDATED ORDERS EXCEPT EXCLUDED
      REPEAT ALL OPERATIONS FOR ALL ITEMS
      ////////////////////
      */
      // itemName: to update Expenses
      if (!endingInventory || !itemId || !itemName) {
        throw new BadRequestError(
          "Please provide all of the required data if you are creating a document for other date than the current"
        );
      }
      const queryDate = new Date(
        createdAt.getFullYear(),
        createdAt.getMonth(),
        createdAt.getDate()
      );
      // Validate there are no date duplicates
      const dateHasRegistry = await InventoryHistory.findOne({
        item: itemId,
        createdAt: queryDate,
      });
      if (dateHasRegistry) {
        throw new BadRequestError(
          "There is already a registry for that date. You may preffer to update that one"
        );
      }

      // Early escape if it's first registry ever
      const registries = await InventoryHistory.find({ item: itemId }).limit(2);
      if (registries.length < 2) {
        updateObject.beginningInventory = beginningInventory
          ? beginningInventory
          : 0;
        updateObject.endingInventory = endingInventory;
      } else {
        /*
        /////////////
        Update following registrie(s) of original position
        /////////////
      */
        const originalRegistry = await InventoryHistory.findById(
          registryId
        ).populate("item");

        const originalDate = new Date(
          originalRegistry.createdAt.getFullYear(),
          originalRegistry.createdAt.getMonth(),
          originalRegistry.createdAt.getDate()
        );
        const previousDocumentToOriginal = await InventoryHistory.findOne({
          item: itemId,
          createdAt: { $lt: originalDate },
        }).sort("createdAt");

        if (previousDocumentToOriginal) {
          const inventoryDifference =
            previousDocumentToOriginal.endingInventory -
            originalRegistry.endingInventory;
          await InventoryHistory.updateMany(
            { item: itemId, createdAt: { $gt: originalDate } },
            {
              $inc: {
                beginningInventory: inventoryDifference,
                endingInventory: inventoryDifference,
              },
            },
            { session }
          );
        }

        /*
        /////////////
        Update Expenses of original
        /////////////
      */
        const originalExpenses = await Expense.find({
          sourceName: originalRegistry.item.name,
          createdAt: queryDate,
        });
        let valueOfExpenses = 0;
        if (originalExpenses.length > 0) {
          await Expense.updateMany(
            {
              sourceName: originalRegistry.item.name,
              createdAt: queryDate,
            },
            { createdAt: createdAt },
            { session }
          );
          valueOfExpenses = originalExpenses.reduce((total, expense) => {
            return total + expense.value;
          }, 0);
        }
        /*
      /////////////
      Update Income of original
      /////////////
      */
        const originalIncomes = await Income.find({
          sourceName: originalRegistry.item.name,
          createdAt: queryDate,
        });
        let valueOfIncomes = 0;
        if (originalIncomes.length > 0) {
          await Income.updateMany(
            {
              sourceName: originalRegistry.item.name,
              createdAt: queryDate,
            },
            { createdAt: createdAt }
          );
          valueOfIncomes = originalIncomes.reduce((total, income) => {
            return total + income.value;
          }, 0);
        }

        /*
        /////////////
        Update balances of original (prev and foll) and new (prev and foll)
        /////////////
      */
        // To
        const originalBalance = await Account.findOne({
          createdAt: originalDate,
        });
        if (!originalBalance) {
          throw new NotFoundError("No account balance found for that date");
        }
        // To update new balance base of each registry
        const previousBalanceToOriginal = await Account.findOne({
          createdAt: { $lt: originalDate },
        });

        // To update following registries
        // If !previousBalanceToOriginal = OK. It means no account registries made before.
        // original: 1200
        // previo: 0 -> 0 - 1200 -> -1200
        // previo - originalExpenses = originalPositionSurplus
        // 1500 - 1000 = 500 ->
        let originalPositionSurplus =
          previousBalanceToOriginal.balance - originalBalance.balance;

        // To know balance base of reallocated
        const previousBalanceToNew = await Account.findOne({
          createdAt: { $lt: createdAt },
        });

        // balance base - expenses + incomes
        let newBalance =
          previousBalanceToNew.balance - valueOfExpenses + valueOfIncomes;
        let newPositionSurplus = previousBalanceToNew.balance - newBalance;

        // original: 1200
        // previo: 1500 -> 1500 - 150 - 100 - 250 + num -> 1000
        // previoNuevo - originalExpenses + originalIncome = newBalance
        // 1500 - 1000 = 500 ->

        // Reallocate registry
        await Account.findOneAndUpdate(
          {
            createdAt: originalDate,
          },
          {
            createdAt: createdAt,
            updatedAt: new Date(Date.now()),
            $set: { balance: newBalance },
          },
          { session }
        ).catch((err) => {
          throw new CustomAPIError("Account couldn't be updated successfully");
        });

        // Update original position following registries
        await Account.updateMany(
          {
            createdAt: { $gt: originalDate },
          },
          {
            updatedAt: new Date(Date.now()),
            $inc: { balance: originalPositionSurplus },
          },
          { session }
        ).catch((err) => {
          throw new CustomAPIError("Account couldn't be updated successfully");
        });
        // Update new position following registries
        await Account.updateMany(
          {
            createdAt: { $gt: createdAt },
          },
          {
            updatedAt: new Date(Date.now()),
            $inc: { balance: newPositionSurplus },
          },
          { session }
        ).catch((err) => {
          throw new CustomAPIError("Account couldn't be updated successfully");
        });
        /*
        /////////////
        Update previous and following registrie(s) of new position
        /////////////
      */
        // Find previous registry endInv to that of new date
        const previousDocument = await InventoryHistory.findOne({
          item: itemId,
          createdAt: { $lt: queryDate },
        }).sort("createdAt");

        // If positioned at beginning of list, put any begInv. Balance validation further ahead
        if (!previousDocument) {
          updateObject.beginningInventory = beginningInventory
            ? beginningInventory
            : 0;
        } else {
          updateObject.beginningInventory = previousDocument.endingInventory;
        }

        // Update all following registries. Update none if none found
        const invChange = endingInventory - previousDocument?.endingInventory;
        await InventoryHistory.updateMany(
          {
            item: itemId,
            createdAt: { $gt: queryDate },
          },
          {
            $inc: { beginningInventory: invChange, endingInventory: invChange },
          },
          { session }
        ).sort("createdAt");
      }
      updateObject.endingInventory = endingInventory;
      updateObject.createdAt = createdAt;
    }

    session.commitTransaction();
  } catch (error) {
    session.abortTransaction();
  } finally {
    session.endSession();
  }
  res.status(StatusCodes.OK).json({ updatedOrder });
};

export const deleteOrder = async (req, res) => {
  res.status(StatusCodes.OK).json({ sales });
};

export const bulkUpdateOrders = async (req, res) => {
  const { orderIds } = req.body;
  // For each (queried) order that was updatedAt within range
  for (const id of orderIds) {
    const order = await Order.findById(id);
    // Find orders on same date to SET new values of derived documents
    const orderDate = new Date(
      order.createdAt.getFullYear(),
      order.createdAt.getMonth(),
      order.createdAt.getDate()
    );
    const orders = await Order.find({ createdAt: orderDate });

    let valueOfItems = 0;
    let grossProfit = 0;
    // Products from packages products
    const ordersProductsPromises = orders.map((order) => {
      return order.products.map(async (product) => {
        const productResult = await ProductPrice.findOne({
          product: product.product,
          size: product.size,
        });
        valueOfItems += productResult?.price * product.quantity;
        return product;
      });
    });
    const ordersPackageProductsPromises = orders.map((order) => {
      return order.packages.map(async (pack) => {
        const packageResult = await PackageOption.findById(pack.package);
        valueOfItems += packageResult?.price * pack.quantity;
        return pack.packageProducts.map((prod) => {
          prod.quantity *= pack.quantity;
          return prod;
        });
      });
    });

    const ordersProducts = await Promise.all(ordersProductsPromises);
    const ordersPackageProducts = await Promise.all(
      ordersPackageProductsPromises
    );
    const productList = [...ordersProducts, ...ordersPackageProducts];
    for (const order of orders) {
      const sale = await Sale.findOne({ order: order._id }).catch((err) => {
        throw new NotFoundError("Order has not been assigned a client");
      });

      order.updateInventory();
    }

    // const orderPackageProducts = [
    //   ...order.packages.map((orderPackage) => {
    //     return orderPackage.packageProducts.map((product) => {
    //       product.quantity *= orderPackage.quantity;
    //       return product;
    //     });
    //   }),
    // ];

    const account = await Account.findOne({ createdAt: orderDate });
    const accountUpdated = await Account.findOneAndUpdate(
      { createdAt: orderDate },
      { $set: { balance: grossProfit } }
    );
    if (!accountUpdated) {
      await Account.create({ createdAt: orderDate, balance: grossProfit });
    }
    await Account.updateMany(
      { createdAt: { $gt: orderDate } },
      { $inc: { balance: account.balance - grossProfit } }
    );
  }
};

async function validatePackageProducts(packageOptionId, packageProducts) {
  const packageOption = await PackageOption.findById(packageOptionId);
  if (!packageOption) {
    throw new Error("PackageOption not found");
  }

  const packageProductCategories = new Map();
  for (const product of packageProducts) {
    const { category } = await Product.findById(product.product).select(
      "category"
    );
    if (!category) {
      throw new BadRequestError(`Product ${product.product} has no category`);
    }
    if (
      !packageOption.options.some((option) => {
        return option.category.equals(category);
      })
    ) {
      throw new BadRequestError(
        `Product ${product.product} has category ${category} not allowed in this package`
      );
    }
    const key = `${category}_${product.size}`;
    if (!packageProductCategories.has(key)) {
      packageProductCategories.set(key, { maxCount: 0, count: 0 });
    }
    const categoryCount = packageProductCategories.get(key);
    const optionMatch = packageOption.options.find((option) => {
      return option.category.equals(category) && option.size === product.size;
    });
    categoryCount.maxCount = optionMatch.maxCount;
    categoryCount.count += product.quantity;
    packageProductCategories.set(key, categoryCount);
  }

  for (const option of packageOption.options) {
    const key = `${option.category._id}_${option.size}`;
    const categoryCount = packageProductCategories.get(key) || {
      maxCount: 0,
      count: 0,
    };
    if (
      categoryCount.count > 0 &&
      categoryCount.count !== categoryCount.maxCount
    ) {
      throw new BadRequestError(
        `Invalid number of products for category ${option.category} - ${option.size}. Counting: ${categoryCount.count}. Max number: ${categoryCount.maxCount}`
      );
    }
    if (categoryCount.count > option.maxCount) {
      throw new BadRequestError(
        `Too many products selected for category ${option.category} - ${option.size}`
      );
    }
  }
}

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
