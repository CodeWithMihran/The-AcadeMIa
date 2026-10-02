const express = require("express");
const router = express.Router();
const subjectController = require("../controllers/subjectController");
const isLoggedIn = require("../middlewares/isLoggedIn");
const checkRole = require("../middlewares/checkRole");


// ----------------------
// ADMIN ROUTES
// ----------------------

// Add subject
router.get("/add", isLoggedIn, checkRole(["admin"]), (req, res) => {
    res.render("add-subject");
});

router.post("/add", isLoggedIn, checkRole(["admin"]), subjectController.addSubject);


// Edit subject
router.get("/edit/:id", isLoggedIn, checkRole(["admin"]), subjectController.editSubject);

router.post("/edit/:id", isLoggedIn, checkRole(["admin"]), subjectController.updateSubject);


// Delete subject
router.post("/delete/:id", isLoggedIn, checkRole(["admin"]), subjectController.deleteSubject);


// ----------------------
// STUDENT ROUTES
// ----------------------

// 1. List subjects
router.get("/", isLoggedIn, subjectController.showSubjects);

// 2. Global Progress Page (ADDED THIS LINE)
// It MUST be above the /:id route to prevent the CastError
router.get("/progress", isLoggedIn, subjectController.showAllProgress);


// 3. View single subject (⚠️ ALWAYS LAST)
router.get("/:id", isLoggedIn, subjectController.viewSubject);


module.exports = router;