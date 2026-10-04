const express = require("express");
const router = express.Router();
const authApi = require("../../middlewares/authApi");
const controller = require("../../controllers/api/studyToolsApiController");

router.use(authApi);
router.get("/", controller.getTools);
router.put("/attendance", controller.saveAttendance);
router.put("/sessionals", controller.saveSessionals);
router.put("/planner", controller.savePlanner);

module.exports = router;
