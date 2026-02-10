import jwt from "jsonwebtoken";

export default function auth(req, res, next) {
  try {
    // Expect: Authorization: Bearer <token>
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  console.log("martin")
    
    // Get the token
    console.log(authHeader)
    const token = authHeader.split(" ")[1];
    
    // Verify token
    console.log('rajesh')
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request
    req.user = {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email
    };
    console.log('ship-sheep-keep-beep')

    // console.log("onedirection",req.user)

    next();
  }
  catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}