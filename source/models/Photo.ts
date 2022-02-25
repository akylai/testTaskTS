import mongoose, {Schema, model} from "mongoose";

const Photo = new Schema({
    albumId: { type: Number},
    title: { type: String, required: true},
    url: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    owner: { type: Schema.Types.ObjectId, ref:"User"}
});

export default model("Photo", Photo);