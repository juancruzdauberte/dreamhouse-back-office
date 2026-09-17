import { ResultSetHeader, RowDataPacket } from "mysql2";
import {
  CreatePropertyDTO,
  PropertyDTO,
  UpdatePropertyDTO,
} from "../property/property.dto";
import { pool } from "../../db/db";
import { IPropertyRepository } from "./property.interface";

export class PropertyRepository implements IPropertyRepository {
  // NEW METHOD: Get all active properties
  async getProperties(): Promise<PropertyDTO[]> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT
              id_propiedad as id,
              nombre as name,
              descripcion as description,
              capacidad_maxima as max_guests,
              estado as status
            FROM dim_propiedades
            WHERE estado = 'activa'
            ORDER BY nombre ASC`,
      );
      return rows as PropertyDTO[];
    } catch (error) {
      console.error("Error getting properties:", error);
      return [];
    }
  }
  async getPropertyById(id: number): Promise<PropertyDTO | null> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT
          id_propiedad as id,
          nombre as name,
          descripcion as description,
          capacidad_maxima as max_capacity,
          estado as status
        FROM dim_propiedades
        WHERE id_propiedad = ?`,
        [id],
      );
      if (rows.length === 0) return null;
      return rows[0] as PropertyDTO;
    } catch (error) {
      console.error("Error getting property by ID:", error);
      return null;
    }
  }
  async createProperty(propertyData: CreatePropertyDTO): Promise<number> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        "INSERT INTO dim_propiedades (nombre, descripcion, capacidad_maxima) VALUES (?, ?, ?)",
        [propertyData.name, propertyData.description, propertyData.max_guests],
      );
      return result.insertId;
    } catch (error) {
      console.error("=== ERROR IN REPOSITORY ===");
      console.error("Error details:", error);
      console.error(
        "Error message:",
        error instanceof Error ? error.message : "Unknown error",
      );
      console.error("=== END ERROR ===");
      throw error;
    }
  }

  async updateProperty(propertyData: UpdatePropertyDTO): Promise<number> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        "UPDATE dim_propiedades SET nombre = ?, descripcion = ?, capacidad_maxima = ?, estado = ? WHERE id_propiedad = ?",
        [
          propertyData.name,
          propertyData.description,
          propertyData.max_guests,
          propertyData.status,
          propertyData.id,
        ],
      );
      return result.insertId;
    } catch (error) {
      console.error("=== ERROR IN REPOSITORY ===");
      console.error("Error details:", error);
      console.error(
        "Error message:",
        error instanceof Error ? error.message : "Unknown error",
      );
      console.error("=== END ERROR ===");
      throw error;
    }
  }
}
