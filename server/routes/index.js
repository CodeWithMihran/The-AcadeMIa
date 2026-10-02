const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    // res.locals.error and success are already set by app.js middleware
    res.render("home"); 
});

module.exports = router;