import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/auth.route.js";
import uploadRoutes from "./src/routes/upload.route.js"
import jwt from "jsonwebtoken";
import signRoutes from "./src/routes/sign.route.js"
import auth from "./src/middlewares/auth.middleware.js";

const app = express();

app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads'))


app.get('/api/get-user',auth, (req, res) => {


  // const authHeader = req.headers.authorization;
  
  // console.log('printing authHeaders:\n', typeof(authHeader))
  // const token = authHeader && authHeader.split(' ')[1];
  // console.log('printing token->', authHeader)
    // console.log("taken-token",token)
  // const decoded = jwt.verify(token, process.env.JWT_SECRET)

  // console.log(decoded)
  // console.log(req.user)
  return res.send(req.user)
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