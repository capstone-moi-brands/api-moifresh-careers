import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../prisma/db';

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password, role } = req.body;

        const existingUser = await db.orm.public.User.where({ email }).first();
        if (existingUser) {
            res.status(400).json({ message: 'Email sudah terdaftar!' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await db.orm.public.User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'APPLICANT',
        });

        res.status(201).json({ message: 'Register berhasil!', userId: newUser.id });
    } catch (error) {
        res.status(500).json({ message: 'Error server', error });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        const user = await db.orm.public.User.where({ email }).first();
        if (!user) {
            res.status(404).json({ message: 'User tidak ditemukan!' });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ message: 'Password salah!' });
            return;
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: 'Login sukses!',
            token,
            user: { id: user.id, name: user.name, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error server', error });
    }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Tidak terotentikasi' });
            return;
        }

        const user = await db.orm.public.User.where({ id: userId }).first();
        if (!user) {
            res.status(404).json({ message: 'User tidak ditemukan' });
            return;
        }

        res.status(200).json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Error server', error });
    }
};
