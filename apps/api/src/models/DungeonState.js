import mongoose from 'mongoose'

const dungeonStateSchema = new mongoose.Schema({
  dungeonId: { type: String, required: true, unique: true },
  live: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now },
})

export default mongoose.model('DungeonState', dungeonStateSchema)
