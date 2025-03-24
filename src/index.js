const express = require("express");
const app = express();
const port = 3001;
const userRoutes = require("./routes/users")
const path = require("path")

const randomInt = (max) => Math.floor(Math.random() * max);

//Connect to DB
const connectDB = require("./utils/db")

//New middleware 
app.use(express.json())

//image folder middleware
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

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
