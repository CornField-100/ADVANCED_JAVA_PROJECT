const User = require("../models/userModels")

exports.userLogIn = (req, res) => {
    res.send("User login")
}
exports.userSignUp = async (req, res) => {
    //Get data from request
    const { firstName, email, lastName, imageUrl, role } = req.body
    const hashedPassword = req.hashedPassword
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
}
