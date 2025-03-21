const express = require("express")
const router = express.Router()
const { hashPassword } = require("../middleware/passencrypt")
const { userLogIn, userSignUp } = require("../controllers/userControllers")
const { verifyToken } = require("../middleware/auth")

//login route
router.post('/login', userLogIn)

//signup route
router.post("/signup", hashPassword, userSignUp)

router.post("/test", verifyToken, (req, res) => {
    res.send("test")
})

module.exports = router 