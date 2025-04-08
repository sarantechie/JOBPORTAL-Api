const jwt=require( "jsonwebtoken");

const dotenv=require( "dotenv");
const User =require("../models/User");

dotenv.config();

const authMiddleware = async (req, res, next) => {
 
  const token = req.headers.authorization?.split(" ")[1];  
  if (!token) {
    return res.status(401).json({ message: "Unauthorized. No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY); 
    req.user = await User.findById(decoded.id).select("-password"); 
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authMiddleware;
