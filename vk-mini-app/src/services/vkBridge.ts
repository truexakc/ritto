/**
 * VK Bridge Service
 * Handles VK Bridge initialization, user info retrieval, and Launch Params extraction
 */

import bridge, {
  type VKBridgeSubscribeHandler,
} from '@vkontakte/vk-bridge';
import type { VKUser, LaunchParams } from '../types/vkBridge';

class VKBridgeService {
  private initialized = false;
  private launchParams: LaunchParams | null = null;

  /**
   * Initialize VK Bridge
   * Must be called before using other methods
   */
  async init(): Promise<void> {
    try {
      // Initialize VK Bridge
      await bridge.send('VKWebAppInit');
      this.initialized = true;

      // Extract and store Launch Params from URL
      this.launchParams = this.extractLaunchParams();
    } catch (error) {
      console.error('Failed to initialize VK Bridge:', error);
      throw new Error('VK Bridge initialization failed');
    }
  }

  /**
   * Get VK user information
   * @returns Promise with VK user data
   */
  async getUserInfo(): Promise<VKUser> {
    if (!this.initialized) {
      throw new Error('VK Bridge not initialized. Call init() first.');
    }

    try {
      const userInfo = await bridge.send('VKWebAppGetUserInfo');
      
      return {
        id: userInfo.id,
        first_name: userInfo.first_name,
        last_name: userInfo.last_name,
        photo_url: userInfo.photo_200 || userInfo.photo_100 || undefined,
      };
    } catch (error) {
      console.error('Failed to get user info:', error);
      throw new Error('Failed to retrieve user information');
    }
  }

  /**
   * Get Launch Params extracted during initialization
   * @returns Launch Params object
   */
  getLaunchParams(): LaunchParams {
    if (!this.initialized) {
      throw new Error('VK Bridge not initialized. Call init() first.');
    }

    if (!this.launchParams) {
      throw new Error('Launch Params not available');
    }

    return this.launchParams;
  }

  /**
   * Extract Launch Params from URL query string
   * @private
   */
  private extractLaunchParams(): LaunchParams {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Extract all required Launch Params
    const vk_user_id = urlParams.get('vk_user_id');
    const vk_app_id = urlParams.get('vk_app_id');
    const vk_is_app_user = urlParams.get('vk_is_app_user');
    const vk_are_notifications_enabled = urlParams.get('vk_are_notifications_enabled');
    const vk_language = urlParams.get('vk_language');
    const vk_platform = urlParams.get('vk_platform');
    const vk_ts = urlParams.get('vk_ts');
    const sign = urlParams.get('sign');

    // Validate required params
    if (!vk_user_id || !vk_app_id || !vk_ts || !sign) {
      throw new Error('Missing required Launch Params');
    }

    return {
      vk_user_id: parseInt(vk_user_id, 10),
      vk_app_id: parseInt(vk_app_id, 10),
      vk_is_app_user: parseInt(vk_is_app_user || '0', 10),
      vk_are_notifications_enabled: parseInt(vk_are_notifications_enabled || '0', 10),
      vk_language: vk_language || 'ru',
      vk_platform: vk_platform || 'mobile_web',
      vk_ts: parseInt(vk_ts, 10),
      sign: sign,
    };
  }

  /**
   * Subscribe to VK Bridge events
   * @param handler Event handler function
   */
  subscribe(handler: VKBridgeSubscribeHandler): void {
    bridge.subscribe(handler);
  }

  /**
   * Unsubscribe from VK Bridge events
   * @param handler Event handler function
   */
  unsubscribe(handler: VKBridgeSubscribeHandler): void {
    bridge.unsubscribe(handler);
  }
}

// Export singleton instance
export const vkBridgeService = new VKBridgeService();
export default vkBridgeService;
