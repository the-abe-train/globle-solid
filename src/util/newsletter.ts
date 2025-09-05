import { SUBSCRIBE_ENDPOINT, withGatewayHeaders } from './api';

const NEWSLETTER_SUBSCRIBED_KEY = 'twlNewsletterSubscribed';

export async function subscribeToNewsletter(email: string): Promise<boolean> {
  if (!email) {
    console.warn('Cannot subscribe to newsletter: no email provided');
    return false;
  }

  // Check if user wants to subscribe
  const wantsNewsletter = localStorage.getItem('twlNewsletter') === 'true';
  if (!wantsNewsletter) {
    console.log('User opted out of newsletter subscription');
    return false;
  }

  // Check if already subscribed this session
  const subscribedEmails = getSubscribedEmails();
  if (subscribedEmails.includes(email)) {
    console.log('Email already subscribed to newsletter this session');
    return true;
  }

  try {
    console.log('Subscribing to newsletter:', email);
    const res = await fetch(
      SUBSCRIBE_ENDPOINT,
      withGatewayHeaders({ method: 'POST', body: email }),
    );

    if (res.ok) {
      // Mark as subscribed for this session
      markEmailAsSubscribed(email);
      const text = await res.text();
      console.log('Newsletter subscription successful:', text);
      return true;
    } else {
      console.error('Newsletter subscription failed:', res.status, res.statusText);
      return false;
    }
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    return false;
  }
}

function getSubscribedEmails(): string[] {
  const stored = localStorage.getItem(NEWSLETTER_SUBSCRIBED_KEY);
  return stored ? JSON.parse(stored) : [];
}

function markEmailAsSubscribed(email: string): void {
  const subscribedEmails = getSubscribedEmails();
  if (!subscribedEmails.includes(email)) {
    subscribedEmails.push(email);
    localStorage.setItem(NEWSLETTER_SUBSCRIBED_KEY, JSON.stringify(subscribedEmails));
  }
}

export function isEmailSubscribed(email: string): boolean {
  return getSubscribedEmails().includes(email);
}

export function clearSubscriptionHistory(): void {
  localStorage.removeItem(NEWSLETTER_SUBSCRIBED_KEY);
}
