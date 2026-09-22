import mongoose from 'mongoose'

const rosterSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  addedAt: { type: Date, default: Date.now },
})

export default mongoose.model('Roster', rosterSchema)
