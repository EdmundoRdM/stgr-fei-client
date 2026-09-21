export interface DocumentoCatalogo {
  Id_Documento: number;
  NombreDocumento: string;
}

export interface DocumentoChecklistItem {
  Id_Documento: number;
  NombreDocumento: string;
  Entregado: boolean;
  FechaEntrega: string | null;
  Id_Estudiante_Documento: number | null;
}

export interface EstudianteChecklist {
  Matricula: string;
  NombreCompleto: string;
  CorreoInstitucional?: string;
  totalRequeridos: number;
  totalEntregados: number;
  completo: boolean;
  documentos: DocumentoChecklistItem[];
}

export interface ChecklistTrabajoResponse {
  Id_TrabajoR: number;
  Titulo: string;
  checklistCompleto: boolean;
  totalDocumentosRequeridos: number;
  totalDocumentosEntregados: number;
  estudiantes: EstudianteChecklist[];
}

export interface EntregaDocumentoPayload {
  Matricula: string;
  Id_Documento: number;
  Entregado?: boolean;
  Numero_Personal?: string | number | null;
}

export interface EntregasLotePayload {
  entregas: Array<{
    Matricula: string;
    Id_Documento: number;
    Entregado: boolean;
  }>;
  Numero_Personal?: string | number | null;
}
