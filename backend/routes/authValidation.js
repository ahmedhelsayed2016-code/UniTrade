import bcrypt from "bcryptjs";
import sharp from "sharp";

const maxPhotoBytes = 512 * 1024;

export function normalizeEmail(value) {
    if (typeof value !== "string") return null;
    const email = value.trim().toLowerCase();
    const [local, domain, extra] = email.split("@");
    if (email.length > 254 || !local || local.length > 64 || extra !== undefined || !domain) return null;
    if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local) || local.startsWith(".") || local.endsWith(".") || local.includes("..")) return null;
    const labels = domain.split(".");
    return labels.length > 1 && labels.every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)) ? email : null;
}

export function passwordError(password) {
    if (typeof password !== "string" || [...password].length < 15) return "Use at least 15 characters.";
    if (bcrypt.truncates(password)) return "That password is too long. Try a shorter passphrase.";
    return null;
}

async function readPhoto(value) {
    if (value == null) return {};
    if (typeof value !== "string" || value.length > Math.ceil(maxPhotoBytes / 3) * 4 + 32) {
        throw new Error("Choose an image of 512 KB or less.");
    }
    const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
    if (!match) throw new Error("Choose a valid JPG, PNG, or WebP image.");
    const [, mediaType, encoded] = match;
    const bytes = Buffer.from(encoded, "base64");
    if (bytes.length > maxPhotoBytes) throw new Error("Choose an image of 512 KB or less.");
    if (bytes.toString("base64") !== encoded) throw new Error("Choose a valid JPG, PNG, or WebP image.");

    try {
        // Re-encode the image to remove metadata.
        const image = sharp(bytes, { limitInputPixels: 20_000_000 });
        if (`image/${(await image.metadata()).format}` !== mediaType) throw new Error();
        const photo = await image.autoOrient().resize(512, 512, { fit: "inside", withoutEnlargement: true }).webp().toBuffer();
        return { photo, photoType: "image/webp" };
    } catch {
        throw new Error("Choose a valid JPG, PNG, or WebP image under 20 megapixels.");
    }
}

export async function profileData(body) {
    const data = {};
    for (const [field, label, max] of [
        ["firstName", "first name", 60], ["lastName", "last name", 60],
        ["major", "major", 120], ["university", "university", 120]
    ]) {
        const value = typeof body[field] === "string" ? body[field].trim() : "";
        if (!value || value.length > max) throw new Error(`Enter a ${label} of 1 to ${max} characters.`);
        data[field] = value;
    }
    data.otherUniversity = "";
    if (data.university.toLowerCase() === "other") {
        const other = typeof body.otherUniversity === "string" ? body.otherUniversity.trim() : "";
        if (!other || other.length > 120) throw new Error("Enter a university name of 1 to 120 characters.");
        data.otherUniversity = other;
    }
    const username = typeof body.username === "string" ? body.username.trim() : "";
    if (!/^[A-Za-z0-9_.-]{3,30}$/.test(username)) {
        throw new Error("Use 3 to 30 letters, numbers, dots, underscores, or dashes for your username.");
    }
    return { ...data, username, ...await readPhoto(body.photo) };
}

export async function registrationData(body) {
    const email = normalizeEmail(body.email);
    if (!email) throw new Error("Enter a valid email address.");
    const invalidPassword = passwordError(body.password);
    if (invalidPassword) throw new Error(invalidPassword);
    const birthDate = body.birthDate;
    const date = typeof birthDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(birthDate) ? new Date(birthDate) : null;
    if (!date || Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== birthDate
        || birthDate.startsWith("0000-") || birthDate > new Date().toISOString().slice(0, 10)) {
        throw new Error("Enter a valid birth date that is not in the future.");
    }
    if (!["Male", "Female"].includes(body.gender)) throw new Error("Select a gender from the list.");
    return { ...await profileData(body), email, password: body.password, birthDate, gender: body.gender };
}
