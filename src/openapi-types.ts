/** Minimal OpenAPI 3.1 type definitions (just what we need) */
export namespace OpenAPIV3_1 {
  export interface Document {
    openapi: '3.1.0';
    info: InfoObject;
    servers?: ServerObject[];
    paths: PathsObject;
    components?: ComponentsObject;
    security?: SecurityRequirementObject[];
    tags?: TagObject[];
  }

  export interface InfoObject {
    title: string;
    version: string;
    description?: string;
  }

  export interface ServerObject {
    url: string;
    description?: string;
  }

  export interface PathsObject {
    [path: string]: PathItemObject;
  }

  export interface PathItemObject {
    get?: OperationObject;
    post?: OperationObject;
    put?: OperationObject;
    patch?: OperationObject;
    delete?: OperationObject;
  }

  export interface OperationObject {
    operationId?: string;
    summary?: string;
    tags?: string[];
    parameters?: ParameterObject[];
    requestBody?: RequestBodyObject;
    responses: ResponsesObject;
    security?: SecurityRequirementObject[];
  }

  export interface ParameterObject {
    name: string;
    in: 'path' | 'query' | 'header' | 'cookie';
    required?: boolean;
    schema: SchemaObject;
    description?: string;
  }

  export interface RequestBodyObject {
    required?: boolean;
    content: {
      [mediaType: string]: {
        schema: SchemaObject | ReferenceObject;
      };
    };
  }

  export interface ResponsesObject {
    [statusCode: string]: ResponseObject;
  }

  export interface ResponseObject {
    description: string;
    content?: {
      [mediaType: string]: {
        schema: SchemaObject | ReferenceObject;
      };
    };
  }

  export interface SchemaObject {
    type?: string | string[];
    properties?: { [name: string]: SchemaObject | ReferenceObject };
    required?: string[];
    items?: SchemaObject | ReferenceObject;
    enum?: unknown[];
    format?: string;
    minimum?: number;
    maximum?: number;
    minLength?: number;
    maxLength?: number;
    description?: string;
    example?: unknown;
    default?: unknown;
    nullable?: boolean;
  }

  export interface ReferenceObject {
    $ref: string;
  }

  export interface ComponentsObject {
    schemas?: { [name: string]: SchemaObject };
    securitySchemes?: { [name: string]: SecuritySchemeObject };
  }

  export interface SecuritySchemeObject {
    type: string;
    scheme?: string;
    bearerFormat?: string;
    description?: string;
  }

  export interface SecurityRequirementObject {
    [name: string]: string[];
  }

  export interface TagObject {
    name: string;
    description?: string;
  }
}
