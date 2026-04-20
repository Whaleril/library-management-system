import { useCallback, useEffect, useState } from 'react'
import { PAGE_SIZE } from '../constants'
import { adminApi } from '../services/adminApi'

export function useLibrarians() {
  const [query, setQuery] = useState({ page: 1, size: PAGE_SIZE, keyword: '' })
  const [data, setData] = useState({ total: 0, page: 1, size: PAGE_SIZE, list: [] })
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await adminApi.listLibrarians(query)
      setData(result)
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    load()
  }, [load])

  const setKeyword = (keyword) => {
    setQuery((prev) => ({ ...prev, keyword, page: 1 }))
  }

  const setPage = (page) => {
    setQuery((prev) => ({ ...prev, page }))
  }

  const createLibrarian = async (payload) => {
    await adminApi.createLibrarian(payload)
    await load()
  }

  const updateLibrarian = async (id, payload) => {
    await adminApi.updateLibrarian(id, payload)
    await load()
  }

  const deleteLibrarian = async (id) => {
    await adminApi.deleteLibrarian(id)
    if (data.list.length === 1 && query.page > 1) {
      setQuery((prev) => ({ ...prev, page: prev.page - 1 }))
      return
    }
    await load()
  }

  return {
    query,
    data,
    loading,
    setKeyword,
    setPage,
    createLibrarian,
    updateLibrarian,
    deleteLibrarian,
    reload: load
  }
}
