import User from "../models/User.js";
import { StatusCodes } from "http-status-codes";
import { UnauthenticatedError, BadRequestError } from "../errors/index.js";
// import { UnauthenticatedError } from "../errors/unauthenticated";

export const register = async (req, res) => {
  const user = await User.create({ ...req.body });
  const token = user.createJWT();
  res.status(StatusCodes.CREATED).json({ token });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new BadRequestError("Please provide both and Email and a Password");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new UnauthenticatedError(
      "Check if your email and password are correct"
    );
  }
  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    throw new UnauthenticatedError(
      "Check if your email and password are correct"
    );
  }
  const token = user.createJWT();
  res.status(StatusCodes.OK).json({ token });
};
