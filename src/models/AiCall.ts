import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

// One row per AI request; the dashboard counts these.
const AiCallSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    kind: { type: String, enum: ["summarize", "quiz", "ask"], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export type AiCallDoc = InferSchemaType<typeof AiCallSchema>;
export const AiCall: Model<AiCallDoc> = models.AiCall || model("AiCall", AiCallSchema);
