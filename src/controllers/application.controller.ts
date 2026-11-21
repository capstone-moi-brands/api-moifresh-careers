import { Request, Response } from 'express';
import { db } from '../prisma/db';
import { evaluateAndSaveAIScreening } from './screening.controller';

export const applyJob = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Tidak terotentikasi. Silakan login terlebih dahulu.' });
            return;
        }

        const { jobId } = req.body;
        if (!jobId) {
            res.status(400).json({ message: 'Field jobId wajib disertakan!' });
            return;
        }

        let cvUrl = req.body.cvUrl;
        if (req.file) {
            cvUrl = `/uploads/cvs/${req.file.filename}`;
        }

        if (!cvUrl) {
            res.status(400).json({ message: 'CV wajib diunggah (file PDF) atau menyertakan cvUrl!' });
            return;
        }

        const job = await db.orm.public.Job.where({ id: String(jobId) }).first();
        if (!job) {
            res.status(404).json({ message: 'Lowongan pekerjaan tidak ditemukan!' });
            return;
        }

        if (job.status !== 'OPEN') {
            res.status(400).json({ message: 'Lowongan pekerjaan ini sudah ditutup!' });
            return;
        }

        const existingApplication = await db.orm.public.Application
            .where({ userId: String(userId), jobId: String(jobId) })
            .first();

        if (existingApplication) {
            res.status(400).json({ message: 'Anda sudah pernah mengajukan lamaran untuk lowongan ini!' });
            return;
        }

        const newApplication = await db.orm.public.Application.create({
            userId: String(userId),
            jobId: String(jobId),
            cvUrl: String(cvUrl),
            status: 'PENDING',
        });

        let screeningResult = null;
        try {
            screeningResult = await evaluateAndSaveAIScreening(newApplication.id);
        } catch (aiError) {
            console.error('Auto AI screening error:', aiError);
        }

        res.status(201).json({
            message: 'Lamaran pekerjaan berhasil dikirim dan otomatis di-screening oleh AI!',
            application: {
                ...newApplication,
                status: screeningResult ? 'SCREENED' : 'PENDING',
                screeningResult,
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Error server', error });
    }
};

export const getAllApplications = async (req: Request, res: Response): Promise<void> => {
    try {
        const { jobId, brand, status, minScore, search } = req.query;

        let query = db.orm.public.Application;

        if (jobId && typeof jobId === 'string') {
            query = query.where({ jobId });
        }

        if (status && typeof status === 'string' && ['PENDING', 'SCREENED', 'ACCEPTED', 'REJECTED'].includes(status)) {
            query = query.where({ status: status as 'PENDING' | 'SCREENED' | 'ACCEPTED' | 'REJECTED' });
        }

        let applications = await query
            .include('user')
            .include('job')
            .include('screeningResult')
            .orderBy((a) => a.createdAt.desc())
            .all();

        if (brand && typeof brand === 'string') {
            applications = applications.filter((app) =>
                app.job?.brand?.toLowerCase() === brand.toLowerCase()
            );
        }

        if (search && typeof search === 'string') {
            const s = search.toLowerCase();
            applications = applications.filter((app) =>
                app.user?.name?.toLowerCase().includes(s) ||
                app.user?.email?.toLowerCase().includes(s) ||
                app.job?.title?.toLowerCase().includes(s)
            );
        }

        if (minScore !== undefined) {
            const min = Number(minScore);
            if (!isNaN(min)) {
                applications = applications.filter((app) =>
                    app.screeningResult && app.screeningResult.aiScore >= min
                );
            }
        }

        res.status(200).json({
            message: 'Berhasil mengambil data pelamar untuk dashboard',
            total: applications.length,
            filters: { jobId, brand, status, minScore, search },
            applications,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error server', error });
    }
};

export const getMyApplications = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Tidak terotentikasi' });
            return;
        }

        const applications = await db.orm.public.Application
            .where({ userId: String(userId) })
            .include('job')
            .include('screeningResult')
            .orderBy((a) => a.createdAt.desc())
            .all();

        res.status(200).json({
            message: 'Berhasil mengambil riwayat lamaran saya',
            total: applications.length,
            applications,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error server', error });
    }
};

export const getApplicationsByJob = async (req: Request, res: Response): Promise<void> => {
    try {
        const jobId = Array.isArray(req.params.jobId) ? req.params.jobId[0] : req.params.jobId;

        const job = await db.orm.public.Job.where({ id: String(jobId) }).first();
        if (!job) {
            res.status(404).json({ message: 'Lowongan pekerjaan tidak ditemukan!' });
            return;
        }

        const applications = await db.orm.public.Application
            .where({ jobId: String(jobId) })
            .include('user')
            .include('screeningResult')
            .orderBy((a) => a.createdAt.desc())
            .all();

        res.status(200).json({
            message: 'Berhasil mengambil daftar pelamar pada lowongan ini',
            jobTitle: job.title,
            brand: job.brand,
            total: applications.length,
            applications,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error server', error });
    }
};

export const getApplicationById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const currentUserId = req.user?.id;
        const currentUserRole = req.user?.role;

        const application = await db.orm.public.Application
            .where({ id: String(id) })
            .include('user')
            .include('job')
            .include('screeningResult')
            .first();

        if (!application) {
            res.status(404).json({ message: 'Lamaran tidak ditemukan!' });
            return;
        }

        if (currentUserRole !== 'HR' && application.userId !== currentUserId) {
            res.status(403).json({ message: 'Akses ditolak! Anda tidak memiliki akses ke lamaran ini.' });
            return;
        }

        res.status(200).json({ application });
    } catch (error) {
        res.status(500).json({ message: 'Error server', error });
    }
};

export const updateApplicationStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { status } = req.body;

        const allowedStatuses = ['PENDING', 'SCREENED', 'ACCEPTED', 'REJECTED'];
        if (!status || !allowedStatuses.includes(status)) {
            res.status(400).json({
                message: `Status tidak valid! Pilihan: ${allowedStatuses.join(', ')}`,
            });
            return;
        }

        const existingApplication = await db.orm.public.Application
            .where({ id: String(id) })
            .first();

        if (!existingApplication) {
            res.status(404).json({ message: 'Lamaran tidak ditemukan!' });
            return;
        }

        const updatedApplication = await db.orm.public.Application
            .where({ id: String(id) })
            .update({ status: status as 'PENDING' | 'SCREENED' | 'ACCEPTED' | 'REJECTED' });

        res.status(200).json({
            message: `Status lamaran berhasil diubah menjadi ${status}!`,
            application: updatedApplication,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error server', error });
    }
};
