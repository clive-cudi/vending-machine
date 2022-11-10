import express, { Request, Response } from 'express';
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import AdminRouter from "./routes/admin";
import CustomerRouter from "./routes/customer";
import logger from "morgan";

const app = express();
dotenv.config({path: path.resolve(__dirname, "../.env")});
const MONGO_URI = process.env.NODE_ENV == "production" ? process.env.MONGO_URI_PROD : process.env.MONGO_URI_DEV
const PORT = process.env.PORT ?? 4767;

app.use(cors());

app.use(express.json());

app.use(logger("dev"));

mongoose.connect(MONGO_URI as string, {
}).then(() => {
    console.log("DB connected");
}).catch((e: any) => {
    console.log("Error connecting to DB");
    console.log(e);
});

app.get('/', (req: Request, res: Response) => {
    return res.status(200).send("Hello Vendor Machine!!")
});

app.use('/api/customer', CustomerRouter);
app.use('/api/admin', AdminRouter);

app.listen(PORT, () => {
    console.log(`Server up PORT: ${PORT}`)
})