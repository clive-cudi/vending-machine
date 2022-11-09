import defaultItems from "./mock/defaultItems.json";
import { v4 as v4ID } from "uuid";
// business logic for the vending machine
/**
 * 
 */

interface Machine_ {
    init: (useBackup?: boolean) => void
    getChange: (value: number, denominations: number[]) => {denomination: number, quantity: number}[]
    minCoins: (amount: number, denoms_: number[], size: number, s: number[]) => {MIN: number, FREQ: number[]}
    buy: (item: {id: string, quantity: number}, amount: number) => {success: boolean, message: string, change: machine_change}
}

interface Item_type {
    id: string
    type: string,
    quantity: number,
    priceTag: {
        price: number
        currency: string
    }
}

interface Machine_constructor_Props {
    denominations: number[]
    currency: string
    initialItems: {
        empty?: boolean
        items?: Item_type[]
    }
}

type machine_change = {denomination: number, quantity: number}[]

type Log_ = {action: "deduct" | "add", amount: number, timestamp: string}

type cashRegister = {
    amount: number,
    currency: string,
    log: Log_[]
}

export class Machine implements Machine_ {
    // there has to be initial money to act as change
    // specify the type of coins accepted
    // implement some sort of backup to the db incase the machine goes down - implementation logic
    // add an option in the initializer function to use backup or not
    // assume the initial machine balance is always more than the change when the first item is bought
    // if their is no enough change, then the buy is declined
    // algorithm for determining the fractionated change 
    // keep track of the frequency of a currency denomination
    defaults: {
        denoms: number[]
        currency: string
        items: Item_type[]
        cash: number
    }
    denominations: number[]
    currency: string
    items: Item_type[]
    cashRegister: cashRegister
    /**
     * 
     * @param denominations number[] containing supported denominations
     */
    constructor({denominations, currency, initialItems}: Machine_constructor_Props) {
        console.log("Constructor init")
        // initialize a list of denominations that the machine works with
        const default_items: Item_type[] = defaultItems ?? [
            {
                "id": v4ID(),
                "type": "water",
                "quantity": 10,
                "priceTag": {
                    "price": 80,
                    "currency": ""
                },
                "info": {
                    "picURL": ""
                }
            },
            {
                "id": v4ID(),
                "type": "energy_drinks",
                "quantity": 20,
                "priceTag": {
                    "price": 180,
                    "currency": ""
                },
                "info": {
                    "picURL": ""
                }
            }
        ];
        this.defaults = {
            denoms: [1, 5, 10, 20, 50, 100, 200, 500, 1000],
            currency: "KES",
            items: default_items,
            cash: 1000
        }
        this.denominations = denominations ?? this.defaults.denoms;
        this.currency = currency ?? this.defaults.currency;

        // ensure this.defaults.items.priceTag.currency syncs with the default currency
        this.defaults.items = this.defaults.items.map((item) => {
            if (item.priceTag.currency == "") {
                item.priceTag.currency = this.defaults.currency;
            } else {
                // implement some currency conversion logic to convert the priceTag.price to this.defaults.currency
                item.priceTag.currency = currency;
            }
            return item;
        });

        // initialize a list [array] of items available in the machine
        this.items = initialItems.empty === true ? [] : (initialItems.items && initialItems.items.length > 0 ? initialItems.items : this.defaults.items);
        this.cashRegister = {
            amount: this.defaults.cash,
            currency: this.currency,
            log: []
        }

    }

    init() {
        // initialize a list of denominations that the machine works with
    }

    buy(item: {id: string, quantity: number}, amount: number): {success: boolean, message: string, change: machine_change} {
        // first ensure the item exists and the quantity is more than or equal to the required quantity
        const itemIndex = this.items.findIndex((elm) => elm.id === item.id);

        if (itemIndex !== -1) {
            const targetItem = this.items[itemIndex];
            
            if (targetItem.quantity >= item.quantity) {
                // check the price against the required amount
                if (amount >= targetItem.priceTag.price) {
                    // update the target item stats after buy check
                    this.items[itemIndex] = {
                        ...this.items[itemIndex],
                        quantity: targetItem.quantity - item.quantity
                    };

                    // calculate the required change
                    const balance = amount - targetItem.priceTag.price;
                    

                    // update the cash register
                    this.updateCashRegister(amount - balance);

                    // get the change data
                    let change: machine_change = this.getChange(balance, this.denominations);

                    return {
                        success: true, 
                        message: `Successfully bought ${item.quantity} units of ${targetItem.type} for ${targetItem.priceTag.currency} ${targetItem.priceTag.price}!!`,
                        change
                    }
                } else {
                    return {
                        success: false,
                        message: "Insufficient funds",
                        change: []
                    }
                }
            } else {
                return {
                    success: false,
                    message: "Sorry. Looks like there isn't enough of what you are asking for. Please try a lower quantity.",
                    change: []
                }
            }
        } else {
            return {
                success: false,
                message: "Item not found",
                change: []
            }
        }
    }

    // admin
    add(item: Item_type) {
        this.items = [
            ...this.items,
            item
        ]
    }

    checkBalance() {
        return `Current Balance: ${this}`
    }

    getAllItems() {
        return this.items;
    }

    getLogs() {
        return this.cashRegister.log;
    }

    changeDenominationSet(newDenominationSet: number[]) {
        this.denominations = newDenominationSet;
    }

    updateCashRegister(amount: number) {
        this.cashRegister.amount += amount;
        return this.generateLog("add", amount);
    }

    generateLog(action: "add" | "deduct", amount: number): Log_ {
        const logMsg = {
            action,
            amount,
            timestamp: new Date().toJSON()
        };

        this.cashRegister.log.push(logMsg);

        return logMsg;
    }

    // business logic

    getChange(value: number, denominations: number[]): machine_change {
        // initialize the coin change algorithm variables
        const AMOUNT: number = value;
        const DENOMINATIONS: number[] = denominations ?? [1, 5, 10, 20, 50, 100, 200, 500, 1000];
        const DENOM_SIZE: number = DENOMINATIONS.length;
        let COINS_FREQ: number[] = new Array(AMOUNT + 1);
        // COINS_USED stores the coins in different denominations used to build up the final change 
        let COINS_USED: number[] = [];

        const { MIN, FREQ } = this.minCoins(AMOUNT, DENOMINATIONS, DENOM_SIZE, COINS_FREQ);

        let k: number = AMOUNT;

        while(k) {
            // console.log(`[${denoms_[FREQ[k]]}]`)
            COINS_USED.push(denominations[FREQ[k]]);
            k = k - denominations[FREQ[k]];
        }

        // helper function to get the number of occurrences of an item in an array
        function getOccurrence<T>(arr: T[], val: T) {
            return arr.filter((v) => (v === val)).length;
        }

        return [...new Set(COINS_USED)].map((coin_instance) => ({denomination: coin_instance, quantity: getOccurrence<number>(COINS_USED, coin_instance)}))
    }

    minCoins(amount: number, denoms_: number[], size: number, s: number[]) {

        let table = new Array(denoms_);

        for (let i = 0; i < denoms_.length; i++) {
            table[i] = new Array(amount + 1);
        }

        for (let ix = 0; ix < denoms_.length; ix++) {
            table[ix][0] = 0;
        }

        for (let iy = 0; iy <= amount; iy++) {
            table[0][iy] = iy;
            s[iy] = 0;
        }

        for (let i = 1; i < size; i++) {
            for (let j = 1; j <= amount; j++) {
                if (j < denoms_[i]) {
                    table[i][j] = table[i-1][j];
                } else {
                    table[i][j] = Math.min(table[i-1][j], table[i][j - denoms_[i]] + 1);
                    s[j] = i;
                }
            }
        }

        return {
            MIN: table[size - 1][amount],
            FREQ: s
        }
    }
}

// const myMachine = new Machine();

// myMachine.init();