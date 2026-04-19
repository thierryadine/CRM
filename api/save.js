export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const response = await fetch('https://ybnafhfijzzcqmakfzy.supabase.co/rest/v1/crm_data', {
      method: 'POST',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlibmFmaGZpamp6emNxbWFrZnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MjYwODMsImV4cCI6MjA5MjEwMjA4M30.QCb5VPm40ZYN8V3-pZQnKav0s1gP39N4Pbn7sW0k0Hc',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlibmFmaGZpamp6emNxbWFrZnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MjYwODMsImV4cCI6MjA5MjEwMjA4M30.QCb5VPm40ZYN8V3-pZQnKav0s1gP39N4Pbn7sW0k0Hc',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ id: 'groupe-opera', data: req.body, updated_at: new Date().toISOString() })
    })
    res.json({ ok: response.ok })
  } catch(e) {
    res.status(500).json({ ok: false })
  }
}
