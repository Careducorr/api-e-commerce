import multer from 'multer';

const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (request, file, callback) => {

        if (file.mimetype.startsWith('image/')) {
            callback(null, true);
        } else {
            callback(new Error('Apenas imagens são permitidas'));
        }
    }
});

export { upload };