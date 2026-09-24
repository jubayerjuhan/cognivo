import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

// PDFs are stored directly in MongoDB (Vercel has no persistent disk).
// Uploads are capped at ~4MB by the API, well below the 16MB document limit.
const AttachmentSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    noteId: { type: Schema.Types.ObjectId, ref: "Note", required: true, index: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, default: "application/pdf" },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true, select: false },
    text: { type: String, default: "", select: false },
    pages: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type AttachmentDoc = InferSchemaType<typeof AttachmentSchema>;
export const Attachment: Model<AttachmentDoc> =
  models.Attachment || model("Attachment", AttachmentSchema);
