import multer from "multer";
import fs from "fs";
import path from "path";

const uploadDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedExtensions = /\.(png|jpe?g|gif|webp|bmp|svg|mp4|webm|mov|m4v|ogg|mp3|wav|m4a|aac|flac|pdf|txt|doc|docx)$/i;

function sanitizeFileName(name = "file") {
    return String(name)
        .replace(/[^a-zA-Z0-9._-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${sanitizeFileName(file.originalname || "upload")}`);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 20 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        const originalName = file?.originalname || "";
        if (!allowedExtensions.test(originalName)) {
            return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "file"));
        }

        cb(null, true);
    }
});

export default upload;
