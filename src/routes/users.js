const express = require("express")
const router = express.Router()
const { hashPassword } = require("../middleware/passencrypt")

router.get('/', (req, res) => {
    res.send('Welcome to my API ! e-commerce backed')
})

router.post("/", hashPassword, (req, res) => {
    // get the data from the request
    const { firstName, email } = req.body
    const hashedPassword = req.hashedPassword
    res.json({
        firstName,
        email,
        hashedPassword,
        _id: "randomId1234"
    })
    console.log(firstName, email, password, )

    res.send("you have reached the post section!!")
})

module.exports = router 