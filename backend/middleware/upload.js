const multer = require('multer');

// This configuration of multer does not save any files to the disk.
// It is simply used to parse 'multipart/form-data' requests,
// which is what we need for our form submission.
const upload = multer();

module.exports = upload;