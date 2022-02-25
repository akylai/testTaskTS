import jwt from "jsonwebtoken";
import {Request, Response, NextFunction} from 'express';

module.exports = (req:Request, res:Response, next:NextFunction) => {
    if (req.method === "OPTIONS") {
        return next();
    }

    try{
        // @ts-ignore
        const token = req.headers.authorization.split(" ")[1];
        if (!token) {
            return res.status(401).json({ message: "Auth error" });
        }
        const decoded = jwt.verify(token, "users");
        console.log("decoded", decoded);
        // @ts-ignore
        req.user = decoded;
        next();
    }catch(err){
        return res.status(401).json({ message: "Auth error" });
    }
}