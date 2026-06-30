import express, { Request, Response, NextFunction } from "express";
import { helpers } from "./db";
import { NewUserInput } from "./types";
import bcrypt from "bcrypt";

const PORT = 3000;
const app = express();

(async () => {
  helpers.init();
})();

app.use(express.json());

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get("/users-api", async (_req: Request, res: Response) => {
  const users = await helpers.getAllUsers();
  res.json(users.map(({ password_hash, ...rest }) => rest));
});

app.post("/users-api", async (req: Request, res: Response) => {
  const { name, password, role }: NewUserInput = req.body;

  if (!name || !password || !role) {
    return res
      .status(400)
      .json({ error: "Name, password, and role are required" });
  }

  if (role !== "client" && role !== "trainer") {
    return res
      .status(400)
      .json({ error: "Role must be 'client' or 'trainer'" });
  }

  const password_hash = await bcrypt.hash(password, 10);
  await helpers.addUser({ name, password_hash, role });
  res.status(201).json({ name, role });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
