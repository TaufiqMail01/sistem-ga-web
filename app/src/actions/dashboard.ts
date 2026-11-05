import { prisma } from '@/lib/prisma'

export async function getDashboardData() {
  const allAssets = await prisma.assets.findMany()
  const allVehicles = await prisma.vehicles_v2.findMany()
  const allBuildings = await prisma.operational_buildings.findMany()

  return {
    allAssets,
    allVehicles,
    allBuildings,
  }
}