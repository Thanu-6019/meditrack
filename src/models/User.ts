// ============================================================
// FILE: src/models/User.ts
// DESCRIPTION: Mongoose User model for MediTrack
// COLLECTION: users
// ============================================================

import mongoose, { Schema, model, Document, Model, HydratedDocument } from 'mongoose';
import bcrypt from 'bcryptjs';

// ─────────────────────────────────────────────
// 1. RAW DOCUMENT INTERFACE (data stored in DB)
// ─────────────────────────────────────────────
export interface IUser {
  fullName: string;
  email: string;
  password: string;
  isActive: boolean;
  lastLogin: Date | null;
  phone?: string;
  dateOfBirth?: Date;
  createdAt?: Date;   // added by timestamps
  updatedAt?: Date;   // added by timestamps
}

// ─────────────────────────────────────────────
// 2. INSTANCE METHODS INTERFACE
// ─────────────────────────────────────────────
export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// ─────────────────────────────────────────────
// 3. STATIC METHODS INTERFACE (extend Model)
// ─────────────────────────────────────────────
export interface IUserModel extends Model<IUser, object, IUserMethods> {
  findByEmail(email: string): Promise<HydratedDocument<IUser, IUserMethods> | null>;
}

// ─────────────────────────────────────────────
// 4. HYDRATED DOCUMENT TYPE (returned by DB)
// ─────────────────────────────────────────────
export type UserDocument = HydratedDocument<IUser, IUserMethods>;

// ─────────────────────────────────────────────
// 5. SCHEMA DEFINITION
// ─────────────────────────────────────────────
const UserSchema = new Schema<IUser, IUserModel, IUserMethods>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/,
        'Please provide a valid email address',
      ],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never returned in queries unless explicitly selected
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    phone: {
      type: String,
      trim: true,
      match: [
        /^[+]?[\d\s\-().]{7,20}$/,
        'Please provide a valid phone number',
      ],
      default: undefined,
    },

    dateOfBirth: {
      type: Date,
      default: undefined,
    },
  },
  {
    // ─── Schema Options ─────────────────────
    timestamps: true,           // adds createdAt + updatedAt automatically
    collection: 'users',        // explicit collection name
    versionKey: false,          // disable __v field
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete (ret as Partial<IUser>).password;     // never expose password in JSON responses
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete (ret as Partial<IUser>).password;
        return ret;
      },
    },
  }
);

// ─────────────────────────────────────────────
// 6. INDEXES
// ─────────────────────────────────────────────

// Primary lookup: find user by email (unique enforced + fast read)
UserSchema.index({ email: 1 }, { unique: true, name: 'idx_users_email_unique' });

// Dashboard / admin: filter active users sorted by registration date
UserSchema.index({ isActive: 1, createdAt: -1 }, { name: 'idx_users_active_created' });

// Session/token refresh: look up by active status + lastLogin
UserSchema.index({ lastLogin: -1 }, { name: 'idx_users_lastLogin' });

// ─────────────────────────────────────────────
// 7. PRE-SAVE MIDDLEWARE — Hash password
// ─────────────────────────────────────────────
UserSchema.pre('save', async function (next) {
  // Only hash when password field is new or modified
  if (!this.isModified('password')) return next();

  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    return next();
  } catch (err) {
    return next(err as Error);
  }
});

// ─────────────────────────────────────────────
// 8. INSTANCE METHODS
// ─────────────────────────────────────────────

/**
 * comparePassword
 * Compare a plain-text password against the stored bcrypt hash.
 * Used during login. Requires password field to be explicitly selected.
 */
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─────────────────────────────────────────────
// 9. STATIC METHODS
// ─────────────────────────────────────────────

/**
 * findByEmail
 * Find an active user by email. Selects password field for auth flows.
 */
UserSchema.statics.findByEmail = function (
  email: string
): Promise<HydratedDocument<IUser, IUserMethods> | null> {
  return this.findOne({ email: email.toLowerCase().trim() })
    .select('+password')
    .exec();
};

// ─────────────────────────────────────────────
// 10. VIRTUAL FIELDS
// ─────────────────────────────────────────────

/**
 * Virtual: age
 * Calculates user age in years from dateOfBirth.
 */
UserSchema.virtual('age').get(function (this: HydratedDocument<IUser>) {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
});

// ─────────────────────────────────────────────
// 11. EXPORT MODEL (hot-reload safe for Next.js)
// ─────────────────────────────────────────────
const User =
  (mongoose.models.User as IUserModel) ||
  model<IUser, IUserModel>('User', UserSchema);

export default User;