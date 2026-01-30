import 'dotenv/config'
import express from "express";
import cors from "cors";  //cross origin resource sharing
import authRoutes from "./src/routes/auth.routes.js";
import pdfRoutes from "./routes/pdf.route.js";

const app = express();

app.use(express.json());
app.use(cors());

// mount routes at these endpoints.

app.use("/api/auth", authRoutes);
app.use("/api/pdf", pdfRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});







const PORT = process.env.PORT || 5000;
app.get('/', (req, res) => {
  res.send('PDF Editor Backend is running');
});


app.listen(PORT, () =>
  console.log("Server running on port", PORT)
);