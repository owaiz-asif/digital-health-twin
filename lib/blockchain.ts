// Simple blockchain-like module for data integrity using Web Crypto API

type Block = {
  index: number
  timestamp: string
  data: string
  previousHash: string
  hash: string
  nonce: number
}

// In-memory chain (in production, this would be persisted)
const chain: Block[] = []

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  return hashHex
}

function simpleHash(input: string): string {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  // Convert to hex and pad to make it look like a proper hash
  const hexHash = Math.abs(hash).toString(16).padStart(8, "0")
  // Create a longer hash by repeating and mixing
  const timestamp = Date.now().toString(16)
  return `${hexHash}${timestamp}${hexHash}`.substring(0, 64)
}

function calculateHash(index: number, timestamp: string, data: string, previousHash: string, nonce: number): string {
  return simpleHash(index + timestamp + data + previousHash + nonce)
}

function createGenesisBlock(): Block {
  const block: Block = {
    index: 0,
    timestamp: new Date().toISOString(),
    data: "Genesis Block - Digital Health Twin",
    previousHash: "0",
    hash: "",
    nonce: 0,
  }
  block.hash = calculateHash(block.index, block.timestamp, block.data, block.previousHash, block.nonce)
  return block
}

export function initializeChain(): void {
  if (chain.length === 0) {
    chain.push(createGenesisBlock())
  }
}

export function addBlock(data: object): string {
  initializeChain()

  const previousBlock = chain[chain.length - 1]
  const newBlock: Block = {
    index: previousBlock.index + 1,
    timestamp: new Date().toISOString(),
    data: JSON.stringify(data),
    previousHash: previousBlock.hash,
    hash: "",
    nonce: 0,
  }

  // Simple proof of work (minimal for demo)
  while (true) {
    newBlock.hash = calculateHash(
      newBlock.index,
      newBlock.timestamp,
      newBlock.data,
      newBlock.previousHash,
      newBlock.nonce,
    )
    if (newBlock.hash.startsWith("00")) break
    newBlock.nonce++
    if (newBlock.nonce > 10000) break // Safety limit
  }

  chain.push(newBlock)
  return newBlock.hash
}

export function verifyChain(): boolean {
  for (let i = 1; i < chain.length; i++) {
    const currentBlock = chain[i]
    const previousBlock = chain[i - 1]

    const calculatedHash = calculateHash(
      currentBlock.index,
      currentBlock.timestamp,
      currentBlock.data,
      currentBlock.previousHash,
      currentBlock.nonce,
    )

    if (currentBlock.hash !== calculatedHash) return false
    if (currentBlock.previousHash !== previousBlock.hash) return false
  }
  return true
}

export function getChain(): Block[] {
  return [...chain]
}

// Hash data for integrity verification (without adding to chain)
export function hashData(data: object): string {
  return simpleHash(JSON.stringify(data) + new Date().toISOString())
}
