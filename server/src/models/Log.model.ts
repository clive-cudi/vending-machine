import mongoose, { Schema } from "mongoose";

export const LogSchema = new Schema({
    action: String,
    amount: Number,
    timestamp: String
}, {
    timestamps: true
});

export const Log = mongoose.model("Log", LogSchema);