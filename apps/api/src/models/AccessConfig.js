import mongoose from 'mongoose'

// Single-document collection holding admin-controlled access flags.
const accessConfigSchema = new mongoose.Schema({
  _id: { type: String, default: 'singleton' },
  commonCodeEnabled: { type: Boolean, default: true },
  rosterGateEnabled: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now },
})

accessConfigSchema.statics.get = async function () {
  let doc = await this.findById('singleton')
  if (!doc) doc = await this.create({ _id: 'singleton' })
  return doc
}

export default mongoose.model('AccessConfig', accessConfigSchema)
