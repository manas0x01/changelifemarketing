import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/database';
import Setting from '@/models/Setting';
import { verifyAdminPermission } from '@/lib/auth';

const DEFAULT_SETTINGS = {
  tdsRate: 2, // 2%
  deductorName: 'Change Life Marketing',
  deductorPan: 'HYDKW0218G',
  deductorTan: 'DELC12345A',
  deductorAddress: 'Patna, Bihar, India',
  deductorContact: '+91 9999999999',
};

export async function GET() {
  try {
    await connectDB();
    const auth = await verifyAdminPermission();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const doc = await Setting.findOne({ key: 'tds_config' }).lean() as any;
    const config = doc?.value ? { ...DEFAULT_SETTINGS, ...doc.value } : DEFAULT_SETTINGS;

    return NextResponse.json({ success: true, settings: config });
  } catch (error: any) {
    console.error('[API_TDS_SETTINGS_GET_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const auth = await verifyAdminPermission();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const body = await req.json();
    const tdsRate = parseFloat(body.tdsRate);
    if (isNaN(tdsRate) || tdsRate < 0 || tdsRate > 100) {
      return NextResponse.json({ error: 'Invalid TDS rate. Must be between 0 and 100.' }, { status: 400 });
    }

    const updatedConfig = {
      tdsRate,
      deductorName: (body.deductorName || DEFAULT_SETTINGS.deductorName).trim(),
      deductorPan: (body.deductorPan || DEFAULT_SETTINGS.deductorPan).trim().toUpperCase(),
      deductorTan: (body.deductorTan || DEFAULT_SETTINGS.deductorTan).trim().toUpperCase(),
      deductorAddress: (body.deductorAddress || DEFAULT_SETTINGS.deductorAddress).trim(),
      deductorContact: (body.deductorContact || DEFAULT_SETTINGS.deductorContact).trim(),
    };

    const doc = await Setting.findOneAndUpdate(
      { key: 'tds_config' },
      {
        key: 'tds_config',
        value: updatedConfig,
        description: 'TDS configuration including active rate (%) and deductor tax details',
        updatedBy: auth.session?.user?.username || 'admin',
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'TDS settings updated successfully',
      settings: doc.value,
    });
  } catch (error: any) {
    console.error('[API_TDS_SETTINGS_PUT_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
