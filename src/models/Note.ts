import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const NoteSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, default: "Untitled" },
    // BlockNote document (array of blocks) stored as-is.
    content: { type: Schema.Types.Mixed, default: [] },
    tags: { type: [String], default: [] },
    folder: { type: String, default: "", index: true },
    shared: { type: Boolean, default: false },
    shareId: { type: String, default: "", index: true },
  },
  { timestamps: true, minimize: false }
);

export type NoteDoc = InferSchemaType<typeof NoteSchema>;
export const Note: Model<NoteDoc> = models.Note || model("Note", NoteSchema);
