import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import {connectDB} from "./src/db.js";
import workflowRoutes from "./src/routes/workflow.route.js"
import authRoutes from "./src/routes/auth.route.js";
import uploadRoutes from "./src/routes/upload.route.js"
import summarizeRoutes from "./src/routes/summarize.route.js"
import jwt from "jsonwebtoken";
import auth from "./src/middlewares/auth.middleware.js";

const app = express();

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173', 
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length']
}));
app.use('/uploads', express.static('uploads'))

app.use(bodyParser.json());

app.get('/api/get-user',auth, (req, res) => {
  return res.send(req.user)
})

//Routes
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use('/api/esign', workflowRoutes)
app.use('/api/summarize', summarizeRoutes)


connectDB();
app.listen(process.env.PORT, () =>
  console.log("Server running on port", process.env.PORT)
);