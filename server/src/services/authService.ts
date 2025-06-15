import bycrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User  from '../models/User';
import { RegisterRequest, LoginRequest, AuthResponse } from '../types/auth';

export const register = async (data: RegisterRequest): Promise<AuthResponse> => {
  const { email, password, name } = data;

  // Check if user already exists
  const existingUser = await User.findOne({where: { email }});
    if (existingUser) {
        throw new Error('Email already exists');
    }

    // Hash the password
    const hashedPassword = await bycrypt.hash(password, 10);

    // Create a new user
    const user = await User.create({
        email,
        password: hashedPassword,
        name
    });

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
        expiresIn: '1d',
    });

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name
        }
    };
};

export const login = async (data: LoginRequest): Promise<AuthResponse> => {
    const { email, password } = data;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
    throw new Error('Invalid email or password');
    }

    // Check password
    const isPasswordValid = await bycrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
        expiresIn: '1d',
    });

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name
        },
    };
};


