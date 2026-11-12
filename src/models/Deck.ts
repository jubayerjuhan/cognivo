import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

// A saved set of flashcards (usually generated from one note) with Leitner
// spaced-repetition state per card: box 0..5, dueAt = next review time.
const DeckSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    noteId: { type: String, default: "" },
    title: { type: String, required: true },
    cards: { type: Schema.Types.Mixed, default: [] },
  },
  { timestamps: true, minimize: false }
);

export type DeckDoc = InferSchemaType<typeof DeckSchema>;
export const Deck: Model<DeckDoc> = models.Deck || model("Deck", DeckSchema);
