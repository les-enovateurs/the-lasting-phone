import express, { Request, Response } from 'express';
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
import dotenv from 'dotenv';
import cors from 'cors';

// Load environment configuration
dotenv.config({ path: `.env` });

const app = express();
const PORT = process.env.PORT || 3008;
const isProduction = process.env.NODE_ENV === 'production';

console.log(`Environment: ${process.env.NODE_ENV}`);

// Security and CORS configuration
if (isProduction) {
    app.use(cors({
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://ttb.les-enovateurs.com'],
        credentials: true
    }));
} else {
    app.use(cors());
}

app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.json());

// Database connection with connection pooling for production
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
};

// Create connection pool for better performance
const pool = mysql.createPool(dbConfig);

// Your existing API routes with connection pool
app.get('/api/event/:slug', async (req: Request<{slug: string}>, res: Response) => {
    try {
        const [events] = await pool.execute('SELECT slug FROM event WHERE slug = ? AND ended_at is null', [req.params.slug]);
        
        if (!events.length) {
            res.status(404).json({ error: 'Event not found' });
            return;
        }
        res.json(events[0]);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/customer', async (req: Request, res: Response) => {
    const {
        event_slug, name, email, accept_recontact, accept_newsletter,
        user_agent, device_brand, device_model, fabrication_date
    } = req.body;

    try {
        const conn = await pool.getConnection();

        try {
            // First, get the event_id from event_slug
            const [events] = await conn.execute(
                'SELECT id FROM event WHERE slug = ? AND ended_at IS NULL',
                [event_slug]
            );

            if (!events.length) {
                res.status(404).json({ error: 'Event not found or already ended' });
                return;
            }

            const event_id = events[0].id;

            // Build smartphone model from brand and model
            let smartphone_model = null;
            if (device_brand && device_model) {
                smartphone_model = `${device_brand.trim()} ${device_model.trim()}`;
            } else if (device_brand) {
                smartphone_model = device_brand.trim();
            } else if (device_model) {
                smartphone_model = device_model.trim();
            }

            // Insert customer and get the ID
            const [result] = await conn.execute(
                `INSERT INTO customer (event_id, name, email, accept_recontact, accept_newsletter, 
                 user_agent, smartphone_model, date_fabrication)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    event_id, name, email,
                    accept_recontact ? 1 : 0,
                    accept_newsletter ? 1 : 0,
                    user_agent,
                    smartphone_model,
                    fabrication_date
                ]
            );

            const customerId = result.insertId;

            // Calculate ranking
            const [rankingResult] = await conn.execute(
                `SELECT COUNT(*) + 1 as rank
                FROM customer 
                WHERE event_id = ? 
                AND date_fabrication IS NOT NULL 
                AND date_fabrication < ?`,
                [event_id, fabrication_date]
            );

            const [totalResult] = await conn.execute(
                `SELECT COUNT(*) as total
                FROM customer
                WHERE event_id = ?
                AND date_fabrication IS NOT NULL`,
                [event_id]
            );

            const rank = rankingResult[0].rank;
            const total = totalResult[0].total;
            const percentile = Math.round((1 - (rank / total)) * 100);

            await conn.execute(
                `UPDATE customer SET rank = ? WHERE id = ?`,
                [rank, customerId]
            );

            res.json({
                success: true,
                customerId,
                deviceRanking: { rank, total, percentile }
            });

        } finally {
            conn.release();
        }

    } catch (error) {
        console.error('Error processing customer:', error);
        res.status(500).json({ error: 'Failed to process customer registration' });
    }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await pool.end();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await pool.end();
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`API server running at http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});