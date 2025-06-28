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
  // The frontend might send 'Model' instead of 'model'. This handles that case.
  if (req.body.Model && !req.body.model) {
    req.body.model = req.body.Model;
    delete req.body.Model;
  }

  const { brand, model, price, stock } = req.body;

  // For product creation (POST), check required fields
  if (req.method === "POST") {
    if (!brand || brand.trim() === "") {
      return res.status(400).json({ message: "Brand is required" });
    }

    if (!model || model.trim() === "") {
      return res.status(400).json({ message: "Model is required" });
    }

    if (price === undefined || price === null || price === "") {
      return res.status(400).json({ message: "Price is required" });
    }

    if (stock === undefined || stock === null || stock === "") {
      return res.status(400).json({ message: "Stock is required" });
    }
  }

  // Validate field formats if they exist
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

  if (
    price !== undefined &&
    price !== "" &&
    (price < 0 || isNaN(Number(price)))
  ) {
    return res
      .status(400)
      .json({ message: "Price must be a valid positive number" });
  }

  if (
    stock !== undefined &&
    stock !== "" &&
    (stock < 0 || !Number.isInteger(Number(stock)))
  ) {
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
