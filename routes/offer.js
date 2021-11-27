const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const Offer = require("../models/offer");
const isAuthenticated = require("../middleware/isAuthenticated");
router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    const { title, description, price, condition, city, brand, size, color } =
      req.fields;
    const newOffer = new Offer({
      product_name: title,
      product_description: description,
      product_price: price,
      product_details: [
        { MARQUE: brand },
        { TAILLE: size },
        { ÉTAT: condition },
        { COULEUR: color },
        { EMPLACEMENT: city },
      ],
      owner: req.user,
    });

    //console.log(newOffer);

    //console.log(req.fields);
    //console.log(req.files);
    const result = await cloudinary.uploader.upload(req.files.picture.path, {
      folder: "/vinted/offers/${newOffer._id}",
    });
    //console.log(result);
    newOffer.product_image = result;
    await newOffer.save();
    res.json(newOffer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
router.get("/offers", async (req, res) => {
  try {
    let filters = {};
    if (req.query.title) {
      filters.product_name = new RegExp(req.query.title, "i");
    }
    if (req.query.priceMin) {
      filters.product_price = { $gte: req.query.priceMin };
    }
    if (req.query.priceMax) {
      if (filters.product_price) {
        filters.product_price.$lte = req.query.priceMax;
      } else {
        filters.product_price = { $lte: req.query.priceMax };
      }
    }
    let sort = {};
    if (req.query.sort === "price-asc") {
      sort = { product_price: 1 };
    } else if (req.query.sort === "price-desc") {
      sort = { product_price: -1 };
    }
    let page;
    if (Number(req.query.page) < 1) {
      page = 1;
    } else {
      page = Number(req.query.page);
    }
    let limit = Number(req.query.limit);
    const offers = await Offer.find(filters)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .select("product_name product_price");

    res.json(offers);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.get("/offers/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const offer = await Offer.findById(id).populate({
      path: "owner",
      select: "account",
    });
    res.status(200).json(offer);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
module.exports = router;
