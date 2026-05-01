import { Request, Response } from 'express';
export declare const addToBlacklist: (req: Request, res: Response) => Promise<void>;
export declare const getBlacklist: (req: Request, res: Response) => Promise<void>;
export declare const removeFromBlacklist: (req: Request, res: Response) => Promise<void>;
