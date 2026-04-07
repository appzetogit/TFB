import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

import EnvironmentVariable from '../modules/admin/models/EnvironmentVariable.js';

async function updateAppleConfig() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const envVars = await EnvironmentVariable.getOrCreate();
    
    console.log('Current DB Apple Config:', {
      clientId: envVars.APPLE_CLIENT_ID,
      redirectUri: envVars.APPLE_REDIRECT_URI
    });

    console.log('Updating with .env values:', {
      clientId: process.env.APPLE_CLIENT_ID,
      redirectUri: process.env.APPLE_REDIRECT_URI
    });

    envVars.APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID;
    envVars.APPLE_REDIRECT_URI = process.env.APPLE_REDIRECT_URI;
    
    await envVars.save();
    console.log('Successfully updated Apple config in Database.');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateAppleConfig();
