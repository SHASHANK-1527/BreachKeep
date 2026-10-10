import mongoose from 'mongoose'

// Single-document collection holding admin-controlled access flags.
const accessConfigSchema = new mongoose.Schema({
  _id: { type: String, default: 'singleton' },
  commonCodeEnabled: { type: Boolean, default: true },
  dailyCodeEnabled: { type: Boolean, default: false },
  rosterGateEnabled: { type: Boolean, default: true },
  // Kill switch. When true every student-facing API route answers 503 and both
  // web bundles render the maintenance page. Admin routes stay reachable.
  maintenance: { type: Boolean, default: false },
  maintenanceMessage: { type: String, default: '' },
  maintenanceEta: { type: String, default: '' },
  // Capstone target box: armed by the Warden on the day. When true the
  // dungeon page shows the story + connect instructions + flag box.
  capstoneArmed: { type: Boolean, default: false },
  capstoneTargetHost: { type: String, default: '' },
  // Testing tools (Warden panel): when on, admin test actions are allowed
  // and the panel shows the Testing tab (skip/restart intro, reset a dungeon).
  testingEnabled: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now },
})

accessConfigSchema.statics.get = async function () {
  let doc = await this.findById('singleton')
  if (!doc) doc = await this.create({ _id: 'singleton' })
  return doc
}

export default mongoose.model('AccessConfig', accessConfigSchema)
