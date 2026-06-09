import mongoose, { Schema, Document } from 'mongoose';

export const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: { type: Number },
  gender: { type: String },
  conditions: [{ type: String }],
  allergies: [{ type: String }],
  notificationPreferences: { email: { type: Boolean, default: true }, push: { type: Boolean, default: false } }
}, { timestamps: true });

export const MedicineSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  medicineName: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  instructions: { type: String },
  verifiedMedicine: { type: Boolean, default: false }
}, { timestamps: true });

export const HealthMetricSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  glucose: { type: Number },
  bloodPressure: { type: String },
  weight: { type: Number },
  notes: { type: String },
  timestamp: { type: Date, default: Date.now }
});

export const NotificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const Medicine = mongoose.models.Medicine || mongoose.model('Medicine', MedicineSchema);
export const HealthMetric = mongoose.models.HealthMetric || mongoose.model('HealthMetric', HealthMetricSchema);
export const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);