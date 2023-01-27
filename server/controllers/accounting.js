import { buildQuery } from "../utils/buildQuery.js";
import { StatusCodes } from "http-status-codes";
import { BadRequestError } from "../errors/bad-request.js";
import { NotFoundError } from "../errors/not-found.js";
import mongoose from "mongoose";
import Account from "../models/Accounting/Account.js";
import { Shareholder } from "../models/Accounting/Equity.js";
import { Expense, ExpenseConcept } from "../models/Accounting/Expenses.js";
import { CustomAPIError } from "../errors/custom-api.js";

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

  res.status(StatusCodes.OK).json(queryResult);
};

export const createExpense = async (req, res) => {
  const { value, units, name, concept, createdAt, updatedAt } = req.body;
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
  const newExpense = await Expense.create(createObject);
  res.status(StatusCodes.CREATED).json(newExpense);
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

  const queryResult = buildQuery(Account, queryObject, structureQuery);

  res.status(StatusCodes.OK).json(queryResult);
};

/********************************* INCOME *********************************/
