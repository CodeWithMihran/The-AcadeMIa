const mongoose = require("mongoose");
const Subject = require("../../models/subject-model");
const User = require("../../models/user-model");
const Tenant = require("../../models/tenant-model");
const CommunityNote = require("../../models/community-note-model");
const CommunityVote = require("../../models/community-vote-model");
const CommunityBounty = require("../../models/community-bounty-model");
const CommunityWallet = require("../../models/community-wallet-model");
const studentSubjectFilter = require("../../utils/studentSubjectFilter");
const { normalizeBranch, branchQueryValues } = require("../../utils/branch");

const NOTE_REWARD = 5;
const BOUNTY_MIN = 10;
const BOUNTY_MAX = 500;
const MAX_FILE_SIZE = 8 * 1024 * 1024;

const idOf = (value) => (value?._id || value)?.toString?.() || "";
const campusOf = (user) => ({
    tenant: user.tenant?._id || user.tenant || null,
    college: user.college && user.college !== "Not Set" ? user.college.trim() : "",
    branch: user.branch && user.branch !== "Not Set" ? normalizeBranch(user.branch) : "",
    semester: Number.isInteger(Number(user.semester)) ? Number(user.semester) : null
});

function fileSignatureIsValid(file) {
    if (!file?.buffer?.length || file.size > MAX_FILE_SIZE) return false;
    const bytes = file.buffer;
    if (file.mimetype === "application/pdf") return bytes.subarray(0, 5).toString("ascii") === "%PDF-";
    if (file.mimetype === "image/png") return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    if (file.mimetype === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    return false;
}

function moderatorCanAccess(user, record) {
    if (user.role === "admin") return true;
    const assignment = user.campusAmbassador;
    if (user.role !== "moderator" || !assignment?.active) return false;
    const campus = idOf(assignment.tenant) === idOf(record.tenant)
        && (!assignment.college || assignment.college === record.college);
    const branch = !assignment.branches?.length || assignment.branches.some(value => normalizeBranch(value) === normalizeBranch(record.branch));
    const semester = !assignment.semesters?.length || assignment.semesters.includes(record.semester);
    return campus && branch && semester;
}

function studentCanAccessNote(user, note) {
    if (idOf(note.tenant) !== idOf(user.tenant)) return false;
    if (note.college && note.college !== (user.college && user.college !== "Not Set" ? user.college : "")) return false;
    if (user.branch && user.branch !== "Not Set" && note.branch && normalizeBranch(note.branch) !== normalizeBranch(user.branch)) return false;
    if (user.semester && note.semester && Number(note.semester) !== Number(user.semester)) return false;
    return true;
}

async function recoverPendingBounties(userId, subjectId) {
    const pending = await CommunityBounty.find({ creator: userId, subject: subjectId, status: "PENDING" });
    if (!pending.length) return;
    const wallet = await CommunityWallet.findOne({ user: userId }).select("entries.reference").lean();
    const references = new Set((wallet?.entries || []).map((entry) => entry.reference));
    for (const bounty of pending) {
        if (references.has(`bounty-escrow:${bounty._id}`)) {
            await CommunityBounty.updateOne({ _id: bounty._id, status: "PENDING" }, { $set: { status: "OPEN" } });
        } else if (Date.now() - bounty.createdAt.getTime() > 2 * 60 * 1000) {
            await CommunityBounty.deleteOne({ _id: bounty._id, status: "PENDING" });
        }
    }
}

async function addWalletEntry({ userId, delta, type, description, reference, actor }) {
    try {
        await CommunityWallet.updateOne({ user: userId }, { $setOnInsert: { user: userId, balance: 0 } }, { upsert: true });
    } catch (error) {
        if (error.code !== 11000) throw error;
    }
    const priorBalance = { $ifNull: ["$balance", 0] };
    const nextBalance = { $add: [priorBalance, delta] };
    const entry = {
        reference,
        delta,
        type,
        description,
        actor: actor || null,
        createdAt: new Date()
    };
    let wallet;
    try {
        wallet = await CommunityWallet.findOneAndUpdate(
            { user: userId, "entries.reference": { $ne: reference }, ...(delta < 0 ? { balance: { $gte: Math.abs(delta) } } : {}) },
            [{ $set: {
                balance: nextBalance,
                entries: { $concatArrays: [{ $ifNull: ["$entries", []] }, [{ $mergeObjects: [{ $literal: entry }, { balanceAfter: nextBalance }] }]] }
            } }],
            { returnDocument: "after" }
        );
    } catch (error) {
        if (error.code !== 11000) throw error;
    }
    if (wallet) {
        const inserted = wallet.entries.find((item) => item.reference === reference);
        return { balance: wallet.balance, alreadyProcessed: false, entry: inserted };
    }
    wallet = await CommunityWallet.findOne({ user: userId }).lean();
    const existing = wallet?.entries?.find((item) => item.reference === reference);
    if (existing) return { balance: wallet.balance, alreadyProcessed: true, entry: existing };
    if (delta < 0) throw Object.assign(new Error("Not enough AcadeMIA Credits."), { statusCode: 400 });
    throw new Error("Could not record the credit ledger entry.");
}

module.exports.getWallet = async (req, res) => {
    try {
        const [user, wallets, approvedCount] = await Promise.all([
            User.findById(req.user._id).select("campusAmbassador branch year"),
            CommunityWallet.aggregate([{ $match: { user: req.user._id } }, { $project: { balance: 1, entries: { $slice: ["$entries", -30] } } }]),
            CommunityNote.countDocuments({ contributor: req.user._id, status: "APPROVED" })
        ]);
        const wallet = wallets[0];
        const badges = [];
        if (approvedCount >= 1) {
            badges.push("First Verified Note");
            if (user?.branch && user.branch !== "Not Set" && user?.year) badges.push(`${user.branch} · Year ${user.year} Contributor`);
        }
        if (approvedCount >= 5) badges.push("Campus Contributor");
        if (approvedCount >= 20) badges.push("Top Contributor");
        return res.json({
            success: true,
            credits: wallet?.balance || 0,
            approvedNotes: approvedCount,
            badges,
            ambassador: user?.campusAmbassador?.active ? user.campusAmbassador : null,
            ledger: (wallet?.entries || []).reverse()
        });
    } catch (error) {
        console.error("Community wallet error:", error);
        return res.status(500).json({ success: false, message: "Could not load your contributor wallet." });
    }
};

module.exports.getMyNotes = async (req, res) => {
    try {
        const notes = await CommunityNote.find({ contributor: req.user._id })
            // Use an inclusion projection. MongoDB cannot mix included fields with
            // an exclusion (other than _id); fileData is already select:false.
            .select("subject unitTitle title description originalName status reviewNote createdAt reviewedAt approvedAt bountyPaid")
            .populate("subject", "name courseCode")
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();
        return res.json({ success: true, notes });
    } catch (error) {
        console.error("Get my community notes error:", error);
        return res.status(500).json({ success: false, message: "Could not load your contribution history." });
    }
};

module.exports.getSubjectNotes = async (req, res) => {
    try {
        const { subjectId } = req.params;
        if (!mongoose.isValidObjectId(subjectId)) return res.status(400).json({ success: false, message: "Invalid subject id." });
        const subject = await Subject.findOne({ _id: subjectId, ...studentSubjectFilter(req.user) }).select("tenant branch semester units");
        if (!subject) return res.status(404).json({ success: false, message: "Subject not found in your curriculum." });
        await recoverPendingBounties(req.user._id, subject._id);
        const college = req.user.college && req.user.college !== "Not Set" ? req.user.college : "";
        const notes = await CommunityNote.find({
            subject: subject._id,
            status: "APPROVED",
            $or: [{ college }, { college: "" }]
        })
            .select("-fileData")
            .populate("contributor", "name college branch year")
            .sort({ approvedAt: -1 })
            .limit(100)
            .lean();
        const noteIds = notes.map((note) => note._id);
        const [voteCounts, myVotes] = await Promise.all([
            CommunityVote.aggregate([{ $match: { note: { $in: noteIds } } }, { $group: { _id: "$note", count: { $sum: 1 } } }]),
            CommunityVote.find({ note: { $in: noteIds }, user: req.user._id }).select("note").lean()
        ]);
        const counts = new Map(voteCounts.map((item) => [item._id.toString(), item.count]));
        const voted = new Set(myVotes.map((item) => item.note.toString()));
        const ranked = notes.map((note) => {
            const upvotes = counts.get(note._id.toString()) || 0;
            return { ...note, upvotes, upvotedByMe: voted.has(note._id.toString()), batchRecommended: upvotes >= 3 };
        }).sort((a, b) => Number(b.batchRecommended) - Number(a.batchRecommended) || b.upvotes - a.upvotes || new Date(b.approvedAt) - new Date(a.approvedAt));
        const bounties = await CommunityBounty.find({ subject: subject._id, status: "OPEN", $or: [{ college }, { college: "" }] })
            .select("title description unitTitle reward createdAt creator")
            .populate("creator", "name")
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
        return res.json({ success: true, notes: ranked, bounties, bountyLimits: { min: BOUNTY_MIN, max: BOUNTY_MAX } });
    } catch (error) {
        console.error("Get community notes error:", error);
        return res.status(500).json({ success: false, message: "Could not load community notes." });
    }
};

module.exports.submitNote = async (req, res) => {
    try {
        if (req.user.track !== "UNIVERSITY") return res.status(403).json({ success: false, message: "Campus notes are currently available to university students." });
        if (!fileSignatureIsValid(req.file)) return res.status(400).json({ success: false, message: "Attach a valid PDF, JPEG, or PNG file up to 8 MB." });
        const { subjectId, unitId, unitTitle, title, description = "", bountyId = "" } = req.body;
        if (!mongoose.isValidObjectId(subjectId) || typeof title !== "string" || !title.trim() || title.trim().length > 120 || typeof unitTitle !== "string" || !unitTitle.trim() || unitTitle.trim().length > 160 || typeof description !== "string" || description.length > 1000) {
            return res.status(400).json({ success: false, message: "Enter a valid subject, unit, note title, and description." });
        }
        const subject = await Subject.findOne({ _id: subjectId, ...studentSubjectFilter(req.user) }).select("tenant branch semester units");
        if (!subject) return res.status(404).json({ success: false, message: "Subject not found in your curriculum." });
        let resolvedUnitTitle = unitTitle.trim();
        let resolvedUnitId = null;
        if (unitId && mongoose.isValidObjectId(unitId)) {
            const unit = subject.units.id(unitId);
            if (!unit) return res.status(400).json({ success: false, message: "Choose a unit from this subject." });
            resolvedUnitId = unit._id;
            resolvedUnitTitle = unit.unitTitle;
        } else if (unitId) return res.status(400).json({ success: false, message: "Invalid unit selection." });

        let bounty = null;
        if (bountyId) {
            if (!mongoose.isValidObjectId(bountyId)) return res.status(400).json({ success: false, message: "Invalid bounty." });
            bounty = await CommunityBounty.findOne({ _id: bountyId, subject: subject._id, status: "OPEN" });
            if (!bounty || (bounty.college && bounty.college !== campusOf(req.user).college)) {
                return res.status(400).json({ success: false, message: "This bounty is no longer open for your campus." });
            }
            if (idOf(bounty.creator) === idOf(req.user._id)) return res.status(400).json({ success: false, message: "You cannot claim your own bounty." });
            if (bounty.unitTitle.trim().toLocaleLowerCase() !== resolvedUnitTitle.trim().toLocaleLowerCase()) return res.status(400).json({ success: false, message: "The submitted notes must match the bounty unit or topic." });
        }
        const campus = campusOf(req.user);
        const note = await CommunityNote.create({
            subject: subject._id,
            tenant: subject.tenant,
            college: campus.college,
            branch: subject.branch || campus.branch,
            semester: subject.semester || campus.semester,
            unitId: resolvedUnitId,
            unitTitle: resolvedUnitTitle,
            title: title.trim(),
            description: description.trim(),
            originalName: req.file.originalname.replace(/[\\/\0]/g, "_").slice(0, 180),
            mimeType: req.file.mimetype,
            size: req.file.size,
            fileData: req.file.buffer,
            contributor: req.user._id,
            bounty: bounty?._id || null
        });
        return res.status(201).json({ success: true, note: { _id: note._id, title: note.title, status: note.status }, message: "Your notes were submitted for campus review." });
    } catch (error) {
        console.error("Submit community note error:", error);
        return res.status(500).json({ success: false, message: "Could not submit your notes." });
    }
};

module.exports.downloadNote = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.noteId)) return res.status(400).json({ success: false, message: "Invalid note id." });
        const note = await CommunityNote.findById(req.params.noteId).select("+fileData status tenant college branch semester contributor mimeType originalName");
        if (!note) return res.status(404).json({ success: false, message: "Note not found." });
        const moderator = moderatorCanAccess(req.user, note);
        const owner = idOf(note.contributor) === idOf(req.user._id);
        if (note.status === "PENDING" && !moderator && !owner) return res.status(404).json({ success: false, message: "Pending note not found." });
        if (note.status === "REJECTED" && !moderator && !owner) return res.status(404).json({ success: false, message: "Note not found." });
        if (note.status === "APPROVED" && !moderator && !studentCanAccessNote(req.user, note)) return res.status(403).json({ success: false, message: "This note belongs to another campus or course scope." });
        const safeName = note.originalName.replace(/["\r\n]/g, "_");
        const fallbackName = safeName.replace(/[^\x20-\x7E]/g, "_");
        res.set({
            "Content-Type": note.mimeType,
            "Content-Length": String(note.size),
            "Content-Disposition": `inline; filename="${fallbackName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`,
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "private, no-store"
        });
        return res.send(note.fileData);
    } catch (error) {
        console.error("Download community note error:", error);
        return res.status(500).json({ success: false, message: "Could not open this note." });
    }
};

module.exports.toggleUpvote = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.noteId)) return res.status(400).json({ success: false, message: "Invalid note id." });
        const note = await CommunityNote.findOne({ _id: req.params.noteId, status: "APPROVED" }).select("tenant college branch semester contributor");
        if (!note) return res.status(404).json({ success: false, message: "Approved note not found." });
        if (!studentCanAccessNote(req.user, note)) return res.status(403).json({ success: false, message: "You can only rate notes from your campus and course scope." });
        if (idOf(note.contributor) === idOf(req.user._id)) return res.status(400).json({ success: false, message: "You cannot upvote your own notes." });
        const existing = await CommunityVote.findOne({ note: note._id, user: req.user._id });
        if (existing) {
            await existing.deleteOne();
            return res.json({ success: true, upvoted: false });
        }
        try {
            await CommunityVote.create({ note: note._id, user: req.user._id });
        } catch (error) {
            if (error.code !== 11000) throw error;
        }
        return res.json({ success: true, upvoted: true });
    } catch (error) {
        console.error("Community upvote error:", error);
        return res.status(500).json({ success: false, message: "Could not update your vote." });
    }
};

module.exports.createBounty = async (req, res) => {
    try {
        const { subjectId, unitTitle, title, description, reward } = req.body || {};
        if (req.user.track !== "UNIVERSITY") return res.status(403).json({ success: false, message: "Campus bounties are currently available to university students." });
        const bountyCredits = Number(reward);
        if (!mongoose.isValidObjectId(subjectId) || typeof unitTitle !== "string" || !unitTitle.trim() || unitTitle.trim().length > 160 || typeof title !== "string" || !title.trim() || title.trim().length > 120 || typeof description !== "string" || !description.trim() || description.trim().length > 1000 || !Number.isInteger(bountyCredits) || bountyCredits < BOUNTY_MIN || bountyCredits > BOUNTY_MAX) {
            return res.status(400).json({ success: false, message: `Enter a valid request and bounty between ${BOUNTY_MIN} and ${BOUNTY_MAX} credits.` });
        }
        const subject = await Subject.findOne({ _id: subjectId, ...studentSubjectFilter(req.user) }).select("tenant branch semester");
        if (!subject) return res.status(404).json({ success: false, message: "Subject not found in your curriculum." });
        const campus = campusOf(req.user);
        const bounty = await CommunityBounty.create({
                subject: subject._id,
                tenant: subject.tenant,
                college: campus.college,
                branch: subject.branch || campus.branch,
                semester: subject.semester || campus.semester,
                unitTitle: unitTitle.trim(),
                title: title.trim(),
                description: description.trim(),
                reward: bountyCredits,
                creator: req.user._id,
                status: "PENDING"
            });
        try {
            await addWalletEntry({ userId: req.user._id, delta: -bountyCredits, type: "BOUNTY_ESCROW", description: `Escrow for: ${title.trim()}`, reference: `bounty-escrow:${bounty._id}`, actor: req.user._id });
        } catch (error) {
            await CommunityBounty.deleteOne({ _id: bounty._id, status: "PENDING" });
            throw error;
        }
        const opened = await CommunityBounty.findOneAndUpdate({ _id: bounty._id, status: "PENDING" }, { $set: { status: "OPEN" } }, { returnDocument: "after" });
        if (!opened) throw new Error("Bounty escrow was placed but the request could not be opened. Contact support with bounty " + bounty._id);
        return res.status(201).json({ success: true, bounty: opened, message: "Bounty posted. Its credits are held until an approved submission fulfills it." });
    } catch (error) {
        console.error("Create bounty error:", error);
        return res.status(error.statusCode || 500).json({ success: false, message: error.statusCode ? error.message : "Could not create this bounty." });
    }
};

module.exports.cancelBounty = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.bountyId)) return res.status(400).json({ success: false, message: "Invalid bounty id." });
        let bounty = await CommunityBounty.findOne({ _id: req.params.bountyId, creator: req.user._id, status: { $in: ["OPEN", "CANCELLING"] } });
        if (!bounty) return res.status(404).json({ success: false, message: "Open bounty not found." });
        if (bounty.status === "OPEN") {
            bounty = await CommunityBounty.findOneAndUpdate({ _id: bounty._id, status: "OPEN" }, { $set: { status: "CANCELLING" } }, { returnDocument: "after" });
            if (!bounty) return res.status(409).json({ success: false, message: "This bounty is being fulfilled or cancelled. Refresh and try again." });
        }
        await addWalletEntry({ userId: bounty.creator, delta: bounty.reward, type: "BOUNTY_REFUND", description: `Refund for cancelled bounty: ${bounty.title}`, reference: `bounty-refund:${bounty._id}`, actor: req.user._id });
        await CommunityBounty.updateOne({ _id: bounty._id, status: "CANCELLING" }, { $set: { status: "CANCELLED" } });
        return res.json({ success: true, message: "Bounty cancelled and escrow credits refunded." });
    } catch (error) {
        console.error("Cancel bounty error:", error);
        return res.status(500).json({ success: false, message: "Refund processing is pending. Refresh the bounty and retry cancellation." });
    }
};

module.exports.getModerationQueue = async (req, res) => {
    try {
        const assignment = req.user.campusAmbassador || {};
        const filter = { status: { $in: ["PENDING", "REVIEWING"] } };
        if (req.user.role !== "admin") {
            if (req.user.role !== "moderator" || !assignment.active || !assignment.tenant) return res.status(403).json({ success: false, message: "Campus ambassador access is required." });
            filter.tenant = assignment.tenant._id || assignment.tenant;
            if (assignment.college) filter.college = assignment.college;
            if (assignment.branches?.length) filter.branch = { $in: [...new Set(assignment.branches.flatMap(branchQueryValues))] };
            if (assignment.semesters?.length) filter.semester = { $in: assignment.semesters };
        }
        const [notes, openBounties] = await Promise.all([
            CommunityNote.find(filter).select("-fileData").populate("subject", "name courseCode").populate("contributor", "name email college branch year").populate("bounty", "title reward status").sort({ createdAt: 1 }).limit(100).lean(),
            CommunityBounty.find(req.user.role === "admin" ? { status: "OPEN" } : { status: "OPEN", tenant: assignment.tenant?._id || assignment.tenant, ...(assignment.college ? { college: assignment.college } : {}), ...(assignment.branches?.length ? { branch: { $in: [...new Set(assignment.branches.flatMap(branchQueryValues))] } } : {}), ...(assignment.semesters?.length ? { semester: { $in: assignment.semesters } } : {}) }).populate("subject", "name courseCode").populate("creator", "name email").sort({ createdAt: -1 }).limit(100).lean()
        ]);
        return res.json({ success: true, notes, bounties: openBounties });
    } catch (error) {
        console.error("Moderation queue error:", error);
        return res.status(500).json({ success: false, message: "Could not load the campus review queue." });
    }
};

async function payBountyToContributor(bountyId, note, reviewerId) {
    let bounty = await CommunityBounty.findOne({ _id: bountyId, subject: note.subject, status: { $in: ["OPEN", "FULFILLING", "FULFILLED"] } });
    if (!bounty) return false;
    if (bounty.status === "FULFILLED") return idOf(bounty.fulfilledBy) === idOf(note._id);
    if (bounty.status === "OPEN") {
        bounty = await CommunityBounty.findOneAndUpdate(
            { _id: bounty._id, status: "OPEN" },
            { $set: { status: "FULFILLING", fulfilledBy: note._id } },
            { returnDocument: "after" }
        );
        if (!bounty) {
            bounty = await CommunityBounty.findOne({ _id: bountyId, status: "FULFILLING", fulfilledBy: note._id });
            if (!bounty) return false;
        }
    } else if (idOf(bounty.fulfilledBy) !== idOf(note._id)) {
        return false;
    }
    await addWalletEntry({ userId: note.contributor, delta: bounty.reward, type: "BOUNTY_PAYOUT", description: `Fulfilled bounty: ${bounty.title}`, reference: `bounty-payout:${bounty._id}`, actor: reviewerId });
    await CommunityBounty.updateOne(
        { _id: bounty._id, status: "FULFILLING", fulfilledBy: note._id },
        { $set: { status: "FULFILLED", fulfilledAt: new Date() } }
    );
    return true;
}

module.exports.reviewNote = async (req, res) => {
    try {
        const { decision, reviewNote = "", fulfillBounty = false } = req.body || {};
        if (!mongoose.isValidObjectId(req.params.noteId) || !["APPROVE", "REJECT"].includes(decision) || typeof reviewNote !== "string" || reviewNote.length > 500) {
            return res.status(400).json({ success: false, message: "Choose approve or reject and provide a review note under 500 characters." });
        }
        let note = await CommunityNote.findById(req.params.noteId);
        if (!note || !["PENDING", "REVIEWING"].includes(note.status)) return res.status(404).json({ success: false, message: "Pending note not found." });
        if (!moderatorCanAccess(req.user, note)) return res.status(403).json({ success: false, message: "This submission is outside your ambassador scope." });
        if (decision === "REJECT") {
            const rejected = await CommunityNote.findOneAndUpdate(
                { _id: note._id, status: "PENDING" },
                { $set: { status: "REJECTED", reviewedBy: req.user._id, reviewedAt: new Date(), reviewNote: reviewNote.trim() } },
                { returnDocument: "after" }
            );
            if (!rejected) return res.status(409).json({ success: false, message: "This submission is already being reviewed or has a final decision." });
            return res.json({ success: true, message: "Notes rejected. No contributor credits were awarded." });
        }

        if (note.status === "PENDING") {
            note = await CommunityNote.findOneAndUpdate(
                { _id: note._id, status: "PENDING" },
                { $set: { status: "REVIEWING", reviewedBy: req.user._id, reviewedAt: new Date(), reviewNote: reviewNote.trim() } },
                { returnDocument: "after" }
            );
            if (!note) return res.status(409).json({ success: false, message: "Another moderator is already reviewing this submission." });
        }

        let bountyPaid = note.bountyPaid;
        if (fulfillBounty === true && note.bounty) {
            bountyPaid = await payBountyToContributor(note.bounty, note, req.user._id);
        }
        await addWalletEntry({ userId: note.contributor, delta: NOTE_REWARD, type: "NOTE_REWARD", description: `Verified notes: ${note.title}`, reference: `note-reward:${note._id}`, actor: req.user._id });
        const approved = await CommunityNote.findOneAndUpdate(
            { _id: note._id, status: "REVIEWING" },
            { $set: { status: "APPROVED", approvedAt: new Date(), reviewedBy: req.user._id, reviewedAt: new Date(), reviewNote: reviewNote.trim(), bountyPaid } },
            { returnDocument: "after" }
        );
        if (!approved) {
            const current = await CommunityNote.findById(note._id).select("status");
            if (current?.status === "APPROVED") return res.json({ success: true, message: "Notes were already approved; credit rewards were not duplicated." });
            return res.status(409).json({ success: false, message: "Credits were safely recorded, but this note needs a final review retry." });
        }
        return res.json({ success: true, message: `Notes approved. ${NOTE_REWARD} contributor credits awarded${bountyPaid ? " and the bounty paid" : ""}.` });
    } catch (error) {
        console.error("Review community note error:", error);
        return res.status(error.statusCode || 500).json({ success: false, message: error.statusCode ? error.message : "Could not review this submission." });
    }
};

module.exports.grantAmbassador = async (req, res) => {
    try {
        const { active, tenantId, college = "", branches = [], semesters = [] } = req.body || {};
        if (typeof active !== "boolean" || typeof college !== "string" || college.length > 160 || !Array.isArray(branches) || branches.length > 30 || !Array.isArray(semesters) || branches.some((branch) => typeof branch !== "string" || branch.trim().length > 40) || semesters.some((semester) => typeof semester !== "number" || !Number.isInteger(semester) || semester < 1 || semester > 8)) {
            return res.status(400).json({ success: false, message: "Provide a valid ambassador scope." });
        }
        const target = await User.findById(req.params.userId);
        if (!target) return res.status(404).json({ success: false, message: "User not found." });
        if (!active) {
            target.campusAmbassador = { active: false, tenant: null, college: "", branches: [], semesters: [], grantedBy: req.user._id, grantedAt: new Date() };
            if (target.role === "moderator") target.role = "student";
        } else {
            if (target.role === "admin") return res.status(400).json({ success: false, message: "Administrator accounts cannot be assigned as campus ambassadors." });
            if (target.role === "moderator" && !target.campusAmbassador?.active) return res.status(400).json({ success: false, message: "This moderator account has a different role assignment." });
            if (!mongoose.isValidObjectId(tenantId)) return res.status(400).json({ success: false, message: "Choose a valid university for this ambassador." });
            const tenant = await Tenant.findOne({ _id: tenantId, type: "UNIVERSITY", active: true }).select("_id affiliatedColleges");
            if (!tenant) return res.status(400).json({ success: false, message: "University not found or inactive." });
            if (target.track !== "UNIVERSITY" || idOf(target.tenant) !== idOf(tenant._id)) return res.status(400).json({ success: false, message: "Ambassadors must be university students at the assigned university." });
            if (college && !tenant.affiliatedColleges.some((campus) => campus.name === college)) return res.status(400).json({ success: false, message: "Choose a college affiliated with this university." });
            if (college && target.college !== college) return res.status(400).json({ success: false, message: "The ambassador must belong to the assigned college." });
            target.role = "moderator";
            target.campusAmbassador = {
                active: true,
                tenant: tenant._id,
                college: college.trim(),
                branches: [...new Set(branches.map(normalizeBranch).filter(Boolean))],
                semesters: [...new Set(semesters.map(Number))],
                grantedBy: req.user._id,
                grantedAt: new Date()
            };
        }
        await target.save();
        return res.json({ success: true, user: { _id: target._id, role: target.role, campusAmbassador: target.campusAmbassador }, message: active ? "Campus ambassador access granted." : "Campus ambassador access revoked." });
    } catch (error) {
        console.error("Grant ambassador error:", error);
        return res.status(500).json({ success: false, message: "Could not update campus ambassador access." });
    }
};

module.exports.adjustCredits = async (req, res) => {
    try {
        const delta = Number(req.body?.delta);
        const note = typeof req.body?.description === "string" ? req.body.description.trim() : "";
        const requestId = req.body?.requestId;
        if (!mongoose.isValidObjectId(req.params.userId) || !Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 1000 || !note || note.length > 200 || typeof requestId !== "string" || !/^[a-zA-Z0-9-]{8,100}$/.test(requestId)) {
            return res.status(400).json({ success: false, message: "Provide a non-zero adjustment up to 1,000 credits and a short reason." });
        }
        const target = await User.exists({ _id: req.params.userId });
        if (!target) return res.status(404).json({ success: false, message: "User not found." });
        const result = await addWalletEntry({ userId: req.params.userId, delta, type: "ADMIN_ADJUSTMENT", description: note, reference: `admin:${req.user._id}:${req.params.userId}:${requestId}`, actor: req.user._id });
        return res.json({ success: true, balance: result.balance, alreadyProcessed: result.alreadyProcessed, message: result.alreadyProcessed ? "This adjustment was already recorded." : "Credit balance adjusted and recorded." });
    } catch (error) {
        console.error("Adjust credits error:", error);
        return res.status(error.statusCode || 500).json({ success: false, message: error.statusCode ? error.message : "Could not adjust this credit balance." });
    }
};
