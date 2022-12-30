import express from "express";
import bodyParser from "body-parser";
import "express-async-errors";
// DB
import mongoose from "mongoose";
import { connectDB } from "./config/mongoConnection.js";
// SECURITY
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
// ROUTES
import authRouter from "./routes/auth.js";
import clientRoutes from "./routes/client.js";
import generalRoutes from "./routes/general.js";
import managementRoutes from "./routes/management.js";
import salesRoutes from "./routes/sales.js";
// MIDDLEWARE
import { requireAdmin } from "./middleware/authentication.js";
import { errorHandlerMiddleware } from "./middleware/error-handler.js";
import { notFound } from "./middleware/notFound.js";

dotenv.config();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policiy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

// ROUTES
app.use("/auth", authRouter);
app.use("/client", clientRoutes);
app.use("/general", generalRoutes);
app.use("/management", managementRoutes);
app.use("/sales", salesRoutes);
app.get("/general", (req, res) => {});

app.use(notFound);
app.use(errorHandlerMiddleware);

const PORT = process.env.PORT || 9000;
const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(PORT, () =>
      console.log(
        `DB Conection established. Server is listening in port: ${PORT}`
      )
    );
  } catch (error) {
    console.log(error);
  }
};

start();
// mongoose.set("strictQuery", false);

// mongoose
//   .connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => {
//     app.listen(PORT, () => console.log(`Server Port: ${PORT}`));
//   })
//   .catch((error) => console.log(`${error} did not connect`));
