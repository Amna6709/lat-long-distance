const fs = require('fs');
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

function askPoint1(rl, onComplete) { 
    rl.question('Enter Point 1 (Lat, Lon): ', (point1Input) => {
        const point1 = parseAndValidateInput(point1Input);
        
        if (!point1) {
            console.log("Try again for Point 1...\n");
            askPoint1(rl, onComplete); 
        } else {
            askPoint2(rl, point1, onComplete); 
        }
    });
}

function askPoint2(rl, point1, onComplete) { 
    rl.question('Enter Point 2 (Lat, Lon): ', (point2Input) => {
        const point2 = parseAndValidateInput(point2Input);
        
        if (!point2) {
            console.log("Try again for Point 2...\n");
            askPoint2(rl, point1, onComplete); 
        } else {
            calculateFinalDistance(rl, point1, point2, onComplete); 
        }
    });
}

function calculateFinalDistance(rl, point1, point2, onComplete) {
    const distance = getDistanceInKm(point1.lat, point1.lon, point2.lat, point2.lon);

    console.log('\n-----------------------------------------');
    console.log('Distance: ' + distance + " " + 'km');

    const confirmedMax = parseFloat(process.env.CONFIRMED_MAX) || 15;
    const possibleMin = parseFloat(process.env.POSSIBLE_MIN) || 15;
    const possibleMax = parseFloat(process.env.POSSIBLE_MAX) || 50;
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
        point1: point1,
        point2: point2,
        distance: parseFloat(distance),
        status: status,
        timestamp: new Date().toLocaleString()
    };

    let fileData = [];

    try {
        if (fs.existsSync(filename)) {
            const rawData = fs.readFileSync(filename, 'utf8');
            fileData = JSON.parse(rawData);
        }
        
        fileData.push(newRecord);
        
        fs.writeFileSync(filename, JSON.stringify(fileData, null, 2), 'utf8');
        console.log(`Result successfully saved to ${filename}\n`);

    } catch (error) {
        console.log("Error saving to file:", error.message);
    }
    if (typeof onComplete === 'function') {
        onComplete();
    }
}
module.exports = {
    askPoint1,
    getDistanceInKm
};