import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback extends Document {
  id: string;
  source: string;
  type: string;
  timestamp: Date;
  sentiment: string;
  rating?: number;
  content: string;
  metadata: Record<string, any>;
  tags: string[];
  senso_context_id?: string;
  created_at: Date;
  updated_at: Date;
}

const FeedbackSchema = new Schema<IFeedback>({
  id: { type: String, required: true, unique: true },
  source: { type: String, required: true, index: true },
  type: { type: String, required: true },
  timestamp: { type: Date, required: true, index: true },
  sentiment: { type: String, enum: ['positive', 'negative', 'neutral', 'mixed'], index: true },
  rating: { type: Number, min: 1, max: 5 },
  content: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed, default: {} },
  tags: [{ type: String }],
  senso_context_id: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Compound indexes for efficient queries
FeedbackSchema.index({ source: 1, timestamp: -1 });
FeedbackSchema.index({ sentiment: 1, timestamp: -1 });
FeedbackSchema.index({ tags: 1 });

export const Feedback = mongoose.model<IFeedback>('Feedback', FeedbackSchema);