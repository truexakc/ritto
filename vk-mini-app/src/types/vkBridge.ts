/**
 * VK Bridge Types
 * Types for VK Bridge integration and Launch Params
 */

export interface VKUser {
  id: number;
  first_name: string;
  last_name: string;
  photo_url?: string;
}

export interface LaunchParams {
  vk_user_id: number;
  vk_app_id: number;
  vk_is_app_user: number;
  vk_are_notifications_enabled: number;
  vk_language: string;
  vk_platform: string;
  vk_ts: number;
  sign: string;
}
