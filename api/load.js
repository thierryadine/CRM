export default async function handler(req, res) {
  const FB_URL = 'https://crm-groupe-opera-default-rtdb.europe-west1.firebasedatabase.app/crm.json'
  try {
    const response = await fetch(FB_URL)
    const data = await response.json()
    res.json(data)
  } catch(e) {
    res.status(500).json(null)
  }
}
