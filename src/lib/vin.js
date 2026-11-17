// Serviciu public NHTSA vPIC (gratuit). Acoperă bine piața SUA; pentru mașini europene poate returna date parțiale.
const API = 'https://vpic.nhtsa.dot.gov/api/vehicles'
export async function decodeVin(vin) {
  const j = await (await fetch(`${API}/DecodeVinValues/${encodeURIComponent(vin)}?format=json`)).json(), x = j.Results?.[0] || {}
  return {brand: x.Make, model: x.Model, year: x.ModelYear, bodyClass: x.BodyClass, fuel: x.FuelTypePrimary, elec: x.ElectrificationLevel}
}
export const mapBody = b => /pickup/i.test(b || '') ? 'Pickup' : /sport utility|suv|crossover/i.test(b || '') ? 'SUV' : /hatch/i.test(b || '') ? 'Hatchback' : /wagon|van|minivan/i.test(b || '') ? 'Break' : /coupe|convertible|roadster/i.test(b || '') ? 'Coupe' : 'Sedan'
export const mapFuel = (f, e) => /plug-in/i.test(e || '') ? 'PHEV' : /hybrid/i.test(e || '') ? 'Hibrid' : /electric/i.test(f || '') && !/gasoline|diesel/i.test(f || '') ? 'Electric' : /diesel/i.test(f || '') ? 'Diesel' : /lpg|propane|natural/i.test(f || '') ? 'GPL' : 'Benzină'
export async function modelsOnline(make) {
  const j = await (await fetch(`${API}/GetModelsForMake/${encodeURIComponent(make)}?format=json`)).json()
  return [...new Set((j.Results || []).map(x => x.Model_Name))]
}
