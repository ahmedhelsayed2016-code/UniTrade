import express from "express";
import Student from "../models/Student.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const router = express.Router();

const tokenCookie = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
};

// POST /login
router.post("/login", async (req, res) => {
    try {
        // 1. Get the email and password from the form.
        const { email, password } = req.body ?? {};

        // 2. Check the required fields.
        if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        // 3. Normalize the email.
        const normalizedEmail = email.trim().toLowerCase();

        // 4. Find the student and include the hidden password hash.
        const student = await Student.findOne({
            email: normalizedEmail
        }).select("+password");

        // 5. Check that the student exists.
        if (!student) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // 6. Compare the password from the form with the saved hash.
        const isPasswordMatch = !bcrypt.truncates(password) && await student.matchPassword(password);

        if (!isPasswordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // 7. Create the JWT and store it in a one-day cookie.
        const token = jwt.sign(
            { id: student._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.cookie("token", token, {
            ...tokenCookie,
            maxAge: 24 * 60 * 60 * 1000
        });

        // 8. Send the student profile to the frontend.
        return res.status(200).json({
            message: "Login successful",
            student: studentProfile(student)
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
});

// POST /register
router.post("/register", async (req, res) => {
    try {
        const {
            firstName, lastName, username, email, password, birthDate,
            university, otherUniversity, major, gender
        } = req.body ?? {};

        if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            return res.status(400).json({ message: "Enter a valid email address" });
        }

        if (typeof password !== "string" || password.length < 8 || bcrypt.truncates(password)) {
            return res.status(400).json({ message: "Password must be at least 8 characters and at most 72 bytes" });
        }

        // The Student model checks the other fields and hashes the password.
        await Student.create({
            firstName, lastName, username, email, password, birthDate,
            university, otherUniversity, major, gender
        });

        return res.status(201).json({ message: "Registration successful. You can now log in." });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "Email or username is already registered" });
        }

        if (error.name === "ValidationError") {
            const fieldError = Object.values(error.errors)[0];
            return res.status(400).json({ message: `Enter a valid value for ${fieldError.path}` });
        }

        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
});

// POST /logout
router.post("/logout", (req, res) => {
    res.clearCookie("token", tokenCookie);

    return res.status(200).json({
        message: "Logged out successfully"
    });
});

// GET /me checks the cookie when the page loads.
router.get("/me", async (req, res) => {
    res.set("Cache-Control", "no-store");
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: "Please log in" });
    }

    let session;
    try {
        session = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    } catch {
        return res.status(401).json({ message: "Session expired or invalid. Please log in again." });
    }

    try {
        const student = await Student.findById(session.id);

        if (!student) {
            return res.status(401).json({ message: "Please log in" });
        }

        return res.json({ student: studentProfile(student) });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
});

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
        gender: student.gender
    };
}

export default router;
