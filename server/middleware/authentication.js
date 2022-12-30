import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { UnauthenticatedError } from "../errors/index.js";

export const requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthenticatedError("No auth token present");
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userId: payload.userId,
      role: payload.userRole,
      name: payload.name,
    };
    next();
  } catch (error) {
    // res.redirect("/auth/login");
    throw new UnauthenticatedError("Invalid authorization");
  }
};
