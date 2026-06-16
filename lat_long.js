const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

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

function isValidLatitudeFormat(value) {
    return /^[+-]?[0-9]{1,2}(\.[0-9,]{1,})?$/.test(value.trim());
}

function isValidLongitudeFormat(value) {
    return /^[+-]?[0-9]{1,3}(\.[0-9,]{1,})?$/.test(value.trim());
}

function isValidLatitudeRange(value) {
    const num = parseFloat(value);
    return num >= -90 && num <= 90;
}

function isValidLongitudeRange(value) {
    const num = parseFloat(value);
    return num >= -180 && num <= 180;
}

function validateLatitude(value) {
    if (!isValidLatitudeFormat(value)) {
        console.log("Invalid latitude format. Please enter a valid decimal number with up to 8 decimal places (e.g., 31.48294321)");
        rl.close();
        return false;
    }
    if (!isValidLatitudeRange(value)) {
        console.log("Latitude value out of range. Must be between -90.00000000 and 90.00000000");
        rl.close();
        return false;
    }
    return true;
}

function validateLongitude(value) {
    if (!isValidLongitudeFormat(value)) {
        console.log("Invalid longitude format. Please enter a valid decimal number with up to 8 decimal places (e.g., 131.48294321)");
        rl.close();
        return false;
    }
    if (!isValidLongitudeRange(value)) {
        console.log("Longitude value out of range. Must be between -180.00000000 and 180.00000000");
        rl.close();
        return false;
    }
    return true;
}

rl.question('Point 1 lat: ', (lat1) => {
    if (!validateLatitude(lat1)) return;

    rl.question('Point 1 lon: ', (lon1) => {
        if (!validateLongitude(lon1)) return;

        rl.question('Point 2 lat: ', (lat2) => {
            if (!validateLatitude(lat2)) return;

            rl.question('Point 2 lon: ', (lon2) => {
                if (!validateLongitude(lon2)) return;

                const distance = getDistanceInKm(
                    parseFloat(lat1),
                    parseFloat(lon1),
                    parseFloat(lat2),
                    parseFloat(lon2)
                );

                console.log('Distance: '+ distance + " " + 'km');

                if (distance > 50) {
                    console.log('Invalid');
                } else if (distance >= 15 && distance <= 50) {
                    console.log('Possible');
                } else if (distance < 15) {
                    console.log('Confirmed');
                } else {
                    console.log('Unknown');
                }

                rl.close();
            });
        });
    });
});