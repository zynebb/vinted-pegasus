const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  //console.log(req.headers);
  if (req.headers.authorization) {
    const token = req.headers.authorization.replace("Bearer ", "");
    //console.log(token);
    const user = await User.findOne({ token: token }).select("account _id");

    //console.log(user);
    if (user) {
      req.user = user;
      return next();
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};
module.exports = isAuthenticated;
