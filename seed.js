import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const workerSchema = new mongoose.Schema({
    name: String,
    username: { type: String, unique: true },
    password: String,
    avatarColor: String,
    joinedAt: { type: Date, default: Date.now }
});

const videoSchema = new mongoose.Schema({
    url: String,
    platform: String,
    videoId: String,
    title: String,
    thumbnail: String,
    description: String,
    channelName: String,
    workerName: String,
    workerUsername: String,
    category: String,
    tags: [String],
    stats: {
        views: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },
        comments: { type: Number, default: 0 },
        shares: { type: Number, default: 0 }
    },
    publishedAt: Date,
    addedAt: { type: Date, default: Date.now },
    lastRefreshed: { type: Date, default: Date.now }
});

const Worker = mongoose.model('Worker', workerSchema);
const Video = mongoose.model('Video', videoSchema);

const workerData = [
    { name: 'Rahul Singh', username: 'rahul', password: 'pass123', avatarColor: '#2563eb' },
    { name: 'Priya Sharma', username: 'priya', password: 'pass123', avatarColor: '#16a34a' },
    { name: 'Arjun Patel', username: 'arjun', password: 'pass123', avatarColor: '#d97706' },
    { name: 'Neha Gupta', username: 'neha', password: 'pass123', avatarColor: '#7c3aed' },
    { name: 'Karan Mehta', username: 'karan', password: 'pass123', avatarColor: '#0891b2' },
];

const categories = ['Gaming', 'Education', 'Entertainment', 'Music', 'Tech', 'Lifestyle'];
const platforms = ['youtube', 'youtube', 'youtube', 'tiktok', 'instagram']; // YouTube heavy

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected for seeding...');

        await Worker.deleteMany({});
        await Video.deleteMany({});
        console.log('🗑️  Cleared existing data...');

        const workers = await Worker.insertMany(workerData);
        console.log(`✅ Created ${workers.length} workers`);

        const videos = [];
        const now = new Date();

        for (let i = 1; i <= 30; i++) {
            const worker = workers[i % workers.length];
            const platform = platforms[i % platforms.length];
            const date = new Date();
            date.setDate(now.getDate() - Math.floor(Math.random() * 14));

            const viewsBase = [500, 1200, 3500, 8000, 25000, 95000, 350000];
            const views = viewsBase[Math.floor(Math.random() * viewsBase.length)];

            videos.push({
                url: platform === 'youtube' ? `https://www.youtube.com/watch?v=dQw4w9WgXcQ${i}` :
                     platform === 'tiktok' ? `https://www.tiktok.com/@user/video/${1000000000 + i}` :
                     `https://www.instagram.com/reel/ABCDEF${i}/`,
                platform,
                videoId: platform === 'youtube' ? `dQw4w9WgXcQ${i}` : null,
                title: `${categories[i % categories.length]} Video ${i} — Amazing Content for You`,
                thumbnail: `https://picsum.photos/seed/video${i}/320/180`,
                description: `This is a great ${categories[i % categories.length].toLowerCase()} video. Check it out!`,
                channelName: `${worker.name}'s Channel`,
                workerName: worker.name,
                workerUsername: worker.username,
                category: categories[i % categories.length],
                tags: [categories[i % categories.length].toLowerCase(), 'viral', 'trending'],
                stats: {
                    views,
                    likes: Math.floor(views * 0.05),
                    comments: Math.floor(views * 0.008),
                    shares: Math.floor(views * 0.015)
                },
                publishedAt: date,
                addedAt: date,
                lastRefreshed: date
            });
        }

        await Video.insertMany(videos);
        console.log(`✅ Created ${videos.length} videos`);
        console.log('\n🔑 Worker Logins:');
        workerData.forEach(w => console.log(`   ${w.name}: username="${w.username}" password="${w.password}"`));
        mongoose.disconnect();
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seed();
