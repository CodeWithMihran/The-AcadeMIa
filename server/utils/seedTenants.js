require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const tenantModel = require("../models/tenant-model");

const tenants = [
    {
        shortCode: "VMSB UTU",
        name: "Veer Madho Singh Bhandari Uttarakhand Technical University",
        type: "UNIVERSITY",
        state: "Uttarakhand",
        domains: ["ritroorkee.com", "gehu.ac.in", "coer.ac.in", "thdcihert.ac.in"],
        affiliatedColleges: [
            { name: "Roorkee Institute of Technology", code: "RIT", domain: "ritroorkee.com", city: "Roorkee" },
            { name: "College of Engineering Roorkee", code: "COER", domain: "coer.ac.in", city: "Roorkee" },
            { name: "Graphic Era Hill University", code: "GEHU", domain: "gehu.ac.in", city: "Dehradun" },
            { name: "THDC-IHET", code: "THDC", domain: "thdcihert.ac.in", city: "Tehri" }
        ]
    },
    {
        shortCode: "AKTU",
        name: "Dr. A.P.J. Abdul Kalam Technical University",
        type: "UNIVERSITY",
        state: "Uttar Pradesh",
        domains: ["aktu.ac.in", "kiet.edu", "akgec.ac.in", "glbitm.ac.in", "jssaten.ac.in", "abes.ac.in"],
        affiliatedColleges: [
            { name: "KIET Group of Institutions", code: "KIET", domain: "kiet.edu", city: "Ghaziabad" },
            { name: "Ajay Kumar Garg Engineering College", code: "AKGEC", domain: "akgec.ac.in", city: "Ghaziabad" },
            { name: "GL Bajaj Institute of Technology & Management", code: "GLBITM", domain: "glbitm.ac.in", city: "Greater Noida" },
            { name: "JSS Academy of Technical Education", code: "JSSATEN", domain: "jssaten.ac.in", city: "Noida" },
            { name: "ABES Engineering College", code: "ABES", domain: "abes.ac.in", city: "Ghaziabad" }
        ]
    },
    {
        shortCode: "COMPETITIVE",
        name: "National Competitive Exam Track (JEE / NEET)",
        type: "COMPETITIVE_EXAM",
        state: "All India",
        domains: [],
        affiliatedColleges: []
    }
];

async function seedTenants() {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required in server/.env.");
    await mongoose.connect(process.env.MONGO_URI);
    for (const tenant of tenants) {
        const { shortCode, active = true, ...insertOnlyFields } = tenant;
        await tenantModel.updateOne(
            { shortCode },
            { $set: { active }, $setOnInsert: insertOnlyFields },
            { upsert: true }
        );
    }
    console.log("Default university and exam tenants are available.");
}

seedTenants()
    .catch(err => {
        console.error("Failed to initialize tenants:", err.message);
        process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
