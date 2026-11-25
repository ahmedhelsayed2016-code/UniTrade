import express from "express";
import Student from "../models/Student.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { normalizeEmail, profileData, registrationData } from "./authValidation.js";
import { authRateLimit } from "./authRateLimit.js";
import { addPasswordResetRoutes } from "./accountEmail.js";

const router = express.Router();
const tokenCookie = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
};

// Keep login timing similar for missing accounts.
const dummyHash = await Student.hashPassword("UniTrade unused login timing value");

router.post("/register", authRateLimit(15), express.json({ limit: "720kb" }), async (req, res) => {
    let data;
    try {
        data = await registrationData(req.body ?? {});
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }

    try {
        await Student.create(data);
    } catch (error) {
        if (error.code === 11000) {
            const message = error.keyPattern?.username ? "That username is already registered." : "That email is already registered. Try logging in.";
            return res.status(409).json({ message });
        }
        if (error.name === "ValidationError") {
            return res.status(400).json({ message: `Enter a valid value for ${Object.values(error.errors)[0].path}.` });
        }
        throw error;
    }

    return res.status(201).json({ message: "Your account is ready. You can now log in." });
});

router.patch("/me", authRateLimit(30), requireStudent, express.json({ limit: "720kb" }), async (req, res) => {
    let updates;
    try {
        updates = await profileData(req.body ?? {});
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
    try {
        const version = req.student.sessionVersion ?? 0;
        const sessionMatch = version ? { sessionVersion: version } : { $or: [{ sessionVersion: 0 }, { sessionVersion: { $exists: false } }] };
        const student = await Student.findOneAndUpdate({ _id: req.student._id, ...sessionMatch },
            { $set: updates }, { returnDocument: "after", runValidators: true });
        if (!student) return res.status(401).json({ message: "Please log in again." });
        return res.json({ student: studentProfile(student) });
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ message: "That username is already taken." });
        throw error;
    }
});

// Keep a smaller request limit on routes that don't accept images.
router.use(express.json({ limit: "16kb" }));

router.post("/login", authRateLimit(30, 5), async (req, res) => {
    const { email, password } = req.body ?? {};
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || typeof password !== "string" || !password || bcrypt.truncates(password)) {
        return res.status(400).json({ message: "Enter a valid email and password." });
    }

    const student = await Student.findOne({ email: normalizedEmail }).select("+password");
    const isPasswordMatch = student ? await student.matchPassword(password) : await bcrypt.compare(password, dummyHash);
    if (!student || !isPasswordMatch) return res.status(401).json({ message: "Invalid email or password" });

    const token = jwt.sign(
        { id: student._id, version: student.sessionVersion ?? 0 },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );
    res.cookie("token", token, { ...tokenCookie, maxAge: 24 * 60 * 60 * 1000 });
    return res.json({ message: "Login successful", student: studentProfile(student) });
});

router.post("/logout", (req, res) => {
    res.clearCookie("token", tokenCookie);
    return res.json({ message: "Logged out successfully" });
});

async function requireStudent(req, res, next) {
    res.set("Cache-Control", "no-store");
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Please log in" });

    let session;
    try {
        session = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    } catch {
        return res.status(401).json({ message: "Session expired or invalid. Please log in again." });
    }

    const student = await Student.findById(session.id);
    // A password reset invalidates older sessions.
    if (!student || (session.version ?? 0) !== (student.sessionVersion ?? 0)) {
        return res.status(401).json({ message: "Please log in again." });
    }
    req.student = student;
    return next();
}

router.get("/me", requireStudent, (req, res) => res.json({ student: studentProfile(req.student) }));

router.get("/photo", requireStudent, async (req, res) => {
    const student = await Student.findById(req.student._id).select("photoType +photo");
    if (!student?.photo || !["image/jpeg", "image/png", "image/webp"].includes(student.photoType)) {
        return res.status(404).json({ message: "No profile photo was uploaded." });
    }
    res.set("X-Content-Type-Options", "nosniff");
    return res.type(student.photoType).send(student.photo);
});

addPasswordResetRoutes(router, tokenCookie);

function studentProfile(student) {
    return {
        id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        username: student.username,
        email: student.email,
        birthDate: student.birthDate,
        university: student.university,
        otherUniversity: student.otherUniversity,
        major: student.major,
        gender: student.gender,
        photoUrl: student.photoType ? `/api/auth/photo?v=${student.updatedAt?.getTime() ?? 0}` : null
    };
}

router.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.type === "entity.too.large") return res.status(413).json({ message: "The request is too large. Choose a smaller photo if uploading one." });
    if (error.type === "entity.parse.failed") return res.status(400).json({ message: "We couldn’t read your request. Please try again." });
    console.error("UniTrade could not complete an authentication request.");
    return res.status(500).json({ message: "Something went wrong. Please try again." });
});

export default router;
