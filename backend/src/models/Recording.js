import mongoose from 'mongoose';

const recordingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  originalFilename: {
    type: String,
    required: true
  },
  storagePath: {
    type: String,
    required: true,
    select: false
  },
  durationSeconds: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'analyzed', 'failed'],
    default: 'uploaded'
  },
  failureReason: {
    type: String,
    default: null
  },
  fluencyResult: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  confidenceResult: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  analyzedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

recordingSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.storagePath;
    delete ret.__v;
    return ret;
  }
});

const Recording = mongoose.model('Recording', recordingSchema);

export default Recording;
