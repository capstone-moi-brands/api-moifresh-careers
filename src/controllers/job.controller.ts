import { Request, Response } from 'express';
import { db } from '../prisma/db';

export const getAllJobs = async (req: Request, res: Response): Promise<void> => {
    try {
        const { brand, status, search } = req.query;

        let query = db.orm.public.Job;

        if (status && (status === 'OPEN' || status === 'CLOSED')) {
            query = query.where({ status: status as 'OPEN' | 'CLOSED' });
        }

        if (brand && typeof brand === 'string') {
            query = query.where({ brand: brand as string });
        }

        if (search && typeof search === 'string') {
            query = query.where((j) => j.title.ilike(`%${search}%`));
        }

        const jobs = await query.orderBy((j) => j.createdAt.desc()).all();

        res.status(200).json({
            message: 'Berhasil mengambil daftar lowongan',
            total: jobs.length,
            jobs,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error server', error });
    }
};

export const getJobById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

        const job = await db.orm.public.Job.where({ id: id as string }).first();
        if (!job) {
            res.status(404).json({ message: 'Lowongan pekerjaan tidak ditemukan!' });
            return;
        }

        res.status(200).json({ job });
    } catch (error) {
        res.status(500).json({ message: 'Error server', error });
    }
};

export const createJob = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, description, requirements, brand } = req.body;

        if (!title || !description || !requirements || !brand) {
            res.status(400).json({ message: 'Field title, description, requirements, dan brand wajib diisi!' });
            return;
        }

        const newJob = await db.orm.public.Job.create({
            title: String(title),
            description: String(description),
            requirements: String(requirements),
            brand: String(brand),
            status: 'OPEN',
        });

        res.status(201).json({
            message: 'Lowongan pekerjaan berhasil dibuat!',
            job: newJob,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error server', error });
    }
};

export const updateJob = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { title, description, requirements, brand, status } = req.body;

        const existingJob = await db.orm.public.Job.where({ id: id as string }).first();
        if (!existingJob) {
            res.status(404).json({ message: 'Lowongan pekerjaan tidak ditemukan!' });
            return;
        }

        const updateData: {
            title?: string;
            description?: string;
            requirements?: string;
            brand?: string;
            status?: 'OPEN' | 'CLOSED';
        } = {};

        if (title !== undefined) updateData.title = String(title);
        if (description !== undefined) updateData.description = String(description);
        if (requirements !== undefined) updateData.requirements = String(requirements);
        if (brand !== undefined) updateData.brand = String(brand);
        if (status !== undefined && (status === 'OPEN' || status === 'CLOSED')) {
            updateData.status = status;
        }

        const updatedJob = await db.orm.public.Job.where({ id: id as string }).update(updateData);

        res.status(200).json({
            message: 'Lowongan pekerjaan berhasil diperbarui!',
            job: updatedJob,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error server', error });
    }
};

export const updateJobStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { status } = req.body;

        if (!status || (status !== 'OPEN' && status !== 'CLOSED')) {
            res.status(400).json({ message: 'Status harus bernilai OPEN atau CLOSED!' });
            return;
        }

        const existingJob = await db.orm.public.Job.where({ id: id as string }).first();
        if (!existingJob) {
            res.status(404).json({ message: 'Lowongan pekerjaan tidak ditemukan!' });
            return;
        }

        const updatedJob = await db.orm.public.Job.where({ id: id as string }).update({ status });

        res.status(200).json({
            message: `Status lowongan berhasil diubah menjadi ${status}!`,
            job: updatedJob,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error server', error });
    }
};

export const deleteJob = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

        const existingJob = await db.orm.public.Job.where({ id: id as string }).first();
        if (!existingJob) {
            res.status(404).json({ message: 'Lowongan pekerjaan tidak ditemukan!' });
            return;
        }

        await db.orm.public.Job.where({ id: id as string }).delete();

        res.status(200).json({ message: 'Lowongan pekerjaan berhasil dihapus!' });
    } catch (error) {
        res.status(500).json({ message: 'Error server', error });
    }
};
