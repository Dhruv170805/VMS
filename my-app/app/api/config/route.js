import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SystemConfig from '@/lib/models/SystemConfig';

export async function GET() {
  await connectDB();
  let config = await SystemConfig.findOne();
  if (!config) {
    config = new SystemConfig();
    await config.save();
  }
  return NextResponse.json(config);
}

export async function PATCH(req) {
  await connectDB();
  const body = await req.json();
  let config = await SystemConfig.findOne();
  if (!config) {
    config = new SystemConfig(body);
  } else {
    Object.assign(config, body);
  }
  await config.save();
  return NextResponse.json(config);
}
