import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  city?: string;
  bio?: string;
  isProvider: boolean;
  completedOrders: number;
  rating: number;
  safetyScore: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    photoURL: { type: String },
    phone: { type: String, default: '' },
    city: { type: String, default: 'Indiranagar, Bengaluru' },
    bio: { type: String, default: '' },
    isProvider: { type: Boolean, default: false },
    completedOrders: { type: Number, default: 0 },
    rating: { type: Number, default: 5.0 },
    safetyScore: { type: String, default: '100%' },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
