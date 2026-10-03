require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const userModel = require("../models/user-model");

async function createAdmin() {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (!process.env.MONGO_URI || !email || !password) {
        throw new Error("Set MONGO_URI, ADMIN_EMAIL, and ADMIN_PASSWORD in server/.env before creating an admin.");
    }

    await mongoose.connect(process.env.MONGO_URI);
    const existingAdmin = await userModel.findOne({ email });
    const hash = await bcrypt.hash(password, 12);
    if (existingAdmin) {
        existingAdmin.password = hash;
        existingAdmin.role = "admin";
        await existingAdmin.save();
        console.log("Existing account updated with administrator access.");
        return;
    }

    await userModel.create({ name: "Admin", email, password: hash, role: "admin" });
    console.log("Admin created successfully.");
}

createAdmin()
    .catch(err => {
        console.error("Failed to create admin:", err.message);
        process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
