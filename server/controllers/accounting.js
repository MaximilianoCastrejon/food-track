import { buildQuery } from "../utils/buildQuery.js";
import { StatusCodes } from "http-status-codes";
import { BadRequestError } from "../errors/bad-request.js";
import { NotFoundError } from "../errors/not-found.js";
import mongoose from "mongoose";
import Account from "../models/Accounting/Account.js";
import { EquityPayout, Shareholder } from "../models/Accounting/Equity.js";
import { Expense, ExpenseConcept } from "../models/Accounting/Expenses.js";
import { CustomAPIError } from "../errors/custom-api.js";
import calculateCOGS_FIFO from "../utils/item_cogs.js";

/********************************* BALANCE *********************************/

export const getAllBalances = (req, res) => {
  const { numericFilters, projection, sort, page, offset } = req.query;

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
  if (sort) {
    structureQuery.sort = sort;
  }

  /* String and num objects to build query*/
  if (stringParams.length > 0) {
    queryObject.stringParams = stringParams;
  }

  if (numericFilters) {
    numQuery.numericFilters = numericFilters;
    numQuery.options = ["balance"];
  }
  if (Object.keys(numQuery).length !== 0) {
    queryObject.numQuery = numQuery;
  }

  const queryResult = buildQuery(Account, queryObject, structureQuery);

  if (!queryResult) {
    throw new NotFoundError("No documents found");
  }

  res.status(StatusCodes.OK).json(queryResult);
};

/********************************* EXPENSES CONCEPTS *********************************/

export const getAllExpenseConcepts = async (req, res) => {
  const concepts = await ExpenseConcept.find({});
  res.status(StatusCodes.OK).json(concepts);
};

export const createExpenseConcept = async (req, res) => {
  const { concept } = req.body;
  if (!concept) {
    throw new BadRequestError(
      "Provide the name for your new concept of expenses"
    );
  }
  const newConcept = await ExpenseConcept.create({ concept: concept });
  if (!newConcept) {
    throw new CustomAPIError(
      "Something went wrong. Concept couldn't be created"
    );
  }

  res.status(StatusCodes.CREATED).json(newConcept);
};

/********************************* EXPENSES *********************************/

export const getAllExpenses = (req, res) => {
  const { concept, numericFilters, projection, sort, page, offset, populate } =
    req.query;

  const queryObject = {};
  const stringParams = [];
  const numQuery = {};
  const idFields = [];
  const structureQuery = {};
  /* Query params */
  if (concept) {
    idFields.push({ id: concept, fieldName: "concept" });
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
    structureQuery.populate = populate;
  }

  /* String and num objects to build query*/
  if (stringParams.length > 0) {
    queryObject.stringParams = stringParams;
  }

  if (numericFilters) {
    numQuery.numericFilters = numericFilters;
    numQuery.options = ["balance"];
  }
  if (Object.keys(numQuery).length !== 0) {
    queryObject.numQuery = numQuery;
  }

  const queryResult = buildQuery(Account, queryObject, structureQuery);

  if (!queryResult) {
    throw new NotFoundError("No documents found");
  }

  res.status(StatusCodes.OK).json(queryResult);
};

export const createExpense = async (req, res) => {
  const { value, units, name, concept, createdAt } = req.body;
  if (!value || !units || !name || !concept) {
    throw new BadRequestError(
      "Please provide all of the fields required for this operation"
    );
  }
  const createObject = {};
  createObject.value = value;
  createObject.units = units;
  createObject.name = name;
  createObject.concept = concept;
  if (createdAt) {
    createObject.createdAt = createdAt;
  }

  const newExpense = await Expense.create(createObject);
  if (!newExpense) {
    throw new CustomAPIError(
      "New expense registry was not successfully created"
    );
  }
  // Create an account document
  res.status(StatusCodes.CREATED).json(newExpense);
};

export const updateExpense = async (req, res) => {
  const { value, units, name, concept, createdAt } = req.body;

  const updateExpense = {};

  if (value) {
    updateExpense.value = value;
  }
  if (units) {
    updateExpense.units = units;
  }
  if (name) {
    updateExpense.name = name;
  }
  if (concept) {
    updateExpense.concept = concept;
  }
  if (createdAt) {
    updateExpense.createdAt = createdAt;
  }
  const updateAccount = {};
  updateExpense.updatedAt = new Date(Date.now());

  const update = await Expense.findByIdAndUpdate(req.params.id, updateExpense);
  if (!update) {
    throw new NotFoundError("That registry could not be found");
  }
  if (value) {
    let valueDiff = update.value - value;
    updateAccount.updatedAt = new Date(Date.now());
    updateAccount.balance = { $inc: -valueDiff };
    // Because its and historical record, all subsequent registries should be updated
    await Account.updateMany(
      { createdAt: { $gt: update.createdAt } },
      updateAccount
    );
    await Account.updateOne({ createdAt: update.createdAt }, updateAccount);
  }

  res
    .status(StatusCodes.OK)
    .json({ msg: "Expense registry and account records updated" });
};

export const deleteExpense = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const deleted = Expense.findByIdAndDelete(req.params.id);
    if (!deleted) {
      throw new NotFoundError(
        "That expense registry could not be found in the database"
      );
    }
    await Account.updateMany(
      { createdAt: { $gte: deleted.createdAt } },
      { balance: { $inc: deleted.value }, updatedAt: new Date(Date.now()) }
    );
    session.commitTransaction();
  } catch (error) {
    session.abortTransaction();
  } finally {
    session.endSession();
  }
  res.status(StatusCodes.OK).json({
    mmsg: "All account documents were successfully updated and that expense was deleted",
  });
};

/********************************* SHAREHOLDERS *********************************/

export const getAllShareholders = (req, res) => {
  const shareholders = Shareholder.find({});
  const percentage = {};
  shareholders.map((shareholder) => {
    percentage.distributed += shareholder.percentage;
  });
  if (percentage.distributed > 1) {
    percentage.alert = "Your distributed percentage is greater than 100%";
  }
  res.status(StatusCodes.OK).json({ shareholders, percentage });
};
export const getShareholder = (req, res) => {
  const shareholders = Shareholder.find({});
  res.status(StatusCodes.OK).json(shareholders);
};
export const createShareholder = (req, res) => {
  const { name, percentage } = req.body;
  const shareholders = Shareholder.find({});
  res.status(StatusCodes.OK).json(shareholders);
};

/********************************* EQUITY *********************************/

export const getAllEquity = (req, res) => {
  const { numericFilters, projection, sort, page, offset } = req.query;

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
  if (sort) {
    structureQuery.sort = sort;
  }

  /* String and num objects to build query*/
  if (stringParams.length > 0) {
    queryObject.stringParams = stringParams;
  }

  if (numericFilters) {
    numQuery.numericFilters = numericFilters;
    numQuery.options = ["balance"];
  }
  if (Object.keys(numQuery).length !== 0) {
    queryObject.numQuery = numQuery;
  }

  const queryResult = buildQuery(EquityPayout, queryObject, structureQuery);

  if (!queryResult) {
    throw new NotFoundError("No documents found");
  }

  res.status(StatusCodes.OK).json(queryResult);
};

/********************************* INCOME *********************************/

/********************************* COGS *********************************/

export const generateCOGSReport = async (req, res) => {
  const { itemId, period } = req.body;
  if (!period || !period.from || !period.to) {
    throw new BadRequestError("Select a start date and an end date");
  }
  if (!itemId) {
    throw new BadRequestError(
      "Provide an Id of the item to calculate its COGS"
    );
  }
  const { name, itemHistory, COGS } = await calculateCOGS_FIFO(period, itemId);

  res.status(StatusCodes.OK).json(name, COGS, itemHistory);
};
