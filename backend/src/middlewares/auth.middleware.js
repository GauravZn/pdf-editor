import jwt from "jsonwebtoken";

export default function auth(req, res, next) {
  try {
    // Expect: Authorization: Bearer <token>
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer "))
    {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // split the authHeader with respect to space and get the token part.
    const token = authHeader.split(" ")[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.user = {
      id: decoded.id,
      email: decoded.email
    };

    next();

  }
  catch (err)
  {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}