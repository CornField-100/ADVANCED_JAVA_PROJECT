const express = require("express")
const router = express.Router()

router.get('/', (req, res) => {
    res.send('Welcome to my API ! e-commerce backed')
})

router.post("/", (req, res) => {
    // get the data from the request
    const { firstName, email, password } = req.body
    res.json({
        firstName,
        email,
        password,
        _id: "randomId1234"
    })
    console.log(firstName, email, password, )

    res.send("you have reached the post section!!")
})

module.exports = router 