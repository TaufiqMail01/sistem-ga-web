import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Ambil data teks dari form
    const asset_code = formData.get('asset_code') as string;
    const name = formData.get('name') as string;
    const category = formData.get('category') as string;
    const brand = formData.get('brand') as string;
    const serial_number = formData.get('serial_number') as string;
    const specification = formData.get('specification') as string;
    const purchase_date = formData.get('purchase_date') as string;
    const purchase_cost = parseFloat(formData.get('purchase_cost') as string) || 0;
    const supplier = formData.get('supplier') as string;
    const location = formData.get('location') as string;
    const holder = formData.get('holder') as string;
    const condition = formData.get('condition') as string;
    const description = formData.get('description') as string;

    // Tangani File Nota (Proof)
    const proofFile = formData.get('proof_file') as File | null;
    let proof_url = null;
    if (proofFile && proofFile.size > 0) {
      const bytes = await proofFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `proof_${Date.now()}_${proofFile.name.replace(/\s+/g, '_')}`;
      const uploadDir = path.join(process.cwd(), 'public/uploads/proofs');
      
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, fileName), buffer);
      proof_url = `/uploads/proofs/${fileName}`;
    }

    // Tangani Foto Fisik Aset 2D
    const assetPhotoFile = formData.get('asset_photo_file') as File | null;
    let asset_photo_url = null;
    if (assetPhotoFile && assetPhotoFile.size > 0) {
      const bytes = await assetPhotoFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const photoName = `photo_${Date.now()}_${assetPhotoFile.name.replace(/\s+/g, '_')}`;
      const uploadDir = path.join(process.cwd(), 'public/uploads/photos');
      
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, photoName), buffer);
      asset_photo_url = `/uploads/photos/${photoName}`;
    }

    // Simpan ke database MySQL via Prisma
    const newAsset = await prisma.assets.create({
      data: {
        asset_code,
        name,
        category,
        brand,
        serial_number,
        specification,
        purchase_date: new Date(purchase_date),
        purchase_cost,
        supplier,
        location,
        holder,
        condition,
        description,
        proof_url,
        asset_photo_url,
      },
    });

    return NextResponse.json({ success: true, message: 'Aset berhasil disimpan!', data: newAsset }, { status: 201 });
  } catch (error: any) {
    console.error('Error saving asset:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}