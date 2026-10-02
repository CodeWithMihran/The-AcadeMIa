require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const userModel = require("../models/user-model");

mongoose.connect(process.env.MONGO_URI)
.then(()=> console.log("MongoDB Connected"))
.catch(err => console.log(err));

async function createAdmin(){

    const existingAdmin = await userModel.findOne({ email: "admin@rit.com" });

    if(existingAdmin){
        console.log("Admin already exists");
        process.exit();
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash("Mihran@admin2007", salt);

    await userModel.create({
        name: "Admin",
        branch: "AIML",
        year: 1,
        semester: 2,
        email: "admin@rit.com",
        password: hash,
        role: "admin"
    });

    console.log("Admin created successfully");
    process.exit();
}

createAdmin();