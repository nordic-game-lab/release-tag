import { Readable } from 'stream'

export async function readStream (stream: Readable): Promise<string> {  
  const chunks: string[] = []

  for await (const chunk of stream) {
    chunks.push(chunk)
  }

  return chunks.join('')
}
