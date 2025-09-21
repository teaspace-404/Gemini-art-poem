// A simple analytics service to track user events.

interface EventPayload {
  [key: string]: any;
}

// A function to get or create a session ID.
// This uses sessionStorage, so the ID persists for the duration of the browser tab.
const getSessionId = (): string => {
  const SESSION_KEY = 'poem-for-art-session-id';
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    // Create a simple, reasonably unique ID.
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
};


/**
 * Sends a tracking event to a backend analytics endpoint.
 * This is designed to be a "fire-and-forget" operation. If it fails,
 * it will log an error to the console but will not disrupt the user experience.
 *
 * @param eventName A string naming the event, e.g., 'artwork_displayed'.
 * @param payload A JSON object containing data associated with the event.
 */
export const trackEvent = (eventName: string, payload: EventPayload): void => {
  // ====================================================================================
  // IMPORTANT: DEPLOYMENT STEP
  // 1. Deploy the Google Cloud Function located in the `cloud_function` directory.
  // 2. Once deployed, you will get an HTTP "Trigger URL".
  // 3. Replace the placeholder URL below with your actual Trigger URL.
  // ====================================================================================
  const endpoint = 'YOUR_GOOGLE_CLOUD_FUNCTION_URL_HERE';
  
  const sessionId = getSessionId();

  if (!endpoint || endpoint === 'YOUR_GOOGLE_CLOUD_FUNCTION_URL_HERE') {
    // We log to the console during development if the endpoint isn't configured.
    // This allows you to see the tracking events in your browser's developer tools.
    console.log(`%c[Analytics Event]%c ${eventName}`, 'color: #7c3aed; font-weight: bold;', 'color: inherit;', { sessionId, ...payload });
    return;
  }

  const eventData = {
    eventName,
    timestamp: new Date().toISOString(),
    sessionId, // Include the session ID in every event
    ...payload,
  };

  // Use navigator.sendBeacon if available for more reliable background sending,
  // otherwise fall back to fetch. sendBeacon is ideal for analytics as it
  // doesn't block the main thread and attempts to complete even if the page is closing.
  if (navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(eventData)], { type: 'application/json' });
    // navigator.sendBeacon returns false if the browser can't queue the request.
    if (!navigator.sendBeacon(endpoint, blob)) {
        console.warn('navigator.sendBeacon failed, falling back to fetch.');
        fallbackFetch(endpoint, eventData);
    }
  } else {
     fallbackFetch(endpoint, eventData);
  }
};


/**
 * A fallback function that uses the Fetch API to send analytics data.
 * @param endpoint The URL of the analytics endpoint.
 * @param eventData The analytics event data to send.
 */
const fallbackFetch = (endpoint: string, eventData: object) => {
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