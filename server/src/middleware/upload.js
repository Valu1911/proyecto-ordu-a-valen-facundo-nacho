import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadsBase = join(__dirname, '..', '..', '..', 'uploads');

// Ensure directories exist
['products', 'chat', 'avatars'].forEach(dir => {
  const path = join(uploadsBase, dir);
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
});

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imagenes JPG, PNG o WebP'), false);
  }
};

// Temporary storage (will be processed by Sharp)
const tempStorage = multer.memoryStorage();

// Product images (max 6)
export const uploadProductImages = multer({
  storage: tempStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
}).array('images', 6);

// Chat image (max 1)
export const uploadChatImage = multer({
  storage: tempStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
}).single('image');

// Avatar (max 1)
export const uploadAvatar = multer({
  storage: tempStorage,
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024, files: 1 },
}).single('avatar');

// Process and save image with Sharp
export async function processImage(buffer, folder, options = {}) {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 80,
  } = options;

  const filename = `${uuidv4()}.webp`;
  const outputPath = join(uploadsBase, folder, filename);

  await sharp(buffer)
    .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality })
    .toFile(outputPath);

  return `/uploads/${folder}/${filename}`;
}

// Process avatar (square crop)
export async function processAvatar(buffer) {
  const filename = `${uuidv4()}.webp`;
  const outputPath = join(uploadsBase, 'avatars', filename);

  await sharp(buffer)
    .resize(300, 300, { fit: 'cover', position: 'centre' })
    .webp({ quality: 85 })
    .toFile(outputPath);

  return `/uploads/avatars/${filename}`;
}
