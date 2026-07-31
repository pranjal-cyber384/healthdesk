/**
 * Azure Blob Storage Configuration
 * 
 * Provides configuration for Azure Blob Storage connection.
 * The actual storage logic is abstracted in StorageService.
 */

const azureConfig = {
  connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
  containerName: process.env.AZURE_STORAGE_CONTAINER_NAME || 'healthdesk-files',
  // Maximum file size in bytes (10MB)
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760,
  // Allowed MIME types
  allowedMimeTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/jpg,image/png,application/pdf')
    .split(',')
    .map(t => t.trim()),
  // SAS token expiry time in minutes
  sasTokenExpiry: 60
};

module.exports = azureConfig;
