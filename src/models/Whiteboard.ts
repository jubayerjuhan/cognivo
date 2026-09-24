import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

// One whiteboard per user (single-user workspace).
const WhiteboardSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    elements: { type: [Schema.Types.Mixed], default: [] },
    // Embedded images from Excalidraw (fileId -> BinaryFileData)
    files: { type: Schema.Types.Mixed, default: {} },
    lastEditedBy: { type: String, default: "" },
    // Identifies which browser tab performed the last save, so polling can ignore its own saves.
    lastClientId: { type: String, default: "" },
  },
  { timestamps: true, minimize: false }
);

export type WhiteboardDoc = InferSchemaType<typeof WhiteboardSchema>;
export const Whiteboard: Model<WhiteboardDoc> =
  models.Whiteboard || model("Whiteboard", WhiteboardSchema);
