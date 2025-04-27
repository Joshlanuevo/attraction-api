import { Request} from 'express';
import { FirebaseLib } from '../lib/FirebaseLib';
import { FirebaseCollections } from '../enums/FirebaseCollections';
import { createHash } from 'crypto';

export class WhitelabelService {
    /**
     * Get whitelabel configuration based on host
     * @returns {Promise<Object|null>} - Whitelabel configuration or null if not found
     */
    static async getWhitelabelConfigFromHost(req: Request) {
      try {
        // Get host from request headers
        const host = WhitelabelService.getCurrentHost(req);
        if (!host) {
          return null;
        }
        
        // Create MD5 hash of the host
        const hostHash = createHash('md5').update(host).digest('hex');
        
        // Get whitelabel config from Firebase
        const firebase = new FirebaseLib();
        const whitelabelConfig = await firebase.getData(
          FirebaseCollections.whitelabel_configs,
          hostHash,
        );
        
        if (!whitelabelConfig) {
          return null;
        }
        
        return whitelabelConfig;
      } catch (error) {
        console.error('Error getting whitelabel config:', error);
        return null;
      }
    }
    
    /**
     * Get current host from the request
     * @param {Request} req - Express request object
     * @returns {string|null} - The current host
     */
    static getCurrentHost(req: Request) {
      try {
        let host = '';
        const origin = req.header('origin');
        
        if (origin) {
          // Strip protocol from origin
          if (origin.startsWith('https://')) {
            host = origin.replace('https://', '');
          } else if (origin.startsWith('http://')) {
            host = origin.replace('http://', '');
          }
        }
        
        // Fall back to host header if origin doesn't exist or couldn't be parsed
        if (!host) {
          host = req.header('host') || '';
        }
        
        return host || null;
      } catch (error) {
        console.error('Error getting host:', error);
        return null;
      }
    }
}