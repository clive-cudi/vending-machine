import { Request, Response } from "express";
import { machine } from "../machine";

const homeCustomer = (req: Request, res: Response, next: () => void) => {
    return res.status(200).send("Customer")
}

const getAllItems = (req: Request, res: Response, next: any) => {
    let items = machine.getAllItems();
    
    return res.status(200).json({
        success: true,
        items
    })
}

const buy = (req: Request, res: Response, next: any) => {
    const { id, quantity, coins }: {id: string, quantity: number, coins: {denomination: number, count: number}[]} = req.body;

    // coins[{denomination: number, count: number}]
    
    const amount = coins.map((coin: {denomination: number, count: number}) => {
        return coin.denomination * coin.count
    }).reduce((partialSum, a) => partialSum + a, 0);;

    console.log(amount);

    const itemBuy = machine.buy({id: id, quantity: quantity}, amount);

    return res.status(itemBuy.success === true ? 200 : 400).json({...itemBuy});
}

export {
    homeCustomer,
    getAllItems,
    buy
};