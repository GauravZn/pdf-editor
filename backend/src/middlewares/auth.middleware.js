import jwt from "jsonwebtoken";

export default function auth(req, res, next) {
  try {
    // Expect: Authorization: Bearer <token>
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const token = authHeader.split(" ")[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request
    //req.user = decoded; // { userId }
    console.log('her,,,,,,,,,,,,,,,,,,,e', decoded)
    req.user = {
      id: decoded.id,
      // email: user.email
    };
    console.log("AUTH USER:", req.user);

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

