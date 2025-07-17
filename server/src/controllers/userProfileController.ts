// server/src/controllers/userProfileController.ts
import { Request, Response } from 'express';
import UserProfile from '../models/UserProfile';
import { AuthenticatedRequest } from '../types/auth';

export const getUserProfileController = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });

  let profile = await UserProfile.findOne({ userId });
  if (!profile) {
    profile = await UserProfile.create({ userId, data: {} });
  }

  res.json(profile.data);
};

export const updateUserProfileController = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });

  const newData = req.body;

  // Validate: tất cả value phải là array of string
  const invalid = Object.entries(newData).some(
  ([_, value]) => typeof value !== 'string'
);

  if (invalid) {
    return res.status(400).json({ message: 'Tất cả giá trị phải là mảng các chuỗi.' });
  }

  const profile = await UserProfile.findOneAndUpdate(
    { userId },
    { data: newData },
    { upsert: true, new: true }
  );

  res.json(profile.data);
};
