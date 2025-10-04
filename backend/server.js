
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const companyRoutes = require('./routes/company');
const countryRoutes = require('./routes/countries');
const currencyRoutes = require('./routes/currency');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/countries', countryRoutes);
app.use('/api/currency', currencyRoutes);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
	console.error('FATAL: MONGO_URI is not defined in environment (.env)');
	process.exit(1);
}

// Basic masking of credentials for logs
const maskMongoUri = (uri) => {
	try {
		const u = new URL(uri.replace('mongodb+srv://', 'http://').replace('mongodb://', 'http://'));
		const userInfo = u.username ? `${u.username}${u.password ? ':****' : ''}@` : '';
		return uri.startsWith('mongodb+srv://')
			? `mongodb+srv://${userInfo}${u.host}${u.pathname}`
			: `mongodb://${userInfo}${u.host}${u.pathname}`;
	} catch {
		return 'Unparseable Mongo URI';
	}
};

const MAX_RETRIES = parseInt(process.env.MONGO_MAX_RETRIES || '5', 10);
const RETRY_DELAY_MS = parseInt(process.env.MONGO_RETRY_DELAY_MS || '3000', 10);

async function connectWithRetry(attempt = 1) {
	try {
		console.log(`Attempting MongoDB connection (attempt ${attempt}) -> ${maskMongoUri(MONGO_URI)}`);
		await mongoose.connect(MONGO_URI, {
			// Modern mongoose no longer needs useNewUrlParser / useUnifiedTopology
			serverSelectionTimeoutMS: parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT || '10000', 10),
			maxPoolSize: parseInt(process.env.MONGO_MAX_POOL_SIZE || '10', 10)
		});
		console.log('✅ MongoDB connected');
		startServer();
	} catch (err) {
		console.error(`MongoDB connection error on attempt ${attempt}:`, err.message);
		if (attempt < MAX_RETRIES) {
			const nextAttempt = attempt + 1;
			console.log(`Retrying in ${RETRY_DELAY_MS}ms (will try ${MAX_RETRIES - attempt} more time(s))`);
			setTimeout(() => connectWithRetry(nextAttempt), RETRY_DELAYMS_FALLBACK_FIX(RETRY_DELAY_MS));
		} else {
			console.error('❌ Exhausted MongoDB connection retries. Exiting process.');
			process.exit(1);
		}
	}
}

// Small helper to guard against NaN or negative values (defensive)
function RETRY_DELAYMS_FALLBACK_FIX(v){
	return (Number.isFinite(v) && v >= 0) ? v : 3000;
}

function startServer() {
	if (app.locals.started) return; // prevent double start
	app.locals.started = true;
	app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}

// Global process-level safety nets
process.on('unhandledRejection', (reason) => {
	console.error('Unhandled Promise Rejection:', reason);
});
process.on('uncaughtException', (err) => {
	console.error('Uncaught Exception:', err);
});

connectWithRetry();
