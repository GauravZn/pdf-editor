import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/auth.routes.js";
import pdfRoutes from "./src/routes/pdf.js";
import esignRoutes from "./src/routes/esign.routes.js";



const app = express();

app.use(express.json());
app.use(cors());
app.use("/pdf", pdfRoutes);
app.use("/api/pdf", pdfRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/pdf/esign", esignRoutes);

app.listen(process.env.PORT, () =>
  console.log("Server running on port", process.env.PORT)
);
