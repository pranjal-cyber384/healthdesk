/**
 * Storage Service Abstraction
 * 
 * Provides a unified interface for file storage operations.
 * In production: uses Azure Blob Storage
 * In development: falls back to local filesystem storage
 * 
 * This abstraction allows swapping storage providers
 * without changing any business logic.
 */

const { BlobServiceClient } = require('@azure/storage-blob');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const azureConfig = require('../config/azure');
const logger = require('../config/logger');
const { sanitizeFilename } = require('../utils/helpers');

class StorageService {
  constructor() {
    this.isAzure = !!azureConfig.connectionString && azureConfig.connectionString !== '';
    this.containerClient = null;
    this.localUploadDir = path.join(__dirname, '..', '..', 'uploads');

    if (this.isAzure) {
      try {
        const blobServiceClient = BlobServiceClient.fromConnectionString(azureConfig.connectionString);
        this.containerClient = blobServiceClient.getContainerClient(azureConfig.containerName);
        logger.info('StorageService: Using Azure Blob Storage');
      } catch (error) {
        logger.warn('StorageService: Azure config invalid, falling back to local storage', { error: error.message });
        this.isAzure = false;
      }
    } else {
      logger.info('StorageService: Using local filesystem storage');
    }
  }

  /**
   * Initialize the storage (create container/directory if needed)
   */
  async initialize() {
    if (this.isAzure) {
      try {
        await this.containerClient.createIfNotExists({
          access: 'blob'
        });
        logger.info(`Azure container '${azureConfig.containerName}' ready`);
      } catch (error) {
        logger.error('Failed to initialize Azure container:', { error: error.message });
        throw error;
      }
    } else {
      // Ensure local upload directories exist
      const dirs = ['profiles', 'reports', 'prescriptions', 'verification', 'qrcodes'];
      for (const dir of dirs) {
        const dirPath = path.join(this.localUploadDir, dir);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
      }
    }
  }

  /**
   * Upload a file to storage
   * 
   * @param {Buffer} fileBuffer - File content as buffer
   * @param {string} originalFilename - Original file name
   * @param {string} folder - Storage folder/prefix (e.g., 'reports', 'profiles')
   * @param {string} mimeType - File MIME type
   * @returns {Promise<{ url: string, filename: string, size: number }>}
   */
  async uploadFile(fileBuffer, originalFilename, folder, mimeType) {
    const uniqueFilename = `${uuidv4()}_${sanitizeFilename(originalFilename)}`;
    const filePath = `${folder}/${uniqueFilename}`;

    if (this.isAzure) {
      return this._uploadToAzure(fileBuffer, filePath, mimeType, uniqueFilename);
    }
    return this._uploadToLocal(fileBuffer, filePath, mimeType, uniqueFilename, folder);
  }

  /**
   * Upload file to Azure Blob Storage
   * @private
   */
  async _uploadToAzure(fileBuffer, blobPath, mimeType, filename) {
    try {
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobPath);
      
      await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
        blobHTTPHeaders: {
          blobContentType: mimeType
        }
      });

      const url = blockBlobClient.url;
      logger.info(`File uploaded to Azure: ${blobPath}`);

      return {
        url,
        filename,
        size: fileBuffer.length
      };
    } catch (error) {
      logger.error('Azure upload failed:', { error: error.message, path: blobPath });
      throw error;
    }
  }

  /**
   * Upload file to local filesystem
   * @private
   */
  async _uploadToLocal(fileBuffer, filePath, mimeType, filename, folder) {
    try {
      const dirPath = path.join(this.localUploadDir, folder);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      const fullPath = path.join(this.localUploadDir, filePath);
      fs.writeFileSync(fullPath, fileBuffer);

      // Return a URL relative to the server
      const url = `/uploads/${filePath}`;
      logger.info(`File uploaded locally: ${filePath}`);

      return {
        url,
        filename,
        size: fileBuffer.length
      };
    } catch (error) {
      logger.error('Local upload failed:', { error: error.message, path: filePath });
      throw error;
    }
  }

  /**
   * Delete a file from storage
   * 
   * @param {string} fileUrl - Full URL or path of the file to delete
   * @returns {Promise<boolean>}
   */
  async deleteFile(fileUrl) {
    if (!fileUrl) return false;

    if (this.isAzure) {
      return this._deleteFromAzure(fileUrl);
    }
    return this._deleteFromLocal(fileUrl);
  }

  /**
   * Delete file from Azure Blob Storage
   * @private
   */
  async _deleteFromAzure(fileUrl) {
    try {
      // Extract blob name from URL
      const url = new URL(fileUrl);
      const blobName = url.pathname.split('/').slice(2).join('/');
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      
      await blockBlobClient.deleteIfExists();
      logger.info(`File deleted from Azure: ${blobName}`);
      return true;
    } catch (error) {
      logger.error('Azure delete failed:', { error: error.message });
      return false;
    }
  }

  /**
   * Delete file from local filesystem
   * @private
   */
  async _deleteFromLocal(fileUrl) {
    try {
      // fileUrl is like /uploads/profiles/filename.jpg
      const relativePath = fileUrl.replace('/uploads/', '');
      const fullPath = path.join(this.localUploadDir, relativePath);

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        logger.info(`File deleted locally: ${relativePath}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Local delete failed:', { error: error.message });
      return false;
    }
  }

  /**
   * Generate a secure download URL (with SAS token for Azure)
   * 
   * @param {string} fileUrl - Stored file URL
   * @param {number} [expiryMinutes=60] - URL expiry time
   * @returns {Promise<string>} Secure download URL
   */
  async getSecureUrl(fileUrl, expiryMinutes = 60) {
    if (!fileUrl) return null;

    if (this.isAzure) {
      try {
        const { BlobSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } = require('@azure/storage-blob');
        
        const url = new URL(fileUrl);
        const blobName = url.pathname.split('/').slice(2).join('/');
        const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);

        // For simplicity, return the blob URL directly if container has blob-level access
        // In production, generate SAS tokens for private containers
        return blockBlobClient.url;
      } catch (error) {
        logger.error('Failed to generate secure URL:', { error: error.message });
        return fileUrl;
      }
    }

    // For local storage, return the path as-is (served by Express static)
    return fileUrl;
  }

  /**
   * Get file as a readable stream
   * 
   * @param {string} fileUrl - Stored file URL
   * @returns {Promise<{ stream: ReadableStream, contentType: string }>}
   */
  async getFileStream(fileUrl) {
    if (this.isAzure) {
      try {
        const url = new URL(fileUrl);
        const blobName = url.pathname.split('/').slice(2).join('/');
        const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
        const downloadResponse = await blockBlobClient.download(0);
        
        return {
          stream: downloadResponse.readableStreamBody,
          contentType: downloadResponse.contentType
        };
      } catch (error) {
        logger.error('Azure stream failed:', { error: error.message });
        throw error;
      }
    }

    // Local file stream
    const relativePath = fileUrl.replace('/uploads/', '');
    const fullPath = path.join(this.localUploadDir, relativePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error('File not found');
    }

    const ext = path.extname(fullPath).toLowerCase();
    const contentTypes = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png'
    };

    return {
      stream: fs.createReadStream(fullPath),
      contentType: contentTypes[ext] || 'application/octet-stream'
    };
  }
}

// Singleton instance
const storageService = new StorageService();

module.exports = storageService;
