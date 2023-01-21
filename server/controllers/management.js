import { StatusCodes } from "http-status-codes";
import InventoryHistory from "../models/Inventories/InventoryHistory.js";
import InventoryItem from "../models/Inventories/InventoryItem.js";
import InventoryType from "../models/Inventories/InventoryType.js";
import Category from "../models/Products/Category.js";
import { buildQuery } from "../utils/buildQuery.js";
import {
  BadRequestError,
  CustomAPIError,
  NotFoundError,
} from "../errors/index.js";
import ProductStat from "../models/Products/ProductStat.js";
import { ProductSize } from "../models/Products/Product.js";
import Order from "../models/Sales/Order.js";
import PackageOption from "../models/Products/PackageOption.js";
import { Expense, ExpenseConcept } from "../models/Accounting/Expenses.js";
import Account from "../models/Accounting/Account.js";

/********************************* INVENTORY TYPES *********************************/

export const getAllInventoryTypes = async (req, res) => {
  const inventoryTypes = await InventoryType.find({});
  if (!inventoryTypes) {
    throw new NotFoundError("There are no inventory types yet");
  }
  res.status(StatusCodes.OK).json(inventoryTypes);
};

export const createInventoryType = async (req, res) => {
  const { name } = req.body;
  const newInventoryType = await InventoryType.create({ name: name });
  res.status(StatusCodes.OK).json(newInventoryType);
};

export const getInventoryType = async (req, res) => {
  const inventoryType = await InventoryType.findById(req.params.id);
  if (!inventoryType) {
    throw new NotFoundError("No such inventory type found");
  }
  res.status(StatusCodes.OK).json(inventoryType);
};

export const updateInventoryType = async (req, res) => {
  const newInventoryType = await InventoryType.findByIdAndUpdate(
    req.params.id,
    { new: true }
  );
  if (!newInventoryType) {
    throw new NotFoundError("No such inventory type found");
  }
  res.status(StatusCodes.OK).json(newInventoryType);
};

export const deleteInventoryType = async (req, res) => {
  const foundAndDeleted = await InventoryType.findByIdAndDelete(req.params.id);
  if (!foundAndDeleted) {
    throw new NotFoundError("No such inventory type found");
  }

  res.status(StatusCodes.OK).json({ msg: "Deletion success" });
};

/********************************* INVENTORY ITEMS *********************************/
export const getAllInventoryItems = async (req, res) => {
  const {
    name,
    unitOfMeasurement,
    projection,
    numericFilters,
    sort,
    skip,
    page,
  } = req.query;
  // TODO: Queryng by type

  // const stringQuery = { name, unitOfMeasurement };
  // const numQuery = { options: ["thresholdLevel"], numericFilters };
  // const inventoryQuery = await buildQuery(
  //   InventoryItem,
  //   stringQuery,
  //   numQuery,
  //   projection,
  //   sort
  // );

  const inventoryItems = await InventoryItem.find({});
  res.status(StatusCodes.OK).json(inventoryItems);
};

export const createInventoryItem = async (req, res) => {
  // TODO: Queryng by type
  const { name, type, unitOfMeasurement, thresholdLevel } = req.body;
  if (!name || !type || !unitOfMeasurement || !thresholdLevel) {
    throw new BadRequestError("Please provide all of the fields required");
  }
  const createObject = {};
  if (name) {
    createObject.name = name;
  }
  if (type) {
    createObject.type = type;
  }
  if (unitOfMeasurement) {
    createObject.unitOfMeasurement = unitOfMeasurement;
  }
  if (thresholdLevel) {
    createObject.thresholdLevel = thresholdLevel;
  }
  const inventoryitem = await InventoryItem.create(createObject);

  res.status(StatusCodes.OK).json(inventoryitem);
};

export const getInventoryItem = async (req, res) => {
  const inventoryItems = InventoryItem.findById(req.params.id).populate("type");
  if (!inventoryItems) {
    throw new NotFoundError("Inventory Item not found");
  }
  res.status(StatusCodes.OK).json({ inventoryItems });
};

export const updateInventoryItem = async (req, res) => {
  const { type, name, unitOfMeasurement, thresholdLevel } = req.body;
  const updateObject = {};
  if (type) {
    updateObject.type = type;
  }
  if (name) {
    updateObject.name = name;
  }
  if (unitOfMeasurement) {
    updateObject.unitOfMeasurement = unitOfMeasurement;
  }
  if (thresholdLevel) {
    updateObject.thresholdLevel = thresholdLevel;
  }

  const updatedInventoryItem = await InventoryItem.findByIdAndUpdate(
    req.params.id,
    updateObject,
    { new: true }
  );
  if (!updatedInventoryItem) {
    throw new NotFoundError(
      "The document was not found or could be sucessfuly updated"
    );
  }

  res.status(StatusCodes.OK).json(updatedInventoryItem);
};

export const deleteInventoryItem = async (req, res) => {
  const deletedItem = await InventoryItem.findByIdAndDelete(req.params.id);
  if (!deletedItem) {
    throw new NotFoundError(
      "The document was not found or could be sucessfuly deleted"
    );
  }
  res.status(StatusCodes.OK).json(deletedItem);
};

/********************************* INVENTORY HISTORY *********************************/

//Always from every item
export const getAllInventoryHistory = async (req, res) => {
  const { type, populate, numericFilters, sort, projection, page, offset } =
    req.body;

  const queryObject = {};
  const stringParams = [];
  const numQuery = {};
  const structureQuery = {};
  /* Query params */
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

  if (stringParams.length > 0) {
    queryObject.stringParams = stringParams;
  }

  if (numericFilters) {
    numQuery.numericFilters = numericFilters;
    numQuery.options = [
      "beginningInventory",
      "endingInventory",
      "usedUnits",
      "purchasedUnits",
      "purchasedCost",
      "wastedUnits",
    ];
  }
  if (Object.keys(numQuery).length !== 0) {
    queryObject.numQuery = numQuery;
  }
  const queryProducts = await buildQuery(
    InventoryHistory,
    queryObject,
    structureQuery
  );

  if (type) {
    const typeItems = await InventoryItem.find({
      type: req.params.typeId,
    }).select("_id");
    const typeHistory = await InventoryHistory.find({
      item: { $in: typeItems },
    });
  }
  res.status(StatusCodes.OK).json(queryProducts);
};

// Make multiple calls to get data from checkbox
export const getInventoryHistory = async (req, res) => {
  const { period } = req.body;
  // period: return data from period AND calc wheightedAverageCost (from purchases)
  // Multiply units by WAC to get value

  if (!period || !period.from || !period.to) {
    throw new BadRequestError("Select a start date and an end date");
  }

  /*
    Add waste and used value
  */
  const itemHistory = await InventoryHistory.find({
    item: req.params.id,
    createdAt: { $gte: period.from, $lte: period.to },
  }).populate({ path: "category", select: "name" });
  let totalCost = 0;
  let totalUnits = 0;
  itemHistory.map((registry) => {
    if (registry.purchasedUnits) {
      totalCost += registry.purchasedCost;
      totalUnits += registry.purchasedUnits;
    }
  });
  const weightedAverageCost = totalCost / totalUnits;
  itemHistory.map((registry) => {
    registry.usedValue = registry.usedUnits
      ? weightedAverageCost * registry.usedUnits
      : null;
    registry.wastedValue = registry.wastedUnits
      ? weightedAverageCost * registry.wastedUnits
      : null;
  });

  res
    .status(StatusCodes.OK)
    .json({ itemHistory, weightedAverageCost: weightedAverageCost });
};

export const createInventoryHistory = async (req, res) => {
  // Create at start of day
  const { beginningInventory } = req.body;
  if (!beginningInventory) {
    new BadRequestError(
      "To write today's inventory please provide your starting inventory"
    );
  }
  const latestRegistry = await InventoryHistory.findOne()
    .sort("-createdAd")
    .select("createdAt");

  console.log("Date.now().getDate()", Date.now().getDate());
  if (
    latestRegistry.createdAt.getDate() === Date.now().getDate() &&
    latestRegistry.createdAt.getMonth() === Date.now().getMonth()
  ) {
    throw new CustomAPIError(
      "Current date's registry has already been created"
    );
  }
  const newRegistry = await InventoryHistory.create(beginningInventory);
  res.status(StatusCodes.CREATED).json(newRegistry);
};

export const updateInventoryHistory = async (req, res) => {
  // At end of each day
  const { endingInventory, unitsUsed, purchase, wasteUnits } = req.body;

  // Write expense
  // Update account
  // wheightedAverageCost (COGS) is always calculated for the period. Never stored. To calculate value of units used and wasted in inventory history
  // You could store 2 loads of an item purchased twice. If you sell 1 load, wheightedAverageCost is calculated to calc COGS
  // Get each item's purchases by time period
  // calc wheightedAverageCost
  // multiply by units used and wasted
  if (
    (purchase.units && !purchase.cost) ||
    (!purchase.units && purchase.cost)
  ) {
    throw new BadRequestError(
      "If you made a purchase, you need to provide units and cost"
    );
  }
  if (!endingInventory || !unitsUsed || !wasteUnits) {
    throw new BadRequestError(
      "Please provide all of the fields to successfully conclude today's inventory registry"
    );
  }

  const updateObject = {};

  if (purchase) {
    /*
      Validate if registry has purchase fields
      Update if true, create if false
    */
    // Save purchases in Expenses instead of in the InventoryHistory and
    // store the created Expense document's _id in the registry of the most recent InventoryHistory document
    // Maybe look up table of Expenses and source
    // How do I store source _id with different refs. To be able to properly populate or aggregate
    // Option: make an intermediary table (Change current Transaction.js to Sale.js)
    // Build Transaction.js that stores type, value/amount. Depending on 'type', increase or decrease account_balance
    const currentRegistry = await InventoryHistory.findOne({
      _id: req.params.id,
    });
    if (
      currentRegistry.purchasedUnits ||
      currentRegistry.purchasedUnits !== 0
    ) {
      await Expense.updateOne(
        { createdAt: currentRegistry.createdAt },
        { value: purchase.cost }
      );
    } else {
    }
    const concept = await ExpenseConcept.findOne({ concept: "inventories" });
    if (!concept) {
      throw new NotFoundError(
        "Please create a concept with the name 'inventories' before registering a purchase"
      );
    }
    const expenseRegistered = await Expense.create({
      concept: concept.concept,
      value: purchase.cost,
    });

    if (!expenseRegistered) {
      throw new CustomAPIError("The expense could not be registered");
    }

    updateObject.purchasedUnits = purchase.units;
    updateObject.purchasedCost = purchase.cost;

    const latestAccount = await Account.findOne().sort("-createdAt");
    const cash = latestAccount.cash - purchase.cost;
    await Account.create(cash);
  }

  updateObject.endingInventory = endingInventory;
  updateObject.unitsUsed = unitsUsed;
  updateObject.wasteUnits = wasteUnits;

  const updatedRegistry = await InventoryHistory.updateOne(
    { _id: req.params.id },
    updateObject
  );

  // const items = InventoryItem.find({});
  res.status(StatusCodes.OK).json(updatedRegistry);
};

/********************************* ACCOUTING *********************************/

export const getSales = (req, res) => {};
export const createExpense = async (req, res) => {
  const { value } = req.body;
  if (value) {
    throw new BadRequestError(
      "If you want to update this expense record, you need to update the corresponding item purchase record"
    );
  }
};

/********************************* PRODUCT STATS *********************************/

export const getAllProductStats = (req, res) => {
  const stats = ProductStat.find({});
};

export const createProductStat = (req, res) => {
  const {} = req.body;
};

export const updateProductStats = (req, res) => {
  // Order.aggregate([
  //   {
  //     $match: {
  //       createdAt: {
  //         $gte: new Date("2022-01-01"),
  //         $lt: new Date("2022-01-31"),
  //       },
  //     },
  //   },
  //   {
  //     $group: {
  //       _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
  //       documents: { $push: "$$ROOT" },
  //     },
  //   },
  // ]);

  // Get date of lastupdate
  const lastUpdate = ProductStat.findOne({})
    .select("updatedAt")
    .sort("-updatedAt");

  // Get orders since last update. Grouped by date
  const orders = Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(lastUpdate),
          $lt: new Date.now(),
        },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        documents: { $push: "$$ROOT" },
      },
    },
  ]);

  // Process each product, package and extra in each Order
  orders.map((dailyOrders) => {
    // Get values and generate/add each stat
    let productValue;
    dailyOrders.forEach((order) => {
      order.products.map((orderItem) => {
        const product = ProductSize.findOne({
          product: orderItem.product,
          size: orderItem.size,
        });
        productValue += product.price * orderItem.quantity;
      });
      order.packages.map((orderItem) => {
        const packageOpt = PackageOption.findOne({
          _id: orderItem.package,
        });
        productValue += packageOpt.price * orderItem.quantity;
      });
      order.extras.map((product) => {
        const product = ProductSize.findOne({
          product: order.product,
          size: order.size,
        });
        productValue += product.price;
      });
    });
  });

  const stats = ProductStat.insertMany();
};
