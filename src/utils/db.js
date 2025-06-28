const mongoose = require("mongoose")
const dotenv = require("dotenv")
dotenv.config()

const uri = process.env.DB_CONNECTION   

const mongoConnection = uri

mongoose.set("strictQuery", true)

const connectDB = async () => {
    try {
        await mongoose.connect(mongoConnection)
        console.log("Connected to MongoDB")
    } catch (error) {
        console.error("NO DB CONNECTION!", error)
        process.exit(1)
    }
}

module.exports = connectDB