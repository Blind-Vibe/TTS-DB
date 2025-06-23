import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ArtistService, validateArtistBusinessRules } from '../lib/api/services/artistService';
import { buildSuccessResponse } from '../lib/api/types';
import { buildErrorResponse, ValidationErrorClass, AuthenticationError, NotFoundError, logError } from '../lib/api/errors';
import type { ApiResponse } from '../lib/api/types';
import type { ApiError } from '../lib/api/errors';
import {
  CreateArtistSchema,
  UpdateArtistSchema,
  ArtistQuerySchema,
  type CreateArtistRequest,
  type UpdateArtistRequest,
  type ArtistQueryRequest,
  type Artist,
} from '../lib/api/schemas/artistSchemas';

// Enhanced Artist interface with API standards
export interface EnhancedArtist extends Artist {
  canBook: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canChangeStatus: boolean;
  hasCompleteProfile: boolean;
  profileCompleteness: {
    percentage: number;
    missing: string[];
  };
}

// Hook state interface
interface ArtistsState {
  artists: EnhancedArtist[];
  isLoading: boolean;
  error: string | null;
  lastFetch: Date | null;
  filters: Partial<ArtistQueryRequest>;
}

/**
 * Enhanced Artists hook with API standards integration
 * 
 * Features:
 * - RFC 7807 compliant error handling
 * - Input validation with Zod schemas
 * - Business rule validation
 * - Structured response format
 * - Enhanced error logging
 * - Rate limiting awareness
 * - Profile completeness checking
 */
export const useArtistsEnhanced = () => {
  const [state, setState] = useState<ArtistsState>({
    artists: [],
    isLoading: true,
    error: null,
    lastFetch: null,
    filters: {},
  });

  /**
   * Transform raw artist data with business rule checks
   */
  const enhanceArtist = useCallback((artist: Artist): EnhancedArtist => {
    const canBookResult = validateArtistBusinessRules.canBook(artist);
    const canEditResult = validateArtistBusinessRules.canEdit(artist);
    const canDeleteResult = validateArtistBusinessRules.canDelete(artist);
    const canChangeStatusResult = validateArtistBusinessRules.canChangeStatus(artist, artist.status);
    const profileCompleteness = validateArtistBusinessRules.hasCompleteProfile(artist);

    const completionPercentage = calculateProfileCompleteness(artist);

    return {
      ...artist,
      canBook: canBookResult.valid,
      canEdit: canEditResult.valid,
      canDelete: canDeleteResult.valid,
      canChangeStatus: canChangeStatusResult.valid,
      hasCompleteProfile: profileCompleteness.valid,
      profileCompleteness: {
        percentage: completionPercentage,
        missing: profileCompleteness.missing || [],
      },
    };
  }, [calculateProfileCompleteness]);

  /**
   * Calculate profile completeness percentage
   */
  const calculateProfileCompleteness = useCallback((artist: Artist): number => {
    const fields = [
      'name', 'genre', 'email', 'phone', 'bio', 'image', 'location'
    ];
    const socialMediaFields = artist.socialMedia ? Object.keys(artist.socialMedia) : [];
    const managerFields = artist.managers && artist.managers.length > 0;
    
    let completedFields = 0;
    const totalFields = fields.length + (socialMediaFields.length > 0 ? 1 : 0) + (managerFields ? 1 : 0);

    fields.forEach(field => {
      if (artist[field as keyof Artist]) completedFields++;
    });

    if (socialMediaFields.length > 0) completedFields++;
    if (managerFields) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  }, []);

  /**
   * Handle API errors with structured logging
   */
  const handleApiError = useCallback((error: unknown, operation: string): string => {
    const requestId = crypto.randomUUID();
    
    if (error instanceof Error) {
      logError(error, {
        operation,
        requestId,
        timestamp: new Date().toISOString(),
        source: 'useArtistsEnhanced'
      });
      return error.message;
    }
    
    const fallbackMessage = `Failed to ${operation}`;
    logError(new Error(fallbackMessage), {
      operation,
      requestId,
      error: String(error),
      source: 'useArtistsEnhanced'
    });
    
    return fallbackMessage;
  }, []);

  /**
   * Build error response using buildErrorResponse from errors.ts
   */
  const createErrorResponse = useCallback((
    error: Error | string,
    requestId: string
  ): ApiResponse<ApiError> => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    const apiError = buildErrorResponse(errorObj, requestId);
    
    return {
      data: apiError,
      meta: {
        request_id: requestId,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        status: 'error',
      },
    };
  }, []);

  /**
   * Fetch artists with enhanced error handling and filtering
   */
  const fetchArtists = useCallback(async (
    filters: Partial<ArtistQueryRequest> = {}
  ): Promise<ApiResponse<{ artists: EnhancedArtist[]; total: number }>> => {
    const requestId = crypto.randomUUID();
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null, filters }));

      // Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const authError = new AuthenticationError();
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: authError.message 
        }));
        return createErrorResponse(authError, requestId);
      }

      // Validate query parameters
      const validatedFilters = ArtistQuerySchema.parse(filters);

      // Fetch artists using our ArtistService
      const response = await ArtistService.getArtists(validatedFilters, requestId);
      
      if ('type' in response.data && response.data.type) {
        // Handle error response
        const apiError = response.data as ApiError;
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: apiError.detail || 'Failed to fetch artists' 
        }));
        return createErrorResponse(apiError.detail, requestId);
      }

      // Transform and enhance artists
      const artistsData = response.data as { artists: Artist[]; total: number; hasMore: boolean };
      const enhancedArtists = artistsData.artists.map(enhanceArtist);
      
      setState(prev => ({
        ...prev,
        artists: enhancedArtists,
        isLoading: false,
        error: null,
        lastFetch: new Date(),
      }));

      return buildSuccessResponse(
        { artists: enhancedArtists, total: artistsData.total },
        requestId,
        {
          message: `Retrieved ${enhancedArtists.length} artists`,
          pagination: {
            page: Math.floor((validatedFilters.offset || 0) / (validatedFilters.limit || 20)) + 1,
            per_page: validatedFilters.limit || 20,
            total: artistsData.total,
            total_pages: Math.ceil(artistsData.total / (validatedFilters.limit || 20)),
            has_next: artistsData.hasMore,
            has_prev: (validatedFilters.offset || 0) > 0,
          }
        }
      );

    } catch (error) {
      const errorMessage = handleApiError(error, 'fetch artists');
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      
      return createErrorResponse(errorMessage, requestId);
    }
  }, [enhanceArtist, handleApiError, createErrorResponse]);

  /**
   * Create artist with validation and enhanced error handling
   */
  const createArtist = useCallback(async (artistData: CreateArtistRequest): Promise<ApiResponse<EnhancedArtist>> => {
    const requestId = crypto.randomUUID();

    try {
      // Validate input
      const validation = CreateArtistSchema.safeParse(artistData);
      if (!validation.success) {
        const validationError = new ValidationErrorClass(validation.error.errors.map(err => ({
          field: err.path.join('.'),
          code: err.code,
          message: err.message,
          value: undefined
        })));
        return createErrorResponse(validationError, requestId) as ApiResponse<EnhancedArtist>;
      }

      // Create artist using our ArtistService
      const response = await ArtistService.createArtist(validation.data, requestId);
      
      if ('type' in response.data && response.data.type) {
        // Handle error response
        const apiError = response.data as ApiError;
        return createErrorResponse(apiError.detail, requestId) as ApiResponse<EnhancedArtist>;
      }

      const newArtist = response.data as Artist;
      const enhancedArtist = enhanceArtist(newArtist);

      // Update local state
      setState(prev => ({
        ...prev,
        artists: [...prev.artists, enhancedArtist],
      }));

      return buildSuccessResponse(enhancedArtist, requestId, {
        message: 'Artist created successfully'
      });

    } catch (error) {
      const errorMessage = handleApiError(error, 'create artist');
      return createErrorResponse(errorMessage, requestId) as ApiResponse<EnhancedArtist>;
    }
  }, [enhanceArtist, handleApiError, createErrorResponse]);

  /**
   * Update artist with business rule validation
   */
  const updateArtist = useCallback(async (
    id: string, 
    updates: Omit<UpdateArtistRequest, 'id'>
  ): Promise<ApiResponse<EnhancedArtist>> => {
    const requestId = crypto.randomUUID();

    try {
      // Find existing artist
      const existingArtist = state.artists.find(a => a.id === id);
      if (!existingArtist) {
        const notFoundError = new NotFoundError('artist');
        return createErrorResponse(notFoundError, requestId) as ApiResponse<EnhancedArtist>;
      }

      // Check business rules
      if (!existingArtist.canEdit) {
        const businessRuleError = new ValidationErrorClass([{
          field: 'status',
          code: 'BUSINESS_RULE_VIOLATION',
          message: 'Artist cannot be edited at this time',
        }]);
        return createErrorResponse(businessRuleError, requestId) as ApiResponse<EnhancedArtist>;
      }

      // Validate updates
      const updateData = { id, ...updates };
      const validation = UpdateArtistSchema.safeParse(updateData);
      if (!validation.success) {
        const validationError = new ValidationErrorClass(validation.error.errors.map(err => ({
          field: err.path.join('.'),
          code: err.code,
          message: err.message,
          value: undefined
        })));
        return createErrorResponse(validationError, requestId) as ApiResponse<EnhancedArtist>;
      }

      // Check status change business rules
      if (updates.status && updates.status !== existingArtist.status) {
        const statusChangeResult = validateArtistBusinessRules.canChangeStatus(existingArtist, updates.status);
        if (!statusChangeResult.valid) {
          const businessRuleError = new ValidationErrorClass([{
            field: 'status',
            code: 'BUSINESS_RULE_VIOLATION',
            message: statusChangeResult.reason || 'Status change not allowed',
          }]);
          return createErrorResponse(businessRuleError, requestId) as ApiResponse<EnhancedArtist>;
        }
      }

      // Update artist using our ArtistService
      const response = await ArtistService.updateArtist(validation.data, requestId);
      
      if ('type' in response.data && response.data.type) {
        // Handle error response
        const apiError = response.data as ApiError;
        return createErrorResponse(apiError.detail, requestId) as ApiResponse<EnhancedArtist>;
      }

      const updatedArtist = response.data as Artist;
      const enhancedArtist = enhanceArtist(updatedArtist);

      // Update local state
      setState(prev => ({
        ...prev,
        artists: prev.artists.map(a => a.id === id ? enhancedArtist : a),
      }));

      return buildSuccessResponse(enhancedArtist, requestId, {
        message: 'Artist updated successfully'
      });

    } catch (error) {
      const errorMessage = handleApiError(error, 'update artist');
      return createErrorResponse(errorMessage, requestId) as ApiResponse<EnhancedArtist>;
    }
  }, [state.artists, enhanceArtist, handleApiError, createErrorResponse]);

  /**
   * Delete artist with business rule validation
   */
  const deleteArtist = useCallback(async (id: string): Promise<ApiResponse<{ deleted: boolean }>> => {
    const requestId = crypto.randomUUID();

    try {
      const response = await ArtistService.deleteArtist({ id }, requestId);

      if ("type" in response.data && response.data.type) {
        return response as ApiResponse<{ deleted: boolean }>;
      }

      setState(prev => ({
        ...prev,
        artists: prev.artists.filter(a => a.id !== id),
      }));

      return response as ApiResponse<{ deleted: boolean }>;

    } catch (error) {
      const errorMessage = handleApiError(error, "delete artist");
      return createErrorResponse(errorMessage, requestId) as ApiResponse<{ deleted: boolean }>;
    }
  }, [state.artists, handleApiError, createErrorResponse]);


  /**
   * Get artist by ID with enhanced data
   */
  const getArtistById = useCallback((id: string): EnhancedArtist | null => {
    return state.artists.find(a => a.id === id) || null;
  }, [state.artists]);

  /**
   * Filter artists by status
   */
  const getArtistsByStatus = useCallback((status: 'Confirmed' | 'Pending' | 'Inquiry' | 'Cancelled') => {
    return state.artists.filter(a => a.status === status);
  }, [state.artists]);

  /**
   * Get artists needing attention (incomplete profiles, etc.)
   */
  const getArtistsNeedingAttention = useCallback(() => {
    return state.artists.filter(a => 
      !a.hasCompleteProfile || 
      a.status === 'Inquiry' || 
      a.profileCompleteness.percentage < 70
    );
  }, [state.artists]);

  /**
   * Get booking statistics
   */
  const getBookingStats = useCallback(() => {
    const total = state.artists.length;
    const canBook = state.artists.filter(a => a.canBook).length;
    const confirmed = state.artists.filter(a => a.status === 'Confirmed').length;
    const pending = state.artists.filter(a => a.status === 'Pending').length;

    return {
      total,
      canBook,
      confirmed,
      pending,
      bookingRate: total > 0 ? Math.round((canBook / total) * 100) : 0,
    };
  }, [state.artists]);

  // Initial data fetch
  useEffect(() => {
    fetchArtists();

    // Set up realtime subscription
    const subscription = supabase
      .channel('artists-enhanced-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'artists' }, 
        () => {
          // Refresh data when changes happen
          fetchArtists(state.filters);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // State
    artists: state.artists,
    isLoading: state.isLoading,
    error: state.error,
    lastFetch: state.lastFetch,
    filters: state.filters,
    
    // Actions
    createArtist,
    updateArtist,
    deleteArtist,
    getArtistById,
    refresh: fetchArtists,
    
    // Filtering and querying
    getArtistsByStatus,
    getArtistsNeedingAttention,
    
    // Statistics
    getBookingStats,
    getTotalArtists: () => state.artists.length,
    getConfirmedArtists: () => state.artists.filter(a => a.status === 'Confirmed').length,
    getAvailableForBooking: () => state.artists.filter(a => a.canBook).length,
    getAverageProfileCompleteness: () => {
      if (state.artists.length === 0) return 0;
      const total = state.artists.reduce((sum, a) => sum + a.profileCompleteness.percentage, 0);
      return Math.round(total / state.artists.length);
    },
  };
}; 