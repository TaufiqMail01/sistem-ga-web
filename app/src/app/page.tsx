import { getDashboardData } from '@/actions/dashboard'

export default async function DashboardPage() {
  const { allAssets, allVehicles, allBuildings } = await getDashboardData()

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard Sistem General Affairs</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 border rounded-lg shadow bg-white">
          <h3 className="text-gray-500 font-medium">Total Aset</h3>
          <p className="text-2xl font-bold mt-2">{allAssets.length}</p>
        </div>
        <div className="p-6 border rounded-lg shadow bg-white">
          <h3 className="text-gray-500 font-medium">Total Kendaraan</h3>
          <p className="text-2xl font-bold mt-2">{allVehicles.length}</p>
        </div>
        <div className="p-6 border rounded-lg shadow bg-white">
          <h3 className="text-gray-500 font-medium">Total Gedung / Ruangan</h3>
          <p className="text-2xl font-bold mt-2">{allBuildings.length}</p>
        </div>
      </div>
    </main>
  )
}