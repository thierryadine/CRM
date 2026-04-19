export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  try {
    const response = await fetch('https://ybnafhfijzzcqmakfzy.supabase.co/rest/v1/crm_data?id=eq.groupe-opera&select=data', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlibmFmaGZpamp6emNxbWFrZnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MjYwODMsImV4cCI6MjA5MjEwMjA4M30.QCb5VPm40ZYN8V3-pZQnKav0s1gP39N4Pbn7sW0k0Hc',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlibmFmaGZpamp6emNxbWFrZnp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MjYwODMsImV4cCI6MjA5MjEwMjA4M30.QCb5VPm40ZYN8V3-pZQnKav0s1gP39N4Pbn7sW0k0Hc',
      }
    })
    const rows = await response.json()
    res.json(rows?.[0]?.data || null)
  } catch(e) {
    res.status(500).json(null)
  }
}
