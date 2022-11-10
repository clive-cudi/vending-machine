import { Request, Response } from "express";
import { machine } from "../machine";

const home = (req: Request, res: Response, next: () => void) => {
    return res.status(200).send("Admin Route")
}

const signup = (req: Request, res: Response, next: any) => {
    const { username, password, confirm } = req.body;
}

const login = (req: Request, res: Response, next: any) => {
    const { username, password } = req.body;
}

const backup = (req: Request, res: Response, next: any) => {
    machine.backup().then((bckp) => {
        return res.status(bckp.success === true ? 200 : 403).json({
            bckp
        })
    }).catch((err) => {
        res.status(400).json({success: false, err})
    })
}


export {
    home,
    signup,
    login,
    backup
};