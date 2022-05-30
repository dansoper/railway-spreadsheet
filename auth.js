// @ts-check
const { google } = require('googleapis');
const fs = require('fs/promises');
const readline = require('readline');
const util = require('util');

/**
 * @param {{ installed: { client_secret: any; client_id: any; redirect_uris: any; }; }} credentials
 */
 async function authorize(credentials, pathToToken, scopes, failOnNoAuth = false) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    let parsedToken = await readFileJson(pathToToken);

    if (parsedToken == "" || parsedToken == null) {
        console.log("No token found");
        if (failOnNoAuth) { throw "No token"; }
        parsedToken = await getNewToken(oAuth2Client, pathToToken, scopes);
    }
    oAuth2Client.setCredentials(parsedToken);
    // This bit forces the client to use the refresh token - which may fail and so we can try get new token
    try {
        await oAuth2Client.getRequestHeaders();
    } catch (err) {
        if (failOnNoAuth) { throw "No token"; }
        parsedToken = await getNewToken(oAuth2Client, pathToToken, scopes);
        oAuth2Client.setCredentials(parsedToken);
    }
    return oAuth2Client;
}

async function getNewToken(oAuth2Client, pathToToken, scopes) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const question = util.promisify(rl.question).bind(rl);
    const code = await question('Enter the code from that page here: ');
    rl.close();
    const token = await oAuth2Client.getToken(code).catch(err => {
        return console.error('Error while trying to retrieve access token', err);
    });
    // Store the token to disk for later program executions
    await fs.writeFile(pathToToken, JSON.stringify(token.tokens)).catch(err => {
        return console.error(err);
    });
    console.log('Token stored to ' + pathToToken);
    return token.tokens;
}

async function readFileJson(path) {
    let buffer = await fs.readFile(path);
    let parsedToken = null;
    if (buffer != null) {
        parsedToken = buffer.toString();
    }
    if (typeof parsedToken == "string" && parsedToken != "") {
        parsedToken = JSON.parse(parsedToken);
    }
    return parsedToken;
}

module.exports = { authorize };