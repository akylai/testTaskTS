import {Request, Response, NextFunction} from 'express';
import User from "../models/User";
import Photo from "../models/Photo";
import Album from "../models/Album";
import {Md5} from "md5-typescript";
import {check, validationResult} from "express-validator";
import jwt from "jsonwebtoken" ;
import axios from "axios";
import mongoose, {Schema, model} from "mongoose";
import {MongoClient, ObjectId} from "mongodb";
import * as dotenv from 'dotenv';

dotenv.config();

const registration = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log("req.body", req.body);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res
                .status(400)
                .json({message: "Ошибка при регистрации", errors});
        }

        const {login, email, password} = req.body;

        const candidate = await User.findOne({login});
        if (candidate) return res.status(400).json({message: `User with login ${login} already exist`});

        const hashPassword = Md5.init(password);

        const user = new User({login, email, password: hashPassword, registerDate: new Date()});
        await user.save();

        return res.status(200).json({message: 'User was created'});
    } catch (err) {
        console.error("Error on registration method " + err);
        return res.status(400).json({message: 'Bad Request'});
    }
}

const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log("req.body", req.body);
        if (!req.body.email && !req.body.login)
            return res.status(400).json({message: "email and login is required"});
        let user;
        if (req.body.email) {
            if (!isEmail(req.body.email)) return res.status(400).json({message: "Incorrect email format"});
            user = await User.findOne({email: req.body.email});
        }

        if (!req.body.email)
            user = await User.findOne({login: req.body.login});

        if (!user) {
            return res
                .status(400)
                .json({message: req.body.email ? `Пользователь ${req.body.email} не найден` : `Пользователь ${req.body.login} не найден`});
        }
        console.log("user", user);

        const validPassword = Md5.init(req.body.password) === user.password;
        if (!validPassword)
            return res.status(400).json({message: "Неправильный логин или пароль"});

        const token = jwt.sign({id: user.id}, "users", {
            expiresIn: "1h",
        });

        return res.status(200).json({
            token,
            user: {
                id: user.id,
                login: user.login,
            },
        });

    } catch (err) {
        console.error("Error on login method " + err);
        return res.status(400).json({message: 'Bad Request'});
    }
}

const loadPhotos = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // @ts-ignore
        console.log("req.user", req.user);
        let data;

        await axios.get('http://jsonplaceholder.typicode.com/photos').then(async response => {
            // console.log(response.data);
            data = response.data;

            const albums = await Album.find();
            // console.log("albums", albums)
            if (albums.length === 0) {
                for (let i = 1; i <= 100; i++) {
                    let obj: { owner: string; id: number; title: string };

                    obj = {
                        id: i,
                        title: `Album #${i}`,
                        // @ts-ignore
                        owner: req.user.id
                    };

                    const album = new Album(obj);
                    // console.log("album", album);
                    await album.save();
                }
            }

            // @ts-ignore
            //for(let photo of data){
            let i = 0;
            for (i = 0; i <= 300; i++) {
                // @ts-ignore
                const photoObj = {
                    // @ts-ignore
                    id: data[i].id,
                    // @ts-ignore
                    albumId: data[i].albumId,
                    // @ts-ignore
                    title: data[i].title,
                    // @ts-ignore
                    url: data[i].url,
                    // @ts-ignore
                    thumbnailUrl: data[i].thumbnailUrl,
                    // @ts-ignore
                    owner: req.user.id
                }
                // const album = await Album.findOne({id:photo.albumId});
                //
                // if(album){
                //     // @ts-ignore
                //     photoObj.albumId = album._id;
                // }
                // console.log("photoObj", photoObj);
                let photoEl = new Photo(photoObj);
                await photoEl.save();
            }

        })


        return res.status(200).json({message: 'Photo album was created'});

    } catch (err) {
        console.error("Error on loadPhotos method " + err);
        return res.status(400).json({message: 'Bad Request'});
    }
}

const getPhotos = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let page;
        let maxcount;
        page = req.query.page ? parseInt(<string>req.query.page) : 1;
        console.log("page", page)
        maxcount = req.query.maxcount ? parseInt(<string>req.query.maxcount) : 10;
        console.log("maxcount", maxcount)
        const mongoClient = new MongoClient("mongodb+srv://user:user@testtaskts.mfl37.mongodb.net/myFirstDatabase?retryWrites=true&w=majority");
        const connection = await mongoClient.connect();
        const db = connection.db();
        if(req.body.ownerid){
            let photos = await db.collection('photos').find({owner: new ObjectId(req.body.ownerid.toString())}).limit(maxcount).skip(page).toArray();
            return res.status(200).json({photos: photos, owner: new ObjectId(req.body.ownerid.toString())});
        }
        let photos = await db.collection('photos').find({}).limit(maxcount).skip(page).toArray();
        return res.status(200).json({photos:photos});

    } catch (err) {
        console.error("Error on getPhotos method " + err);
        return res.status(400).json({message: 'Bad Request'});
    }
}

const deletePhoto = async(req:Request, res:Response, next: NextFunction) => {
    try {
        const {photoid} = req.body;
        const mongoClient = new MongoClient("mongodb+srv://user:user@testtaskts.mfl37.mongodb.net/myFirstDatabase?retryWrites=true&w=majority");
        const connection = await mongoClient.connect();
        const db = connection.db();

        if(!photoid) return res.status(400).json({message:"Не указан id фотографии"});

        const photos = photoid.split(",");
        console.log(photos.length);
        console.log(photos);

        let i = 0;
        for(i=0; i< photos.length; i++){
           await db.collection('photos').deleteOne({_id: new ObjectId(photos[i].toString())});
            // const deletedPhoto = await db.collection('photos').deleteOne({_id: new ObjectId(photoid.toString())});
        }


        // return res.status(200).json({deletedPhoto});
        return res.status(200).json({success: true});

    } catch(err){
        console.error("Error on deletePhoto method " + err);
        return res.status(400).json({message: 'Bad Request'});
    }
}

const deleteAlbum = async(req: Request, res: Response, next: NextFunction ) =>{
    try {
        const {albumid} = req.body;
        if(!albumid) return res.status(400).json({message:"Не указан id альбома"});

        const mongoClient = new MongoClient("mongodb+srv://user:user@testtaskts.mfl37.mongodb.net/myFirstDatabase?retryWrites=true&w=majority");
        const connection = await mongoClient.connect();
        const db = connection.db();

        const albums = albumid.split(",");
        console.log(albums.length);
        console.log(albums);

        let i = 0;
        for(i=0; i< albums.length; i++){
            await db.collection('albums').deleteOne({id: parseInt(albums[i])});

            const photos = await db.collection('photos').find({albumId:parseInt(albums[i])}).toArray();

            if(photos.length > 0){
                let j = 0;
                for(j=0; j < photos.length; j++)
                    await db.collection('photos').deleteOne({_id: new ObjectId(photos[j]._id)});
            }
        }

        return res.status(200).json({success: true});

    }catch(err){
        console.error("Error on deleteAlbum method " + err);
        return res.status(400).json({message: 'Bad Request'});
    }
}

const changeAlbumTitle = async(req: Request, res: Response, next: NextFunction) => {
    try {
        const {albumid, new_album_name} = req.body;
        if(!albumid) return res.status(200).json("Не передан обязательный параметр albumid");
        if(!new_album_name) return res.status(200).json("Не передан обязательный параметр title");

        const mongoClient = new MongoClient("mongodb+srv://user:user@testtaskts.mfl37.mongodb.net/myFirstDatabase?retryWrites=true&w=majority");
        const connection = await mongoClient.connect();
        const db = connection.db();

        const album = await db.collection('albums').find({id: parseInt(albumid)}).toArray();
        if(album.length === 0) return res.status(200).json(`Альбом с id ${albumid} не найден`);

        await db.collection('albums').updateOne({id: parseInt(albumid)}, {$set:{title:new_album_name }});

        return res.status(200).json({success: true});

    }catch(err){
        console.error("Error on changeAlbumTitle method " + err);
        return res.status(400).json({message: 'Bad Request'});
    }
}

function isEmail(search: string): boolean {
    let serchfind: boolean;

    const regexp = new RegExp('^([^ ]+@[^ ]+\\.[a-z]{2,6}|)$');

    serchfind = regexp.test(search);
    console.log(serchfind)
    return serchfind
}

export default {registration, login, loadPhotos, getPhotos,deletePhoto, deleteAlbum, changeAlbumTitle};