const express = require("express");
const router = express.Router();
const authApi = require("../../middlewares/authApi");
const upload = require("../../middlewares/communityUpload");
const communityActionLimit = require("../../middlewares/communityActionLimit");
const controller = require("../../controllers/api/communityApiController");

router.use(authApi);
router.get("/wallet", controller.getWallet);
router.get("/my-notes", communityActionLimit({ action: "my-notes", limit: 120, windowMs: 5 * 60 * 1000 }), controller.getMyNotes);
router.get("/subjects/:subjectId/notes", communityActionLimit({ action: "notes-read", limit: 120, windowMs: 5 * 60 * 1000 }), controller.getSubjectNotes);
router.post("/notes", communityActionLimit({ action: "note-upload", limit: 10, windowMs: 60 * 60 * 1000 }), upload, controller.submitNote);
router.get("/notes/:noteId/file", communityActionLimit({ action: "file-read", limit: 60, windowMs: 5 * 60 * 1000 }), controller.downloadNote);
router.post("/notes/:noteId/upvote", communityActionLimit({ action: "upvote", limit: 60, windowMs: 10 * 60 * 1000 }), controller.toggleUpvote);
router.post("/bounties", communityActionLimit({ action: "bounty-create", limit: 5, windowMs: 60 * 60 * 1000 }), controller.createBounty);
router.post("/bounties/:bountyId/cancel", controller.cancelBounty);
router.get("/moderation/queue", controller.getModerationQueue);
router.patch("/moderation/notes/:noteId", controller.reviewNote);
router.patch("/admin/users/:userId/ambassador", require("../../middlewares/checkRoleApi")(["admin"]), controller.grantAmbassador);
router.post("/admin/users/:userId/credits", require("../../middlewares/checkRoleApi")(["admin"]), controller.adjustCredits);

module.exports = router;
