const redisClient = require("../utils/redisClient");

exports.getReviews = async (req, res) => {
  const { id } = req.params;

  try {
    const reviews = await redisClient.lRange(`product:REVIEWS:${id}`, 0, -1);
    const parsedReviews = reviews.map((rev) => JSON.parse(rev));
    res.json(parsedReviews);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};

exports.addReview = async (req, res) => {
  const { id } = req.params;
  const { name, rating, comment } = req.body;

  const review = {
    name,
    rating,
    comment,
    date: new Date().toISOString(),
  };

  try {
    await redisClient.rPush(`product:REVIEWS:${id}`, JSON.stringify(review));
    res.status(201).json({ message: "Review added." });
  } catch (error) {
    res.status(500).json({ error: "Failed to add review" });
  }
};
