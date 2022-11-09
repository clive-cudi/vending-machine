import { Request, Response } from "express";

const homeCustomer = (req: Request, res: Response, next: () => void) => {
    return res.status(200).send("Customer")
}

export {};