const dns = require('dns');
const mongoose = require('mongoose');

async function connectWithUri(uri) {
    await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
}

async function connectDB() {
    try {
        mongoose.set('strictQuery', true);

        const uri = process.env.MONGO_URI;

        if (!uri) {
            throw new Error("MONGO_URI is not defined in environment variables");
        }

        // Windows system DNS can refuse Node's querySrv for mongodb+srv URIs.
        if (process.platform === 'win32' && String(uri).startsWith('mongodb+srv://')) {
            const previous = dns.getServers();
            dns.setServers(['8.8.8.8', '1.1.1.1', ...previous.filter((s) => s !== '8.8.8.8' && s !== '1.1.1.1')]);
        }

        try {
            await connectWithUri(uri);
        } catch (firstErr) {
            const msg = String(firstErr?.message || firstErr);
            if (msg.includes('querySrv') || msg.includes('ECONNREFUSED')) {
                const previous = dns.getServers();
                dns.setServers(['8.8.8.8', '1.1.1.1', ...previous]);
                console.warn('Mongo DNS SRV failed; retrying with public DNS resolvers...');
                await connectWithUri(uri);
            } else {
                throw firstErr;
            }
        }
        console.log('Connected to MongoDB successfully');

    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error}`);
        process.exit(1);
    }
}

module.exports = connectDB;