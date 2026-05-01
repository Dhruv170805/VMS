import { Request, Response } from 'express';
export declare const checkIn: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const checkOut: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
