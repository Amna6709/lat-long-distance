const fs = require('fs');
const crypto = require('crypto');
const readline = require('readline');

function getDistanceInKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const rLat1 = lat1 * Math.PI / 180;
    const rLat2 = lat2 * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(rLat1) * Math.cos(rLat2) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function isValidLatitudeFormat(value) { return /^[+-]?[0-9]{1,}(\.[0-9]{1,})?$/.test(value.trim()); }
function isValidLongitudeFormat(value) { return /^[+-]?[0-9]{1,}(\.[0-9]{1,})?$/.test(value.trim()); }
function isValidLatitudeRange(value) { const num = parseFloat(value); return num >= -90 && num <= 90; }
function isValidLongitudeRange(value) { const num = parseFloat(value); return num >= -180 && num <= 180; }

function validateLatitude(value) {
    if (!isValidLatitudeFormat(value)) {
        console.log(`Invalid latitude format "${value}". Enter a valid decimal (e.g., 31.48294321)`);
        return false;
    }
    if (!isValidLatitudeRange(value)) {
        console.log(`Latitude value "${value}" out of range. Must be between -90 and 90.`);
        return false;
    }
    return true;
}

function validateLongitude(value) {
    if (!isValidLongitudeFormat(value)) {
        console.log(`Invalid longitude format "${value}". Enter a valid decimal (e.g., 131.48294321)`);
        return false;
    }
    if (!isValidLongitudeRange(value)) {
        console.log(`Longitude value "${value}" out of range. Must be between -180 and 180.`);
        return false;
    }
    return true;
}

function parseAndValidateInput(input) {
    const parts = input.split(',');
    if (parts.length !== 2) {
        console.log("Invalid format. Please enter latitude and longitude separated by a comma (e.g., 31.4829,174.3524)");
        return null;
    }
    const lat = parts[0].trim();
    const lon = parts[1].trim();
    if (!validateLatitude(lat) || !validateLongitude(lon)) { return null; }
    return { lat: parseFloat(lat), lon: parseFloat(lon) };
}

function makeNewRl() {
    return readline.createInterface({ input: process.stdin, output: process.stdout });
}

function askPoint1(rl, username, onComplete) {
    rl.removeAllListeners('SIGINT');

    rl.on('SIGINT', () => {
        console.log("\n\n[Ctrl+C] Returning to main menu...\n");
        rl.close();                          
        const freshRl = makeNewRl();        
        onComplete(freshRl);                 
    });

    rl.question('Enter Point 1 (Lat, Lon): ', (input) => {
        rl.removeAllListeners('SIGINT');
        const point1 = parseAndValidateInput(input);
        if (!point1) {
            console.log("Try again for Point 1...\n");
            askPoint1(rl, username, onComplete);
        } else {
            askPoint2(rl, point1, username, onComplete);
        }
    });
}

function askPoint2(rl, point1, username, onComplete) {
    rl.removeAllListeners('SIGINT');

    rl.on('SIGINT', () => {
        console.log("\n\n[Ctrl+C] Returning to main menu...\n");
        rl.close();
        const freshRl = makeNewRl();
        onComplete(freshRl);
    });

    rl.question('Enter Point 2 (Lat, Lon): ', (input) => {
        rl.removeAllListeners('SIGINT');
        const point2 = parseAndValidateInput(input);
        if (!point2) {
            console.log("Try again for Point 2...\n");
            askPoint2(rl, point1, username, onComplete);
        } else {
            calculateFinalDistance(rl, point1, point2, username, onComplete);
        }
    });
}

function calculateFinalDistance(rl, point1, point2, username, onComplete) {
    const distance = getDistanceInKm(point1.lat, point1.lon, point2.lat, point2.lon);

    console.log('\n-----------------------------------------');
    console.log('Distance: ' + distance + " " + 'km');

    const confirmedMax       = parseFloat(process.env.CONFIRMED_MAX)       || 15;
    const possibleMin        = parseFloat(process.env.POSSIBLE_MIN)        || 15;
    const possibleMax        = parseFloat(process.env.POSSIBLE_MAX)        || 50;
    const invalidGreaterThan = parseFloat(process.env.INVALID_GREATER_THAN) || 50;

    let status = 'Unknown';
    if (distance > invalidGreaterThan) {
        status = 'Invalid';
    } else if (distance >= possibleMin && distance <= possibleMax) {
        status = 'Possible';
    } else if (distance < confirmedMax) {
        status = 'Confirmed';
    }

    console.log('Status: ' + status);
    console.log('-----------------------------------------\n');

    const filename = process.env.RESULTS_FILE || 'results.json';
    const newRecord = {
        id: crypto.randomUUID(),
        username,
        point1,
        point2,
        distance: parseFloat(distance),
        status,
        timestamp: new Date().toISOString()
    };

    let fileData = [];
    try {
        if (fs.existsSync(filename)) {
            fileData = JSON.parse(fs.readFileSync(filename, 'utf8'));
        }
        fileData.push(newRecord);
        fs.writeFileSync(filename, JSON.stringify(fileData, null, 2), 'utf8');
        console.log(`Result successfully saved to ${filename}\n`);
    } catch (error) {
        console.log("Error saving to file:", error.message);
    }

    if (typeof onComplete === 'function') {
        onComplete(rl);  
    }
}

module.exports = { askPoint1, getDistanceInKm };