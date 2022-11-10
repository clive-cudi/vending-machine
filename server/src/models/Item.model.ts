import mongoose, { Schema } from "mongoose";

export const ItemSchema = new Schema({
    id: String,
    type: String,
    quantity: Number,
    priceTag: {
        price: Number,
        currency: String
    }
}, {
    timestamps: true
});

export const Item = mongoose.model("Item", ItemSchema);