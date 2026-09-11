const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer Storage Engine
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    const prefix = file.fieldname === 'avatar' ? 'avatar' : 'attachment';
    cb(null, `${prefix}-${uniqueSuffix}${ext}`);
  },
});

// File Filter
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (file.fieldname === 'avatar') {
    // Avatar upload: images only
    const allowedImageTypes = /jpeg|jpg|png|webp|gif/;
    if (allowedImageTypes.test(ext) && allowedImageTypes.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, webp, gif) are allowed for profile avatars!'), false);
    }
  } else {
    // Message attachments: images, documents, audio, spreadsheets, text
    // Block executable or scripting files for security
    const dangerousExtensions = /^\.(exe|bat|cmd|sh|php|js|vbs|msi|dll|scr|jar|py)$/i;
    if (dangerousExtensions.test(ext)) {
      cb(new Error('Executable and script file uploads are not allowed for security reasons.'), false);
    } else {
      cb(null, true);
    }
  }
};

// Upload Middleware Instance (Supports up to 25MB files)
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter,
});

module.exports = upload;
