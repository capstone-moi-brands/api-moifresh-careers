import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                role: string;
            };
        }
    }
}

export interface AuthPayload {
    id: string;
    role: string;
}

export interface AuthRequest extends Request {
    user?: AuthPayload;
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ message: 'Akses ditolak! Token autentikasi tidak ditemukan.' });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as AuthPayload;
        req.user = decoded;
        next();
    } catch (error) {
        res.status(403).json({ message: 'Token tidak valid atau sudah kedaluwarsa!' });
        return;
    }
};

export const authorizeRoles = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ message: 'Tidak terotentikasi. Silakan login terlebih dahulu.' });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                message: `Akses ditolak! Fitur ini hanya untuk role: ${allowedRoles.join(', ')}`,
            });
            return;


        }

        next();
    };
};
