import { normalizeEmail } from "./authValidation.js";

const windowMs = 15 * 60 * 1000;

export function authRateLimit(ipLimit, emailLimit) {
    const attempts = new Map();

    function removeExpired() {
        const now = Date.now();
        for (const [key, attempt] of attempts) {
            if (attempt.expiresAt <= now) attempts.delete(key);
        }
    }
    setInterval(removeExpired, 60_000).unref();

    function countAttempt(key, limit) {
        const now = Date.now();
        let attempt = attempts.get(key);
        if (!attempt || attempt.expiresAt <= now) {
            // Keep the in-process limiter bounded even when requests use many addresses.
            if (attempts.size >= 10_000) {
                removeExpired();
                if (attempts.size >= 10_000) return Math.ceil(windowMs / 1000);
            }
            attempt = { count: 0, expiresAt: now + windowMs };
            attempts.set(key, attempt);
        }
        if (attempt.count >= limit) return Math.ceil((attempt.expiresAt - now) / 1000);
        attempt.count++;
        return 0;
    }

    return (req, res, next) => {
        let wait = countAttempt(`ip:${req.ip}`, ipLimit);
        const email = emailLimit && normalizeEmail(req.body?.email);
        if (!wait && email) wait = countAttempt(`email:${email}`, emailLimit);
        if (!wait) return next();
        res.set("Retry-After", String(wait));
        return res.status(429).json({ message: "Too many attempts. Please wait and try again." });
    };
}
