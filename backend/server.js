import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/auth.route.js";
import uploadRoutes from "./src/routes/upload.route.js"
import jwt from "jsonwebtoken";
import signRoutes from "./src/routes/sign.route.js"

const app = express();

app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads'))


app.get('/api/get-user', (req, res) => {

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET)

  console.log(decoded)
  return res.send(decoded)
})

//Routes
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use('/api/esign', signRoutes)

// generateKeys().then((res)=>console.log(res))  

// console.log('das chahiye')


app.listen(process.env.PORT, () =>
  console.log("Server running on port", process.env.PORT)
);