import { Injectable } from '@nestjs/common';
import { File } from './interfaces/file.interfaces';
import * as fs from 'fs';
import * as path from 'path';
let AWS;

try {
  AWS = require('@aws-sdk/client-s3');
} catch (error) {
  console.log('AWS not installed');
}

@Injectable()
export class FileUploadService {
  // Save Local
  async saveLocal(file: File, folderPath: string): Promise<boolean> {
    // Convert file data to a buffer
    const buffer = Buffer.from(file.data, 'base64');

    try {
      // Check if the folder path exists, if not, create it
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      // Define the file path where the file will be saved
      const pathFile = path.join(folderPath, file.name);

      // Write the file to disk
      await fs.writeFileSync(pathFile, buffer);

      // Return true to indicate successful saving
      return true;
    } catch (error) {
      // If an error occurs, throw the error
      throw new Error(error);
    }
  }

  //Save S3
  async saveS3(file: File, options: S3Options): Promise<boolean> {
    // Check if AWS is available
    if (!AWS) {
      throw new Error('AWS (@aws-sdk/client-s3) is required');
    }

    // Convert file data to a buffer
    const buffer = Buffer.from(file.data, 'base64');

    // Create an S3 client instance with the provided options
    const s3 = new AWS.S3Client({
      region: options.Region,
      credentials: {
        accessKeyId: options.AccessKeyId,
        secretAccessKey: options.SecretAccessKey,
      },
    });

    // Send the PutObject command to upload the file to S3
    const data = await s3.send(
      new AWS.PutObjectCommand({
        Bucket: options.Bucket,
        Key: options.Key,
        Body: buffer,
      }),
    );

    // Return true to indicate successful upload
    return true;
  }
}
export type S3Options = {
  Bucket: string;
  Region: string;
  AccessKeyId: string;
  SecretAccessKey: string;
  Key: string | null;
};
