import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import dns from 'dns';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Force Node.js to use Google DNS to bypass Windows/ISP querySrv ECONNREFUSED blocks
dns.setServers(['8.8.8.8', '8.8.4.4']);
import { ApifyClient } from 'apify-client';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const apifyClient = new ApifyClient({
    token: process.env.apify_apikey,
});

app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) {
    console.error("❌ ERROR: MONGODB_URI is missing in .env file!");
    process.exit(1);
}

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err.message));

// ─────────────────────────────────────────
// SCHEMAS
// ─────────────────────────────────────────

const workerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatarColor: { type: String, default: '#2563eb' },
    joinedAt: { type: Date, default: Date.now }
});

const videoSchema = new mongoose.Schema({
    url: { type: String, required: true },
    platform: { type: String, enum: ['youtube', 'tiktok', 'instagram'], required: true },
    videoId: { type: String },
    title: { type: String, default: 'Untitled Video' },
    thumbnail: { type: String, default: '' },
    description: { type: String, default: '' },
    channelName: { type: String, default: '' },
    workerName: { type: String, required: true },
    workerUsername: { type: String, required: true },
    category: { type: String, default: 'General' },
    tags: [String],
    stats: {
        views: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },
        comments: { type: Number, default: 0 },
        shares: { type: Number, default: 0 }
    },
    publishedAt: { type: Date },
    addedAt: { type: Date, default: Date.now },
    lastRefreshed: { type: Date, default: Date.now }
});

const Worker = mongoose.model('Worker', workerSchema);
const Video = mongoose.model('Video', videoSchema);

// ─────────────────────────────────────────
// PLATFORM HELPERS
// ─────────────────────────────────────────

function detectPlatform(url) {
    if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
    if (/tiktok\.com/.test(url)) return 'tiktok';
    if (/instagram\.com/.test(url)) return 'instagram';
    return null;
}

function extractYouTubeId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/,
        /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

async function fetchYouTubeData(videoId) {
    if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY_HERE') {
        return {
            title: `YouTube Video (${videoId})`,
            thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            description: 'Add your YouTube API key to fetch full details.',
            channelName: 'Unknown Channel',
            tags: [],
            stats: { views: 0, likes: 0, comments: 0, shares: 0 },
            publishedAt: new Date()
        };
    }
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,statistics&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(apiUrl);
    const data = await res.json();
    if (!data.items || data.items.length === 0) throw new Error('Video not found on YouTube');
    const item = data.items[0];
    return {
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
        description: item.snippet.description?.slice(0, 500) || '',
        channelName: item.snippet.channelTitle,
        tags: item.snippet.tags?.slice(0, 10) || [],
        stats: {
            views: parseInt(item.statistics?.viewCount || 0),
            likes: parseInt(item.statistics?.likeCount || 0),
            comments: parseInt(item.statistics?.commentCount || 0),
            shares: 0
        },
        publishedAt: new Date(item.snippet.publishedAt)
    };
}

async function fetchTikTokData(url) {
    try {
        if (!process.env.apify_apikey) throw new Error("Apify key missing");
        const run = await apifyClient.actor("clockwork/tiktok-scraper").call({
            postURLs: [url],
            resultsPerPage: 1,
            shouldDownloadCovers: false,
            shouldDownloadSubtitles: false,
            shouldDownloadVideos: false
        });
        const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
        if (!items || items.length === 0) throw new Error("Video not found on TikTok");
        const data = items[0];
        
        return {
            title: data.text || 'TikTok Video',
            thumbnail: data.covers?.default || data.videoMeta?.coverUrl || '',
            description: data.text || '',
            channelName: data.authorMeta?.name || data.authorMeta?.nickName || 'Unknown',
            tags: data.hashtags?.map(h => h.name) || [],
            stats: { 
                views: parseInt(data.playCount || 0), 
                likes: parseInt(data.diggCount || 0), 
                comments: parseInt(data.commentCount || 0), 
                shares: parseInt(data.shareCount || 0) 
            },
            publishedAt: new Date(data.createTimeISO || Date.now())
        };
    } catch (e) {
        console.error("TikTok Apify Error:", e.message);
        throw new Error("Failed to fetch TikTok data. Make sure the URL is valid.");
    }
}

async function fetchInstagramData(url) {
    try {
        if (!process.env.apify_apikey) throw new Error("Apify key missing");
        const run = await apifyClient.actor("apify/instagram-scraper").call({
            directUrls: [url],
            resultsType: "details"
        });
        const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
        if (!items || items.length === 0) throw new Error("Post not found on Instagram");
        const data = items[0];
        
        return {
            title: data.caption || 'Instagram Post',
            thumbnail: data.displayUrl || data.url || '',
            description: data.caption || '',
            channelName: data.ownerUsername || data.ownerFullName || 'Unknown',
            tags: [], 
            stats: { 
                views: parseInt(data.videoPlayCount || data.videoViewCount || 0), 
                likes: parseInt(data.likesCount || 0), 
                comments: parseInt(data.commentsCount || 0), 
                shares: 0 
            },
            publishedAt: new Date(data.timestamp || Date.now())
        };
    } catch (e) {
        console.error("Instagram Apify Error:", e.message);
        throw new Error("Failed to fetch Instagram data. Make sure the URL is public.");
    }
}

// ─────────────────────────────────────────
// WORKER ROUTES
// ─────────────────────────────────────────

// Create worker
app.post('/api/workers', async (req, res) => {
    try {
        const { name, username, password } = req.body;
        if (!name || !username || !password) {
            return res.status(400).json({ error: 'Name, username, and password are required' });
        }
        const colors = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#be185d', '#b45309'];
        const avatarColor = colors[Math.floor(Math.random() * colors.length)];
        const worker = new Worker({ name, username, password, avatarColor });
        await worker.save();
        res.status(201).json(worker);
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ error: 'Username already exists' });
        res.status(500).json({ error: err.message });
    }
});

// Get all workers with their video counts
app.get('/api/workers', async (req, res) => {
    try {
        const workers = await Worker.find().sort({ joinedAt: -1 });
        const workersWithStats = await Promise.all(workers.map(async (w) => {
            const videoCount = await Video.countDocuments({ workerUsername: w.username });
            const totalViews = await Video.aggregate([
                { $match: { workerUsername: w.username } },
                { $group: { _id: null, total: { $sum: '$stats.views' } } }
            ]);
            return {
                ...w.toObject(),
                videoCount,
                totalViews: totalViews[0]?.total || 0
            };
        }));
        res.json(workersWithStats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Worker login
app.post('/api/workers/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const worker = await Worker.findOne({ username, password });
        if (!worker) return res.status(401).json({ error: 'Invalid credentials' });
        res.json(worker);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete worker
app.delete('/api/workers/:id', async (req, res) => {
    try {
        await Worker.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ─────────────────────────────────────────
// VIDEO ROUTES
// ─────────────────────────────────────────

// Add video by URL
app.post('/api/videos', async (req, res) => {
    try {
        const { url, workerName, workerUsername, category } = req.body;
        if (!url || !workerName || !workerUsername) {
            return res.status(400).json({ error: 'URL, workerName, and workerUsername are required' });
        }

        const platform = detectPlatform(url);
        if (!platform) return res.status(400).json({ error: 'Unsupported platform. Use YouTube, TikTok, or Instagram URLs.' });

        let videoId = null;
        let metadata = {};

        if (platform === 'youtube') {
            videoId = extractYouTubeId(url);
            if (!videoId) return res.status(400).json({ error: 'Could not extract YouTube video ID from URL' });
            // Check duplicate
            const existing = await Video.findOne({ videoId, platform: 'youtube' });
            if (existing) return res.status(409).json({ error: 'This YouTube video is already added' });
            metadata = await fetchYouTubeData(videoId);
        } else if (platform === 'tiktok') {
            metadata = await fetchTikTokData(url);
        } else if (platform === 'instagram') {
            metadata = await fetchInstagramData(url);
        }

        const video = new Video({
            url,
            platform,
            videoId,
            workerName,
            workerUsername,
            category: category || 'General',
            ...metadata,
            lastRefreshed: new Date()
        });

        await video.save();
        res.status(201).json(video);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all videos with filters
app.get('/api/videos', async (req, res) => {
    try {
        const { platform, worker, search, from, to, sort = 'newest', page = 1, limit = 10 } = req.query;
        const query = {};

        if (platform && platform !== 'all') query.platform = platform;
        if (worker && worker !== 'all') query.workerUsername = worker;
        if (from || to) {
            query.addedAt = {};
            if (from) query.addedAt.$gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                toDate.setHours(23, 59, 59, 999);
                query.addedAt.$lte = toDate;
            }
        }
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { channelName: { $regex: search, $options: 'i' } },
                { workerName: { $regex: search, $options: 'i' } }
            ];
        }

        const sortMap = {
            newest: { addedAt: -1 },
            oldest: { addedAt: 1 },
            mostViews: { 'stats.views': -1 },
            mostLikes: { 'stats.likes': -1 },
            mostComments: { 'stats.comments': -1 }
        };

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [videos, total] = await Promise.all([
            Video.find(query).sort(sortMap[sort] || { addedAt: -1 }).skip(skip).limit(parseInt(limit)),
            Video.countDocuments(query)
        ]);

        res.json({ videos, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Dashboard aggregate stats
app.get('/api/videos/dashboard', async (req, res) => {
    try {
        const { worker } = req.query;
        const baseMatch = {};
        if (worker) {
            baseMatch.workerUsername = worker;
        }

        const now = new Date();
        const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
        const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - 7);
        const startOfMonth = new Date(now); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
        const startOf30Days = new Date(now); startOf30Days.setDate(now.getDate() - 30);
        const startOf7Days = new Date(now); startOf7Days.setDate(now.getDate() - 7);

        // Aggregate totals
        const [totalsAgg] = await Video.aggregate([
            { $match: baseMatch },
            { $group: { _id: null, totalViews: { $sum: '$stats.views' }, totalLikes: { $sum: '$stats.likes' }, totalComments: { $sum: '$stats.comments' }, totalVideos: { $sum: 1 } } }
        ]);

        // Platform breakdown
        const platformBreakdown = await Video.aggregate([
            { $match: baseMatch },
            { $group: { _id: '$platform', count: { $sum: 1 }, views: { $sum: '$stats.views' } } }
        ]);

        let usedIds = [];

        // Top today
        const topTodayQuery = { ...baseMatch, addedAt: { $gte: startOfDay } };
        const topToday = await Video.findOne(topTodayQuery).sort({ 'stats.views': -1 });
        const topTodayFallback = topToday || await Video.findOne(baseMatch).sort({ 'stats.views': -1 });
        if (topTodayFallback) usedIds.push(topTodayFallback._id);

        // Top this week
        const topWeekQuery = { ...baseMatch, addedAt: { $gte: startOfWeek }, _id: { $nin: usedIds } };
        const topWeek = await Video.findOne(topWeekQuery).sort({ 'stats.views': -1 });
        const topWeekFallback = topWeek || await Video.findOne({ ...baseMatch, _id: { $nin: usedIds } }).sort({ 'stats.views': -1 });
        if (topWeekFallback) usedIds.push(topWeekFallback._id);

        // Top this month
        const topMonthQuery = { ...baseMatch, addedAt: { $gte: startOfMonth }, _id: { $nin: usedIds } };
        const topMonth = await Video.findOne(topMonthQuery).sort({ 'stats.views': -1 });
        const topMonthFallback = topMonth || await Video.findOne({ ...baseMatch, _id: { $nin: usedIds } }).sort({ 'stats.views': -1 });

        // Views over last 30 days
        const viewsOverTime = await Video.aggregate([
            { $match: { ...baseMatch, addedAt: { $gte: startOf30Days } } },
            { $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$addedAt' } },
                views: { $sum: '$stats.views' },
                count: { $sum: 1 }
            }},
            { $sort: { '_id': 1 } }
        ]);

        // Uploads per day last 7 days
        const uploadsPerDay = await Video.aggregate([
            { $match: { ...baseMatch, addedAt: { $gte: startOf7Days } } },
            { $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$addedAt' } },
                count: { $sum: 1 }
            }},
            { $sort: { '_id': 1 } }
        ]);

        // Recent 5 videos
        const recentVideos = await Video.find(baseMatch).sort({ addedAt: -1 }).limit(5);

        // Worker leaderboard
        const workerLeaderboard = await Video.aggregate([
            { $group: { _id: '$workerName', videoCount: { $sum: 1 }, totalViews: { $sum: '$stats.views' } } },
            { $sort: { videoCount: -1 } },
            { $limit: 5 }
        ]);

        res.json({
            totals: totalsAgg || { totalViews: 0, totalLikes: 0, totalComments: 0, totalVideos: 0 },
            platformBreakdown,
            topToday: topTodayFallback,
            topWeek: topWeekFallback,
            topMonth: topMonthFallback,
            viewsOverTime,
            uploadsPerDay,
            recentVideos,
            workerLeaderboard
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single video
app.get('/api/videos/:id', async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ error: 'Video not found' });
        res.json(video);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Refresh stats (YouTube only)
app.put('/api/videos/:id/refresh', async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ error: 'Video not found' });
        if (video.platform !== 'youtube' || !video.videoId) {
            return res.status(400).json({ error: 'Auto-refresh only available for YouTube videos' });
        }
        const fresh = await fetchYouTubeData(video.videoId);
        video.stats = fresh.stats;
        video.title = fresh.title;
        video.thumbnail = fresh.thumbnail;
        video.lastRefreshed = new Date();
        await video.save();
        res.json(video);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Manually update stats (TikTok / Instagram)
app.put('/api/videos/:id/stats', async (req, res) => {
    try {
        const { views, likes, comments, shares, title } = req.body;
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ error: 'Video not found' });
        if (views !== undefined) video.stats.views = parseInt(views) || 0;
        if (likes !== undefined) video.stats.likes = parseInt(likes) || 0;
        if (comments !== undefined) video.stats.comments = parseInt(comments) || 0;
        if (shares !== undefined) video.stats.shares = parseInt(shares) || 0;
        if (title) video.title = title;
        video.lastRefreshed = new Date();
        await video.save();
        res.json(video);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete video
app.delete('/api/videos/:id', async (req, res) => {
    try {
        await Video.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ???????????????????????????????????????????????????????????????????????????????
// PRODUCTION FRONTEND SERVING
// ???????????????????????????????????????????????????????????????????????????????
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
