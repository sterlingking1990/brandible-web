import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'

function hashData(value: string) {
  return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { event_name, event_id, brand_username, email, phone } = req.body

  const payload = {
    pixel_code: process.env.TIKTOK_PIXEL_ID,
    event: event_name,
    event_id: event_id,
    timestamp: new Date().toISOString(),
    context: {
      user: {
        email: email ? hashData(email) : undefined,
        phone_number: phone ? hashData(phone) : undefined,
      },
      page: {
        url: `https://shop.brandiblebms.com/${brand_username}/wall`,
      }
    },
    properties: {
      content_id: brand_username,
      content_type: 'product',
    }
  }

  try {
    const response = await fetch(
      'https://business-api.tiktok.com/open_api/v1.3/event/track/',
      {
        method: 'POST',
        headers: {
          'Access-Token': process.env.TIKTOK_ACCESS_TOKEN!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: [payload] }),
      }
    )
    const data = await response.json()
    return res.status(200).json(data)
  } catch (error) {
    console.error('TikTok Events API error:', error)
    return res.status(500).json({ error: 'Failed to send event' })
  }
}