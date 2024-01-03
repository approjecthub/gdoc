import { Schema, model } from "mongoose";

const gDocument = new Schema({
  _id: String,
  data: Object,
});

export default model("gDocument", gDocument);
