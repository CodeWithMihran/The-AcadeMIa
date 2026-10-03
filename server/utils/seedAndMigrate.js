require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const tenantModel = require("../models/tenant-model");
const userModel = require("../models/user-model");
const subjectModel = require("../models/subject-model");
const progressModel = require("../models/progress-model");

async function seedAndMigrate() {
    try {
        console.log("Connecting to MongoDB for migration...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected Successfully.");

        // Convert legacy one-document-per-subject progress records before the
        // new per-topic unique index is used by the API.
        const progressIndexes = await progressModel.collection.indexes();
        const legacyProgressIndex = progressIndexes.find(index =>
            index.unique && index.key?.user === 1 && index.key?.subject === 1 && !index.key?.topicId
        );
        if (legacyProgressIndex) {
            await progressModel.collection.dropIndex(legacyProgressIndex.name);
        }
        const legacyProgress = await progressModel.find({ topicId: { $exists: false } }).lean();
        const topicProgressOperations = legacyProgress.flatMap(record =>
            (record.completedTopicIds || []).map(topicId => ({
                updateOne: {
                    filter: { user: record.user, subject: record.subject, topicId },
                    update: { $set: { completed: true } },
                    upsert: true
                }
            }))
        );
        if (topicProgressOperations.length) {
            await progressModel.collection.bulkWrite(topicProgressOperations, { ordered: false });
        }
        if (legacyProgress.length) {
            await progressModel.deleteMany({ _id: { $in: legacyProgress.map(record => record._id) } });
            console.log(`-> Migrated ${legacyProgress.length} legacy progress records.`);
        }

        // 1. Seed Initial Universities / Tenants
        console.log("1. Seeding Base Tenants (Universities & Exam Track)...");

        // VMSB UTU
        let utu = await tenantModel.findOne({ shortCode: "VMSB UTU" });
        if (!utu) {
            utu = await tenantModel.create({
                name: "Veer Madho Singh Bhandari Uttarakhand Technical University",
                shortCode: "VMSB UTU",
                type: "UNIVERSITY",
                state: "Uttarakhand",
                domains: ["ritroorkee.com", "gehu.ac.in", "coer.ac.in", "thdcihert.ac.in"],
                affiliatedColleges: [
                    { name: "Roorkee Institute of Technology", code: "RIT", domain: "ritroorkee.com", city: "Roorkee" },
                    { name: "College of Engineering Roorkee", code: "COER", domain: "coer.ac.in", city: "Roorkee" },
                    { name: "Graphic Era Hill University", code: "GEHU", domain: "gehu.ac.in", city: "Dehradun" },
                    { name: "THDC-IHET", code: "THDC", domain: "thdcihert.ac.in", city: "Tehri" }
                ],
                active: true
            });
            console.log("-> Created Tenant: VMSB UTU");
        } else {
            console.log("-> Tenant VMSB UTU already exists.");
        }

        // AKTU
        let aktu = await tenantModel.findOne({ shortCode: "AKTU" });
        if (!aktu) {
            aktu = await tenantModel.create({
                name: "Dr. A.P.J. Abdul Kalam Technical University",
                shortCode: "AKTU",
                type: "UNIVERSITY",
                state: "Uttar Pradesh",
                domains: ["aktu.ac.in", "kiet.edu", "akgec.ac.in", "glbitm.ac.in", "jssaten.ac.in", "abes.ac.in"],
                affiliatedColleges: [
                    { name: "KIET Group of Institutions", code: "KIET", domain: "kiet.edu", city: "Ghaziabad" },
                    { name: "Ajay Kumar Garg Engineering College", code: "AKGEC", domain: "akgec.ac.in", city: "Ghaziabad" },
                    { name: "GL Bajaj Institute of Technology & Management", code: "GLBITM", domain: "glbitm.ac.in", city: "Greater Noida" },
                    { name: "JSS Academy of Technical Education", code: "JSSATEN", domain: "jssaten.ac.in", city: "Noida" },
                    { name: "ABES Engineering College", code: "ABES", domain: "abes.ac.in", city: "Ghaziabad" }
                ],
                active: true
            });
            console.log("-> Created Tenant: AKTU");
        } else {
            console.log("-> Tenant AKTU already exists.");
        }

        // Competitive Track
        let compTrack = await tenantModel.findOne({ shortCode: "COMPETITIVE" });
        if (!compTrack) {
            compTrack = await tenantModel.create({
                name: "National Competitive Exam Track (JEE / NEET)",
                shortCode: "COMPETITIVE",
                type: "COMPETITIVE_EXAM",
                state: "All India",
                domains: [],
                affiliatedColleges: [],
                active: true
            });
            console.log("-> Created Tenant: Competitive Track");
        } else {
            console.log("-> Tenant Competitive Track already exists.");
        }

        // 2. Migrate Existing Subjects to VMSB UTU
        console.log("2. Linking unassigned subjects to VMSB UTU...");
        const unassignedSubjects = await subjectModel.find({
            $or: [{ tenant: null }, { tenant: { $exists: false } }]
        });

        if (unassignedSubjects.length > 0) {
            for (let subj of unassignedSubjects) {
                subj.tenant = utu._id;
                subj.track = "UNIVERSITY";
                await subj.save();
            }
            console.log(`-> Migrated ${unassignedSubjects.length} subjects to VMSB UTU tenant.`);
        } else {
            console.log("-> All subjects already have tenant associations.");
        }

        // 3. Migrate Existing Users
        console.log("3. Linking legacy users to tenants...");
        const usersToUpdate = await userModel.find({
            $or: [{ tenant: null }, { tenant: { $exists: false } }]
        });

        for (let user of usersToUpdate) {
            user.tenant = utu._id;
            user.track = "UNIVERSITY";
            if (!user.college || user.college === "Not Set") {
                user.college = "Roorkee Institute of Technology";
            }
            user.onboardingCompleted = true;
            await user.save();
        }
        console.log(`-> Updated ${usersToUpdate.length} users with tenant & college details.`);

        console.log("\n✅ Migration completed successfully!");
        process.exit(0);

    } catch (err) {
        console.error("❌ Migration error:", err);
        process.exit(1);
    }
}

seedAndMigrate();
