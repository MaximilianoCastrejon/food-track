import mongoose from "mongoose";
import { CustomAPIError } from "../errors";

export const productTransactionMiddleware = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const transaction = session;
    req.transaction = transaction;
    next();
  } catch (err) {
    await session.abortTransaction();
    throw new CustomAPIError("Transaction aborted");
  } finally {
    await session.endSession();
  }
};
