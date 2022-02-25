import mongoose, {Schema, model} from "mongoose";

const Album = new Schema({
    id: {type: Number, required: true},
    title: { type: String, required: true },
    owner: { type: Schema.Types.ObjectId, ref:"User"},
    // favorite_products: [{ type: Schema.Types.ObjectId, ref: "UserProductFavorite" }],
});

export default model("Album", Album);


