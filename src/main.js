require('dotenv').config();
const readline = require('readline');
const fs = require('fs');
const { askPoint1 } = require('./distanceCalc');

let rl = readline.createInterface({ input: process.stdin, output: process.stdout });

let currentSessionUser = "";

function setupSigint() {
    rl.removeAllListeners('SIGINT');
    rl.on('SIGINT', () => {
        console.log("\n\n[Ctrl+C] Returning to main menu...\n");
        showMenu();
    });
}

function initApp() {
    const appName = process.env.APP_NAME || "Distance Calculator";
    console.log(`=============================================================`);
    console.log(`                      Welcome to ${appName}                   `);
    console.log(`=============================================================`);
    askForName();
}

function askForName() {
    rl.removeAllListeners('SIGINT');
    rl.on('SIGINT', () => {
        console.log("\n\nName is required to continue. Please enter your name.\n");
        askForName();
    });
    rl.question('Enter your name: ', (input) => {
        const username = input.trim();

        if (!username) {
            console.log("Name cannot be empty. Please enter a valid name.\n");
            return askForName();
        }

        const nameRegex = /^[a-zA-Z\s]{2,30}$/;
        if (!nameRegex.test(username)) {
            console.log("Invalid name! Name should only contain letters and spaces (e.g., Amna or John Doe).\n");
            return askForName();
        }

        currentSessionUser = username;
        console.log(`Welcome ${username}!`);
        console.log("=============================================================\n");
        showMenu();
    });
}

function showMenu(freshRl) {
    if (freshRl) {
        rl = freshRl;
    }

    setupSigint();

    console.log("What would you like to do today?");
    console.log("1. Calculate distance between two points using lat and long");
    console.log("2. Display previous results");
    console.log("3. Exit App");
    console.log("=============================================================");

    rl.question('Enter Number for action to perform: ', (choice) => {
        handleMenuChoice(choice.trim());
    });
}

function handleMenuChoice(choice) {
    if (choice === '1') {
        console.log("\nStarting Distance Calculator...\n");
        askPoint1(rl, currentSessionUser, showMenu);
    } else if (choice === '2') {
        displayPreviousResults();
    } else if (choice === '3') {
        console.log("\nExiting App. Goodbye!");
        rl.close();
        process.exit(0);
    } else {
        console.log("\nInvalid option! Please select 1, 2, or 3.\n");
        showMenu();
    }
}

function displayPreviousResults() {
    const filename = process.env.RESULTS_FILE || 'results.json';

    console.log("\n=============================================================");
    console.log("                    PREVIOUS HISTORY RESULTS");
    console.log("=============================================================");

    if (!fs.existsSync(filename)) {
        console.log("\nNo history found. Perform a calculation first!\n");
        console.log("=============================================================\n");
        showMenu();
        return;
    }

    try {
        const rawData = fs.readFileSync(filename, 'utf8');

        let records;
        try {
            records = JSON.parse(rawData);
        } catch (jsonErr) {
            console.log("History file data formatted incorrectly.");
            console.log("=============================================================\n");
            showMenu();
            return;
        }

        if (records.length === 0) {
            console.log("\nHistory file is empty.\n");
            console.log("=============================================================\n");
            showMenu();
            return;
        }

        const confirmedList = records.filter(r => r && r.status === 'Confirmed');
        const possibleList = records.filter(r => r && r.status === 'Possible');
        const invalidList = records.filter(r => r && r.status === 'Invalid');

        const validateRecord = (r) => {
            const errors = [];

            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!r.id) {
                errors.push("ID       : N/A (Missing ID)");
            } else if (!uuidRegex.test(r.id)) {
                errors.push(`ID       : "${r.id}" (Invalid UUID format)`);
            }

            const nameRegex = /^[a-zA-Z\s]{2,30}$/;
            if (!r.username) {
                errors.push("Username : N/A (Missing Username)");
            } else if (!nameRegex.test(r.username)) {
                errors.push(`Username : "${r.username}" (Invalid — only letters/spaces, 2-30 chars)`);
            }

            if (!r.point1) {
                errors.push("Point 1  : N/A (Missing Point1)");
            } else {
                if (r.point1.lat === undefined || r.point1.lat === null) {
                    errors.push("Point 1  : Latitude missing");
                } else if (typeof r.point1.lat !== 'number' || r.point1.lat < -90 || r.point1.lat > 90) {
                    errors.push(`Point 1  : Latitude "${r.point1.lat}" is invalid (must be -90 to 90)`);
                }
                if (r.point1.lon === undefined || r.point1.lon === null) {
                    errors.push("Point 1  : Longitude missing");
                } else if (typeof r.point1.lon !== 'number' || r.point1.lon < -180 || r.point1.lon > 180) {
                    errors.push(`Point 1  : Longitude "${r.point1.lon}" is invalid (must be -180 to 180)`);
                }
            }

            if (!r.point2) {
                errors.push("Point 2  : N/A (Missing Point2)");
            } else {
                if (r.point2.lat === undefined || r.point2.lat === null) {
                    errors.push("Point 2  : Latitude missing");
                } else if (typeof r.point2.lat !== 'number' || r.point2.lat < -90 || r.point2.lat > 90) {
                    errors.push(`Point 2  : Latitude "${r.point2.lat}" is invalid (must be -90 to 90)`);
                }
                if (r.point2.lon === undefined || r.point2.lon === null) {
                    errors.push("Point 2  : Longitude missing");
                } else if (typeof r.point2.lon !== 'number' || r.point2.lon < -180 || r.point2.lon > 180) {
                    errors.push(`Point 2  : Longitude "${r.point2.lon}" is invalid (must be -180 to 180)`);
                }
            }

            if (r.distance === undefined || r.distance === null) {
                errors.push("Distance : N/A (Missing Distance)");
            } else if (typeof r.distance !== 'number' || isNaN(r.distance) || r.distance < 0) {
                errors.push(`Distance : "${r.distance}" (Invalid — must be a positive number)`);
            }

            if (!r.timestamp) {
                errors.push("Time     : N/A (Missing Timestamp)");
            } else {
                const parsedDate = Date.parse(r.timestamp);
                const isISOFormat = r.timestamp.includes('T') && r.timestamp.endsWith('Z');
                if (isNaN(parsedDate) || !isISOFormat) {
                    errors.push(`Time     : "${r.timestamp}" (Invalid — must be ISO format e.g. 2026-06-19T18:10:01.469Z)`);
                }
            }

            return errors;
        };

        const printRecords = (list) => {
            if (list.length === 0) { console.log("  No records."); return; }

            list.forEach((r, index) => {
                const errors = validateRecord(r);

                const distanceDisplay = (r.distance !== undefined && r.distance !== null && typeof r.distance === 'number' && !isNaN(r.distance))
                    ? `${r.distance} km` : "N/A";
                const point1Display = (r.point1 && typeof r.point1.lat === 'number' && typeof r.point1.lon === 'number')
                    ? `(${r.point1.lat}, ${r.point1.lon})` : "N/A";
                const point2Display = (r.point2 && typeof r.point2.lat === 'number' && typeof r.point2.lon === 'number')
                    ? `(${r.point2.lat}, ${r.point2.lon})` : "N/A";
                const timeDisplay = (r.timestamp && r.timestamp.includes('T') && r.timestamp.endsWith('Z') && !isNaN(Date.parse(r.timestamp)))
                    ? r.timestamp : "N/A";

                console.log(`  ${index + 1}.`);
                console.log(`     ID       : ${r.id || "N/A"}`);
                console.log(`     Username : ${r.username || "N/A"}`);
                console.log(`     Point 1  : ${point1Display}`);
                console.log(`     Point 2  : ${point2Display}`);
                console.log(`     Distance : ${distanceDisplay}`);
                console.log(`     Time     : ${timeDisplay}`);

                if (errors.length > 0) {
                    console.log(`RECORD ISSUES DETECTED:`);
                    errors.forEach(err => console.log(`        ✗ ${err}`));
                }
                console.log(`     ---`);
            });
        };

        console.log("\n--- [ CONFIRMED ] ---");
        printRecords(confirmedList);

        console.log("\n--- [ POSSIBLE ] ---");
        printRecords(possibleList);

        console.log("\n--- [ INVALID ] ---");
        printRecords(invalidList);

    } catch (error) {
        console.log("Error reading history:", error.message);
    }

    console.log("\n=============================================================\n");
    showMenu();
}



initApp();