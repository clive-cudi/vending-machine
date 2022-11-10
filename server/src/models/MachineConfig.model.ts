import mongoose, { Schema } from "mongoose";
import { ItemSchema } from "./Item.model";

export const MachineConfigSchema = new Schema({
    denominations: [Number],
    currency: String,
    items: [ItemSchema],
    cashRegister: {
        amount: Number,
        currency: String
    },
    stamp: String
}, {
    timestamps: true
});

export const MachineConfig = mongoose.model("MachineConfig", MachineConfigSchema);