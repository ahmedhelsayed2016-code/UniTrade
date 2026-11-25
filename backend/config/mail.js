import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import nodemailer from "nodemailer";

const outbox = new URL("../.mail-outbox/", import.meta.url);
let transport;

export function localMailEnabled() {
    return process.env.MAIL_MODE === "outbox" && ["development", "test"].includes(process.env.NODE_ENV);
}

export function outboxPath() {
    return fileURLToPath(outbox);
}

function smtpEnabled() {
    const { MAIL_MODE, SMTP_HOST, SMTP_USER, SMTP_PASS, MAIL_FROM, NODE_ENV, FRONTEND_ORIGIN } = process.env;
    return MAIL_MODE === "smtp" && Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS && MAIL_FROM)
        && (NODE_ENV !== "production" || FRONTEND_ORIGIN?.startsWith("https://"));
}

export function emailEnabled() {
    return localMailEnabled() || smtpEnabled();
}

export async function sendAccountEmail(to, subject, text) {
    if (smtpEnabled()) {
        const port = Number(process.env.SMTP_PORT || 587);
        transport ??= nodemailer.createTransport({
            host: process.env.SMTP_HOST, port, secure: port === 465, requireTLS: port !== 465,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
            connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 15_000
        });
        await transport.sendMail({ from: process.env.MAIL_FROM, to, subject, text });
        return;
    }
    if (!localMailEnabled()) throw new Error("Email delivery is unavailable.");

    // Keep reset codes out of application logs.
    await mkdir(outbox, { recursive: true, mode: 0o700 });
    await writeFile(new URL(`${randomUUID()}.txt`, outbox), `To: ${to}\nSubject: ${subject}\n\n${text}\n`, {
        flag: "wx", mode: 0o600
    });
}
