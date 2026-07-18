const mongoose = require('mongoose');

async function connectDB() {
    try {
        mongoose.set('strictQuery', true);

        const uri = process.env.MONGO_URI;

        if(!uri) {
            throw new Error("MONGO_URI is not defined in environment variables");
        }

        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB successfully');

    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error}`);
        process.exit(1);
    }
}

module.exports = connectDB;