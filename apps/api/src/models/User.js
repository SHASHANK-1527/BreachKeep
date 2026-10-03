import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },              // bcrypt hash; absent for pure-Google accounts
    googleId: { type: String, sparse: true },
    avatar: { type: String, default: null },

    verified: { type: Boolean, default: false },
    verificationCode: { type: String },
    verificationExpires: { type: Date },

    // daily access code (generated at midnight IST, emailed, typed on landing)
    sessionCode: { type: String },
    sessionCodeExpires: { type: Date },
    lastSessionDate: { type: String },
    verifiedToday: { type: Boolean, default: false },

    // password reset
    resetToken: { type: String },
    resetTokenExpires: { type: Date },

    // course progression
    house: {
      type: String,
      enum: ['rimeguard', 'emberkeep', 'arcweave', 'voltgrid', null],
      default: null,
    },
    introComplete: { type: Boolean, default: false },
    introRooms: { type: [String], default: [] },
    sorted: { type: Boolean, default: false },

    role: { type: String, enum: ['student', 'admin'], default: 'student' },

    // Per-account testing rights. When the Warden has testing enabled globally
    // AND this flag is on, the account sees the floating test panel (lower-right)
    // in production, exactly like VITE_TEST_MODE did during local development.
    testingRights: { type: Boolean, default: false },

    // login throttling
    failedLogins: { type: Number, default: 0 },
    lockUntil: { type: Date },
  },
  { timestamps: true }
)

// The ONLY shape ever sent to a client. Never leak hashes/codes/tokens.
userSchema.methods.safe = function () {
  return {
    id: this._id.toString(),
    username: this.username,
    email: this.email,
    avatar: this.avatar,
    house: this.house,
    sorted: this.sorted,
    introComplete: this.introComplete,
    role: this.role,
  }
}

export default mongoose.model('User', userSchema)
