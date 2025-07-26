import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

export class MongoDBClient {
  private static instance: MongoDBClient;
  private isConnected: boolean = false;

  private constructor() {}

  static getInstance(): MongoDBClient {
    if (!MongoDBClient.instance) {
      MongoDBClient.instance = new MongoDBClient();
    }
    return MongoDBClient.instance;
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('✅ Already connected to MongoDB');
      return;
    }

    try {
      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) {
        throw new Error('MONGODB_URI not found in environment variables');
      }

      const dbName = process.env.MONGODB_DB_NAME || 'hackathon-07-26-2025';
      await mongoose.connect(mongoUri, {
        dbName: dbName
      });
      this.isConnected = true;
      console.log(`✅ Connected to MongoDB successfully (Database: ${dbName})`);
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    await mongoose.disconnect();
    this.isConnected = false;
    console.log('🔌 Disconnected from MongoDB');
  }

  getConnection() {
    return mongoose.connection;
  }
}

export const mongoClient = MongoDBClient.getInstance();