const express = require("express");
const app = express();
const port = 3001;
const userRoutes = require("./src/routes/users")

const randomInt = (max) => Math.floor(Math.random() * max);

//Connect to DB
const connectDB = require("./src/utils/db")

//New middleware 
app.use(express.json())

// cors middleware
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    )
    next()
})

connectDB()

// Start server
app.listen(port, () => {
    console.log(`Example app running at http://localhost:${port}`);
});

//ROUTES
app.use("/api/users", userRoutes)
