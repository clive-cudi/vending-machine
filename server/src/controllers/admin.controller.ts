import { Request, Response, NextFunction } from "express";
import { v4 as v4ID } from "uuid";
import bcrypt from "bcryptjs";
import { machine } from "../machine";
import { Item } from "../models/Item.model";
import { Admin } from "../models/Admin.model";

// implementation logic controllers for the admin routes

const home = (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).send("Admin Route")
}

const signup = (req: Request, res: Response, next: NextFunction) => {
    const { username, password, confirm } = req.body;

    if (username && password && confirm) {
        // check if user exists
        Admin.findOne({username: username}).then(async (user) => {
            if (user) {
                return res.status(400).json({
                    success: false,
                    message: "User Exists. Please Try another username"
                })
            } else {
                if (password !== confirm) {
                    return res.status(403).json({
                        success: false,
                        message: "Passwords do not match. Please try again"
                    })
                }

                // generate a unique id for the new user
                const uid = v4ID();
                
                // hash password
                const hashed_password = await bcrypt.hash(password, 10);

                // model the new user
                const newUser = new Admin({
                    uid: uid,
                    username: username,
                    password: hashed_password
                });

                newUser.save().then(() => {
                    return res.status(200).json({
                        success: true,
                        message: "Admin user created successfully"
                    })
                }).catch((err) => {
                    return res.status(500).json({
                        success: false,
                        message: "Failed to create admin user. Please try again!"
                    })
                })
            }
        }).catch((err) => {
            console.log(err);
            return res.status(502).json({
                success: false,
                message: "An DB Error Ocurred"
            })
        })
    } else {
        return res.status(403).json({
            success: false,
            message: "Missing Required Signup credentials"
        })
    }
}

const login = (req: Request, res: Response, next: NextFunction) => {
    const { username, password } = req.body;

    Admin.findOne({username: username}).then(async (user) => {
        if (user) {
            if (user.password && ( await bcrypt.compare(password, user.password))) {
                // generate a random access token
                const accessToken = `${username}_${v4ID()}_${username}`;

                const encrypted_token = await bcrypt.hash(accessToken, 10);

                Admin.updateOne(
                    {uid: user.uid},
                    {$set: {
                        accessToken: encrypted_token
                    }}
                ).then(() => {
                    return res.status(200).json({
                        success: true,
                        message: "Login Successfull",
                        accessToken
                    });
                }).catch((error) => {
                    return res.status(500).json({
                        success: false,
                        message: "Login Failed",
                        error: `${error}`
                    })
                })
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Invalid credentials"
                })
            }
        } else {
            return res.status(400).json({
                success: false,
                message: "User doesn't exist"
            })
        }
    }).catch((err) => {
        return res.status(502).json({
            success: false,
            message: "Database error!!",
            error: `${err}`
        })
    })
}

const backup = (req: Request, res: Response, next: NextFunction) => {
    machine.backup().then((bckp) => {
        return res.status(bckp.success === true ? 200 : 403).json({
            bckp
        })
    }).catch((err) => {
        res.status(400).json({success: false, err})
    })
}

const addProduct = (req: Request, res: Response, next: NextFunction) => {
    const { type, quantity, price } = req.body;

    if (type && quantity && price) {
        const itemID = v4ID();

        const newItem = {
            id: itemID,
            type,
            quantity,
            priceTag: {
                price,
                currency: machine.currency
            }
        }

        return res.status(200).json({...machine.add(newItem), success: true, message: "Item added successfully"});

    } else {
        return res.status(400).json({
            success: false,
            message: "Please provide the required fields"
        })
    }
}

const removeProduct = (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.body;

    if (id) {
        return res.status(200).json(machine.remove(id));
    } else {
        return res.status(400).json({
            success: false,
            message: "Please provide an item ~id~"
        })
    }
}


const getLogs = (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({...machine.getLogs(), success: true})
}

const checkBalance = (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({message: machine.checkBalance(), success: true})
}

const setDenominations = (req: Request, res: Response, next: NextFunction) => {
    const { denominations } = req.body;

    if (denominations?.length > 0 ) {
        const newDenominationSet = machine.changeDenominationSet(denominations);

        return res.status(200).json({denominations: newDenominationSet, message: `Denominations ${machine.denominations}`, success: true})
    } else {
        return res.status(400).json({
            success: false,
            message: "Please provide a list of denominations ~[denom1, denom2, ...denomN]~"
        })
    }
}

const addFunds = (req: Request, res: Response, next: NextFunction) => {
    const { coins }: {coins: {denomination: number, count: number}[]} = req.body;

    if (coins) {
        const amount = coins.map((coin) => coin.denomination * coin.count).reduce((cumulative, b) => cumulative + b, 0);

        return res.status(200).json({log: machine.updateCashRegister(amount > 0 ? amount : 0), message: `Successfully added ${machine.currency} ${amount > 0 ? amount : 0} to machine`, success: true})
    } else {
        return res.status(400).json({message: "Please provide the funds to be added ~ coins: [denomination: number, count: number] ~", success: true});
    }
}

const withdrawFunds = (req: Request, res: Response, next: NextFunction) => {
    const { amount } = req.body;

    if (amount) {
        const withdrawal = machine.withdraw(amount);
        return res.status(withdrawal.success === true ? 200 : 400).json(withdrawal);
    } else {
        return res.status(400).json({success: false, message: "Please enter the amount to withdraw."});
    }
}

const changePrice = (req: Request, res: Response, next: NextFunction) => {
    const { id, price } = req.body;

    if (id && price) {
        const changePriceResult = machine.changePrice(id, price);

        return res.status(changePriceResult.success === true ? 200 : 500).json({...changePriceResult});
    } else {
        return res.status(400).json({
            success: false,
            message: "Please Recheck your inputs for ~ id & price ~"
        })
    }
}

export {
    home,
    signup,
    login,
    backup,
    addProduct,
    removeProduct,
    getLogs,
    checkBalance,
    setDenominations,
    addFunds,
    withdrawFunds,
    changePrice
};