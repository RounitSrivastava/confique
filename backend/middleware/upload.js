const multer = require('multer');
const path = require('path');

// Configure multer for memory storage (no disk saving)
const storage = multer.memoryStorage();

// File filter to restrict file types
const fileFilter = (req, file, cb) => {
    // Check file types for images
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Configure multer with additional options
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 5 // Maximum 5 files per request
    }
});

// Specific upload configurations for different use cases
const uploadConfigs = {
    // For single avatar uploads
    singleAvatar: upload.single('avatar'),
    
    // For showcase logo uploads
    singleLogo: upload.single('logo'),
    
    // For showcase banner uploads  
    singleBanner: upload.single('banner'),
    
    // For multiple images (events, posts, etc.)
    multipleImages: upload.array('images', 5), // max 5 images
    
    // For mixed fields (common in forms)
    mixedFields: upload.fields([
        { name: 'avatar', maxCount: 1 },
        { name: 'logo', maxCount: 1 },
        { name: 'banner', maxCount: 1 },
        { name: 'images', maxCount: 5 }
    ]),
    
    // For payment screenshot uploads
    paymentScreenshot: upload.single('paymentScreenshot')
};

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        // Multer-specific errors
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: 'File too large',
                details: 'Maximum file size is 5MB'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                message: 'Too many files',
                details: 'Maximum 5 files allowed'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                message: 'Unexpected field',
                details: 'Check field names in your form'
            });
        }
    } else if (error) {
        // Other errors (like fileFilter errors)
        return res.status(400).json({
            message: 'File upload error',
            details: error.message
        });
    }
    next();
};

// Helper function to validate file types
const validateFileType = (file, allowedTypes = ['image/jpeg', 'image/png', 'image/webp']) => {
    return file && allowedTypes.includes(file.mimetype);
};

// Helper function to get file extension
const getFileExtension = (filename) => {
    return path.extname(filename).toLowerCase();
};

// Helper function to generate unique filename
const generateUniqueFilename = (originalname) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = getFileExtension(originalname);
    return `file_${timestamp}_${randomString}${extension}`;
};

module.exports = {
    upload,
    ...uploadConfigs,
    handleMulterError,
    validateFileType,
    getFileExtension,
    generateUniqueFilename
};