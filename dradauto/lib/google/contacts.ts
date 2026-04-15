const PEOPLE_API = 'https://people.googleapis.com/v1'

export interface GoogleContactData {
  nome: string
  whatsapp: string
  especialidadeMedico?: string
  nomeMedico?: string
}

// Criar contato no Google Contacts do médico
export async function createGoogleContact(
  accessToken: string,
  data: GoogleContactData
): Promise<string | null> {
  const body = {
    names: [{ givenName: data.nome }],
    phoneNumbers: [
      {
        value: data.whatsapp,
        type: 'mobile',
        canonicalForm: data.whatsapp,
      },
    ],
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

  if (!res.ok) {
    const errorText = await res.text()
    console.error(`[Google Contacts] HTTP ${res.status}:`, errorText)

    if (res.status === 401) throw new Error('GOOGLE_TOKEN_REVOKED')

    if (res.status === 403) {
      // Distinguir "scope missing" de "API not enabled"
      if (errorText.includes('has not been used') || errorText.includes('is disabled') || errorText.includes('SERVICE_DISABLED')) {
        throw new Error('GOOGLE_PEOPLE_API_DISABLED')
      }
      throw new Error('GOOGLE_CONTACTS_SCOPE_MISSING')
    }

    return null
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
    phoneNumbers: [{ value: data.whatsapp, type: 'mobile' }],
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
