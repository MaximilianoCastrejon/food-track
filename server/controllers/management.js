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
import { ProductPrice } from "../models/Products/Product.js";
import Order from "../models/Sales/Order.js";
import calculateCOGS_FIFO from "../utils/item_cogs.js";
import PackageOption from "../models/Products/PackageOption.js";
import { Expense, ExpenseConcept } from "../models/Accounting/Expenses.js";
import Account from "../models/Accounting/Account.js";
import Extras from "../models/Products/Extras.js";
import mongoose from "mongoose";
import { Income } from "../models/Accounting/Income.js";

//TODO: Combine get history routes for item and registries
// Add option to calculate COGS on queried registries (period) only if items were selected
// Add cogs calculation in accounting
// Generate fake account balance for each expense
// Generate Sales

// Generate data for orders, income, customer loyalty updates
// Call product stats with orders fake data

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
  if (!name) {
    throw new BadRequestError("Please provide a name");
  }
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
  const { name } = req.body;
  const newInventoryType = await InventoryType.findByIdAndUpdate(
    req.params.id,
    { name: name },
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
  // TODO: build Query for populated type
  const {
    name,
    nameOptions,
    unitOfMeasurement,
    unitOfMeasurementOptions,
    numericFilters,
    projection,
    sort,
    page,
    offset,
  } = req.query;

  const queryObject = {};
  const stringParams = [];
  const numQuery = {};
  const structureQuery = {};
  /* Query params */
  if (name) {
    stringParams.push({ name, nameOptions });
  }
  if (unitOfMeasurement) {
    stringParams.push({ unitOfMeasurement, unitOfMeasurementOptions });
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
    numQuery.options = ["currentLevel", "thresholdLevel"];
  }
  if (Object.keys(numQuery).length !== 0) {
    queryObject.numQuery = numQuery;
  }

  const queryResult = await buildQuery(
    InventoryItem,
    queryObject,
    structureQuery
  );

  res.status(StatusCodes.OK).json(queryResult);
};

export const createInventoryItem = async (req, res) => {
  // TODO: Queryng by type
  const { name, type, unitOfMeasurement, currentLevel, thresholdLevel } =
    req.body;
  if (
    !name ||
    !type ||
    !unitOfMeasurement ||
    !thresholdLevel ||
    !currentLevel
  ) {
    throw new BadRequestError("Please provide all of the fields required");
  }
  const createObject = {};
  createObject.name = name;
  createObject.type = type;
  createObject.unitOfMeasurement = unitOfMeasurement;
  createObject.currentLevel = currentLevel;
  createObject.thresholdLevel = thresholdLevel;

  const inventoryitem = await InventoryItem.create(createObject);

  res.status(StatusCodes.CREATED).json(inventoryitem);
};

export const getInventoryItem = async (req, res) => {
  const inventoryItem = await InventoryItem.findById(req.params.id).populate(
    "type"
  );
  if (!inventoryItem) {
    throw new NotFoundError("Inventory Item not found");
  }
  res.status(StatusCodes.OK).json(inventoryItem);
};

// create begInv -> update current level to begInv
// create order -> get (used and excluded) Recipe units -> get currentLevel -> calculate new currentLevel -> update it
export const updateInventoryItem = async (req, res) => {
  const { type, name, unitOfMeasurement, currentLevel, thresholdLevel } =
    req.body;
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
  if (currentLevel) {
    updateObject.currentLevel = currentLevel;
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
      "The document was not found or could not be sucessfully deleted"
    );
  }
  res.status(StatusCodes.OK).json(deletedItem);
};

/********************************* INVENTORY HISTORY REGISTRIES *********************************/

//Always from every item
// Getting registries 1 (latest) or all
// Option for itemId, offset: 1, page: 1, sort: -createdAt
export const getAllInventoryHistory = async (req, res) => {
  const {
    type,
    item,
    populate,
    numericFilters,
    sort,
    projection,
    page,
    offset,
  } = req.query;

  const queryObject = {};
  const stringParams = [];
  const numQuery = {};
  const idFields = [];
  const structureQuery = {};
  /* Query params */
  if (item) {
    idFields.push({ id: item, fieldName: "item" });
  }
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
    numQuery.options = [
      "beginningInventory",
      "endingInventory",
      "usedUnits",
      "wastedUnits",
      "createdAt",
    ];
  }

  if (stringParams.length > 0) {
    queryObject.stringParams = stringParams;
  }
  if (Object.keys(numQuery).length !== 0) {
    queryObject.numQuery = numQuery;
  }
  if (idFields.length !== 0) {
    queryObject.idFields = idFields;
  }
  const queryProducts = await buildQuery(
    InventoryHistory,
    queryObject,
    structureQuery
  );

  // if (type) {
  //   const typeItems = await InventoryItem.find({
  //     type: req.params.typeId,
  //   }).select("_id");
  //   const typeHistory = await InventoryHistory.find({
  //     item: { $in: typeItems },
  //   });
  // }
  res.status(StatusCodes.OK).json(queryProducts);
};

export const getInventoryHistory = async (req, res) => {
  // GET complete registry (update data)
  const registryId = req.params.id;

  const result = await InventoryHistory.findOne({ _id: registryId });

  res.status(StatusCodes.OK).json(result);
};

// Button autocreates and shows update form
export const createInventoryHistory = async (req, res) => {
  const { createdAt, itemId, beginningInventory } = req.body;
  if (!createdAt || !itemId) {
    throw new BadRequestError("Please provide all of the required fields");
  }
  const createObject = {};

  const date = new Date(
    createdAt.getFullYear(),
    createdAt.getMonth(),
    createdAt.getDate()
  );

  const previousRegistry = await InventoryHistory.findOne({
    item: itemId,
    createdAt: { $lt: date },
  });

  if (!previousRegistry && !beginningInventory) {
    throw new BadRequestError(
      "This is the first registry of this item. Please provide a beginning inventory"
    );
  }

  const registryExists = await InventoryHistory.findOne({
    item: itemId,
    createdAt: date,
  });

  if (registryExists) {
    throw new BadRequestError(
      "Duplication err: Current date's registry has already been created for that item"
    );
  }

  createObject.beginningInventory = previousRegistry
    ? previousRegistry.endingInventory
    : beginningInventory;

  const registry = await InventoryHistory.create(createObject);

  res.status(StatusCodes.CREATED).json(registry);
};

// GET last createdAt -> GET orders since -> GET Recipes units -> update InventoryHistory
// Luego de crearse, completar la form para hacer update de la fecha y
export const updateInventoryHistory = async (req, res) => {
  const {
    endingInventory,
    usedUnits,
    wastedUnits,
    beginningInventory,
    createdAt,
  } = req.body;
  const registryId = req.params.id;
  const updateObject = {};

  // No option to update begInv because it is always the same as the previous endInv. Unless is the first registry ever.
  // All expenses have to be registered at the same date as some InventoryHistory registry
  if (endingInventory) {
    updateObject.endingInventory = endingInventory;
  }
  // Updated with each order. If auto update fails, get orders from date, get units from Recipes, write number in Input field;
  if (usedUnits) {
    updateObject.usedUnits = usedUnits;
  }
  if (wastedUnits) {
    updateObject.wastedUnits = wastedUnits;
  }

  let result;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const originalRegistry = await InventoryHistory.findById(registryId);
    if (!originalRegistry) {
      throw new NotFoundError("No registry with such ID");
    }

    // Para qué quiero actualizar la fecha. Sería mejor generar una order
    if (createdAt) {
      // itemName: to update Expenses
      if (!endingInventory) {
        throw new BadRequestError(
          "Please provide all of the required data if you are creating a document for other date than the current"
        );
      }
      const newPositionDate = new Date(
        createdAt.getFullYear(),
        createdAt.getMonth(),
        createdAt.getDate()
      );
      // Validate there are no date duplicates
      const dateHasRegistry = await InventoryHistory.findOne({
        item: originalRegistry.item,
        createdAt: newPositionDate,
      });
      if (dateHasRegistry) {
        throw new BadRequestError(
          "There is already a registry for that date. You may preffer to update that one"
        );
      }

      // Early escape if it's first registry ever or document is positioned at first
      const registries = await InventoryHistory.find({
        item: originalRegistry.item,
      }).limit(2);
      const originalDate = new Date(
        originalRegistry.createdAt.getFullYear(),
        originalRegistry.createdAt.getMonth(),
        originalRegistry.createdAt.getDate()
      );
      const previousDocumentToOriginal = await InventoryHistory.findOne({
        item: originalRegistry.item,
        createdAt: { $lt: originalDate },
      }).sort("createdAt");

      const previousDocumentToNew = await InventoryHistory.findOne({
        item: itemId,
        createdAt: { $lt: newPositionDate },
      }).sort("createdAt");

      if (registries.length < 2 || !previousDocumentToNew) {
        updateObject.beginningInventory = beginningInventory
          ? beginningInventory
          : 0;
      } else {
        /*
        /////////////
        Update previous and following registrie(s) of original position
        /////////////
        */
        const inventoryDifference =
          previousDocumentToOriginal?.endingInventory -
          originalRegistry.endingInventory;
        await InventoryHistory.updateMany(
          { item: originalRegistry.item, createdAt: { $gt: originalDate } },
          {
            $inc: {
              beginningInventory: inventoryDifference,
              endingInventory: inventoryDifference,
            },
          },
          { session }
        );
        updateObject.beginningInventory = previousDocumentToNew.endingInventory;

        // Update all following registries. Update none if none found
        const invChange =
          endingInventory - previousDocumentToNew.endingInventory;
        // example -> new endInv: 2100, prev endInv: 1700, next begInv: 1700
        // 2100 - 1700 = 400. All next begInv & endInv: +400
        await InventoryHistory.updateMany(
          {
            item: itemId,
            createdAt: { $gt: newPositionDate },
          },
          {
            $inc: { beginningInventory: invChange, endingInventory: invChange },
          },
          { session }
        ).sort("createdAt");
      }
      updateObject.beginningInventory = previousDocumentToNew.endingInventory;
      updateObject.createdAt = createdAt;
    }

    const updatedRegistry = await InventoryHistory.findByIdAndUpdate(
      registryId,
      updateObject,
      { new: true, session }
    );
    if (!updatedRegistry) {
      throw new CustomAPIError("Registry could not be successfully updated");
    }
    result = updatedRegistry;

    // Compare the original document and the updated document
    if (endingInventory) {
      let endDiff =
        updatedRegistry.endingInventory - originalRegistry.endingInventory;
      // Update subsequent registries for item
      await InventoryHistory.updateMany(
        {
          item: updatedRegistry.item,
          createdAt: { $gt: updatedRegistry.createdAt },
        },
        {
          beginningInventory: { $inc: endDiff },
          endingInventory: { $inc: endDiff },
        },
        { session }
      );
    }

    session.commitTransaction();
  } catch (error) {
    session.abortTransaction();
  } finally {
    session.endSession();
  }
  const warnings = {};

  // Check for all date's expenses for imbalance warning
  const start = new Date(result.createdAt);
  start.setHours(0, 0, 0, 0);
  const end = new Date(result.createdAt);
  end.setHours(23, 59, 59, 999);

  // Query expenses on same date as registry for item
  const expenses = await Expense.find({
    sourceName: originalRegistry.item.name,
    createdAt: { $gte: start, $lte: end },
  });

  // Calculate units purchased
  let expensesUnits = expenses?.reduce((expensesUnits, obj) => {
    return expensesUnits + obj.units;
  }, 0);

  // Calculate if inventory and purchases are balanced (equal to 0)
  let available = result.beginningInventory + expensesUnits;
  let operations =
    result.usedUnits + result.wastedUnits + result.endingInventory;
  if (available !== operations) {
    warnings.discrepancy = `Please update registry or expenses journals until your inventory is balanced. If all numbers are correct, register discrepancy as wasted units. Current balance: ${
      available - operations
    }`;
  }
  // if (updatedRegistry.endingInventory !== remaining) {
  //   warnings.imbalance =
  //     "Registered inventory and usage do not seem to match endingInventory.";
  //   warnings.expenses =
  //     "Remember to register/update your purchases if any was made. This is important because otherwise, you will not be able to accurately calculate COGS. Register difference as waste is you don't recall where the discrepancy comes from";
  // }

  res.status(StatusCodes.OK).json(result, warnings);
};

export const deleteInventoryHistory = async (req, res) => {
  const { itemId } = req.body;
  const registryId = req.params.id;

  // Get original registry
  // Get previous registry
  // If no previous, make no chages to following
  // Else, difference between original endInv and prv endInv to update all following
  // Update
  const session = await mongoose.startSession();
  session.startTransaction();

  const originalRegistry = await InventoryHistory.findById(registryId);
  if (!originalRegistry) {
    throw new NotFoundError("No registry with such ID");
  }
  const deleted = await InventoryHistory.findByIdAndDelete(registryId, {
    session,
  });
  if (!deleted) {
    session.abortTransaction();
    session.endSession();
    throw new NotFoundError("Registry not found");
  }
  const previous = await InventoryHistory.findOne({
    item: itemId,
    createdAt: { $lt: originalRegistry.createdAt },
  });

  let difference = previous.endingInventory - originalRegistry.endingInventory;

  await InventoryHistory.updateMany(
    {
      imte: itemId,
      createdAt: { $gt: originalRegistry.createdAt },
    },
    {
      $inc: { beginningInventory: difference },
      $inc: { endingInventory: difference },
    },
    { session }
  ).catch(() => {
    session.abortTransaction();
    session.endSession();
    throw new CustomAPIError(
      "An error occurred while updating your account registries"
    );
  });

  session.commitTransaction();
  session.endSession();
  res.status(StatusCodes.OK).json({
    deleted,
    msg: "Delete or update expenses made on this date for data consistency",
  });
};

export const deleteInventoryHistoryItem = async (req, res) => {
  // Reallocate or delete expenses and update or delete Acount balances
  const { action } = req.query;
  const { range, itemId } = req.body;
  const session = await mongoose.startSession();
  session.startTransaction();
  switch (action) {
    case "range":
      if (!range || !range.from || !range.to) {
        throw new BadRequestError("Please select a range for operation");
      }
      if (!itemId) {
        throw new BadRequestError("Plase provide the item ID");
      }
      const previous = await InventoryHistory.findOne({
        item: itemId,
        createdAt: { $lt: range.from },
      });
      const following = await InventoryHistory.findOne({
        item: itemId,
        createdAt: { $gt: range.to },
      });

      let difference = 0;
      if (previous) {
        // If no following, operation wont update anything
        difference = previous.endingInventory - following?.beginningInventory;
      }

      await InventoryHistory.updateMany(
        {
          imte: itemId,
          createdAt: { $gt: range.to },
        },
        {
          $inc: { beginningInventory: difference },
          $inc: { endingInventory: difference },
        },
        { session }
      ).catch(() => {
        session.abortTransaction();
        session.endSession();
        throw new CustomAPIError(
          "An error occurred while updating your inventory registries"
        );
      });

      await InventoryHistory.deleteMany(
        { item: itemId, createdAt: { $gte: range.from, $lte: range.to } },
        {
          session,
        }
      ).catch(() => {
        session.abortTransaction();
        session.endSession();
        throw new CustomAPIError(
          "An error occurred upon deleting your inventory registries"
        );
      });

      break;
    case "item":
      await InventoryHistory.deleteMany(
        {
          item: itemId,
        },
        { session }
      ).catch(() => {
        session.abortTransaction();
        session.endSession();
        throw new CustomAPIError(
          "An error occurred upon deleting your inventory registries"
        );
      });
      break;
    default:
      throw new BadRequestError("Please choose a valid action");
      break;
  }

  session.commitTransaction();
  session.endSession();

  res.status(StatusCodes.OK).json({
    msg: "deletion successful. remember to update your expenses, income and account",
  });
};

function dateIsValid(dateStr) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;

  if (dateStr.match(regex) === null) {
    return false;
  }

  const date = new Date(dateStr);

  const timestamp = date.getTime();

  if (typeof timestamp !== "number" || Number.isNaN(timestamp)) {
    return false;
  }

  return date.toISOString().startsWith(dateStr);
}

// Make multiple calls to get data from checkbox
// TODO: Calc WAC and endInv of lbegInv
// Set rule: Period (year, month, week, days): take purchases made 1 month prior calculated period to calculate value of ending Inventory
// 1 month = 4 weeks
// Example: April's 2nd week's COGS (8-14)
// April's begInv value = March's endInv value
// March's endInv value = purchases from March 8th to April 7th calculated with FIFO
// March's endInv units = 100
// March Purchases:
//  1. 50 units @ $3
//  2. 20 units @ $2
//  3. 10 units @ $2.50
//  4. 30 units @ $4
//  5. 30 units @ $4
//  6. 30 units @ $5
//  7. 30 units @ $1
//  8. 30 units @ $3.50
//  9. 30 units @ $4
//  10. 30 units @ $4
// Only 1 through 4 matter
// 50 * 3 = $150
// 20 * 2 = $40
// 10 * 2.50 = $25
// 20 * 4 = $80
// April's beginning Inventory is -> $295 with FIFO
// If no purchases in previous month, search two months back, and repeato if none found
// Now calc COGS for April's 2nd week adding up value of (units used + wasted) in that period (Aptril 8th-14th).

/********************************* PRODUCT STATS *********************************/

// Make multiple calls to get stats for all 3 types
// TODO: add querying for object array fields
export const getAllProductStats = async (req, res) => {
  const {
    product,
    itemType,
    itemTypeOptions,
    populate,
    numericFilters,
    sort,
    projection,
    page,
    offset,
  } = req.query;

  const queryObject = {};
  const stringParams = [];
  const numQuery = {};
  const idFields = [];
  const structureQuery = {};
  /* Query params */
  if (product) {
    idFields.push({ id: product, fieldName: "product" });
  }

  if (itemType) {
    stringParams.push({ itemType, itemTypeOptions });
  }
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
    numQuery.options = ["yearlySalesTotal", "yearlyTotalSoldUnits"];
  }

  if (stringParams.length > 0) {
    queryObject.stringParams = stringParams;
  }
  if (Object.keys(numQuery).length !== 0) {
    queryObject.numQuery = numQuery;
  }
  if (idFIelds.length > 0) {
    queryObject.idFIelds = idFIelds;
  }
  const queryProducts = await buildQuery(
    ProductStat,
    queryObject,
    structureQuery
  );
  if (!queryProducts) {
    throw new NotFoundError("No documents found");
  }

  res.status(StatusCodes.OK).json(queryProducts);
};

export const getItemProductStats = (req, res) => {
  const prodId = req.params.prodId;
  const orders = Order.aggregate([
    {
      $match: {
        createdAt: {
          $gt: latestRegistry,
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
};

// Initialize all dates and months for a year
// or create Stat at Product creation
export const createProductStat = (req, res) => {
  const { latestRegistry } = req.body;
  const itemId = req.params.id;
  const orders = Order.aggregate([
    {
      $match: {
        createdAt: {
          $gt: latestRegistry,
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
};

async function formatOrders() {
  return stats;
}

// Update from orders in a period of time
// If an order gets updated, update the stats of that date
// createdAt for stats will be the same as date's order's createdAt
export const updateProductStats = async (req, res) => {
  const {
    type,
    yearlySalesTotal,
    yearlyTotalSoldUnits,
    year,
    monthlyData,
    dailyData,
  } = req.body;
  if (!period || !period.from || !period.to) {
    throw new BadRequestError(
      "Provide date range to auto update registries based on your order data"
    );
  }
  const updateObject = {};
  // Sea cual sea el createdAt, si se hizo un update, se incluyen
  // Si haces una update de la fecha de la orden, estás cambiando también las estadísticas de su antigua posición
  // Vamos a actualizar todos. Solamente un mes antes de la fecha actual.
  // A partir de ahí no se modifican
  const date = new Date(Date.now());
  const lastMonth = new Date(
    date.getFullYear(),
    date.getMonth() - 1,
    date.getDate()
  );
  const lastMonthOrders = await Order.find({
    createdAt: { $gte: lastMonth },
    createdAt: { $lte: date },
  });

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
  if (dailyData) {
    if (!dailyData.date || !dailyData.totalSales || !dailyData.totalUnits) {
      throw new BadRequestError(
        "Please provide all of the information to ad your stats"
      );
    }
    const updatedStat = await ProductStat.findOneAndUpdate(
      {},
      { updateObject },
      { upsert: true }
    );
  }

  // Step: Get date of lastupdate from any item
  const start = new Date(period.from);
  const end = new Date(period.to);
  start.setUTCHours(0, 0, 0, 0);
  end.setUTCHours(23, 59, 59, 999);

  // Step: Get orders since last update. Grouped by date
  const orders = Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: start,
          $lte: end,
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
  // Step: create mock data and see output

  // Step: Process each product, package and extra in each Order
  /*  orders.map((dailyOrders) => {
    // Get values and generate/add each stat
    let productValue;
    dailyOrders.forEach((order) => {
      order.products.map((orderItem) => {
        const product = ProductPrice.findOne({
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
      order.extras.map((extra) => {
        const product = Extras.findOne({
          item: order.product,
          size: order.size,
        });
        productValue += product.price;
      });
    });
  });
*/
  const stats = ProductStat.insertMany();
  res.status(StatusCodes.OK).json(orders);
};

// Auto update range
export const updateProductStatsRegistry = async (req, res) => {};

export const deleteProductStats = async (req, res) => {};
