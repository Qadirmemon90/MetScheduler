import "dotenv/config";
import dns from "node:dns";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRouter from "./routes/AuthRoutes.js";
import socialAuthRouter from "./routes/socialAuthRouter.js";


dns.setServers(["8.8.8.8", "1.1.1.1"]);
const app = express();

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;

app.get("/", (_req: Request, res: Response) => {
  res.send("Server is Running Fast!");
});

app.use("/api/auth", authRouter)
app.use("/api/oauth", socialAuthRouter)


// Global Error Handler

app.use((err: any, _req: Request, res: Response, _next: NextFunction)=>{
    console.error(err);    
    res.status(500).send(err?.response?.data?.message || err?.message)
})

await connectDB();

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});