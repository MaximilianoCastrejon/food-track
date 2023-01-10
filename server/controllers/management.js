import { StatusCodes } from "http-status-codes";
import InventoryHistory from "../models/Inventories/InventoryHistory.js";
import InventoryItem from "../models/Inventories/InventoryItem.js";
import InventoryType from "../models/Inventories/InventoryType.js";
import Category from "../models/Products/Category.js";
import { buildQuery } from "../utils/buildQuery.js";
import { BadRequestError, NotFoundError } from "../errors/index.js";

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

export const getAllInventoryHistory = (req, res) => {};

export const getTypeHistory = async (req, res) => {
  const typeItems = await InventoryItem.find({
    type: req.params.typeId,
  }).select("_id");
  const typeHistory = await InventoryHistory.find({ item: { $in: typeItems } });
  res.status(StatusCodes.OK).json(typeHistory);
};
