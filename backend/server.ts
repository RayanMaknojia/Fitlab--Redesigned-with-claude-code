import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";
import { connect } from "./config/database";
import * as userModel from "./models/User";
import bcrypt from "bcrypt";
import {authRouter} from "./routes/auth"

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
    credentials: true, // required so the browser sends/accepts the session cookie
  })
);

app.use(
  session({
    name: "session",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: CONNECTION_STRING }),
    cookie: {
      httpOnly: true,
      maxAge: 30 * 60 * 1000, // 30 minutes
    },
  })
);

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url}`);
  next();
});


app.use('/api', authRouter)

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

const startServer = async () => {
  try {
    await connect();
    await userModel.init();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
