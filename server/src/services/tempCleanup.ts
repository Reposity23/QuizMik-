import fs from "fs/promises";

export const cleanupFiles = async (files: Express.Multer.File[]) => {
  await Promise.all(
    files.map(async (file) => {
      try {
        await fs.unlink(file.path);
      } catch {
        // ignore cleanup errors
      }
    })
  );
};
