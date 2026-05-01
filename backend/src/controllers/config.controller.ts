import { Request, Response } from 'express';
import SystemConfig from '../models/SystemConfig';

export const getConfig = async (req: Request, res: Response) => {
  try {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = new SystemConfig();
      await config.save();
    }
    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateConfig = async (req: Request, res: Response) => {
  try {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = new SystemConfig(req.body);
    } else {
      Object.assign(config, req.body);
    }
    await config.save();
    res.json({ message: 'Configuration updated', config });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
