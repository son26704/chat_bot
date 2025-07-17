// server/src/models/UserProfile.ts
import mongoose from 'mongoose';

const UserProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} }, // chứa JSON tuỳ ý
});

const UserProfile = mongoose.model('UserProfile', UserProfileSchema);
export default UserProfile;
