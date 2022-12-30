import { StatusCodes } from "http-status-codes";
import { CustomAPIError } from "../errors/custom-api.js";

export const errorHandlerMiddleware = (err, req, res, next) => {
  console.log("err", err);
  let defaultError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err.message || "Something went wrong, try again later",
  };
  // Mongoose err handeling
  if (err.name === "ValidationError") {
    defaultError.msg = `${Object.values(err.errors)
      .map((item) => item.message)
      .join(", ")}`;
    defaultError.statusCode = StatusCodes.BAD_REQUEST;
  }
  if (err.name === "CastError") {
    defaultError.msg = `No item found with ID ${err.value}. ID is not correctly formated`;
    defaultError.statusCode = StatusCodes.NOT_FOUND;
  }
  if (err.code && err.code === 11000) {
    defaultError.msg = `Duplicate value entered for ${Object.keys(
      err.keyValue
    )} field. Please try a different value`;
    defaultError.statusCode = StatusCodes.BAD_REQUEST;
  }

  return res.status(defaultError.statusCode).json({ msg: defaultError.msg });
};
