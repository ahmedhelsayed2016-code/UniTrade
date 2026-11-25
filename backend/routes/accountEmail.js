import { createHash, createHmac, randomBytes, randomInt } from "node:crypto";
import Student from "../models/Student.js";
import { emailEnabled, sendAccountEmail } from "../config/mail.js";
import { normalizeEmail, passwordError } from "./authValidation.js";
import { authRateLimit } from "./authRateLimit.js";

const resetMinutes = 10;

function tokenDigest(token) {
    return createHash("sha256").update(token).digest("hex");
}

function codeDigest(email, code) {
    // A server secret protects short codes stored in the database.
    return createHmac("sha256", process.env.JWT_SECRET).update(`password-reset:${email}:${code}`).digest("hex");
}

function expirationTime() {
    return new Date(Date.now() + resetMinutes * 60_000);
}

function activeReset(digest) {
    return { "passwordReset.digest": digest, "passwordReset.expiresAt": { $gt: new Date() } };
}

async function sendResetCode(email) {
    const code = String(randomInt(1_000_000)).padStart(6, "0");
    const record = { digest: codeDigest(email, code), expiresAt: expirationTime() };
    const result = await Student.updateOne({ email }, { $set: { passwordReset: record } });
    if (result.matchedCount) {
        await sendAccountEmail(email, "Your UniTrade password reset code", `Your password reset code is: ${code}\n\nIt expires in ${resetMinutes} minutes.`);
    }
}

export function addPasswordResetRoutes(router, tokenCookie) {
    router.post("/forgot-password", authRateLimit(20, 3), (req, res) => {
        const email = normalizeEmail(req.body?.email);
        if (!email) return res.status(400).json({ message: "Enter a valid email address." });
        if (!emailEnabled()) return res.status(503).json({ message: "We can’t send email right now. Please try again later." });

        // Respond before the lookup to avoid revealing which accounts exist.
        res.status(202).json({ message: "If you have an account with this email, check your inbox for a six-digit code." });
        sendResetCode(email).catch(() => console.error("UniTrade could not send a password reset code."));
    });

    router.post("/verify-reset-code", authRateLimit(30, 5), async (req, res) => {
        const { code } = req.body ?? {};
        const email = normalizeEmail(req.body?.email);
        const message = "That reset code is invalid or expired. Check it or request a new code.";
        if (!email || typeof code !== "string" || !/^\d{6}$/.test(code)) return res.status(400).json({ message });

        // The exchange consumes the code and issues a single-use reset token.
        const token = randomBytes(32).toString("hex");
        const record = { digest: tokenDigest(token), expiresAt: expirationTime() };
        const result = await Student.updateOne({ email, ...activeReset(codeDigest(email, code)) }, { $set: { passwordReset: record } });
        if (!result.modifiedCount) return res.status(400).json({ message });
        res.set("Cache-Control", "no-store");
        return res.json({ resetToken: token });
    });

    router.post("/reset-password", authRateLimit(30), async (req, res) => {
        const { token, password } = req.body ?? {};
        const validation = passwordError(password);
        if (validation) return res.status(400).json({ message: validation });

        const message = "This password reset has expired or already been used. Request a new code.";
        if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) return res.status(400).json({ message });
        const digest = tokenDigest(token);
        if (!await Student.exists(activeReset(digest))) return res.status(400).json({ message });

        const hash = await Student.hashPassword(password);
        const result = await Student.updateOne(activeReset(digest), {
            $set: { password: hash }, $unset: { passwordReset: 1 }, $inc: { sessionVersion: 1 }
        });
        if (!result.modifiedCount) return res.status(400).json({ message });
        res.clearCookie("token", tokenCookie);
        return res.json({ message: "Your password was changed. Log in with your new password." });
    });
}
