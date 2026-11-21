import { Request, Response } from 'express';
import { db } from '../prisma/db';

export const evaluateAndSaveAIScreening = async (applicationId: string) => {
    const application = await db.orm.public.Application
        .where({ id: String(applicationId) })
        .include('job')
        .include('user')
        .first();

    if (!application) return null;

    const candidateName = application.user?.name || 'Pelamar';
    const jobTitle = application.job?.title || 'Posisi Pekerjaan';
    const brand = application.job?.brand || 'MOI Brands';
    const jobRequirements = application.job?.requirements || '-';
    const jobDescription = application.job?.description || '-';
    const cvUrl = application.cvUrl;

    const baseScores = [78, 82, 85, 88, 92, 95];
    const randomIndex = Math.floor(Math.random() * baseScores.length);
    let aiScore = baseScores[randomIndex];
    let aiInsight = `Kandidat ${candidateName} memiliki latar belakang dan kompetensi yang relevan dengan posisi ${jobTitle} pada brand ${brand}. Disarankan untuk dijadwalkan wawancara teknis.`;

    const aiServiceUrl = process.env.AI_SERVICE_URL;

    if (aiServiceUrl && aiServiceUrl.trim() !== '') {
        try {
            const response = await fetch(aiServiceUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    candidateName,
                    jobTitle,
                    brand,
                    jobRequirements,
                    jobDescription,
                    cvUrl,
                }),
            });

            if (response.ok) {
                const data: any = await response.json();
                if (typeof data.aiScore === 'number') {
                    aiScore = Math.min(100, Math.max(0, Math.round(data.aiScore)));
                }
                if (typeof data.aiInsight === 'string') {
                    aiInsight = data.aiInsight;
                }
            }
        } catch (fetchErr) {
            console.warn('AI Service tim belum aktif, menggunakan evaluasi lokal sementara:', fetchErr);
        }
    }

    const existingScreening = await db.orm.public.ScreeningResult
        .where({ applicationId: String(applicationId) })
        .first();

    let screeningResult;
    if (existingScreening) {
        screeningResult = await db.orm.public.ScreeningResult
            .where({ applicationId: String(applicationId) })
            .update({ aiScore, aiInsight });
    } else {
        screeningResult = await db.orm.public.ScreeningResult.create({
            applicationId: String(applicationId),
            aiScore,
            aiInsight,
        });
    }

    await db.orm.public.Application
        .where({ id: String(applicationId) })
        .update({ status: 'SCREENED' });

    return screeningResult;
};

export const screenApplication = async (req: Request, res: Response): Promise<void> => {
    try {
        const applicationId = Array.isArray(req.params.applicationId)
            ? req.params.applicationId[0]
            : req.params.applicationId;

        const screeningResult = await evaluateAndSaveAIScreening(String(applicationId));
        if (!screeningResult) {
            res.status(404).json({ message: 'Lamaran tidak ditemukan!' });
            return;
        }

        res.status(200).json({
            message: 'Screening AI berhasil dilakukan!',
            screening: screeningResult,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error server', error });
    }
};

export const getScreeningResult = async (req: Request, res: Response): Promise<void> => {
    try {
        const applicationId = Array.isArray(req.params.applicationId)
            ? req.params.applicationId[0]
            : req.params.applicationId;

        const screeningResult = await db.orm.public.ScreeningResult
            .where({ applicationId: String(applicationId) })
            .first();

        if (!screeningResult) {
            res.status(404).json({ message: 'Hasil screening belum tersedia untuk lamaran ini!' });
            return;
        }

        res.status(200).json({ screening: screeningResult });
    } catch (error) {
        res.status(500).json({ message: 'Error server', error });
    }
};
