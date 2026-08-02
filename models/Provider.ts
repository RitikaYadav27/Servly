import mongoose, { Schema, Document } from 'mongoose';

export interface IProvider extends Document {
  userEmail: string;
  category: string;
  experience: string;
  hourlyRate: string;
  bio: string;
  phone: string;
  city: string;
  servicesOffered: string[];
  status: 'active' | 'pending' | 'paused';
  createdAt: Date;
  updatedAt: Date;
}

const ProviderSchema: Schema = new Schema(
  {
    userEmail: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    experience: { type: String, required: true },
    hourlyRate: { type: String, required: true },
    bio: { type: String, default: '' },
    phone: { type: String, required: true },
    city: { type: String, required: true },
    servicesOffered: { type: [String], default: [] },
    status: { type: String, enum: ['active', 'pending', 'paused'], default: 'active' },
  },
  { timestamps: true }
);

export default mongoose.models.Provider || mongoose.model<IProvider>('Provider', ProviderSchema);
