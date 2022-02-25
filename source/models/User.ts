import mongoose, {Schema, model} from "mongoose";

const User = new Schema({
    login: { type: String, required: true },
    email: { type: String, required: true},
    password: { type: String, required: true },
    registerDate: { type: Date, required: true}
    // favorite_products: [{ type: Schema.Types.ObjectId, ref: "UserProductFavorite" }],
});

export default  model("User", User);