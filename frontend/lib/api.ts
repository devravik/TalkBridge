const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export async function createRoom(): Promise<{ room_id: string; join_url: string }> {
  const res = await fetch(`${API_URL}/api/v1/rooms`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to create room')
  return res.json()
}

export async function joinRoom(
  roomId: string,
  language: string,
  displayName?: string,
): Promise<{ participant_id: string; room_id: string; language: string }> {
  const res = await fetch(`${API_URL}/api/v1/rooms/${roomId}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language, display_name: displayName || '' }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to join room')
  }
  return res.json()
}

export async function endRoom(roomId: string): Promise<void> {
  await fetch(`${API_URL}/api/v1/rooms/${roomId}/end`, { method: 'POST' })
}
