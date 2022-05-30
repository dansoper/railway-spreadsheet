// @ts-check
const { google } = require('googleapis');
const fs = require('fs/promises');

 /**
 * @param {import("google-auth-library").OAuth2Client} auth
 * @param {string} spreadsheetId
 * @param {string} range
 * @param {string | object} pathOrStations
 * @param {string} tripsPath
 */
 async function getStationTripsFromSheet(auth, spreadsheetId, range, pathOrStations, tripsPath = "") {
    return new Promise(async (resolve, reject) => {
        try {
            const sheets = google.sheets({ version: 'v4', auth });
            sheets.spreadsheets.values.get({
                spreadsheetId: spreadsheetId,
                range: range,
                valueRenderOption: "UNFORMATTED_VALUE"
            }, async (err, res) => {
                if (err) {
                    console.error('The API returned an error: ' + err);
                    reject(err); return;
                }
                const rows = res.data.values;
                if (rows.length) {
                    let stations;
                    if (typeof pathOrStations == "string") {
                        const content = (await fs.readFile('stations.json')).toString();
                        stations = JSON.parse(content);
                    } else {
                        stations = pathOrStations;
                    }
                    const trips = [];
                    let date = null;
                    rows.map((row, i) => {
                        if (!isNaN(row[0])) {
                            date = new Date(1900, 0, --row[0])
                        } else {
                            const fromStation = stations.find(a => a.name == row[0]);
                            const toStation = stations.find(a => a.name == row[3]);
                            trips.push({
                                date,
                                from: row[0],
                                fromCode: fromStation != null ? fromStation.code : "NOCODE",
                                to: row[3],
                                toCode: toStation != null ? toStation.code : "NOCODE",
                                departure: row[1],
                                arrival: row[2],
                                stock: row[4],
                                notes: row[5]
                            });
                        }
                    });
                    if (tripsPath != "") await fs.writeFile(tripsPath, JSON.stringify(trips));
                    resolve(trips);
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

module.exports = { getStationTripsFromSheet };