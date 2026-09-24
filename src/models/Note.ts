import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const NoteSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, default: "Untitled" },
    // BlockNote document (array of blocks) stored as-is.
    content: { type: Schema.Types.Mixed, default: [] },
  },
  { timestamps: true, minimize: false }
);

export type NoteDoc = InferSchemaType<typeof NoteSchema>;
export const Note: Model<NoteDoc> = models.Note || model("Note", NoteSchema);
