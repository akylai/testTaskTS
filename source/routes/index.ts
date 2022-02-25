import express from 'express';
import controller from '../controllers/index';
import { check, validationResult } from "express-validator";
// @ts-ignore
import authMiddleware from "../middlewares/auth.middleware";

const router = express.Router();

// router.get('/', controller.getHome);
//
// router.post('/post', controller.postVideo);

router.post('/register', [check("email", "Incorrect email format").isEmail()], controller.registration);

router.post('/login', controller.login);

router.post('/load-photos',authMiddleware, controller.loadPhotos);

router.get('/get-photos', controller.getPhotos);

router.delete('/delete-photo', authMiddleware, controller.deletePhoto);

router.delete('/delete-album', authMiddleware, controller.deleteAlbum);

router.patch('/change-album-title', authMiddleware, controller.changeAlbumTitle);

export = router;