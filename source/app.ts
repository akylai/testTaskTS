import express from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import * as bodyParser from "body-parser";
import routes from './routes/index';
import mongoose from "mongoose";
dotenv.config();

const app = express();
const port = process.env.PORT;
// const DB_URL = "mongodb+srv://user:user@testtaskts.eiaah.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const DB_URL = process.env.DB_URL;
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false}));

app.use('/', routes);

async function startApp(){
    try {
        // @ts-ignore
        await mongoose.connect(DB_URL);
        app.listen(port, () => {
            console.log("Server started on port " + port);
        })
    } catch(err){
            console.error("Server started with error " + err);
    }
}

startApp();