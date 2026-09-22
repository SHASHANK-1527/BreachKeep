import mongoose from 'mongoose'

const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roomId: { type: String, required: true },
  solvedAt: { type: Date, default: Date.now },
})
progressSchema.index({ userId: 1, roomId: 1 }, { unique: true })

export default mongoose.model('Progress', progressSchema)
