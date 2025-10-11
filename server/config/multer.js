import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(), // Lưu file vào memory thay vì disk
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = file.mimetype.includes('pdf') || 
                    file.mimetype.includes('msword') || 
                    file.mimetype.includes('vnd.openxmlformats-officedocument.wordprocessingml.document');

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed!'));
    }
  }
});

export default upload;