const express = require("express");
const router = express.Router();
const { getReviews, addReview } = require("../controllers/reviewController");

router.get("/:id", getReviews); 
router.post("/:id", addReview);

module.exports = router;
