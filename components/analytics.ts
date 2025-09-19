// A simple analytics service to track user events.

interface EventPayload {
  [key: string]: any;
}

/**
 * Sends a tracking event to a backend analytics endpoint.
 * This is designed to be a "fire-and-forget" operation. If it fails,
 * it will log an error to the console but will not disrupt the user experience.
 *
 * @param eventName A string naming the event, e.g., 'artwork_displayed'.
 * @param payload A JSON object containing data associated with the event.
 */
export const trackEvent = (eventName: string, payload: EventPayload): void => {
  // In a real-world scenario, this URL would come from an environment variable.
  // For example: const endpoint = process.env.REACT_APP_TRACKING_ENDPOINT;
  const endpoint = 'YOUR_GOOGLE_CLOUD_FUNCTION_URL_HERE';

  if (!endpoint || endpoint === 'YOUR_GOOGLE_CLOUD_FUNCTION_URL_HERE') {
    console.warn('Analytics tracking endpoint is not configured.');
    return;
  }

  const eventData = {
    eventName,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  // Use navigator.sendBeacon if available for more reliable background sending,
  // otherwise fall back to fetch.
  if (navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(eventData)], { type: 'application/json' });
    navigator.sendBeacon(endpoint, blob);
  } else {
     fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
      keepalive: true, // Helps ensure the request completes even if the page is closing
    }).catch(error => {
      console.error('Analytics tracking error:', error);
    });
  }
};
