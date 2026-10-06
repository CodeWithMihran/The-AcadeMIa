const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const requiredEnvironment = ["MONGO_URI", "JWT_KEY", "EXPRESS_SESSION_SECRET"];
const missingEnvironment = requiredEnvironment.filter((name) => !process.env[name]?.trim());
if (missingEnvironment.length) {
    throw new Error(`Missing required server configuration: ${missingEnvironment.join(", ")}`);
}

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const userModel = require("./models/user-model");
const tenantModel = require("./models/tenant-model");
const { generateToken } = require("./utils/generateToken");

const app = express();

// Required for reverse proxy (Render, AWS, Nginx)
app.set("trust proxy", 1);

// ------------------
// Database Connection
// ------------------
// ------------------
// Middlewares
// ------------------
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
app.use(cors({
    origin: [clientUrl, "http://localhost:3000", "http://127.0.0.1:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Subject editor requests can contain structured exam and career resources,
// which exceed Express's 100 KB default. Keep a finite cap for abuse resistance.
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());

// Persistent Mongo Session Store
app.use(session({
    secret: process.env.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        ttl: 24 * 60 * 60 // 1 day
    }),
    cookie: {
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// ------------------
// Passport Google OAuth
// ------------------
app.use(passport.initialize());
app.use(passport.session());

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL) {
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    proxy: true
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const profileEmail = profile.emails?.[0]?.value;
        if (!profileEmail || typeof profileEmail !== "string") {
            return done(new Error("Google did not provide an email address."), null);
        }
        const email = profileEmail.toLowerCase().trim();
        const emailDomain = email.split("@")[1];

        // Dynamic domain resolution across registered tenants
        let matchedTenant = null;
        let matchedCollegeName = "Not Set";

        if (emailDomain) {
            matchedTenant = await tenantModel.findOne({
                $or: [
                    { domains: emailDomain },
                    { "affiliatedColleges.domain": emailDomain }
                ],
                active: true
            });

            if (matchedTenant) {
                const college = matchedTenant.affiliatedColleges.find(c => c.domain === emailDomain);
                if (college) matchedCollegeName = college.name;
            }
        }

        let user = await userModel.findOne({ email });

        if (!user) {
            user = await userModel.create({
                name: profile.displayName,
                email: email,
                googleId: profile.id,
                tenant: matchedTenant ? matchedTenant._id : null,
                college: matchedCollegeName,
                branch: "Not Set",
                year: 1,
                semester: 1,
                role: "student",
                onboardingCompleted: false
            });
        } else if (!user.googleId) {
            user.googleId = profile.id;
            if (!user.tenant && matchedTenant) {
                user.tenant = matchedTenant._id;
                user.college = matchedCollegeName;
            }
            await user.save();
        }

        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));
}

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await userModel.findById(id).populate("tenant", "name shortCode type");
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// ------------------
// REST API Routes (MERN Core)
// ------------------
app.use("/api/auth", require("./routes/api/authApiRouter"));
app.use("/api/tenants", require("./routes/api/tenantApiRouter"));
app.use("/api/subjects", require("./routes/api/subjectApiRouter"));
app.use("/api/progress", require("./routes/api/progressApiRouter"));
app.use("/api/study-tools", require("./routes/api/studyToolsApiRouter"));
app.use("/api/community", require("./routes/api/communityApiRouter"));
app.use("/api/admin", require("./routes/api/adminApiRouter"));

// Google OAuth callback bridging to React frontend
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL) {
    app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
    
    app.get("/auth/google/callback",
        // ✅ FIXED: Catch the access_denied error if a user cancels the consent screen
        (req, res, next) => {
            if (req.query.error === 'access_denied') {
                return res.redirect(`${clientUrl}/?error=denied`);
            }
            next();
        },
        passport.authenticate("google", { failureRedirect: `${clientUrl}/?error=failed` }),
        (req, res) => {
        const token = generateToken(req.user);
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Redirect to React frontend callback
        res.redirect(`${clientUrl}/auth/callback`);
        }
    );
} else {
    app.get("/auth/google", (req, res) => res.status(503).json({
        success: false,
        message: "Google sign-in is not configured on this server."
    }));
    app.get("/auth/google/callback", (req, res) => res.redirect(`${clientUrl}/?error=not_configured`));
}

// ------------------
// 404 & Error Handlers
// ------------------
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Endpoint not found: ${req.method} ${req.originalUrl}`
    });
});

app.use((err, req, res, next) => {
    console.error("Server Error:", err);
    const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 500 ? err.status : 500;
    const message = status === 413
        ? "Request payload is too large. Reduce the submitted content and try again."
        : status === 400
            ? "Request data could not be parsed. Check the submitted fields and try again."
            : "Internal server error";
    res.status(status).json({
        success: false,
        message
    });
});

// ------------------
// Server Startup
// ------------------
const PORT = process.env.PORT || 3000;
async function startServer() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected");
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (error) {
        console.error("MongoDB connection failed; server was not started.", error.message);
        process.exitCode = 1;
    }
}

startServer();
