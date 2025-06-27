// Input validation middleware
const validateUserInput = (req, res, next) => {
  const { firstName, lastName, email } = req.body;

  if (firstName && firstName.length < 2) {
    return res
      .status(400)
      .json({ message: "First name must be at least 2 characters" });
  }

  if (lastName && lastName.length < 2) {
    return res
      .status(400)
      .json({ message: "Last name must be at least 2 characters" });
  }

  if (email && !isValidEmail(email)) {
    return res
      .status(400)
      .json({ message: "Please provide a valid email address" });
  }

  next();
};

const validateProductInput = (req, res, next) => {
  const { brand, model, price, stock } = req.body;

  if (brand && brand.length < 2) {
    return res
      .status(400)
      .json({ message: "Brand must be at least 2 characters" });
  }

  if (model && model.length < 2) {
    return res
      .status(400)
      .json({ message: "Model must be at least 2 characters" });
  }

  if (price !== undefined && (price < 0 || isNaN(price))) {
    return res
      .status(400)
      .json({ message: "Price must be a valid positive number" });
  }

  if (stock !== undefined && (stock < 0 || !Number.isInteger(Number(stock)))) {
    return res
      .status(400)
      .json({ message: "Stock must be a valid non-negative integer" });
  }

  next();
};

const validatePassword = (req, res, next) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  // Check for at least one uppercase, one lowercase, and one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      message:
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    });
  }

  next();
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

module.exports = {
  validateUserInput,
  validateProductInput,
  validatePassword,
};
