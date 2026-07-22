/**
 * Service for browser native push notifications with click-to-navigate support
 */

export interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  onClickUrl?: string;
  onNavigate?: (url: string) => void;
}

class BrowserNotificationService {
  private hasPermission: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.hasPermission = Notification.permission === 'granted';
    }
  }

  public async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      this.hasPermission = true;
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === 'granted';
      return this.hasPermission;
    }

    return false;
  }

  public sendNotification(options: PushNotificationOptions) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    
    if (Notification.permission !== 'granted') {
      this.requestPermission().then((granted) => {
        if (granted) this.createNotification(options);
      });
    } else {
      this.createNotification(options);
    }
  }

  private createNotification({ title, body, icon, onClickUrl, onNavigate }: PushNotificationOptions) {
    try {
      const notification = new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: `diagnopro-notif-${Date.now()}`,
      });

      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
        if (onClickUrl && onNavigate) {
          onNavigate(onClickUrl);
        } else if (onClickUrl) {
          window.location.href = onClickUrl;
        }
      };
    } catch (err) {
      console.error('Failed to create browser notification:', err);
    }
  }
}

export const browserNotificationService = new BrowserNotificationService();
