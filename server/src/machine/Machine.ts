// business logic for the vending machine
import defaultItems from "./mock/defaultItems.json";
import { v4 as v4ID } from "uuid";
import { MachineConfig } from "../models/MachineConfig.model";
import { Machine_, MachineConfig_, Machine_constructor_Props, machine_change, Item_type, Log_, backup_return_type, cashRegister, init_Props } from "./types";

/**
 * Machine class
 * This class contains all business logic and a bit of implementation logic for the Vending machine
 */
export class Machine implements Machine_ {
    // there has to be initial money to act as initial change provision
    // specify the type of coins accepted
    // assume the initial machine balance is always more than the change when the first item is bought
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


    constructor({denominations, currency, initialItems}: Machine_constructor_Props) {
        console.log("Constructor init");
        // initialize a list of denominations that the machine works with
        // list of default items available in the machine if no backup is used
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

        // default configuration for the machine if no backup is loaded
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

    // implement some sort of backup to the db incase the machine goes down - implementation logic
    // add an option in the initializer function to use backup or not
    init({useBackup}: init_Props) {
        if (useBackup === true) {
            // get the latest document from DB
            // if error, use the defaults
            console.log(`Backup recovery init...`)

            // async function for getting the most recent backup from DB
            async function findMostRecentConfig() {
                const doc_ = await MachineConfig.findOne(
                    {},
                    {},
                    {
                        sort: {"createdAt": -1}
                    }
                );

                if (!doc_) {return;}

                return MachineConfig.findOne({
                    stamp: doc_.stamp
                })
            }

            const defaultConfig = {
                denominations: this.denominations,
                currency: this.currency,
                items: this.items,
                cashRegister: this.cashRegister
            }

            findMostRecentConfig().then((config) => {
                // console.log(config?.items);
                if (config !== null) {
                    const configItems: Item_type[] = config?.items.map((item) => ({id: item.id, type: item.type, quantity: item.quantity, priceTag: {...item.priceTag}})) as Item_type[];
                    this.denominations = config?.denominations ?? defaultConfig.denominations;
                    this.currency = config?.currency ?? defaultConfig.currency;
                    this.items = configItems;
                    this.cashRegister = {...config?.cashRegister, log: []} as cashRegister ?? defaultConfig.cashRegister;
                    return config;
                }
            }).catch(() => {
                return defaultConfig;
            })
        }
    }

    // buying an item
    buy(item: {id: string, quantity: number}, amount: number): {success: boolean, message: string, change: machine_change} {
        // first ensure the item exists and the quantity is more than or equal to the required quantity
        const itemIndex = this.items.findIndex((elm) => elm.id === item.id);

        if (itemIndex !== -1) {
            const targetItem = this.items[itemIndex];
            
            if (targetItem.quantity >= item.quantity) {
                // obtain the expected cumulative amount of the order
                const cumulativeAmount = targetItem.priceTag.price * item.quantity;

                // check the price against the required amount
                if (amount >= cumulativeAmount) {
                    // update the target item stats after buy check
                    this.items[itemIndex] = {
                        ...targetItem,
                        quantity: targetItem.quantity - item.quantity
                    };

                    // calculate the required change
                    const balance = amount - cumulativeAmount;
                    

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
        // look for existence of a similar item type in the inventory
        if (this.items.some((item_) => item_.type === item.type)) {
            // item exists
            // assign the existing item index to a const variable
            const targetItemIndex = this.items.findIndex((itm) => itm.type === item.type);
            this.items[targetItemIndex] = {
                ...this.items[targetItemIndex],
                quantity: this.items[targetItemIndex].quantity + item.quantity,
                priceTag: {
                    price: item.priceTag.price ?? this.items[targetItemIndex].priceTag.price,
                    currency: this.currency
                }
            }

            return this.items[targetItemIndex];
        } else {
            // item doesn't exist, add new field for the item in the inventory
            this.items = [
                ...this.items,
                item
            ]

            return item;
        }

    }
    
    // remove an item from the inventory by its id
    remove(id: string) {
        // check if the target item exists
        if (this.items.some((item_) => item_.id === id)) {
            const targetItemIndex = this.items.findIndex((sample_item) => sample_item.id === id);
            
            if (targetItemIndex > -1) {
                this.items.splice(targetItemIndex, 1);
                return {
                    success: true,
                    message: "Item removed successfully"
                }
            } else {
                return {
                    success: false,
                    message: "Item not Found"
                }
            }
        } else {
            return {
                success: false,
                message: "Item doesn't exist"
            }
        }
    }

    changePrice(id: string, price: number) {
        if (this.items.some((item_) => item_.id === id)) {
            const targetItemIndex = this.items.findIndex((sample_item) => sample_item.id === id);

            if (targetItemIndex > -1) {
                let targetItem: Item_type = {
                    ...this.items[targetItemIndex],
                    priceTag: {
                        price,
                        currency: this.currency
                    }                    
                };

                this.items[targetItemIndex] = targetItem;

                return {item: this.items[targetItemIndex], success: true, message: "Successfully updated the price"};
            } else {
                return {
                    success: false,
                    message: "Item not Found"
                }
            }
        } else {
            return {
                success: false,
                message: "Item doesn't exist"
            }
        }
    }

    checkBalance() {
        return `Current Balance: ${this.cashRegister.amount}`
    }

    getAllItems() {
        return this.items;
    }

    getLogs() {
        return this.cashRegister.log;
    }

    // mutate the default denomination set available in the machine
    changeDenominationSet(newDenominationSet: number[]) {
        this.denominations = newDenominationSet;
        return this.denominations;
    }

    // change the currency being used in the machine
    changeCurrency(currency: string) {
        this.currency = currency;
    }

    // updates / adds funds to the cash register
    updateCashRegister(amount: number) {
        this.cashRegister.amount = this.cashRegister.amount + amount;
        return this.generateLog("add", amount);
    }

    // withdraw funds available
    withdraw(amount: number) {
        // check if the amount of funds available is legible for withdrawal
        if (this.cashRegister.amount >= amount) {
            this.cashRegister.amount = this.cashRegister.amount - amount;

            return {
                success: true,
                message: `Successfully withdrawn ${this.currency} ${amount}`,
                log: this.generateLog("deduct", amount)
            };
        } else {
            return {
                success: false,
                message: "Insufficient funds available for withdrawal",
                log: null
            }
        }
    }

    // returns a log: Log_ object depending on the action done
    generateLog(action: "add" | "deduct", amount: number): Log_ {
        const logMsg = {
            action,
            amount,
            timestamp: new Date().toJSON()
        };

        this.cashRegister.log.push(logMsg);

        return logMsg;
    }

    // function to backup the machine configuration to the database
    backup(): Promise<backup_return_type> {
        const backupConfig = new MachineConfig({
            denominations: this.denominations,
            currency: this.currency,
            items: this.items,
            cashRegister: {
                amount: this.cashRegister.amount,
                currency: this.cashRegister.currency
            },
            stamp: new Date().toJSON()
        })

        const bck = backupConfig.save().then((config) => {
            return {...config, success: true};
        }).catch((err) => {
            return {success: false, error: err}
        })

        return bck as Promise<backup_return_type>;
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

    // returns the minimum number of coins for change depending on the denominations provided as well as the frequency of each coin denomination used
    // this function implements the algorithm for solving the coin change problem using dynamic programming
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