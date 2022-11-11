import { Machine } from "./Machine";

// initializing a single instance of the machine to be used globally
export const machine = new Machine({
    currency: "US",
    denominations: [1, 20, 30],
    initialItems: {
        empty: false,
        items: []
    }
});

// restart the machine to use the most recent backup
machine.init({
    useBackup: true
});