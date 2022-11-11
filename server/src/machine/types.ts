// type definitions implemented in the machine class

export interface Machine_ {
    init: ({ useBackup }: init_Props) => void
    getChange: (value: number, denominations: number[]) => {denomination: number, quantity: number}[]
    minCoins: (amount: number, denoms_: number[], size: number, s: number[]) => {MIN: number, FREQ: number[]}
    buy: (item: {id: string, quantity: number}, amount: number) => {success: boolean, message: string, change: machine_change}
}

export interface Item_type {
    id: string
    type: string,
    quantity: number,
    priceTag: {
        price: number
        currency: string
    }
}

export interface Machine_constructor_Props {
    denominations: number[]
    currency: string
    initialItems: {
        empty?: boolean
        items?: Item_type[]
    }
}

export interface init_Props {
    useBackup: boolean
}

export interface MachineConfig_ {
    denominations: number[]
    currency: string
    items: Item_type[]
    cashRegister: {
        amount: number
        currency: string
    }
}

export type machine_change = {denomination: number, quantity: number}[]

export type Log_ = {action: "deduct" | "add", amount: number, timestamp: string}

export type cashRegister = {
    amount: number,
    currency: string,
    log: Log_[]
}

export interface backup_return_type extends MachineConfig_ {
    success: boolean, error?: any
}