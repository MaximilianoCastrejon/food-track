import { StatusCodes } from "http-status-codes";

// StoragedGood
export const getAllStoragedGoods = async (req, res) => {
  res.status(StatusCodes.OK).send({ msg: "OK" });
};

export const getStoragedGood = async (req, res) => {
  res.status(StatusCodes.OK).send({ msg: "OK" });
};

export const createStoragedGood = async (req, res) => {
  res.status(StatusCodes.OK).send({ msg: "OK" });
};

export const deleteStoragedGood = async (req, res) => {
  res.status(StatusCodes.OK).send({ msg: "OK" });
};

export const updateStoragedGood = async (req, res) => {
  res.status(StatusCodes.OK).send({ msg: "OK" });
};
