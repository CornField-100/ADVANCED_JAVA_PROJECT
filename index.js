const express = require("express");
const app = express();
const port = 3001;
const userRoutes = require("./src/routes/users")

const randomInt = (max) => Math.floor(Math.random() * max);

// Middleware to calculate an arithmetic value
app.use((req, res, next) => {
    req.arithmetic_calculation = randomInt(111) * randomInt(200); 
    next();
});
//New middleware 
app.use(express.json())

// Route handler
app.get("/", (req, res) => {
    console.log(`Calculated Value: ${req.arithmetic_calculation}`); // Log the calculated value
    res.send(`Hello there! The calculated value is ${req.arithmetic_calculation}`);
});

// Start server
app.listen(port, () => {
    console.log(`Example app running at http://localhost:${port}`);
});

//ROUTES
app.use("/api/users", userRoutes)
