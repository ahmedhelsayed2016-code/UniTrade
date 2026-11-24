import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const studentSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    username: { type: String, required: true, trim: true, unique: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    password: { type: String, required: true, minlength: 8, select: false },
    birthDate: { type: Date, required: true },
    university: { type: String, required: true, trim: true },
    otherUniversity: {
        type: String,
        trim: true,
        required() {
            return this.university?.toLowerCase() === "other";
        }
    },
    major: { type: String, required: true, trim: true },
    gender: { type: String, required: true, trim: true }
}, { timestamps: true });

studentSchema.pre("save", async function () {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 12);
    }
});

studentSchema.methods.matchPassword = function (password) {
    return bcrypt.compare(password, this.password);
};

export default mongoose.model("Student", studentSchema);
