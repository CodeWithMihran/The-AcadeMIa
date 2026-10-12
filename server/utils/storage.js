const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const { Readable } = require("stream");

// Render's persistent disk should be mounted at /var/data and configured with
// STORAGE_DIR=/var/data/notes. Local development keeps files under server/.
const LOCAL_STORAGE_DIR = path.resolve(
    process.env.STORAGE_DIR || path.resolve(__dirname, "../storage/notes")
);
if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
    fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
}

/**
 * Checks whether remote S3/R2 storage is fully configured.
 */
function isS3Configured() {
    return Boolean(
        process.env.S3_BUCKET &&
        process.env.S3_REGION &&
        process.env.S3_ACCESS_KEY_ID &&
        process.env.S3_SECRET_ACCESS_KEY
    );
}

/**
 * Persists a note file buffer either to configured S3 or local disk.
 * Returns the storage type and unique storage key.
 */
async function saveNoteFile(buffer, originalName, mimeType) {
    const ext = path.extname(originalName || "").slice(0, 10).toLowerCase() || ".bin";
    const filename = `${randomUUID()}${ext}`;

    if (isS3Configured()) {
        try {
            // Lazy load AWS SDK if installed and configured
            const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
            const s3Client = new S3Client({
                region: process.env.S3_REGION,
                credentials: {
                    accessKeyId: process.env.S3_ACCESS_KEY_ID,
                    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
                },
                ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {})
            });

            await s3Client.send(new PutObjectCommand({
                Bucket: process.env.S3_BUCKET,
                Key: `notes/${filename}`,
                Body: buffer,
                ContentType: mimeType
            }));

            return {
                storageType: "s3",
                storageKey: `notes/${filename}`
            };
        } catch (s3Error) {
            console.warn("S3 upload failed, falling back to secure local disk storage:", s3Error.message);
        }
    }

    // Default: write to local filesystem storage
    const targetPath = path.join(LOCAL_STORAGE_DIR, filename);
    await fs.promises.writeFile(targetPath, buffer);

    return {
        storageType: "disk",
        storageKey: filename
    };
}

/**
 * Streams or sends note content to the Express HTTP response.
 * Handles disk files, S3 objects, and backward-compatible MongoDB buffer records.
 */
async function streamNoteFile(note, res) {
    // 1. Stored on local disk
    if (note.storageKey && (note.storageType === "disk" || !note.storageType)) {
        const filePath = path.join(LOCAL_STORAGE_DIR, path.basename(note.storageKey));
        if (fs.existsSync(filePath)) {
            return fs.createReadStream(filePath).pipe(res);
        }
    }

    // 2. Stored on S3 / R2
    if (note.storageKey && note.storageType === "s3" && isS3Configured()) {
        try {
            const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
            const s3Client = new S3Client({
                region: process.env.S3_REGION,
                credentials: {
                    accessKeyId: process.env.S3_ACCESS_KEY_ID,
                    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
                },
                ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {})
            });

            const command = new GetObjectCommand({
                Bucket: process.env.S3_BUCKET,
                Key: note.storageKey
            });
            const s3Response = await s3Client.send(command);
            return s3Response.Body.pipe(res);
        } catch (s3Error) {
            console.error("S3 stream error:", s3Error.message);
        }
    }

    // 3. Fallback for legacy database records that still have fileData in MongoDB
    if (note.fileData && Buffer.isBuffer(note.fileData)) {
        const stream = Readable.from(note.fileData);
        return stream.pipe(res);
    }

    throw new Error("Note content file is missing or unreadable.");
}

/**
 * Removes a stored note file from disk or S3.
 */
async function deleteNoteFile(storageKey, storageType) {
    if (!storageKey) return;
    try {
        if (storageType === "disk" || !storageType) {
            const filePath = path.join(LOCAL_STORAGE_DIR, path.basename(storageKey));
            if (fs.existsSync(filePath)) {
                await fs.promises.unlink(filePath);
            }
        } else if (storageType === "s3" && isS3Configured()) {
            const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
            const s3Client = new S3Client({
                region: process.env.S3_REGION,
                credentials: {
                    accessKeyId: process.env.S3_ACCESS_KEY_ID,
                    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
                },
                ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {})
            });
            await s3Client.send(new DeleteObjectCommand({
                Bucket: process.env.S3_BUCKET,
                Key: storageKey
            }));
        }
    } catch (err) {
        console.warn(`Could not delete stored file ${storageKey}:`, err.message);
    }
}

module.exports = {
    saveNoteFile,
    streamNoteFile,
    deleteNoteFile,
    LOCAL_STORAGE_DIR
};
