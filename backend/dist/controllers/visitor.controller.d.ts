import { Request, Response } from 'express';
export declare const registerVisitor: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getHostVisitors: (req: Request, res: Response) => Promise<void>;
export declare const getPendingVisitors: (req: Request, res: Response) => Promise<void>;
export declare const approveVisitor: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getVisitorProfile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getVisitorByCode: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateVisitorStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
