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
import calculateCOGS_FIFO from "../utils/item_cogs.js";
import PackageOption from "../models/Products/PackageOption.js";
import { Expense, ExpenseConcept } from "../models/Accounting/Expenses.js";
import Account from "../models/Accounting/Account.js";
import Extras from "../models/Products/Extras.js";

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
  const { name, type, unitOfMeasurement, thresholdLevel } = req.body;
  if (!name || !type || !unitOfMeasurement || !thresholdLevel) {
    throw new BadRequestError("Please provide all of the fields required");
  }
  const createObject = {};
  createObject.name = name;
  createObject.type = type;
  createObject.unitOfMeasurement = unitOfMeasurement;
  createObject.thresholdLevel = thresholdLevel;

  const inventoryitem = await InventoryItem.create(createObject);

  res.status(StatusCodes.CREATED).json(inventoryitem);
};

export const getInventoryItem = async (req, res) => {
  const inventoryItem = InventoryItem.findById(req.params.id).populate("type");
  if (!inventoryItem) {
    throw new NotFoundError("Inventory Item not found");
  }
  res.status(StatusCodes.OK).json(inventoryItem);
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
      "The document was not found or could not be sucessfully deleted"
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
      "wastedUnits",
      "createdAt",
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

export const getInventoryItemHistory = async (req, res) => {
  const { period, itemId } = req.body;

  if (!period || !period.from || !period.to) {
    throw new BadRequestError("Select a start date and an end date");
  }

  const { name, itemHistory, COGS } = await calculateCOGS_FIFO(
    period,
    req.params.id
  );

  // function dateIsValid(dateStr) {
  //   const regex = /^\d{4}-\d{2}-\d{2}$/;

  //   if (dateStr.match(regex) === null) {
  //     return false;
  //   }

  //   const date = new Date(dateStr);

  //   const timestamp = date.getTime();

  //   if (typeof timestamp !== "number" || Number.isNaN(timestamp)) {
  //     return false;
  //   }

  //   return date.toISOString().startsWith(dateStr);
  // }

  // if (!dateIsValid(period.from) || !dateIsValid(period.to)) {
  //   throw new BadRequestError(
  //     "One or both Dates provided are not in the correct format 'yyyy-mm-dd'"
  //   );
  // }

  // /*
  //   Add waste and used value
  // */

  // // Find expenses under InventoryItem name for the same period
  // // Find last months purchases or previous to that one if no purchases found (or purchases are lower than period's begInv)
  // //
  // // calc period's begInv with FIFO
  // // calc period's COGS with begInv and period's usedUnits and wasted with FIFO
  // // HOW TO CALC UNITS USED AND wasted value for each registry
  // // 4,

  // // begInv porque pueden pasar meses de no atender el negocio, que el producto se pudra
  // // Y entonces cuando re-abran y quieran calcular el COGS
  // // Se debe calcular el COGS con el ebginnin inventory que sería 0.
  // // No siempre el endInv va a ser begInv.
  // // Por lo tanto se realizarán compras el mismo día que habran

  // // Que pasa si hace la compra el 09 y la usan/reciben hasta el 20
  // // Se actualiza el nivel de inventario el 09. Si pasa cualqueir cosa y no se utiliza, se registra como waste
  // // Da igual si es endInv o begInv, si se pudre todo, del endInv de ayer, se registra como waste del nuevo registro begInv
  // const dateStart = new Date(period.from);
  // dateStart.setUTCHours(0, 0, 0, 0);
  // const dateEnd = new Date(period.from);
  // dateEnd.setUTCHours(23, 59, 59, 999);
  // const item = await InventoryHistory.findOne({
  //   item: req.params.id,
  //   createdAt: { $gte: dateStart, $lte: dateEnd },
  // })
  //   .select("beginningInventory item")
  //   .populate({ path: "item", select: "name" });

  // if (!item) {
  //   throw new NotFoundError(
  //     "No registry found for that item on your start creation date provided"
  //   );
  // }
  // const periodStart = new Date(period.from);
  // periodStart.setUTCHours(0, 0, 0, 0);
  // // console.log(
  // //   "periodStart",
  // //   new Date(periodStart.setUTCMonth(periodStart.getUTCMonth() - 1))
  // // );
  // const periodEnd = new Date(period.to);
  // periodEnd.setUTCHours(23, 59, 59, 999);
  // console.log("periodEnd", periodEnd);
  // const itemHistory = await InventoryHistory.find({
  //   item: req.params.id,
  //   createdAt: { $gte: periodStart, $lte: periodEnd },
  // })
  //   .select("-item")
  //   .sort("createdAt");

  // if (itemHistory.length === 0) {
  //   throw new NotFoundError(
  //     "No records found with name or time frame provided"
  //   );
  // }

  // let periodUnits = 0;
  // for (const registry of itemHistory) {
  //   periodUnits += registry.wastedUnits + registry.usedUnits;
  // }

  // const previousDate = new Date(period.from);
  // previousDate.setDate(periodStart.getDate() - 1);
  // //Calc beginningInventory for period to calculate (from $lt -> yesterday)
  // const beginningInventoryCost = await calculateBeginningInventoryCost_FIFO(
  //   periodStart,
  //   item.beginningInventory,
  //   item.item.name
  // );

  // const COGS = await calculateCOGS_FIFO(
  //   beginningInventoryCost,
  //   item.beginningInventory,
  //   periodUnits,
  //   period,
  //   item.item.name
  // );

  // async function calculateCOGS_FIFO(
  //   begInvCost,
  //   begInvUnits,
  //   periodUnits,
  //   period,
  //   itemName
  // ) {
  //   let COGS = 0;
  //   let remainingUnits = periodUnits + begInvUnits;
  //   const start = new Date(period.from);
  //   start.setUTCHours(0, 0, 0, 0);
  //   const end = new Date(period.to);
  //   end.setUTCHours(23, 59, 59, 999);
  //   const periodExpenses = await Expense.find({
  //     name: itemName,
  //     createdAt: { $gte: start, $lte: end },
  //   }).sort("createdAt");
  //   // Need to push in at beginning
  //   periodExpenses.unshift({ value: begInvCost, units: begInvUnits });

  //   for (const purchase of periodExpenses) {
  //     if (remainingUnits > 0) {
  //       if (purchase.units <= remainingUnits) {
  //         COGS += purchase.value;
  //         remainingUnits -= purchase.units;
  //       } else {
  //         COGS += remainingUnits * (purchase.value / purchase.units);
  //         remainingUnits = 0;
  //       }
  //     }
  //   }

  //   return COGS;
  // }

  // async function calculateBeginningInventoryCost_FIFO(
  //   calcStart /* COGS period previous date */,
  //   beginningInventory /* units */,
  //   itemName
  // ) {
  //   let remainingUnits = beginningInventory;
  //   let totalCost = 0;
  //   calcStart.setUTCHours(0, 0, 0, 0);
  //   let periodStart = new Date(calcStart);
  //   periodStart.setUTCMonth(calcStart.getUTCMonth() - 1);
  //   // periodStart.setUTCMonth(new Date(periodStart.getUTCMonth() - 1)); // 2023-04-12 -> 2023-03-12
  //   let periodEnd = new Date();

  //   while (remainingUnits > 0) {
  //     console.log("remainingUnits", remainingUnits);

  //     periodEnd.setUTCMonth(periodStart.getUTCMonth() + 1);

  //     periodEnd.setUTCHours(23, 59, 59, 999);
  //     console.log("periodEnd", periodEnd);
  //     console.log("---------------------------");

  //     // periodEnd.setFullYear(periodStart.getFullYear());
  //     // periodEnd.setMonth(periodStart.getMonth() + 1);
  //     // periodEnd.setDate(periodStart.getDate());
  //     // console.log("periodEnd.getMonth", periodEnd.getUTCMonth());
  //     // console.log("periodStart.getMonth", periodStart.getUTCMonth());
  //     const purchases = await Expense.find({
  //       name: itemName,
  //       createdAt: {
  //         $gte: periodStart,
  //         $lte: periodEnd,
  //       },
  //     }).sort({ createdAt: 1 });
  //     //Such date format necessary because on next loop, we'll take another month back (2023-02-12) and query (2023-02-12 -> 2023-03-12)

  //     for (const purchase of purchases) {
  //       console.log("purchase", purchase);
  //       // if pUnits = 100 and rUnits = 300
  //       if (purchase.units <= remainingUnits) {
  //         totalCost += purchase.value;
  //         remainingUnits -= purchase.units;
  //       } else {
  //         totalCost += remainingUnits * (purchase.value / purchase.units);
  //         remainingUnits = 0;
  //       }
  //     }
  //     periodStart.setFullYear(periodStart.getFullYear());
  //     periodStart.setMonth(periodStart.getMonth() - 1);
  //     periodStart.setDate(periodStart.getDate());
  //     periodStart.setUTCHours(0, 0, 0, 0);
  //   }
  //   console.log("totalCost", totalCost);
  //   return totalCost;
  // }

  /*
  CALC PERIOD's UNITS USED AND LOOK BACK ON PURCHASE UTIL SUM IS GREATER TAHN OR EQUAL TO TH PERIOD AND CALC UNITARY 
  WAIT, WHAT about the beginning inventory. Should 
  Maybe go back until the sum is >= than units used - begInv
  HOW TO CALCULATE BEGINNING INVENTROY COST
  I am confused 
  TRACK FIFO of month if calculating COGS for 1 month, FIFO of year if calc 1 year COGS.
  */

  // const periodExpenses = Expense.findOne({name: })
  // wheightedAverageCost (COGS) is always calculated for the period. Never stored.
  // To calculate value of units used and wasted in inventory history
  // You could store 2 bundles of an item purchased twice (1 per purchase).
  // If you sell 1 bundle, wheightedAverageCost is calculated to calc COGS, not expenses
  // const weightedAverageCost = totalCost / totalUnits;
  // itemHistory.map((registry) => {
  //   registry.usedValue = registry.usedUnits
  //     ? weightedAverageCost * registry.usedUnits
  //     : null;
  //   registry.wastedValue = registry.wastedUnits
  //     ? weightedAverageCost * registry.wastedUnits
  //     : null;
  // });

  res.status(StatusCodes.OK).json({
    item: name,
    itemHistory,
    COGS /*, weightedAverageCost: weightedAverageCost */,
  });
};

export const getInventoryHistory = async (req, res) => {};

export const createInventoryHistory = async (req, res) => {
  // Create at start of day
  const { beginningInventory, itemId } = req.body;
  if (!beginningInventory) {
    new BadRequestError(
      "To write today's inventory please provide your beginning inventory"
    );
  }
  const latestRegistry = await InventoryHistory.findOne({ item: itemId })
    .sort("-createdAt")
    .select("createdAt");

  const today = new Date(Date.now());
  if (latestRegistry) {
    if (
      latestRegistry.createdAt.getDate() === today.getDate() &&
      latestRegistry.createdAt.getMonth() === today.getMonth()
    ) {
      throw new BadRequestError(
        "Duplication err: Current date's registry has already been created for that item"
      );
    }
  }
  const newRegistry = await InventoryHistory.create({
    beginningInventory: beginningInventory,
    item: itemId,
  });
  res.status(StatusCodes.CREATED).json(newRegistry);
};

export const updateInventoryHistory = async (req, res) => {
  // At end of each day
  const { endingInventory, usedUnits, wastedUnits } = req.body;

  // Write expense
  // Update account
  // Get each item's purchases by time period
  // calc wheightedAverageCost
  // multiply by units used and wasted

  const updateObject = {};

  // Save purchases in Expenses instead of in the InventoryHistory

  // Just store the name of the source of the expense.
  // You dont need to have a connection with every schema an expense comes from

  updateObject.endingInventory = endingInventory;
  updateObject.usedUnits = usedUnits;
  updateObject.wastedUnits = wastedUnits;

  const updatedRegistry = await InventoryHistory.updateOne(
    { _id: req.params.id },
    updateObject
  );

  // const items = InventoryItem.find({});
  res.status(StatusCodes.OK).json(updatedRegistry);
};

export const deleteInventoryHistory = async (req, res) => {
  const deletedRegistry = await InventoryHistory.findByIdAndDelete(
    req.params.id
  );
  if (!deletedRegistry) {
    throw new NotFoundError("Registry does not exist");
  }
  res.status(StatusCodes.OK).json({ msg: "Registry was deleted" });
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

  // Get date of lastupdate from any item
  const lastUpdate = ProductStat.findOne({})
    .select("updatedAt")
    .sort("-updatedAt");

  // Get orders since last update. Grouped by date
  const orders = Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(lastUpdate),
          $lte: new Date.now(),
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
  /*  orders.map((dailyOrders) => {
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
