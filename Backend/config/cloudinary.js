import { v2 as cloudinary } from 'cloudinary';
import { getCloudinaryCredentials } from '../shared/utils/envService.js';
import { clearEnvCache } from '../shared/utils/envService.js';
import EnvironmentVariable from "../modules/admin/models/EnvironmentVariable.js";
import { decrypt, isEncrypted } from "../shared/utils/encryption.js";

// Normalize env values (trim quotes if present)
function cleanEnv(value) {
  if (!value || typeof value !== 'string') return value;
  let v = value.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

// Initialize Cloudinary with database credentials
let cloudinaryInitialized = false;

async function initializeCloudinary() {
  if (cloudinaryInitialized) {
    return cloudinary;
  }

  try {
    const resolveCredentials = async () => {
      const credentials = await getCloudinaryCredentials();
      return {
        cloudName: cleanEnv(credentials.cloudName || process.env.CLOUDINARY_CLOUD_NAME),
        apiKey: cleanEnv(credentials.apiKey || process.env.CLOUDINARY_API_KEY),
        apiSecret: cleanEnv(credentials.apiSecret || process.env.CLOUDINARY_API_SECRET),
      };
    };

    // First attempt from cache/DB.
    let { cloudName, apiKey, apiSecret } = await resolveCredentials();

    // If any value appears missing, force-refresh DB env cache and retry once.
    if (!cloudName || !apiKey || !apiSecret) {
      clearEnvCache();
      ({ cloudName, apiKey, apiSecret } = await resolveCredentials());
    }

    if (!cloudName || !apiKey || !apiSecret) {
      // Diagnostic check: values may exist in DB but fail to decrypt
      // on this server when ENCRYPTION_KEY/ENCRYPTION_KEY_OLD differs.
      let decryptHint = "";
      try {
        const envDoc = await EnvironmentVariable.getOrCreate();
        const rawCloudName = envDoc?.CLOUDINARY_CLOUD_NAME || "";
        const rawApiKey = envDoc?.CLOUDINARY_API_KEY || "";
        const rawApiSecret = envDoc?.CLOUDINARY_API_SECRET || "";

        const rawExists = {
          cloudName: typeof rawCloudName === "string" && rawCloudName.trim() !== "",
          apiKey: typeof rawApiKey === "string" && rawApiKey.trim() !== "",
          apiSecret:
            typeof rawApiSecret === "string" && rawApiSecret.trim() !== "",
        };

        const encryptedFlags = {
          apiKey: isEncrypted(rawApiKey),
          apiSecret: isEncrypted(rawApiSecret),
        };

        const decryptedApiKey = encryptedFlags.apiKey ? decrypt(rawApiKey) : rawApiKey;
        const decryptedApiSecret = encryptedFlags.apiSecret
          ? decrypt(rawApiSecret)
          : rawApiSecret;

        const decryptFailedForExistingSecrets =
          rawExists.apiKey &&
          rawExists.apiSecret &&
          (!decryptedApiKey || !decryptedApiSecret);

        if (decryptFailedForExistingSecrets) {
          decryptHint =
            " Likely cause: DB secrets exist but decryption failed on this server. Check ENCRYPTION_KEY and ENCRYPTION_KEY_OLD in production.";
        }
      } catch (_) {
        // Keep original missing-key behavior if diagnostics check fails.
      }

      const missing = [];
      if (!cloudName) missing.push('CLOUDINARY_CLOUD_NAME');
      if (!apiKey) missing.push('CLOUDINARY_API_KEY');
      if (!apiSecret) missing.push('CLOUDINARY_API_SECRET');
      
      console.error(
        `❌ Cloudinary is not fully configured. Missing: ${missing.join(', ')}. Set these in ENV Setup or backend .env.${decryptHint}`
      );
      throw new Error(
        `Cloudinary configuration incomplete. Missing: ${missing.join(', ')}.${decryptHint}`,
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret
    });

    cloudinaryInitialized = true;
  } catch (error) {
    console.error('❌ Error initializing Cloudinary:', {
      message: error.message,
      stack: error.stack
    });
    cloudinaryInitialized = false;
    throw error; // Re-throw to let caller handle
  }

  return cloudinary;
}

// Initialize on module load (fallback to process.env)
const CLOUDINARY_CLOUD_NAME = cleanEnv(process.env.CLOUDINARY_CLOUD_NAME);
const CLOUDINARY_API_KEY = cleanEnv(process.env.CLOUDINARY_API_KEY);
const CLOUDINARY_API_SECRET = cleanEnv(process.env.CLOUDINARY_API_SECRET);

if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
  });
  cloudinaryInitialized = true;
}

// Reinitialize function (call after updating env variables)
export async function reinitializeCloudinary() {
  cloudinaryInitialized = false;
  return await initializeCloudinary();
}

export { cloudinary, initializeCloudinary };


