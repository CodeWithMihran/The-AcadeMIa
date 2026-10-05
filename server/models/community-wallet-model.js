const mongoose = require("mongoose");

const walletEntrySchema = new mongoose.Schema({
    reference: { type: String, required: true },
    delta: { type: Number, required: true },
    balanceAfter: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ["NOTE_REWARD", "BOUNTY_ESCROW", "BOUNTY_PAYOUT", "BOUNTY_REFUND", "ADMIN_ADJUSTMENT"], required: true },
    description: { type: String, trim: true, required: true, maxlength: 240 },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null },
    createdAt: { type: Date, default: Date.now }
}, { _id: true });

const communityWalletSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, unique: true },
    balance: { type: Number, min: 0, default: 0 },
    entries: { type: [walletEntrySchema], default: [] }
}, { timestamps: true });

communityWalletSchema.index({ "entries.reference": 1 }, { unique: true, sparse: true });
module.exports = mongoose.models.CommunityWallet || mongoose.model("CommunityWallet", communityWalletSchema);
