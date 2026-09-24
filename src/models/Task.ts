import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const TaskSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    dueDate: { type: Date, default: null },
    completed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type TaskDoc = InferSchemaType<typeof TaskSchema>;
export const Task: Model<TaskDoc> = models.Task || model("Task", TaskSchema);
