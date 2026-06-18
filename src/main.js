require('dotenv').config(); 
const readline = require('readline');
const fs = require('fs');
const { askPoint1 } = require('./distanceCalc');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function initApp() {
    const appName = process.env.APP_NAME || "Distance Calculator";
    
    console.log(`=============================================================`);
    console.log(`                Welcome to ${appName}                        `);
    console.log(`=============================================================`);
    
    askForName(); 
}
function askForName() {
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
        console.log(`Welcome ${username}!`);
        console.log("=============================================================\n");
        showMenu();
    });
}
function showMenu() {
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
        askPoint1(rl, showMenu); 
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
    console.log("                  PREVIOUS HISTORY RESULTS                   ");
    console.log("=============================================================");

    if (!fs.existsSync(filename)) {
        console.log("\nNo history found. Perform a calculation first!\n");
        console.log("=============================================================\n");
        showMenu();
        return;
    }

    try {
        const rawData = fs.readFileSync(filename, 'utf8');
        const records = JSON.parse(rawData);

        if (records.length === 0) {
            console.log("\nHistory file is empty.\n");
            console.log("=============================================================\n");
            showMenu();
            return;
        }

        const confirmedList = records.filter(r => r.status === 'Confirmed');
        const possibleList = records.filter(r => r.status === 'Possible');
        const invalidList = records.filter(r => r.status === 'Invalid');

        console.log("\n--- [ CONFIRMED ] ---");
        if (confirmedList.length === 0) console.log("No records.");
        confirmedList.forEach((r, index) => {
            console.log(`${index + 1}. Dist: ${r.distance} km | Time: ${r.timestamp}`);
        });

        console.log("\n--- [ POSSIBLE ] ---");
        if (possibleList.length === 0) console.log("No records.");
        possibleList.forEach((r, index) => {
            console.log(`${index + 1}. Dist: ${r.distance} km | Time: ${r.timestamp}`);
        });

        console.log("\n--- [ INVALID ] ---");
        if (invalidList.length === 0) console.log("No records.");
        invalidList.forEach((r, index) => {
            console.log(`${index + 1}. Dist: ${r.distance} km | Time: ${r.timestamp}`);
        });

    } catch (error) {
        console.log("Error reading history:", error.message);
    }

    console.log("\n=============================================================\n");
    showMenu();
}

initApp();