import {
  CreatePropertyDTO,
  PropertyDTO,
  UpdatePropertyDTO,
} from "../property/property.dto";

export interface IPropertyRepository {
  getProperties(): Promise<PropertyDTO[]>;
  getPropertyById(id: number): Promise<PropertyDTO | null>;
  createProperty(propertyData: CreatePropertyDTO): Promise<number>;
  updateProperty(propertyData: UpdatePropertyDTO): Promise<number>;
}
