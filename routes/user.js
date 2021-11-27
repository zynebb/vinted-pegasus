const express = require("express");
const router = express.Router();
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encbase64 = require("crypto-js/enc-base64");

const User = require("../models/User");

router.post("/user/signup", async (req, res) => {
  try {
    const email = req.fields.email;
    const username = req.fields.username;
    const phone = req.fields.phone;
    const password = req.fields.password;

    if (username) {
      // Chercher dans la bdd s'il n'y a pas un user qui possÃ¨de cet email
      const user = await User.findOne({ email: email });
      if (!user) {
        // GÃ©nÃ©rer le salt
        const salt = uid2(64);
        // GÃ©nÃ©rer le hash
        const hash = SHA256(password + salt).toString(encbase64);
        // GÃ©nÃ©rer le token
        const token = uid2(64);

        // DÃ©clarer un nouveau user
        const newUser = new User({
          email: email,
          account: {
            username: username,
            phone: phone,
          },
          token: token,
          salt: salt,
          hash: hash,
        });
        // Sauvergarder ce nouveau user dans la BDD
        await newUser.save();
        // RÃ©pondre au client
        res.status(200).json({
          _id: newUser._id,
          token: newUser.token,
          account: newUser.account,
        });
      } else {
        res.status(409).json({ message: "This email already has an account" });
      }
    } else {
      res.status(400).json({ message: "Missing username parameter" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const { email, password } = req.fields;
    // Qui est le user qui veut se connecter ?
    const user = await User.findOne({ email: email });
    console.log(user);
    if (user) {
      console.log("Le hash du user dans la BDD est : ", user.hash);
      // GÃ©nÃ©rer un nouveau hash (Ã  partir du mot de passe reÃ§u en body + du salt trouvÃ© en BDD)
      const newHash = SHA256(req.fields.password + user.salt).toString(
        encbase64
      );
      console.log("Le nouveau hash est :", newHash);
      // Comparer ce nouveau hash au hash de la BDD
      if (newHash === user.hash) {
        // Si ce sont les mÃªmes ===> OK
        res.status(200).json({
          _id: user._id,
          token: user.token,
          account: user.account,
        });
      } else {
        // Sinon ===> Unauthorized
        res.status(401).json({ message: "Unauthorized" });
      }
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
