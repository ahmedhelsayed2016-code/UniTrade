import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { fileURLToPath } from "node:url";
import connectDB from "./config/db.js";
import Student from "./models/Student.js";
import authRoutes from "./routes/authRoutes.js";
import { localMailEnabled, outboxPath } from "./config/mail.js";

const app = express();

app.use(cookieParser());
app.use(cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true
}));

app.use("/api/auth", authRoutes);

const frontendFolder = fileURLToPath(new URL("../frontend/dist/", import.meta.url));
app.use(express.static(frontendFolder));

if (!process.env.JWT_SECRET) {
    throw new Error("Set JWT_SECRET in backend/.env before starting the server");
}

await connectDB();
await Student.init();

const port = process.env.PORT || 5000;
// Keep the local mail outbox on the loopback interface.
app.listen(port, localMailEnabled() ? "127.0.0.1" : undefined, () => {
    console.log(`Server listening on http://localhost:${port}`);
    if (localMailEnabled()) console.log(`Development email outbox: ${outboxPath()}`);
});
