import { error } from "console";
import authenticate from "./authForCalendar";
import cred from "./credentials";

const {google} = require('googleapis');
const calendar = google.calendar({ version: 'v3', auth: 'AIzaSyAlEyEbWbka3anHeT3q4lWUw3D0of45Apk' });

async function main () {
    let authed = authenticate();
    let dateTime = new Date();
    let parsedTime = dateTime.toISOString();
    dateTime.setHours(dateTime.getHours+1);
    parsedTime = dateTime.toISOString();

    if (!authed) {
        throw new error();
    }

    const response = await calendar.events.insert({
        calenderId: 'primary',
        requestBody: {
            start: {
                parsedTime,
            },
            end: {
                parsedTime,
            }
        },
    });

}

async function authenticate() {
    let authed = false;
    const oauth2Client = new google.Auth.OAuth2Client(
        {
            clientId: cred.clientId,
            clientSecret: cred.clientSecret,
            redirectUri: 'http://localhost:8000'
        }
    )

    const SCOPE = ['https://www.googleapis.com/auth/calendar'];

    google.options({ auth: oauth2Client });

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPE
    });

    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens);
    authed = true;

    return authed;
}



main().catch(e => {
    console.log(e);
});