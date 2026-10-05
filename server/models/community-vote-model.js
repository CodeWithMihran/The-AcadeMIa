const mongoose = require("mongoose");

const communityVoteSchema = new mongoose.Schema({
    note: { type: mongoose.Schema.Types.ObjectId, ref: "CommunityNote", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    value: { type: Number, enum: [1], default: 1 }
}, { timestamps: true });

communityVoteSchema.index({ note: 1, user: 1 }, { unique: true });
module.exports = mongoose.models.CommunityVote || mongoose.model("CommunityVote", communityVoteSchema);
