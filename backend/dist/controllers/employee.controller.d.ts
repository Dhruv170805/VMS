import { Request, Response } from 'express';
export declare const uploadEmployees: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getEmployees: (req: Request, res: Response) => Promise<void>;
export declare const toggleEmployeeStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
