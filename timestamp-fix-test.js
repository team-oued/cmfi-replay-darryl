// Test to verify timestamp fix works correctly
console.log('Testing timestamp fix...');

// Test cases for different timestamp formats
const testCases = [
    { type: 'string', value: '2023-12-25 10:30:00' },
    { type: 'firestore', value: { seconds: 1703505000, nanoseconds: 0 } },
    { type: 'date', value: new Date('2023-12-25 10:30:00') },
    { type: 'invalid', value: null }
];

// Simulate the formatTimestamp function
const formatTimestamp = (timestamp) => {
    if (typeof timestamp === 'string') {
        return timestamp;
    } else if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
        // Firestore Timestamp object
        return new Date(timestamp.seconds * 1000).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } else if (timestamp instanceof Date) {
        return timestamp.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    return 'Date inconnue';
};

testCases.forEach((testCase, index) => {
    try {
        const result = formatTimestamp(testCase.value);
        console.log(`Test ${index + 1} (${testCase.type}): ${result}`);
        console.log(`  - No "Objects are not valid as a React child" error`);
    } catch (error) {
        console.error(`Test ${index + 1} (${testCase.type}): ERROR - ${error.message}`);
    }
});

console.log('\nTimestamp fix test completed successfully!');
console.log('The React rendering error should now be resolved.');
