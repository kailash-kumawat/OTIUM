import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./src/config/env.config.js";

const app = express();

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  }),
);

app.use(
  express.json({
    limit: "16kb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  }),
);

app.use(cookieParser());
app.use(express.static("public"));

import { userRoutes } from "./src/routes/index.js";

app.use("/api/v1/users", userRoutes);

export default app;
