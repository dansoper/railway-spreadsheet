// @ts-check
const { google } = require('googleapis');
const fs = require('fs/promises');

/**
 * @param {import ("google-auth-library").OAuth2Client} auth
 * @param {string} spreadsheetId
 * @param {string} range
 * @param {string} path
 */
function getStationCoordsFromSheet(auth, spreadsheetId, range, path = "") {
    return new Promise((resolve, reject) => {
        try {
            const sheets = google.sheets({ version: 'v4', auth });
            sheets.spreadsheets.values.get({
                spreadsheetId: spreadsheetId,
                range: range,
            }, async (err, res) => {
                if (err) {
                    console.error('The API returned an error: ' + err);
                    reject(err); return;
                }
                const rows = res.data.values;
                if (rows.length) {
                    const stations = [];
                    rows.map(row => {
                        stations.push({
                            lat: row[2],
                            long: row[3],
                            name: row[0],
                            code: row[1],
                            county: row[4]
                        });
                    });
                    if (path != "") {
                        await fs.writeFile(path, JSON.stringify(stations));
                    }
                    resolve(stations);
                } else {
                    console.error('No data found.');
                    reject("No data");
                }
            });
        } catch (err) {
            console.error(err);
            reject(err);
        }
    });
}

module.exports = { getStationCoordsFromSheet };