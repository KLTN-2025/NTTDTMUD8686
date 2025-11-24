import mongoose from "mongoose";

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => console.log('Database Connected'))
        mongoose.connection.on('error', (err) => console.log('Database Error:', err))

        // Sửa connection string để tránh lỗi namespace
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is not set');
        }

        // Đảm bảo connection string đúng format
        const connectionString = mongoUri.endsWith('/') 
            ? `${mongoUri}job-portal` 
            : `${mongoUri}/job-portal`;

        console.log('Connecting to MongoDB:', connectionString.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs

        await mongoose.connect(connectionString, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
}

export default connectDB;
