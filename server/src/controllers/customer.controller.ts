import { Request, Response, NextFunction } from "express";
import { machine } from "../machine";

// implementation logic controllers for the customer routes

const homeCustomer = (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).send("Customer")
}

const getAllItems = (req: Request, res: Response, next: any) => {
    let items = machine.getAllItems();
    
    return res.status(200).json({
        success: true,
        items
    })
}

const buy = (req: Request, res: Response, next: NextFunction) => {
    const { id, quantity, coins }: {id: string, quantity: number, coins: {denomination: number, count: number}[]} = req.body;

    // coins[{denomination: number, count: number}]
    
    const amount = coins.map((coin: {denomination: number, count: number}) => {
        return coin.denomination * coin.count
    }).reduce((partialSum, a) => partialSum + a, 0);

    console.log(`Amount: ${amount}`);

    const itemBuy = machine.buy({id: id, quantity: quantity}, amount);

    return res.status(itemBuy.success === true ? 200 : 400).json({...itemBuy});
}

export {
    homeCustomer,
    getAllItems,
    buy
};