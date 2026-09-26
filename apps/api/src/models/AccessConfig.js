import mongoose from 'mongoose'

// Single-document collection holding admin-controlled access flags.
const accessConfigSchema = new mongoose.Schema({
  _id: { type: String, default: 'singleton' },
  commonCodeEnabled: { type: Boolean, default: true },
  rosterGateEnabled: { type: Boolean, default: true },
  // Kill switch. When true every student-facing API route answers 503 and both
  // web bundles render the maintenance page. Admin routes stay reachable.
  maintenance: { type: Boolean, default: false },
  maintenanceMessage: { type: String, default: '' },
  maintenanceEta: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now },
})

accessConfigSchema.statics.get = async function () {
  let doc = await this.findById('singleton')
  if (!doc) doc = await this.create({ _id: 'singleton' })
  return doc
}

export default mongoose.model('AccessConfig', accessConfigSchema)
