import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import { connect } from "./config/database";
import * as userModel from "./models/User";
import * as clientModel from "./models/Client";
import * as workoutSessionModel from "./models/WorkoutSession";
import * as sessionExerciseModel from "./models/SessionExercise";
import * as exerciseTemplateModel from "./models/ExerciseTemplate";
import * as scheduleModel from "./models/Schedule";
import * as linkRequestModel from "./models/LinkRequest";
import * as passwordResetTokenModel from "./models/PasswordResetToken";
import * as listingModel from "./models/Listing";
import * as notificationModel from "./models/Notification";
import { authRouter } from "./routes/auth";
import { workoutSessionRouter } from "./routes/workoutSessions";
import { exerciseTemplateRouter } from "./routes/exerciseTemplates";
import { scheduleRouter } from "./routes/schedules";
import { chatRouter } from "./routes/chat";
import { dataSyncRouter } from "./routes/dataSync";
import { linkRouter } from "./routes/links";
import { listingRouter } from "./routes/listings";
import { notificationRouter } from "./routes/notifications";

const PORT = 3000;
const app = express();

const SESSION_SECRET = process.env.SESSION_SECRET;
const CONNECTION_STRING = process.env.CONNECTION_STRING;

if (!SESSION_SECRET) {
  throw new Error("SESSION_SECRET is not set.");
}

if (!CONNECTION_STRING) {
  throw new Error("CONNECTION_STRING is not set.");
}

app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN ?? "http://localhost:5173",
    credentials: true,
  }),
);

app.use(
  session({
    name: "session",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: MongoStore.create({ mongoUrl: CONNECTION_STRING }),
    cookie: {
      httpOnly: true,
      maxAge: 3 * 60 * 60 * 1000,
    },
  }),
);

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Express API",
    version: "1.0.0",
  },
};

const spec = swaggerJSDoc({
  definition: swaggerDefinition,
  apis: ["./routes/*.ts", "./server.ts"],
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(spec));
app.use("/api", authRouter);
app.use("/api/chat", chatRouter);
app.use("/api", workoutSessionRouter);
app.use("/api", exerciseTemplateRouter);
app.use("/api", scheduleRouter);
app.use("/api", dataSyncRouter);
app.use("/api", linkRouter);
app.use("/api", listingRouter);
app.use("/api", notificationRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

const startServer = async () => {
  try {
    await connect();
    await Promise.all([
      userModel.init(),
      clientModel.init(),
      workoutSessionModel.init(),
      sessionExerciseModel.init(),
      exerciseTemplateModel.init(),
      scheduleModel.init(),
      linkRequestModel.init(),
      passwordResetTokenModel.init(),
      listingModel.init(),
      notificationModel.init(),
    ]);
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
