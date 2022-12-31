import { StatusCodes } from "http-status-codes";

// Assets categories
export const getAllAssetCategories = async (req, res) => {
  res.status(StatusCodes.OK).send({ msg: "OK" });
};

export const getAssetCategory = async (req, res) => {
  res.status(StatusCodes.OK).send({ msg: "OK" });
};

export const createAssetCategory = async (req, res) => {
  res.status(StatusCodes.OK).send({ msg: "OK" });
};

export const deleteAssetCategory = async (req, res) => {
  res.status(StatusCodes.OK).send({ msg: "OK" });
};

export const updateAssetCategory = async (req, res) => {
  res.status(StatusCodes.OK).send({ msg: "OK" });
};
