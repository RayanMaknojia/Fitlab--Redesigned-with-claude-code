import express, { Request, Response, NextFunction } from "express";
import { helpers } from "./db";
import { NewUserInput } from "./types";
import bcrypt from "bcrypt";
import {authRouter} from "./routes/auth"

const PORT = 3000;
const app = express();

app.use(express.json());

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
    await helpers.init();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
