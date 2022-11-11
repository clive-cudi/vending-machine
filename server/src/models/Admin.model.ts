import mongoose, { Schema } from "mongoose";

export const AdminSchema = new Schema({
    uid: String,
    username: String,
    password: String,
    accessToken: String
});

export const Admin = mongoose.model("Admin", AdminSchema);