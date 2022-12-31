import { StatusCodes } from "http-status-codes";

// Assets
export const getAllAssets = async (req, res) => {
  res.status(StatusCodes.OK).send({ msg: "OK" });
};

export const getAsset = async (req, res) => {
  res.status(StatusCodes.OK).send({ msg: "OK" });
};

export const createAsset = async (req, res) => {
  res.status(StatusCodes.OK).send({ msg: "OK" });
};

export const deleteAsset = async (req, res) => {
  res.status(StatusCodes.OK).send({ msg: "OK" });
};

export const updateAsset = async (req, res) => {
  res.status(StatusCodes.OK).send({ msg: "OK" });
};
