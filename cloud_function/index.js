const { Firestore, FieldValue } = require('@google-cloud/firestore');

// Initialize Firestore
const firestore = new Firestore();
const SESSIONS_COLLECTION = 'sessions';
const TEN_MINUTES_MS = 10 * 60 * 1000;

/**
 * A stateful Google Cloud Function to track user sessions in Firestore.
 *
 * @param {object} req Express-like request object.
 * @param {object} res Express-like response object.
 */
exports.helloHttp = async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const { sessionId, eventName, timestamp, ...payload } = req.body;

  if (!sessionId || !eventName) {
    res.status(400).send('Bad Request: "sessionId" and "eventName" are required.');
    return;
  }

  const sessionRef = firestore.collection(SESSIONS_COLLECTION).doc(sessionId);
  const eventTimestamp = new Date(timestamp);

  try {
    await firestore.runTransaction(async (transaction) => {
      const sessionDoc = await transaction.get(sessionRef);
      let sessionData;

      if (!sessionDoc.exists) {
        // First event for this session, create the document.
        sessionData = {
          startTime: eventTimestamp,
          lastSeen: eventTimestamp,
          artworkViewsInFirst10Min: 0,
          totalEvents: 0,
          events: [], // Store a history of events if desired
        };
      } else {
        sessionData = sessionDoc.data();
      }

      // --- Core Session Logic ---
      
      // 1. Check if the event is within the first 10 minutes of the session start.
      const isWithinFirst10Min = eventTimestamp.getTime() - sessionData.startTime.toDate().getTime() < TEN_MINUTES_MS;
      
      // 2. If it's an 'artwork_displayed' event in that window, increment the counter.
      if (eventName === 'artwork_displayed' && isWithinFirst10Min) {
        sessionData.artworkViewsInFirst10Min += 1;
      }
      
      // 3. Update general session stats.
      sessionData.lastSeen = eventTimestamp;
      sessionData.totalEvents += 1;
      
      // 4. (Optional) Append the current event to an array for detailed logging.
      sessionData.events.push({
          eventName,
          timestamp: eventTimestamp,
          payload: payload
      });

      // 5. Commit the changes to Firestore.
      if (!sessionDoc.exists) {
        transaction.create(sessionRef, sessionData);
      } else {
        transaction.update(sessionRef, sessionData);
      }
    });

    res.status(200).send({ message: 'Session updated successfully.' });

  } catch (error) {
    console.error('Firestore transaction failed:', error);
    res.status(500).send('Internal Server Error');
  }
};