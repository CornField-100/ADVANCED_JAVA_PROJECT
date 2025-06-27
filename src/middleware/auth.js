const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/userModels");

exports.verifyToken = async (req, res, next) => {
  //Check if the authorization header exists
  if (!req.headers.authorization) {
    return res.status(403).send({ message: "No token provided!" });
  }

  const token = req.headers.authorization.split(" ")[1];
  try {
    const decodedToken = jwt.verify(token, process.env.SECRET_TOKEN_KEY);
    req.user = decodedToken;

    //Check if the user is in the db
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found " });
    }
    next();
  } catch (err) {
    return res.status(401).send({ message: "Unauthorized" });
  }
};

exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Require Admin Role!" });
  }
};
