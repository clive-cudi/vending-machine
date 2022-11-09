import { Machine } from "./Machine";

// implementation logic init
export const machine = new Machine({
    currency: "US",
    denominations: [1, 20, 30],
    initialItems: {
        empty: false,
        items: []
    }
});

machine.init();

// console.log(machine.getChange(0, [50, 100, 200]))

console.log(machine.buy({id: "shuwedasf809f", quantity: 20}, 180));

machine.add({
    id: "hguweg8727v fd424iu",
    type: "iPhone", 
    priceTag: {
        currency: "US",
        price: 1000
    },
    quantity: 100
})

console.log(machine.getLogs());

console.log(machine.getAllItems());