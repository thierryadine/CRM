export default async function handler(req, res) {
  const FB_URL = 'https://crm-groupe-opera-default-rtdb.europe-west1.firebasedatabase.app/crm.json'
  
  if (req.method === 'GET') {
    try {
      const response = await fetch(FB_URL)
      const data = await response.json()
      return res.json(data)
    } catch(e) {
      return res.status(500).json(null)
    }
  }
  
  if (req.method === 'POST') {
    try {
      const response = await fetch(FB_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      })
      return res.json({ ok: response.ok })
    } catch(e) {
      return res.status(500).json({ ok: false })
    }
  }
  
  res.status(405).end()
}
