"use client"

import { useEffect, useState, useCallback } from "react"

export interface PendingStop {
  localId:         string
  stopId:          string
  routeId:         string
  status:          "delivered" | "partial" | "failed"
  collectedAmount: number
  paymentMethod:   "cash" | "card" | "transfer" | "account"
  notes:           string
  signatureUrl?:   string
  photoUrl?:       string
  createdAt:       number
}

const DB_NAME    = "panaderia-pwa"
const DB_VERSION = 1
const STORE      = "pending_stops"

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "localId" })
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

async function dbGet<T>(storeName: string): Promise<T[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, "readonly")
    const req = tx.objectStore(storeName).getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror   = () => reject(req.error)
  })
}

async function dbPut(storeName: string, value: unknown): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, "readwrite")
    const req = tx.objectStore(storeName).put(value)
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })
}

async function dbDelete(storeName: string, key: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(storeName, "readwrite")
    const req = tx.objectStore(storeName).delete(key)
    req.onsuccess = () => resolve()
    req.onerror   = () => reject(req.error)
  })
}

export function useOfflineSync() {
  const [isOnline, setIsOnline]       = useState(true)
  const [pending, setPending]         = useState<PendingStop[]>([])
  const [syncing, setSyncing]         = useState(false)
  const [lastSync, setLastSync]       = useState<Date | null>(null)

  // Cargar pendientes desde IndexedDB al montar
  useEffect(() => {
    setIsOnline(navigator.onLine)
    loadPending()
  }, [])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      syncAll()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  async function loadPending() {
    const items = await dbGet<PendingStop>(STORE)
    setPending(items)
  }

  const queueStop = useCallback(async (stop: Omit<PendingStop, "localId" | "createdAt">) => {
    const item: PendingStop = {
      ...stop,
      localId:   crypto.randomUUID(),
      createdAt: Date.now(),
    }
    await dbPut(STORE, item)
    setPending(prev => [...prev, item])

    if (navigator.onLine) syncAll()
  }, [])

  async function syncAll() {
    const items = await dbGet<PendingStop>(STORE)
    if (items.length === 0) return

    setSyncing(true)
    try {
      const res = await fetch("/api/sync/delivery", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ stops: items }),
      })

      if (res.ok) {
        const { synced } = await res.json() as { synced: string[] }
        // Borrar solo los que el server confirmó
        await Promise.all(synced.map(id => dbDelete(STORE, id)))
        await loadPending()
        setLastSync(new Date())
      }
    } finally {
      setSyncing(false)
    }
  }

  return {
    isOnline,
    pending,
    syncing,
    lastSync,
    queueStop,
    syncNow: syncAll,
  }
}
