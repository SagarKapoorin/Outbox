import mongoose, { Schema } from 'mongoose';

export interface EmailDoc extends mongoose.Document {
  id: string; 
  accountId: string;
  folder: string;
  messageId: string;
  uid: number;
  subject?: string;
  from?: string;
  to?: string;
  date?: Date;
  text?: string;
  html?: string;
  labels: string[]; 
  createdAt: Date;
  updatedAt: Date;
}

const EmailSchema = new Schema<EmailDoc>(
  {
    id: { type: String, required: true, index: true, unique: true },
    accountId: { type: String, required: true, index: true },
    folder: { type: String, required: true, index: true },
    messageId: { type: String, required: true, index: true },
    uid: { type: Number, required: true },
    subject: String,
    from: String,
    to: String,
    date: Date,
    text: String,
    html: String,
    labels: { type: [String], default: [] }
  },
  { timestamps: true }
);

export const EmailModel = mongoose.model<EmailDoc>('Email', EmailSchema);

