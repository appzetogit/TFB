import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoSanitize from 'mongo-sanitize';
import xssClean from 'xss-clean';
import routes from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimit.js';
import { responseTimeLogger } from './middleware/responseTimeLogger.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { healthCheck } from './config/health.js';
import { config } from './config/env.js';

const app = express();

/* ✅ FIXED CORS CONFIG */
const allowedOrigins = [
    "https://app.tifunbox.com",
    "https://tifunbox.com",
    "https://www.tifunbox.com",
    "http://localhost:5173",
    "http://localhost:3000"
];

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
};

// Trust proxy (important for rate limiter)
app.set('trust proxy', 1);

// Request ID
app.use(requestIdMiddleware);

// Health routes
app.get('/health', async (_req, res) => {
    try {
        const data = await healthCheck();
        res.status(200).json(data);
    } catch (err) {
        res.status(503).json({ status: 'DOWN', error: 'Health check failed' });
    }
});

app.get('/ready', (_req, res) => {
    res.status(200).json({ status: 'ready' });
});

/* ✅ SECURITY */
app.use(helmet({
    contentSecurityPolicy: { directives: { defaultSrc: ["'self'"] } },
    hsts: config.nodeEnv === 'production'
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
    xssFilter: true,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

/* ✅ CORS APPLY */
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // 🔥 IMPORTANT FIX FOR PREFLIGHT

app.use(morgan('dev'));

/* ✅ BODY PARSER */
app.use(express.json({
    verify: (req, res, buf) => {
        if (req.originalUrl && req.originalUrl.includes('/webhook/razorpay')) {
            req.rawBody = buf;
        }
    }
}));
app.use(express.urlencoded({ extended: true }));

/* ✅ SECURITY SANITIZATION */
app.use((req, _res, next) => {
    req.body = mongoSanitize(req.body);
    req.query = mongoSanitize(req.query);
    req.params = mongoSanitize(req.params);
    next();
});
app.use(xssClean());

/* ✅ RATE LIMIT */
app.use('/api', apiRateLimiter);

/* ✅ RESPONSE TIME LOG */
app.use('/api', responseTimeLogger);

/* ✅ ROUTES */
app.use('/api', routes);

/* ✅ ERROR HANDLER */
app.use(errorHandler);

export default app;