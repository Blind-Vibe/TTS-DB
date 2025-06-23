import { supabase } from '../../supabase';
import {
  CreateArtistSchema,
  UpdateArtistSchema,
  ArtistQuerySchema,
  ArtistIdSchema,
  validateArtistBusinessRules,
  type CreateArtistRequest,
  type UpdateArtistRequest,
  type ArtistQueryRequest,
  type ArtistIdRequest,
  type Artist,
} from '../schemas/artistSchemas';
import { buildSuccessResponse, type ApiResponse } from '../types';
import { ApiError } from '../errors';

// Simple logger for the service
const logger = {
  info: (message: string, context: Record<string, unknown> = {}) => {
    console.log(`[ArtistService] ${message}`, context);
  },
  error: (message: string, context: Record<string, unknown> = {}) => {
    console.error(`[ArtistService] ${message}`, context);
  },
  warn: (message: string, context: Record<string, unknown> = {}) => {
    console.warn(`[ArtistService] ${message}`, context);
  }
};

// Helper functions for standardized responses
const createSuccessResponse = <T>(data: T, requestId: string, message?: string): ApiResponse<T> => {
  return buildSuccessResponse(data, requestId, { message });
};

const createErrorResponse = (
  type: string,
  title: string,
  status: number,
  detail: string,
  requestId: string,
  extensions?: Record<string, unknown>
): ApiResponse<ApiError> => {
  const error: ApiError = {
    type: `https://docs.trainstation-dashboard.com/errors/${type.toLowerCase()}`,
    title,
    status,
    detail,
    instance: `/api/v1/request/${requestId}`,
    timestamp: new Date().toISOString(),
    request_id: requestId,
  };

  if (extensions) {
    Object.assign(error, extensions);
  }

  return {
    data: error,
    meta: {
      request_id: requestId,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      status: 'error',
      message: title,
    }
  };
};

// Helper function to convert snake_case to camelCase
const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  
  if (obj !== null && typeof obj === 'object') {
    const result: any = {};
    Object.entries(obj).forEach(([key, value]) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = toCamelCase(value);
    });
    return result;
  }
  
  return obj;
};

// Helper function to convert camelCase to snake_case
const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }
  
  if (obj !== null && typeof obj === 'object') {
    const result: any = {};
    Object.entries(obj).forEach(([key, value]) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = toSnakeCase(value);
    });
    return result;
  }
  
  return obj;
};

/**
 * Enhanced Artist Service
 * Provides comprehensive artist management with validation, business rules,
 * and RFC 7807 compliant responses.
 * 
 * This demonstrates the API standards pattern that can be applied across all entities.
 */
export class ArtistService {
  private static readonly TABLE_NAME = 'artists';

  /**
   * Get all artists with filtering and pagination
   */
  static async getArtists(
    query: ArtistQueryRequest,
    requestId: string = crypto.randomUUID(),
    userId: string = 'system'
  ): Promise<ApiResponse<{ artists: Artist[]; total: number; hasMore: boolean }> | ApiResponse<ApiError>> {
    try {
      // Validate query parameters with Zod
      const validatedQuery = ArtistQuerySchema.parse(query);

      const startTime = Date.now();
      logger.info('Getting artists', { 
        requestId, 
        userId, 
        query: validatedQuery 
      });

      // Build query with filters
      let queryBuilder = supabase
        .from(this.TABLE_NAME)
        .select('*', { count: 'exact' })
        .range(validatedQuery.offset, validatedQuery.offset + validatedQuery.limit - 1)
        .order('created_at', { ascending: false });

      // Apply filters
      if (validatedQuery.status) {
        queryBuilder = queryBuilder.eq('status', validatedQuery.status);
      }

      if (validatedQuery.genre) {
        queryBuilder = queryBuilder.ilike('genre', `%${validatedQuery.genre}%`);
      }

      if (validatedQuery.location) {
        queryBuilder = queryBuilder.ilike('location', `%${validatedQuery.location}%`);
      }

      if (validatedQuery.search) {
        queryBuilder = queryBuilder.or(
          `name.ilike.%${validatedQuery.search}%,` +
          `genre.ilike.%${validatedQuery.search}%,` +
          `location.ilike.%${validatedQuery.search}%`
        );
      }

      if (validatedQuery.hasUpcomingPerformances !== undefined) {
        if (validatedQuery.hasUpcomingPerformances) {
          queryBuilder = queryBuilder.not('next_performance', 'is', null);
        } else {
          queryBuilder = queryBuilder.is('next_performance', null);
        }
      }

      const { data, error, count } = await queryBuilder;

      if (error) {
        logger.error('Failed to fetch artists', { 
          requestId, 
          userId, 
          error: error.message 
        });
        
        return createErrorResponse(
          'FETCH_FAILED',
          'Failed to fetch artists',
          500,
          'An error occurred while retrieving artists',
          requestId,
          { originalError: error.message }
        );
      }

      // Transform and enhance artist data
      const enhancedArtists = (data || []).map((artist: any) => 
        this.enhanceArtistData(toCamelCase(artist), requestId)
      );

      const total = count || 0;
      const hasMore = validatedQuery.offset + validatedQuery.limit < total;

      logger.info('Artists fetched successfully', {
        requestId,
        userId,
        count: enhancedArtists.length,
        total,
        duration: Date.now() - startTime
      });

      return createSuccessResponse({
        artists: enhancedArtists,
        total,
        hasMore
      }, requestId);

    } catch (error) {
      logger.error('Unexpected error in getArtists', { 
        requestId, 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      return createErrorResponse(
        'INTERNAL_ERROR',
        'Unexpected error occurred',
        500,
        'An unexpected error occurred while fetching artists',
        requestId,
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Get a single artist by ID
   */
  static async getArtistById(
    params: ArtistIdRequest,
    requestId: string = crypto.randomUUID(),
    userId: string = 'system'
  ): Promise<ApiResponse<Artist> | ApiResponse<ApiError>> {
    try {
      const validatedParams = ArtistIdSchema.parse(params);
      
      const startTime = Date.now();
      logger.info('Getting artist by ID', { 
        requestId, 
        userId, 
        artistId: validatedParams.id 
      });

      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('id', validatedParams.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return createErrorResponse(
            'ARTIST_NOT_FOUND',
            'Artist not found',
            404,
            `No artist found with ID: ${validatedParams.id}`,
            requestId
          );
        }

        logger.error('Failed to fetch artist', { 
          requestId, 
          userId, 
          artistId: validatedParams.id,
          error: error.message 
        });
        
        return createErrorResponse(
          'FETCH_FAILED',
          'Failed to fetch artist',
          500,
          'An error occurred while retrieving the artist',
          requestId,
          { originalError: error.message }
        );
      }

      const enhancedArtist = this.enhanceArtistData(toCamelCase(data), requestId);

      logger.info('Artist fetched successfully', {
        requestId,
        userId,
        artistId: validatedParams.id,
        duration: Date.now() - startTime
      });

      return createSuccessResponse(enhancedArtist, requestId);

    } catch (error) {
      logger.error('Unexpected error in getArtistById', { 
        requestId, 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      return createErrorResponse(
        'INTERNAL_ERROR',
        'Unexpected error occurred',
        500,
        'An unexpected error occurred while fetching the artist',
        requestId,
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Create a new artist with comprehensive validation
   */
  static async createArtist(
    artistData: CreateArtistRequest,
    requestId: string = crypto.randomUUID(),
    userId: string = 'system'
  ): Promise<ApiResponse<Artist> | ApiResponse<ApiError>> {
    try {
      // Validate input with Zod schemas
      const validatedData = CreateArtistSchema.parse(artistData);

      const startTime = Date.now();
      logger.info('Creating artist', { 
        requestId, 
        userId, 
        artistName: validatedData.name 
      });

      // Convert to database format
      const dbData = toSnakeCase({
        ...validatedData,
        created_by: userId,
        updated_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .insert(dbData)
        .select()
        .single();

      if (error) {
        logger.error('Failed to create artist', { 
          requestId, 
          userId, 
          error: error.message 
        });
        
        return createErrorResponse(
          'CREATE_FAILED',
          'Failed to create artist',
          500,
          'An error occurred while creating the artist',
          requestId,
          { originalError: error.message }
        );
      }

      const enhancedArtist = this.enhanceArtistData(toCamelCase(data), requestId);

      logger.info('Artist created successfully', {
        requestId,
        userId,
        artistId: data.id,
        artistName: validatedData.name,
        duration: Date.now() - startTime
      });

      return createSuccessResponse(enhancedArtist, requestId);

    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return createErrorResponse(
          'VALIDATION_ERROR',
          'Validation failed',
          400,
          'The provided artist data is invalid',
          requestId,
          { validationErrors: (error as any).errors }
        );
      }

      logger.error('Unexpected error in createArtist', { 
        requestId, 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      return createErrorResponse(
        'INTERNAL_ERROR',
        'Unexpected error occurred',
        500,
        'An unexpected error occurred while creating the artist',
        requestId,
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Update an existing artist with business rule validation
   */
  static async updateArtist(
    artistData: UpdateArtistRequest,
    requestId: string = crypto.randomUUID(),
    userId: string = 'system'
  ): Promise<ApiResponse<Artist> | ApiResponse<ApiError>> {
    try {
      // Validate input with Zod schemas
      const validatedData = UpdateArtistSchema.parse(artistData);

      const startTime = Date.now();
      logger.info('Updating artist', { 
        requestId, 
        userId, 
        artistId: validatedData.id 
      });

      // Get existing artist for business rule validation
      const existingResponse = await this.getArtistById(
        { id: validatedData.id }, 
        requestId, 
        userId
      );
      
      if ('data' in existingResponse && 'type' in existingResponse.data) {
        return existingResponse as ApiResponse<ApiError>;
      }

      const existingArtist = (existingResponse as ApiResponse<Artist>).data;

      // Validate business rules for status changes
      if (validatedData.status && validatedData.status !== existingArtist.status) {
        const statusValidation = validateArtistBusinessRules.canChangeStatus(
          existingArtist, 
          validatedData.status
        );
        
        if (!statusValidation.valid) {
          return createErrorResponse(
            'BUSINESS_RULE_VIOLATION',
            'Status change not allowed',
            400,
            statusValidation.reason || 'Status change violates business rules',
            requestId
          );
        }
      }

      // Convert to database format (excluding id and creation timestamp)
      const { id, ...updateData } = validatedData;
      const dbData = toSnakeCase({
        ...updateData,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      });

      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .update(dbData)
        .eq('id', validatedData.id)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update artist', { 
          requestId, 
          userId, 
          artistId: validatedData.id,
          error: error.message 
        });
        
        return createErrorResponse(
          'UPDATE_FAILED',
          'Failed to update artist',
          500,
          'An error occurred while updating the artist',
          requestId,
          { originalError: error.message }
        );
      }

      const enhancedArtist = this.enhanceArtistData(toCamelCase(data), requestId);

      logger.info('Artist updated successfully', {
        requestId,
        userId,
        artistId: validatedData.id,
        duration: Date.now() - startTime
      });

      return createSuccessResponse(enhancedArtist, requestId);

    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return createErrorResponse(
          'VALIDATION_ERROR',
          'Validation failed',
          400,
          'The provided artist data is invalid',
          requestId,
          { validationErrors: (error as any).errors }
        );
      }

      logger.error('Unexpected error in updateArtist', { 
        requestId, 
        userId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });

      return createErrorResponse(
        'INTERNAL_ERROR',
        'Unexpected error occurred',
        500,
        'An unexpected error occurred while updating the artist',
        requestId,
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Delete an artist with business rule validation
   */
  static async deleteArtist(
    params: ArtistIdRequest,
    requestId: string = crypto.randomUUID(),
    userId: string = 'system'
  ): Promise<ApiResponse<{ deleted: boolean }> | ApiResponse<ApiError>> {
    try {
      const validatedParams = ArtistIdSchema.parse(params);

      const startTime = Date.now();
      logger.info('Deleting artist', {
        requestId,
        userId,
        artistId: validatedParams.id
      });

      // Fetch existing artist for business rule validation
      const existingResponse = await this.getArtistById(
        { id: validatedParams.id },
        requestId,
        userId
      );

      if ('data' in existingResponse && 'type' in existingResponse.data) {
        return existingResponse as ApiResponse<ApiError>;
      }

      const existingArtist = (existingResponse as ApiResponse<Artist>).data;
      const canDelete = validateArtistBusinessRules.canDelete(existingArtist);
      if (!canDelete.valid) {
        return createErrorResponse(
          'BUSINESS_RULE_VIOLATION',
          'Cannot delete artist',
          400,
          canDelete.reason || 'Artist cannot be deleted',
          requestId
        );
      }

      const { error } = await supabase
        .from(this.TABLE_NAME)
        .delete()
        .eq('id', validatedParams.id);

      if (error) {
        logger.error('Failed to delete artist', {
          requestId,
          userId,
          artistId: validatedParams.id,
          error: error.message
        });

        return createErrorResponse(
          'DELETE_FAILED',
          'Failed to delete artist',
          500,
          'An error occurred while deleting the artist',
          requestId,
          { originalError: error.message }
        );
      }

      logger.info('Artist deleted successfully', {
        requestId,
        userId,
        artistId: validatedParams.id,
        duration: Date.now() - startTime
      });

      return createSuccessResponse({ deleted: true }, requestId, 'Artist deleted successfully');

    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return createErrorResponse(
          'VALIDATION_ERROR',
          'Validation failed',
          400,
          'The provided artist id is invalid',
          requestId,
          { validationErrors: (error as any).errors }
        );
      }

      logger.error('Unexpected error in deleteArtist', {
        requestId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return createErrorResponse(
        'INTERNAL_ERROR',
        'Unexpected error occurred',
        500,
        'An unexpected error occurred while deleting the artist',
        requestId,
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Enhanced artist data with business flags and metrics
   */
  private static enhanceArtistData(rawArtist: any, requestId: string): Artist {
    const artist = rawArtist as Artist;

    // Calculate performance metrics
    const performanceHistory = artist.performanceHistory || [];
    const totalPerformances = performanceHistory.length;
    const totalRevenue = performanceHistory.reduce((sum, perf) => sum + perf.revenue, 0);
    const averageAttendance = totalPerformances > 0 
      ? Math.round(performanceHistory.reduce((sum, perf) => sum + perf.attendance, 0) / totalPerformances)
      : 0;

    // Find latest and next performance dates
    const sortedPerformances = performanceHistory
      .map(perf => ({ ...perf, date: new Date(perf.date) }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const now = new Date();
    const lastPerformanceDate = sortedPerformances
      .filter(perf => perf.date < now)
      .pop()?.date.toISOString();

    const nextPerformanceDate = sortedPerformances
      .find(perf => perf.date > now)?.date.toISOString();

    // Add enhanced metrics
    artist.metrics = {
      totalPerformances,
      totalRevenue,
      averageAttendance,
      lastPerformanceDate,
      nextPerformanceDate,
    };

    return artist;
  }
}

// Export validation utilities for use in components
export { validateArtistBusinessRules };

// Export a convenience function for validation
export const validateArtistData = {
  create: (data: unknown) => CreateArtistSchema.safeParse(data),
  update: (data: unknown) => UpdateArtistSchema.safeParse(data),
  query: (data: unknown) => ArtistQuerySchema.safeParse(data),
  id: (data: unknown) => ArtistIdSchema.safeParse(data),
}; 