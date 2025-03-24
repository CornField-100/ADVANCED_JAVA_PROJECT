const User = require("../models/userModels")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
require("dotenv").config()

exports.userLogIn = async (req, res) => {
    const { email, password } = req.body
    try {
        //find the user in the db
        const foundUser = await User.findOne({ email })
        if (!foundUser) {
            throw new Error("Invalid credentials")
        }
        //Compare the password sent and stored
        const passwordMatch = await bcrypt.compare(password, foundUser.password)
        if (!passwordMatch) {
            throw new Error("Wrong password man")
        }
        //Create a token
        const token = jwt.sign(
            {
                userId: foundUser._id,
            },
            process.env.SECRET_TOKEN_KEY,  
            { expiresIn: "24h" }
        )
        res.status(200).json(token)
        console.log(token)
    } catch(err) {
        res.status(401).json({
            message: err.message,
        })
    }
}

exports.userSignUp = async (req, res) => {
    //Get data from request
    const { firstName, email, lastName, imageUrl, role } = req.body
    const hashedPassword = req.hashedPassword
    try {
        //Creating a new user
        const newUser = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            imageUrl,
            role,
            inventory: [],
        })
        //Saving to a database
        const savedUser = await newUser.save()
        res.status(201).json(savedUser)
    } catch (err) {
        //catch any errors 
        res.status(400).json({
            message: err.message,
        })
    }
}
