import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";
import { Admin } from "../models/Admin.model";

// middleware function to intercept admin requests and check for validity of the access token
export const authAdmin = (req: Request, res: Response, next: NextFunction) => {
    const accessToken = req.body.accessToken || req.query.accessToken || req.headers["authorization"];
    const { username } = req.body;

    // check for availability of the accessToken
    if (!accessToken) {
        return res.status(403).json({
            success: false,
            message: "An access token is required for this route"
        })
    }
    

    Admin.findOne({username: username}).then(async (user) => {
        // console.log(user?.accessToken);
        if (user?.accessToken && ( await bcrypt.compare(accessToken, user?.accessToken))) {
            // console.log("Tokens match")
            return next();
        } else {
            return res.status(403).json({
                success: false,
                message: "Invalid Access Token!!"
            })
        }
    }).catch((err) => {
        return res.status(403).json({
            success: false,
            message: "User doesn't exist!!"
        })
    })
}