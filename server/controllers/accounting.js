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
import { Income } from "../models/Accounting/Income.js";

/********************************* BALANCE *********************************/

export const getAllBalances = async (req, res) => {
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

export const getAccountRegistry = async (req, res) => {
  const registryId = req.params.id;
  const registry = await Account.findById(registryId);
  if (!registry) {
    throw new NotFoundError("Registry could not be found");
  }

  res.status(StatusCodes.OK).json(registry);
};
// Same as for Inventory History. Create and open update form
export const createAccountRegistry = async (req, res) => {
  const { balance } = req.body;
  if (!balance) {
    throw new BadRequestError(
      "Please provide a balance. Specifically the one for the previous date"
    );
  }
  const balanceObj = await Account.create({ balance: balance });
  res.status(StatusCodes.CREATED).json(balanceObj);
};

export const deleteAccountRegistry = async (req, res) => {
  const registryId = req.params.id;
  const registry = await Account.findByIdAndDelete(registryId);
  if (!registry) {
    throw new NotFoundError("Registry could not be found");
  }
  res.status(StatusCodes.OK).json(registry);
};
export const deleteAccountRegistries = async (req, res) => {
  const { range } = req.body;
  if (!range || !range.from || !range.to) {
  }
  const deleted = await Account.deleteMany({
    createdAt: { $gte: range.from, $lte: range.to },
  });
  if (deleted.deletedCount < 1) {
    throw new NotFoundError("No documents found in that range");
  }
  res.status(StatusCodes.OK).json(deleted);
};

export const updateAccountRegistry = async (req, res) => {
  const { value, add, substract, prevBalance, createdAt } = req.body;
  if (!value) {
    throw new BadRequestError("Please provide a value");
  }
  const registryId = req.params.id;
  const updateObject = {};
  if (value) {
    updateObject.balance = { $set: { balance: value } };
  }
  if (add) {
    updateObject.balance = { $inc: { balance: add } };
  }
  if (substract) {
    updateObject.balance = { $inc: { balance: -substract } };
  }
  if (createdAt) {
    updateObject.createdAt = createdAt;
  }

  const originalRegistry = await Account.findById(registryId);
  if (!originalRegistry) {
    throw new NotFoundError("A registry with that ID could not be found");
  }
  const session = await mongoose.startSession();
  session.startTransaction();
  const updatedBalance = await Account.findByIdAndUpdate(
    registryId,
    {
      $inc: { balance: value },
    },
    { new: true },
    { session }
  );
  if (!updatedBalance) {
    session.abortTransaction();
    session.endSession();
    throw new CustomAPIError("Something went wrong while updating the balance");
  }
  if (createdAt) {
    // Update old and new
    const prevToNewPos = await Account.findOne({
      createdAt: { $lt: createdAt },
    }).sort("-createdAt");
    const prevToOriginalPos = await Account.findOne({
      createdAt: { $lt: originalRegistry.createdAt },
    }).sort("-createdAt");
    // Update original position
    await Account.updateMany(
      { createdAt: { $gt: originalRegistry.createdAt } },
      {
        $inc: {
          balance: prevToOriginalPos?.balance - originalRegistry.balance,
        },
      },
      { session }
    ).catch((err) => {
      session.abortTransaction();
      session.endSession();
      throw new CustomAPIError(
        "There was a problem updating the following registries"
      );
    });
    // Update new position
    await Account.updateMany(
      { createdAt: { $gt: createdAt } },
      { $inc: { balance: prevToNewPos?.balance - updatedBalance.balance } },
      { session }
    ).catch((err) => {
      session.abortTransaction();
      session.endSession();
      throw new CustomAPIError(
        "There was a problem updating the following registries"
      );
    });
  }
  session.commitTransaction();
  session.endSession();
  res.status(StatusCodes.OK).json(updatedBalance.balance);
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

export const deleteExpenseConcept = async (req, res) => {
  const conceptId = req.params.id;
  const deleted = await ExpenseConcept.findById(conceptId);
  res
    .status(StatusCodes.OK)
    .json({ deleted, msg: "Concept successfully deleted" });
};
export const updateExpenseConcept = async (req, res) => {
  const { concept } = req.body;
  const conceptId = req.params.id;
  const updated = await ExpenseConcept.findById(conceptId, {
    concept: concept,
  });

  res
    .status(StatusCodes.OK)
    .json({ updated, msg: "Concept successfully deleted" });
};

/********************************* EXPENSES *********************************/

export const getAllExpenses = async (req, res) => {
  const {
    sourceName,
    sourceNameOptions,
    concept,
    numericFilters,
    projection,
    sort,
    page,
    offset,
    populate,
  } = req.query;

  const queryObject = {};
  const stringParams = [];
  const numQuery = {};
  const idFields = [];
  const structureQuery = {};
  /* Query params */
  if (concept) {
    idFields.push({ id: concept, fieldName: "concept" });
  }
  if (sourceName) {
    stringParams.push({ sourceName, sourceNameOptions });
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
  if (idFields.length !== 0) {
    queryObject.idFields = idFields;
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

export const getExpenseById = async (req, res) => {
  const registryId = req.params.id;
  const expense = await Expense.findById(registryId);
  if (!expense) {
    throw new NotFoundError("Expense could not be found");
  }

  res.status(StatusCodes.OK).json(expense);
};

export const createExpense = async (req, res) => {
  const { value, units, sourceName, concept, createdAt } = req.body;
  if (!value || !units || !sourceName || !concept) {
    throw new BadRequestError(
      "Please provide all of the fields required for this operation"
    );
  }
  const createObject = {};
  createObject.value = value;
  createObject.units = units;
  createObject.sourceName = sourceName;
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
  // Create/update account document
  // const msg = await updateAccountBalance({ expense: newExpense });

  res.status(StatusCodes.CREATED).json({
    newExpense,
    msg: " Remember that Expenses have to corresponde to an Inventory History registry",
  });
};

async function updateAccountBalance({ expense, income }) {
  const date = new Date(expense.createdAt);
  const registeredDateStart = new Date(date);
  const registeredDateEnd = new Date(date);
  registeredDateStart.setHours(0, 0, 0, 0);
  registeredDateEnd.setHours(23, 59, 59, 999);

  const previousAccountRegistry = await Account.findOne({
    createdAt: { $lt: registeredDateStart },
  }).sort("-createdAt");

  const currentBalance = await Account.findOne({
    createdAt: {
      $gte: registeredDateStart,
      $lte: registeredDateEnd,
    },
  });

  if (expense) {
    if (
      !previousAccountRegistry ||
      previousAccountRegistry.balance - expense.value < 0
    ) {
      throw new CustomAPIError(
        "Not enough funds to perform that puchase. Register more income or increase equity"
      );
    }

    let newBalance = currentBalance
      ? { $inc: { balance: -expense.value } }
      : {
          balance: previousAccountRegistry.balance - expense.value,
          createdAt: expense.createdAt,
        };
    let updateQuery = currentBalance
      ? { _id: currentBalance._id }
      : {
          createdAt: {
            $gte: registeredDateStart,
            $lte: registeredDateEnd,
          },
        };

    const accountUpdate = await Account.findOneAndUpdate(
      updateQuery,
      newBalance,
      { upsert: true }
    );
    console.log("newBalance", newBalance);
    console.log("updateQuery", updateQuery);
    console.log("accountUpdate", accountUpdate);
    if (!accountUpdate) {
      throw new CustomAPIError("An error ocurred during your update");
    }
  }
  if (income) {
    // if !previousAccountRegistry -> OK. Create it

    let newBalance = currentBalance
      ? { $inc: { balance: income.value } }
      : {
          balance: previousAccountRegistry?.balance + income.value,
          createdAt: income.createdAt,
        };
    let updateQuery = currentBalance
      ? { _id: currentBalance._id }
      : {
          createdAt: {
            $gte: registeredDateStart,
            $lte: registeredDateEnd,
          },
        };

    const accountUpdate = await Account.findOneAndUpdate(
      updateQuery,
      newBalance,
      { upsert: true }
    );
    console.log("newBalance", newBalance);
    console.log("updateQuery", updateQuery);
    console.log("accountUpdate", accountUpdate);

    if (!accountUpdate) {
      throw new CustomAPIError("An error ocurred during your update");
    }
  }
  return { msg: "Account updated" };
}

export const updateExpense = async (req, res) => {
  const { value, units, sourceName, concept, createdAt } = req.body;

  const updateExpense = {};

  if (value) {
    updateExpense.value = value;
  }
  if (units) {
    updateExpense.units = units;
  }
  if (sourceName) {
    updateExpense.sourceName = sourceName;
  }
  if (concept) {
    updateExpense.concept = concept;
  }
  if (createdAt) {
    updateExpense.createdAt = createdAt;
  }

  const update = await Expense.findByIdAndUpdate(req.params.id, updateExpense);
  if (!update) {
    throw new NotFoundError("That registry could not be found");
  }
  let valueUpdateDifference = 0;
  let reallocatedExpenses = 0;

  if (value) {
    valueUpdateDifference = update.value - value;
  }
  if (createdAt) {
    reallocatedExpenses = update.value;
  }

  res.status(StatusCodes.OK).json({
    msg: "Expense registry and account records updated. Remember to update your account with new values",
    reallocatedExpenses: reallocatedExpenses,
    valueUpdateDifference: valueUpdateDifference,
  });
};

export const deleteExpense = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const deleted = await Expense.findByIdAndDelete(req.params.id, { session });
    if (!deleted) {
      throw new NotFoundError(
        "That expense registry could not be found in the database"
      );
    }
    await Account.updateMany(
      { createdAt: { $gte: deleted.createdAt } },
      { balance: { $inc: deleted.value }, updatedAt: new Date(Date.now()) },
      { session }
    );
    session.commitTransaction();
  } catch (error) {
    session.abortTransaction();
  } finally {
    session.endSession();
  }
  res.status(StatusCodes.OK).json({
    msg: "All account documents were successfully updated and that expense was deleted",
  });
};

export const deleteExpensesBySource = async (req, res) => {
  const { action } = req.query;
  const { sourceName, range } = req.body;

  if (!sourceName) {
    throw new BadRequestError("Plase provide the name of the item");
  }
  const session = await mongoose.startSession();
  session.startTransaction();

  switch (action) {
    case "range":
      if (!range || !range.from || !range.to) {
        throw new BadRequestError("Please select a range for operation");
      }
      await Expense.deleteMany(
        {
          sourceName: sourceName,
          createdAt: { $gte: range.from, $lte: range.to },
        },
        { session }
      ).catch((err) => {
        session.abortTransaction();
        throw new CustomAPIError("An error ocrrued during deletion");
      });

      session.commitTransaction();
      break;
    case "item":
      await Expense.deleteMany({ sourceName: sourceName }, { session }).catch(
        (err) => {
          session.abortTransaction();
          throw new CustomAPIError("An error ocrrued during deletion");
        }
      );
      session.commitTransaction();
      break;

    default:
      throw new BadRequestError("Please provide a valid deletion action param");
      break;
  }

  session.endSession();

  res.status(StatusCodes.OK).json({
    msg: "Deletion successful. Remember to update your account balance too",
  });
};
/********************************* SHAREHOLDERS *********************************/

export const getAllShareholders = (req, res) => {
  const shareholders = Shareholder.find({});

  res.status(StatusCodes.OK).json({ shareholders, percentage });
};
export const getShareholder = (req, res) => {
  const shareholders = Shareholder.find({});
  res.status(StatusCodes.OK).json(shareholders);
};
export const createShareholder = (req, res) => {
  const { name, percentage } = req.body;
  const shareholders = Shareholder.find({});
  let distributedPercentage = {};
  shareholders.map((shareholder) => {
    distributedPercentage += shareholder.percentage;
  });
  if (distributedPercentage > 1) {
    throw new BadRequestError(
      "You are assigning more than 100% of your company."
    );
  }
  res.status(StatusCodes.OK).json(shareholders);
};
export const deleteShareholder = (req, res) => {
  const { name, percentage } = req.body;
  const shareholders = Shareholder.find({});
  res.status(StatusCodes.OK).json(shareholders);
};
export const updateShareholder = (req, res) => {
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

export const getAllIncomes = async (req, res) => {
  const {
    sourceName,
    sourceNameOptions,
    concept,
    numericFilters,
    projection,
    sort,
    page,
    offset,
    populate,
  } = req.query;

  const queryObject = {};
  const stringParams = [];
  const numQuery = {};
  const idFields = [];
  const structureQuery = {};
  /* Query params */
  if (concept) {
    idFields.push({ id: concept, fieldName: "concept" });
  }
  if (sourceName) {
    stringParams.push({ sourceName, sourceNameOptions });
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
  if (idFields.length !== 0) {
    queryObject.idFields = idFields;
  }

  if (Object.keys(numQuery).length !== 0) {
    queryObject.numQuery = numQuery;
  }

  const queryResult = buildQuery(Income, queryObject, structureQuery);

  if (!queryResult) {
    throw new NotFoundError("No documents found");
  }

  res.status(StatusCodes.OK).json(queryResult);
};

export const getIncomeById = async (req, res) => {
  const registryId = req.params.id;

  const registry = await Income.findById(registryId);
  if (!registry) {
    throw new NotFoundError("No income registry with that ID");
  }
  res.status(StatusCodes.OK).json(registry);
};

export const createIncome = async (req, res) => {
  const { value, units, sourceName, concept, createdAt } = req.body;
  if (!value || !units || !sourceName || !concept) {
    throw new BadRequestError(
      "Please provide all of the fields required for this operation"
    );
  }
  const createObject = {};
  createObject.value = value;
  createObject.units = units;
  createObject.sourceName = sourceName;
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
  // Create/update account document
  // const msg = await updateAccountBalance({ expense: newExpense });

  res.status(StatusCodes.CREATED).json({
    newExpense,
    msg: " Remember that Expenses have to corresponde to an Inventory History registry",
  });
};

export const updateIncome = async (req, res) => {
  const { value, units, sourceName, concept, createdAt } = req.body;

  const updateExpense = {};

  if (value) {
    updateExpense.value = value;
  }
  if (units) {
    updateExpense.units = units;
  }
  if (sourceName) {
    updateExpense.sourceName = sourceName;
  }
  if (concept) {
    updateExpense.concept = concept;
  }
  if (createdAt) {
    updateExpense.createdAt = createdAt;
  }

  const update = await Expense.findByIdAndUpdate(req.params.id, updateExpense);
  if (!update) {
    throw new NotFoundError("That registry could not be found");
  }
  let valueUpdateDifference = 0;
  let reallocatedExpenses = 0;

  if (value) {
    valueUpdateDifference = update.value - value;
  }
  if (createdAt) {
    reallocatedExpenses = update.value;
  }

  res.status(StatusCodes.OK).json({
    msg: "Expense registry and account records updated. Remember to update your account with new values",
    reallocatedExpenses: reallocatedExpenses,
    valueUpdateDifference: valueUpdateDifference,
  });
};

export const deleteIncome = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const deleted = await Expense.findByIdAndDelete(req.params.id, { session });
    if (!deleted) {
      throw new NotFoundError(
        "That expense registry could not be found in the database"
      );
    }
    await Account.updateMany(
      { createdAt: { $gte: deleted.createdAt } },
      { balance: { $inc: deleted.value }, updatedAt: new Date(Date.now()) },
      { session }
    );
    session.commitTransaction();
  } catch (error) {
    session.abortTransaction();
  } finally {
    session.endSession();
  }
  res.status(StatusCodes.OK).json({
    msg: "All account documents were successfully updated and that expense was deleted",
  });
};

export const deleteIncomesBySource = async (req, res) => {
  const { action } = req.query;
  const { sourceName, range } = req.body;

  if (!sourceName) {
    throw new BadRequestError("Plase provide the name of the item");
  }
  const session = await mongoose.startSession();
  session.startTransaction();

  switch (action) {
    case "range":
      if (!range || !range.from || !range.to) {
        throw new BadRequestError("Please select a range for operation");
      }
      await Income.deleteMany(
        {
          sourceName: sourceName,
          createdAt: { $gte: range.from, $lte: range.to },
        },
        { session }
      ).catch((err) => {
        session.abortTransaction();
        throw new CustomAPIError("An error ocrrued during deletion");
      });

      session.commitTransaction();
      break;
    case "item":
      await Income.deleteMany({ sourceName: sourceName }, { session }).catch(
        (err) => {
          session.abortTransaction();
          throw new CustomAPIError("An error ocrrued during deletion");
        }
      );
      session.commitTransaction();
      break;

    default:
      throw new BadRequestError("Please provide a valid deletion action param");
      break;
  }

  session.endSession();

  res.status(StatusCodes.OK).json({
    msg: "Deletion successful. Remember to update your account balance too",
  });
};

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
