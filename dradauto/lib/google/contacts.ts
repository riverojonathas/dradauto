const PEOPLE_API = 'https://people.googleapis.com/v1'
import { normalizeDigits } from '@/lib/phone'

export interface GoogleContactData {
  nome: string
  whatsapp: string
  especialidadeMedico?: string
  nomeMedico?: string
}

function toGooglePhone(value: string): string | null {
  const digits = normalizeDigits(value)
  if (!digits) return null
  return `+${digits}`
}

// Criar contato no Google Contacts do médico
export async function createGoogleContact(
  accessToken: string,
  data: GoogleContactData
): Promise<string | null> {
  const phone = toGooglePhone(data.whatsapp)

  const body = {
    names: [{ givenName: data.nome }],
    phoneNumbers: phone
      ? [
          {
            value: phone,
            type: 'mobile',
          },
        ]
      : [],
    biographies: [
      {
        value: `Paciente dradauto${data.especialidadeMedico ? ` — ${data.especialidadeMedico}` : ''}`,
        contentType: 'TEXT_PLAIN',
      },
    ],
  }

  const res = await fetch(`${PEOPLE_API}/people:createContact`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (res.status === 403) throw new Error('GOOGLE_CONTACTS_SCOPE_MISSING')
  if (!res.ok) {
    const raw = await res.text()
    console.error('Google Contacts create error:', raw)

    let detail = raw
    try {
      const parsed = JSON.parse(raw)
      detail = parsed?.error?.message || raw
    } catch {
      // mantém raw quando não for JSON
    }

    throw new Error(`GOOGLE_CONTACTS_API_ERROR:${res.status}:${detail.slice(0, 240)}`)
  }

  const contact = await res.json()
  // resourceName ex: "people/c123456789"
  return contact.resourceName as string
}

// Atualizar contato existente
export async function updateGoogleContact(
  accessToken: string,
  resourceName: string,
  data: GoogleContactData
): Promise<boolean> {
  const phone = toGooglePhone(data.whatsapp)

  // 1. Buscar etag atual (obrigatório para update)
  const getRes = await fetch(
    `${PEOPLE_API}/${resourceName}?personFields=names,phoneNumbers,biographies`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!getRes.ok) return false
  const current = await getRes.json()

  const body = {
    ...current,
    names: [{ givenName: data.nome }],
    phoneNumbers: phone ? [{ value: phone, type: 'mobile' }] : [],
  }

  const res = await fetch(
    `${PEOPLE_API}/${resourceName}:updateContact?updatePersonFields=names,phoneNumbers`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )

  return res.ok
}

// Deletar contato (ao excluir paciente — opcional)
export async function deleteGoogleContact(
  accessToken: string,
  resourceName: string
): Promise<void> {
  await fetch(`${PEOPLE_API}/${resourceName}:deleteContact`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  // Ignorar erros — paciente já foi removido do banco
}
