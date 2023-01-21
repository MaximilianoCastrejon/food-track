import { StatusCodes } from "http-status-codes";
import { Customer } from "../models/Sales/Customer.js";
import Order from "../models/Sales/Order.js";
import Extras from "../models/Products/Extras.js";
import {
  Product,
  ProductSize,
  ProductIngredient,
  ProductCategory,
} from "../models/Products/Product.js";
import PackageOption from "../models/Products/PackageOption.js";
import mongoose from "mongoose";
import { NotFoundError } from "../errors/not-found.js";
import { BadRequestError } from "../errors/bad-request.js";
import InventoryItem from "../models/Inventories/InventoryItem.js";

/********************************* ORDERS *********************************/

export const getAllOrders = async (req, res) => {
  const orders = await Order.find({});
  res.status(StatusCodes.OK).json({ orders });
};

export const getOrderAndOwner = async (req, res) => {
  const order = await Order.findById(req.params.id);
  const owner = await Customer.finOne({ orders: { $in: [order._id] } });
  res.status(StatusCodes.OK).json({ order, owner });
};

export const createOrder = async (req, res) => {
  const { products, packages, extras, customerId } = req.body;

  if (!customerId) {
    throw new BadRequestError("Select which customer made this order");
  }
  const orderObject = {};
  const session = await mongoose.startSession();
  // MONEY
  // Find customer discount
  // Register transaction: Customer, order, pacakge, extras, products price
  // Update Income, Account
  // Decrease Inventory Item
  // Update loyalty status

  session.startTransaction();
  try {
    const order = Order.create(orderObject, { session });
    console.log("productsValue", productsValue);
    ProductSize.find({});
    let valueOfProducts;
    let valueOfPackages;
    const transactionObj = {};
    if (products) {
      await Promise.all(
        products.map(async (obj) => {
          const productPrice = await ProductSize.findOne({
            product: obj.product,
            size: obj.size,
          });
          valueOfProducts += productPrice.price;

          const productInventory = ProductIngredient.find({
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
      valueOfProducts + (await Transaction.create({ order: order._id }));
    updateInventory(order);
    updateSales();

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
  // TODO: Move pre save logic here
  await Customer.updateOne(
    { _id: customerId },
    {
      $push: {
        orders: order._id,
      },
    }
  );
  res.status(StatusCodes.OK).json({ sales });
};

export const updateOrder = async (req, res) => {
  const { productId, packageOptionId } = req.body;
  const updateProducts = {};
  const updatePackage = {};
  const updatePackageProducts = {};
  const updateExtra = {};

  if (productId) {
    updateProducts.productId = productId;
  }
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
  const sales = await Customer.find(/* User*/);
  res.status(StatusCodes.OK).json({ sales });
};
// Called when assinging order to customer
export const textPredictCustomer = async (req, res) => {
  const customers = await Customer.find({}).select("name _id");
  res.status(StatusCodes.OK).json(customers);
};
export const getCustomer = async (req, res) => {
  const sales = await Customer.find(/* User*/);
  res.status(StatusCodes.OK).json({ sales });
};
export const getCustomerLoyalty = async (req, res) => {
  const sales = await Customer.find(/* User*/);
  res.status(StatusCodes.OK).json({ sales });
};
export const createCustomer = async (req, res) => {
  const sales = await Customer.find(/* User*/);
  res.status(StatusCodes.OK).json({ sales });
};
export const updateCustomer = async (req, res) => {
  const sales = await Customer.find(/* User*/);
  res.status(StatusCodes.OK).json({ sales });
};
export const deleteCustomer = async (req, res) => {
  const sales = await Customer.find(/* User*/);
  res.status(StatusCodes.OK).json({ sales });
};

const updateInventory = (order) => {
  // Decrease RawIngredients by (prod_ingredient_size_qty - exluded_ingredient_qty)
  // Decrease RawIngredients by (product_size_qty of package)
};
const updateSales = (order) => {
  //
};

/********************************* CUSTOMER ORDERS *********************************/
