import mongoose, { Document, Schema } from 'mongoose';

export interface IProviderMedia extends Document {
  providerEmail: string;
  photos: string[];
}

export interface IBooking extends Document {
  bookingId: string;
  providerEmail: string;
  providerName: string;
  providerCategory: string;
  providerPhoto?: string;
  customerEmail: string;
  customerName: string;
  date: string;
  time: string;
  status: string;
}

export interface IReview extends Document {
  reviewId: string;
  providerEmail: string;
  authorName: string;
  rating: number;
  text: string;
  image?: string;
}

const ProviderMediaSchema = new Schema<IProviderMedia>({
  providerEmail: { type: String, required: true, unique: true, index: true },
  photos: { type: [String], default: [] },
}, { timestamps: true });

const BookingSchema = new Schema<IBooking>({
  bookingId: { type: String, required: true, unique: true, index: true },
  providerEmail: { type: String, required: true, index: true },
  providerName: { type: String, required: true },
  providerCategory: { type: String, required: true },
  providerPhoto: String,
  customerEmail: { type: String, required: true, index: true },
  customerName: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, default: 'Requested' },
}, { timestamps: true });

const ReviewSchema = new Schema<IReview>({
  reviewId: { type: String, required: true, unique: true, index: true },
  providerEmail: { type: String, required: true, index: true },
  authorName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  text: { type: String, required: true },
  image: String,
}, { timestamps: true });

export const ProviderMedia = mongoose.models.ProviderMedia || mongoose.model<IProviderMedia>('ProviderMedia', ProviderMediaSchema);
export const Booking = mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);
export const Review = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
