import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { File, FileRequest } from '../interfaces/file.interfaces';

// Create a decorator for handling file uploads
export const FileUpload = createParamDecorator(
  (
    param: string | { key: string; required: boolean }, // Parameter can be either a string or an object containing key and required flag
    context: ExecutionContext,
  ): File | File[] => {
    const req = context.switchToHttp().getRequest();
    let files;

    // Check if the parameter is a string or an object
    if (typeof param === 'string') {
      // If it's a string, extract files from the request body using the parameter as the key
      files = req.body[param];
    } else {
      // If it's an object, extract files using the key specified in the object
      const paramObject = param as { key: string; required: boolean };
      files = req.body[paramObject.key];

      // If the parameter is marked as required and files are not found, throw an error
      if (paramObject.required && !files) {
        throw new Error('File is required');
      }
    }

    // If files is an array, process each file
    if (Array.isArray(files)) {
      return files.map((file: FileRequest) => {
        // Check if file data is present
        if (file.data == null || file.data == undefined) {
          throw new Error('File data is required');
        }
        // Process file data
        const data = getClearData(file.data);
        return {
          name: file.name,
          data: data.data,
          type: data.type,
          size: file.data.length,
        };
      });
    } else {
      // If files is not an array, process a single file
      const file: FileRequest = files;
      // Check if file data is present
      if (file.data == null || file.data == undefined) {
        throw new Error('File data is required');
      }
      // Process file data
      const data = getClearData(file.data);
      return {
        name: file.name,
        data: data.data,
        type: data.type,
        size: file.data.length,
      };
    }
  },
);

// Define a type for clear file data
type DataFile = { type: string; data: string };

// Function to extract clear data from file data
const getClearData = (rawData: string): DataFile => {
  // Define a regular expression to extract file type
  const typeRegex = /data:image\/([a-zA-Z0-9]+);base64/;
  // Match the regular expression against the raw data
  const match = rawData.match(typeRegex);

  // If no match is found or match is incomplete, throw an error
  if (!match || match.length < 2) {
    throw new Error('File data header is required');
  }

  // Extract the file type from the matched string
  const fileType = match[1];
  // Extract the file data by removing the header from the raw data
  const data = rawData.replace(/^data:[a-zA-Z0-9-+/]+;base64,/, '');

  // Return an object containing the file type and clear data
  return { type: fileType, data };
};
