import { Application, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'MOI Brands Careers API',
    version: '1.0.0',
    description:
      'Dokumentasi lengkap REST API untuk Job Portal & Recruitment System MOI Brands. Dilengkapi dengan otentikasi JWT, manajemen lowongan, pelamaran kerja (upload CV), dan evaluasi AI Screening.',
    contact: {
      name: 'MOI Brands Tech Team',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Masukkan JWT Token dengan format: Bearer <token>',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', format: 'email', example: 'johndoe@moibrands.com' },
          role: { type: 'string', enum: ['HR', 'APPLICANT'], example: 'APPLICANT' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Job: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174001' },
          title: { type: 'string', example: 'Social Media Specialist' },
          description: { type: 'string', example: 'Bertanggung jawab mengelola strategi konten sosial media.' },
          requirements: { type: 'string', example: 'Pengalaman min. 1 tahun di digital marketing.' },
          brand: { type: 'string', example: 'MOI Fresh' },
          status: { type: 'string', enum: ['OPEN', 'CLOSED'], example: 'OPEN' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Application: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174002' },
          userId: { type: 'string', format: 'uuid' },
          jobId: { type: 'string', format: 'uuid' },
          cvUrl: { type: 'string', example: '/uploads/cvs/cv-1712345678.pdf' },
          status: {
            type: 'string',
            enum: ['PENDING', 'SCREENED', 'ACCEPTED', 'REJECTED'],
            example: 'PENDING',
          },
          createdAt: { type: 'string', format: 'date-time' },
          user: { $ref: '#/components/schemas/User' },
          job: { $ref: '#/components/schemas/Job' },
          screeningResult: { $ref: '#/components/schemas/ScreeningResult' },
        },
      },
      ScreeningResult: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          applicationId: { type: 'string', format: 'uuid' },
          aiScore: { type: 'integer', minimum: 0, maximum: 100, example: 88 },
          aiInsight: {
            type: 'string',
            example:
              'Kandidat John Doe memiliki latar belakang yang sangat relevan. Disarankan untuk dijadwalkan wawancara.',
          },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', example: 'Budi Santoso' },
          email: { type: 'string', format: 'email', example: 'budi@example.com' },
          password: { type: 'string', format: 'password', example: 'Secret123!' },
          role: { type: 'string', enum: ['HR', 'APPLICANT'], default: 'APPLICANT', example: 'APPLICANT' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'budi@example.com' },
          password: { type: 'string', format: 'password', example: 'Secret123!' },
        },
      },
      CreateJobRequest: {
        type: 'object',
        required: ['title', 'description', 'requirements', 'brand'],
        properties: {
          title: { type: 'string', example: 'Barista & Store Crew' },
          description: { type: 'string', example: 'Melayani customer dan meracik minuman sesuai standar.' },
          requirements: { type: 'string', example: 'Pria/Wanita max 25 tahun, ramah dan disiplin.' },
          brand: { type: 'string', example: 'MOI Fresh' },
        },
      },
      UpdateJobRequest: {
        type: 'object',
        properties: {
          title: { type: 'string', example: 'Senior Barista' },
          description: { type: 'string' },
          requirements: { type: 'string' },
          brand: { type: 'string' },
          status: { type: 'string', enum: ['OPEN', 'CLOSED'] },
        },
      },
      UpdateJobStatusRequest: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['OPEN', 'CLOSED'], example: 'CLOSED' },
        },
      },
      UpdateApplicationStatusRequest: {
        type: 'object',
        required: ['status'],
        properties: {
          status: {
            type: 'string',
            enum: ['PENDING', 'SCREENED', 'ACCEPTED', 'REJECTED'],
            example: 'ACCEPTED',
          },
        },
      },
      MessageResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Operasi berhasil.' },
        },
      },
    },
  },
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Registrasi Pengguna Baru',
        description: 'Mendaftarkan akun baru sebagai Pelamar (APPLICANT) atau HR.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Registrasi berhasil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Register berhasil!' },
                    userId: { type: 'string', format: 'uuid' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Email sudah terdaftar',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
              },
            },
          },
          '500': {
            description: 'Kesalahan internal server',
          },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login Akun',
        description: 'Login menggunakan email dan password untuk mendapatkan token JWT.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login berhasil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Login sukses!' },
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        role: { type: 'string', enum: ['HR', 'APPLICANT'] },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Password salah',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
              },
            },
          },
          '404': {
            description: 'User tidak ditemukan',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
              },
            },
          },
        },
      },
    },
    '/api/auth/user': {
      get: {
        tags: ['Authentication'],
        summary: 'Mendapatkan Data Profil Pengguna Login',
        description: 'Mengambil data profil pengguna yang sedang login berdasarkan JWT token.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Data profil ditemukan',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Token tidak valid atau tidak disertakan',
          },
          '404': {
            description: 'User tidak ditemukan',
          },
        },
      },
    },
    '/api/jobs': {
      get: {
        tags: ['Jobs'],
        summary: 'Mendapatkan Daftar Lowongan Pekerjaan',
        description: 'Endpoint publik untuk melihat daftar lowongan kerja dengan opsi filter status, brand, dan pencarian kata kunci.',
        parameters: [
          {
            name: 'brand',
            in: 'query',
            description: 'Filter berdasarkan nama brand (contoh: MOI Fresh)',
            schema: { type: 'string' },
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filter berdasarkan status lowongan',
            schema: { type: 'string', enum: ['OPEN', 'CLOSED'] },
          },
          {
            name: 'search',
            in: 'query',
            description: 'Pencarian kata kunci pada judul lowongan',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Daftar lowongan pekerjaan',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    total: { type: 'integer', example: 5 },
                    jobs: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Job' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Jobs'],
        summary: 'Membuat Lowongan Pekerjaan Baru (Khusus HR)',
        description: 'Hanya dapat diakses oleh user dengan role HR.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateJobRequest' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Lowongan pekerjaan berhasil dibuat',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    job: { $ref: '#/components/schemas/Job' },
                  },
                },
              },
            },
          },
          '400': { description: 'Field wajib tidak lengkap' },
          '401': { description: 'Tidak terotentikasi' },
          '403': { description: 'Akses ditolak (Bukan role HR)' },
        },
      },
    },
    '/api/jobs/{id}': {
      get: {
        tags: ['Jobs'],
        summary: 'Detail Lowongan Pekerjaan',
        description: 'Endpoint publik untuk melihat detail suatu lowongan berdasarkan ID.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID Lowongan Pekerjaan (UUID)',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Detail lowongan pekerjaan',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    job: { $ref: '#/components/schemas/Job' },
                  },
                },
              },
            },
          },
          '404': { description: 'Lowongan tidak ditemukan' },
        },
      },
      put: {
        tags: ['Jobs'],
        summary: 'Memperbarui Data Lowongan Pekerjaan (Khusus HR)',
        description: 'Hanya dapat diakses oleh user dengan role HR.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID Lowongan Pekerjaan (UUID)',
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateJobRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Lowongan pekerjaan berhasil diperbarui',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    job: { $ref: '#/components/schemas/Job' },
                  },
                },
              },
            },
          },
          '401': { description: 'Tidak terotentikasi' },
          '403': { description: 'Akses ditolak (Bukan role HR)' },
          '404': { description: 'Lowongan tidak ditemukan' },
        },
      },
      delete: {
        tags: ['Jobs'],
        summary: 'Menghapus Lowongan Pekerjaan (Khusus HR)',
        description: 'Hanya dapat diakses oleh user dengan role HR.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID Lowongan Pekerjaan (UUID)',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Lowongan pekerjaan berhasil dihapus',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MessageResponse' },
              },
            },
          },
          '401': { description: 'Tidak terotentikasi' },
          '403': { description: 'Akses ditolak (Bukan role HR)' },
          '404': { description: 'Lowongan tidak ditemukan' },
        },
      },
    },
    '/api/jobs/{id}/status': {
      patch: {
        tags: ['Jobs'],
        summary: 'Mengubah Status Lowongan Kerja (Khusus HR)',
        description: 'Mengubah status lowongan menjadi OPEN atau CLOSED.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID Lowongan Pekerjaan (UUID)',
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateJobStatusRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Status lowongan berhasil diubah',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    job: { $ref: '#/components/schemas/Job' },
                  },
                },
              },
            },
          },
          '400': { description: 'Status tidak valid' },
          '401': { description: 'Tidak terotentikasi' },
          '403': { description: 'Akses ditolak (Bukan role HR)' },
          '404': { description: 'Lowongan tidak ditemukan' },
        },
      },
    },
    '/api/applications': {
      get: {
        tags: ['Applications'],
        summary: 'Melihat Seluruh Lamaran Kerja (Khusus HR)',
        description:
          'Mengambil seluruh berkas pelamar untuk HR dashboard dengan dukungan filter jobId, brand, status, minScore AI, dan search.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'jobId',
            in: 'query',
            description: 'Filter ID lowongan tertentu',
            schema: { type: 'string' },
          },
          {
            name: 'brand',
            in: 'query',
            description: 'Filter berdasarkan nama brand lowongan',
            schema: { type: 'string' },
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filter berdasarkan status lamaran',
            schema: {
              type: 'string',
              enum: ['PENDING', 'SCREENED', 'ACCEPTED', 'REJECTED'],
            },
          },
          {
            name: 'minScore',
            in: 'query',
            description: 'Filter batas minimum skor AI (contoh: 80)',
            schema: { type: 'integer' },
          },
          {
            name: 'search',
            in: 'query',
            description: 'Pencarian nama pelamar, email, atau judul lowongan',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Daftar pelamar untuk HR dashboard',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    total: { type: 'integer', example: 12 },
                    filters: { type: 'object' },
                    applications: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Application' },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Tidak terotentikasi' },
          '403': { description: 'Akses ditolak (Bukan role HR)' },
        },
      },
      post: {
        tags: ['Applications'],
        summary: 'Mengajukan Lamaran Kerja & Auto AI Screening (Khusus Pelamar)',
        description:
          'Pelamar mengunggah CV (PDF) atau menyertakan URL CV untuk melamar ke suatu posisi. Sistem akan otomatis menjalankan AI Screening.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['jobId'],
                properties: {
                  jobId: {
                    type: 'string',
                    description: 'ID Lowongan Pekerjaan yang dilamar',
                    example: '123e4567-e89b-12d3-a456-426614174001',
                  },
                  cv: {
                    type: 'string',
                    format: 'binary',
                    description: 'File CV dalam format PDF (maks. 5MB)',
                  },
                  cvUrl: {
                    type: 'string',
                    description: 'URL alternatif CV jika tidak mengunggah file langsung',
                    example: 'https://example.com/my-cv.pdf',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Lamaran berhasil dikirim dan di-screening AI',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    application: { $ref: '#/components/schemas/Application' },
                  },
                },
              },
            },
          },
          '400': { description: 'CV tidak disertakan, lowongan tutup, atau sudah pernah melamar' },
          '401': { description: 'Tidak terotentikasi' },
          '403': { description: 'Akses ditolak (Bukan role APPLICANT)' },
          '404': { description: 'Lowongan pekerjaan tidak ditemukan' },
        },
      },
    },
    '/api/applications/my': {
      get: {
        tags: ['Applications'],
        summary: 'Riwayat Lamaran Saya (Khusus Pelamar)',
        description: 'Melihat semua lowongan yang pernah dilamar oleh pengguna yang sedang login beserta status dan skornya.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Daftar riwayat lamaran pelamar',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    total: { type: 'integer' },
                    applications: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Application' },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Tidak terotentikasi' },
          '403': { description: 'Akses ditolak (Bukan role APPLICANT)' },
        },
      },
    },
    '/api/applications/job/{jobId}': {
      get: {
        tags: ['Applications'],
        summary: 'Daftar Pelamar untuk Lowongan Tertentu (Khusus HR)',
        description: 'Mengambil seluruh lamaran yang masuk untuk satu lowongan spesifik.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'jobId',
            in: 'path',
            required: true,
            description: 'ID Lowongan Pekerjaan (UUID)',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Daftar lamaran pada lowongan',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    jobTitle: { type: 'string' },
                    brand: { type: 'string' },
                    total: { type: 'integer' },
                    applications: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Application' },
                    },
                  },
                },
              },
            },
          },
          '401': { description: 'Tidak terotentikasi' },
          '403': { description: 'Akses ditolak (Bukan role HR)' },
          '404': { description: 'Lowongan tidak ditemukan' },
        },
      },
    },
    '/api/applications/{id}': {
      get: {
        tags: ['Applications'],
        summary: 'Detail Satu Lamaran Kerja',
        description: 'Dapat diakses oleh HR atau oleh pelamar pemilik lamaran tersebut.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID Lamaran Kerja (UUID)',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Detail lamaran ditemukan',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    application: { $ref: '#/components/schemas/Application' },
                  },
                },
              },
            },
          },
          '401': { description: 'Tidak terotentikasi' },
          '403': { description: 'Akses ditolak (Bukan pemilik lamaran atau HR)' },
          '404': { description: 'Lamaran tidak ditemukan' },
        },
      },
    },
    '/api/applications/{id}/status': {
      patch: {
        tags: ['Applications'],
        summary: 'Update Status Lamaran (Khusus HR)',
        description: 'HR dapat mengubah status lamaran menjadi PENDING, SCREENED, ACCEPTED, atau REJECTED.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID Lamaran Kerja (UUID)',
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateApplicationStatusRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Status lamaran berhasil diubah',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    application: { $ref: '#/components/schemas/Application' },
                  },
                },
              },
            },
          },
          '400': { description: 'Status tidak valid' },
          '401': { description: 'Tidak terotentikasi' },
          '403': { description: 'Akses ditolak (Bukan role HR)' },
          '404': { description: 'Lamaran tidak ditemukan' },
        },
      },
    },
    '/api/screenings/{applicationId}': {
      post: {
        tags: ['AI Screening'],
        summary: 'Menjalankan Ulang Evaluasi AI Screening (Khusus HR)',
        description:
          'Memicu evaluasi kecocokan kandidat ulang menggunakan AI berdasarkan kriteria posisi dan CV kandidat.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'applicationId',
            in: 'path',
            required: true,
            description: 'ID Lamaran Kerja (UUID)',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Screening AI berhasil dieksekusi',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    screening: { $ref: '#/components/schemas/ScreeningResult' },
                  },
                },
              },
            },
          },
          '401': { description: 'Tidak terotentikasi' },
          '403': { description: 'Akses ditolak (Bukan role HR)' },
          '404': { description: 'Lamaran tidak ditemukan' },
        },
      },
      get: {
        tags: ['AI Screening'],
        summary: 'Melihat Hasil AI Screening Suatu Lamaran',
        description: 'Mendapatkan skor dan analisis kecocokan AI untuk suatu lamaran.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'applicationId',
            in: 'path',
            required: true,
            description: 'ID Lamaran Kerja (UUID)',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Hasil screening AI ditemukan',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    screening: { $ref: '#/components/schemas/ScreeningResult' },
                  },
                },
              },
            },
          },
          '401': { description: 'Tidak terotentikasi' },
          '404': { description: 'Hasil screening belum tersedia' },
        },
      },
    },
  },
};

export const setupSwagger = (app: Application): void => {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'MOI Brands Careers API Documentation',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
      },
    })
  );

  app.get('/api-docs.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};
