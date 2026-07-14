import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const pendingPaymentSchema = new mongoose.Schema({
    amount: String,
    txn_id: { type: String, unique: true },
    party: String,
    subject: String,
    date: String,
    receivedAt: { type: Date, default: Date.now }
});

const saleSchema = new mongoose.Schema({
    id: String,
    customer: String,
    discordId: String,
    product: String,
    amount: Number,
    txnId: String,
    status: String,
    date: String,
    time: String,
    staff: String,
    notes: String,
    createdAt: { type: Date, default: Date.now }
});

const PendingPayment = mongoose.model('PendingPayment', pendingPaymentSchema);
const Sale = mongoose.model('Sale', saleSchema);

async function clearData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB...');

        const salesResult = await Sale.deleteMany({});
        const pendingResult = await PendingPayment.deleteMany({});

        console.log(`🗑️  Cleared ${salesResult.deletedCount} sales.`);
        console.log(`🗑️  Cleared ${pendingResult.deletedCount} pending payments.`);
        console.log('✨ Database is now fresh and empty.');

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Clearing failed:', error);
        process.exit(1);
    }
}

clearData();
