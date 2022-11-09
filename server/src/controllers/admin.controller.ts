import { Request, Response } from "express";

const home = (req: Request, res: Response, next: () => void) => {
    return res.status(200).send("Admin Route")
}


export {
    home
};