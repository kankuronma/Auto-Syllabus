let tokenClient;
let gapiInited = false;
let gisInited = false;

// TODO: Replace with your actual API key from Google Cloud Console
const API_KEY = 'YOUR_API_KEY_HERE';
const CLIENT_ID = '629284788331-i3md1r13u5u0pg8ajosphj2a9d5q76q7.apps.googleusercontent.com';

const SCOPES = 'https://www.googleapis.com/auth/calendar.events';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

export async function initGoogleAPI() {
  return new Promise((resolve, reject) => {
    const script1 = document.createElement('script');
    script1.src = 'https://apis.google.com/js/api.js';
    script1.onload = () => {
      gapi.load('client', async () => {
        try {
          await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: [DISCOVERY_DOC],
          });
          gapiInited = true;
          if (gisInited) resolve();
        } catch (err) {
          reject(err);
        }
      });
    };
    script1.onerror = reject;
    document.head.appendChild(script1);

    // Load Google Identity Services
    const script2 = document.createElement('script');
    script2.src = 'https://accounts.google.com/gsi/client';
    script2.onload = () => {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // Set later
      });
      gisInited = true;
      if (gapiInited) resolve();
    };
    script2.onerror = reject;
    document.head.appendChild(script2);
  });
}

export async function authorizeAndAddEvents(events) {
  return new Promise((resolve, reject) => {
    tokenClient.callback = async (resp) => {
      if (resp.error) {
        reject(resp);
        return;
      }
      try {
        const results = await addEventsToCalendar(events);
        resolve(results);
      } catch (err) {
        reject(err);
      }
    };
    
    if (gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
}

async function addEventsToCalendar(events) {
  const results = [];
  for (const event of events) {
    try {
      const request = {
        calendarId: 'primary',
        resource: {
          summary: event.title,
          description: event.description || `From syllabus: ${event.title}`,
          start: {
            dateTime: event.startDateTime,
            timeZone: event.timeZone || 'America/Winnipeg',
          },
          end: {
            dateTime: event.endDateTime,
            timeZone: event.timeZone || 'America/Winnipeg',
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 24 * 60 },
              { method: 'popup', minutes: 30 },
            ],
          },
        },
      };
      
      const response = await gapi.client.calendar.events.insert(request);
      results.push({ success: true, event: response.result });
    } catch (err) {
      results.push({ success: false, error: err.message, event: event.title });
    }
  }
  return results;
}

export function signOut() {
  const token = gapi.client.getToken();
  if (token !== null) {
    google.accounts.oauth2.revoke(token.access_token);
    gapi.client.setToken('');
  }
}

export function isAuthorized() {
  return gapi.client && gapi.client.getToken() !== null;
}