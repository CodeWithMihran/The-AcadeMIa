const multer = require("multer");

const acceptedTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024, files: 1, fields: 8 },
    fileFilter: (req, file, callback) => callback(null, acceptedTypes.has(file.mimetype))
});

module.exports = (req, res, next) => {
    upload.single("file")(req, res, (error) => {
        if (error) {
            const message = error.code === "LIMIT_FILE_SIZE"
                ? "Files must be 8 MB or smaller."
                : error.code === "LIMIT_UNEXPECTED_FILE"
                    ? "Upload one PDF or image file."
                    : "Upload a PDF, JPEG, or PNG file.";
            return res.status(400).json({ success: false, message });
        }
        next();
    });
};
