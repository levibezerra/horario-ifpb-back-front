import type { EntityId, ListParams, ListResponse } from "@/types/api"
import { api } from "../api"

export function createCrudService<
  Entity,
  CreatePayload,
  UpdatePayload = Partial<CreatePayload>,
>(resource: string) {
  return {
    async list(params?: ListParams): Promise<Entity[]> {
      const response = await api.get<Entity[] | ListResponse<Entity>>(resource, { params })
      if (Array.isArray(response.data)) {
        return response.data
      }
      return response.data.content || []
    },
    async getById(id: EntityId): Promise<Entity> {
      const response = await api.get<Entity>(
        `${resource}/${encodeURIComponent(String(id))}`,
      )
      return response.data
    },
    async create(payload: CreatePayload): Promise<Entity> {
      const response = await api.post<Entity>(resource, payload)
      return response.data
    },
    async update(id: EntityId, payload: UpdatePayload): Promise<Entity> {
      const response = await api.put<Entity>(
        `${resource}/${encodeURIComponent(String(id))}`,
        payload,
      )
      return response.data
    },
    async patch(id: EntityId, payload: Partial<UpdatePayload>): Promise<Entity> {
      const response = await api.patch<Entity>(
        `${resource}/${encodeURIComponent(String(id))}`,
        payload,
      )
      return response.data
    },
    async remove(id: EntityId): Promise<void> {
      await api.delete(`${resource}/${encodeURIComponent(String(id))}`)
    },
  }
}