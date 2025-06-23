import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { ArtistService } from '../lib/api/services/artistService';
import type { Artist, CreateArtistRequest, UpdateArtistRequest, ArtistQueryRequest } from '../lib/api/schemas/artistSchemas';
import type { ApiResponse } from '../lib/api/types';
import type { ApiError } from '../lib/api/errors';
import { toast } from 'react-hot-toast';

// Enhanced error handling interface
interface ArtistsError {
  type: 'validation' | 'authentication' | 'authorization' | 'not_found' | 'server' | 'network';
  message: string;
  details?: any;
  fieldErrors?: Record<string, string>;
}

// Convert service response to React Query compatible format
const handleServiceResponse = <T>(response: ApiResponse<T> | ApiResponse<ApiError>) => {
  // Check if this is an error response by looking at the data structure
  if ('type' in (response.data as any) && 'status' in (response.data as any)) {
    const errorData = response.data as ApiError;
    const error: ArtistsError = {
      type: errorData.status === 422 ? 'validation' : 
             errorData.status === 401 ? 'authentication' :
             errorData.status === 403 ? 'authorization' :
             errorData.status === 404 ? 'not_found' : 'server',
      message: errorData.detail || 'Operation failed',
      details: errorData,
      fieldErrors: errorData.errors?.reduce((acc: Record<string, string>, err) => ({
        ...acc,
        [err.field]: err.message
      }), {})
    };
    throw error;
  }
  
  // Check if the response indicates an error status
  if (response.meta.status === 'error') {
    const error: ArtistsError = {
      type: 'server',
      message: response.meta.message || 'Operation failed',
      details: response
    };
    throw error;
  }
  
  return response.data as T;
};

export function useArtists(query?: Partial<ArtistQueryRequest>) {
  const queryClient = useQueryClient();

  const artistsQuery = useQuery({
    queryKey: ['artists', query],
    queryFn: async () => {
      const response = await ArtistService.getArtists(query || {});
      return handleServiceResponse(response);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  const createArtistMutation = useMutation({
    mutationFn: async (artistData: CreateArtistRequest) => {
      const response = await ArtistService.createArtist(artistData);
      return handleServiceResponse(response);
    },
    onSuccess: (newArtist) => {
      queryClient.invalidateQueries({ queryKey: ['artists'] });
      // Optimistically update cache
      queryClient.setQueryData(['artists', 'all'], (old: Artist[] | undefined) => 
        old ? [newArtist, ...old] : [newArtist]
      );
      toast.success('Artist created successfully!');
    },
    onError: (error: ArtistsError) => {
      const errorMessage = error.fieldErrors ? 
        Object.values(error.fieldErrors).join(', ') : 
        error.message;
      toast.error(`Error creating artist: ${errorMessage}`);
    }
  });

  const updateArtistMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Omit<UpdateArtistRequest, 'id'> }) => {
      const response = await ArtistService.updateArtist({ id, ...updates });
      return handleServiceResponse(response);
    },
    onSuccess: (updatedArtist) => {
      queryClient.invalidateQueries({ queryKey: ['artists'] });
      // Optimistically update individual artist cache
      queryClient.setQueryData(['artists', updatedArtist.id], updatedArtist);
      // Update in lists cache
      queryClient.setQueryData(['artists', 'all'], (old: Artist[] | undefined) => 
        old ? old.map(artist => artist.id === updatedArtist.id ? updatedArtist : artist) : [updatedArtist]
      );
      toast.success('Artist updated successfully!');
    },
    onError: (error: ArtistsError) => {
      const errorMessage = error.fieldErrors ? 
        Object.values(error.fieldErrors).join(', ') : 
        error.message;
      toast.error(`Error updating artist: ${errorMessage}`);
    }
  });

  const deleteArtistMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await ArtistService.deleteArtist({ id });
      return handleServiceResponse(response);
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['artists'] });
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['artists', deletedId] });
      // Update lists cache
      queryClient.setQueryData(['artists', 'all'], (old: Artist[] | undefined) => 
        old ? old.filter(artist => artist.id !== deletedId) : []
      );
      toast.success('Artist deleted successfully!');
    },
    onError: (error: ArtistsError) => {
      toast.error(`Error deleting artist: ${error.message}`);
    }
  });

  // Enhanced mutation functions with better return types
  const createArtist = useCallback(async (artistData: CreateArtistRequest): Promise<{ success: boolean; artist?: Artist; error?: ArtistsError }> => {
    try {
      const artist = await createArtistMutation.mutateAsync(artistData);
      return { success: true, artist };
    } catch (error) {
      return { success: false, error: error as ArtistsError };
    }
  }, [createArtistMutation]);

  const updateArtist = useCallback(async (id: string, updates: Omit<UpdateArtistRequest, 'id'>): Promise<{ success: boolean; artist?: Artist; error?: ArtistsError }> => {
    try {
      const artist = await updateArtistMutation.mutateAsync({ id, updates });
      return { success: true, artist };
    } catch (error) {
      return { success: false, error: error as ArtistsError };
    }
  }, [updateArtistMutation]);

  const deleteArtist = useCallback(async (id: string): Promise<{ success: boolean; error?: ArtistsError }> => {
    try {
      await deleteArtistMutation.mutateAsync(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error as ArtistsError };
    }
  }, [deleteArtistMutation]);

  return {
    artists: artistsQuery.data || [],
    isLoading: artistsQuery.isLoading,
    isError: artistsQuery.isError,
    error: artistsQuery.error as ArtistsError,
    createArtist,
    updateArtist,
    deleteArtist,
    // Legacy support for direct mutation calls
    createArtistMutation: createArtistMutation.mutate,
    updateArtistMutation: updateArtistMutation.mutate,
    deleteArtistMutation: deleteArtistMutation.mutate,
    // Loading states
    isCreating: createArtistMutation.isPending,
    isUpdating: updateArtistMutation.isPending,
    isDeleting: deleteArtistMutation.isPending,
    // Additional utilities
    refetch: artistsQuery.refetch,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['artists'] })
  };
}

export function useArtist(id: string) {
  const artistQuery = useQuery<Artist>({
    queryKey: ['artists', id],
    queryFn: async () => {
      if (!id) throw new Error('Artist ID is required');
      const response = await ArtistService.getArtistById(id);
      return handleServiceResponse<Artist>(response);
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    artist: artistQuery.data,
    isLoading: artistQuery.isLoading,
    isError: artistQuery.isError,
    error: artistQuery.error as ArtistsError,
    refetch: artistQuery.refetch
  };
}

// Enhanced artists management hook with additional business operations
export function useArtistsManagement() {
  const queryClient = useQueryClient();

  const addPerformanceMutation = useMutation({
    mutationFn: async ({ artistId, eventId, fee }: { artistId: string, eventId: string, fee?: number }) => {
      const response = await ArtistService.addPerformance(artistId, eventId, fee);
      return handleServiceResponse(response);
    },
    onSuccess: (updatedArtist) => {
      queryClient.invalidateQueries({ queryKey: ['artists'] });
      queryClient.setQueryData(['artists', updatedArtist.id], updatedArtist);
      toast.success('Performance added successfully!');
    },
    onError: (error: ArtistsError) => {
      toast.error(`Error adding performance: ${error.message}`);
    }
  });

  const addPerformance = useCallback(async (artistId: string, eventId: string, fee?: number): Promise<{ success: boolean; artist?: Artist; error?: ArtistsError }> => {
    try {
      const artist = await addPerformanceMutation.mutateAsync({ artistId, eventId, fee });
      return { success: true, artist };
    } catch (error) {
      return { success: false, error: error as ArtistsError };
    }
  }, [addPerformanceMutation]);

  return {
    addPerformance,
    isAddingPerformance: addPerformanceMutation.isPending
  };
}

// Validation hook for real-time form feedback
export const useArtistValidation = () => {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  const validateField = useCallback(async (field: string, value: any): Promise<string | null> => {
    setIsValidating(true);
    
    try {
      // Import validation schema
      const { CreateArtistSchema } = await import('../lib/api/schemas/artistSchemas');
      
      // Validate specific field
      const result = CreateArtistSchema.shape[field as keyof typeof CreateArtistSchema.shape]?.safeParse(value);
      
      if (result && !result.success) {
        const error = result.error.errors[0]?.message || 'Invalid value';
        setFieldErrors(prev => ({ ...prev, [field]: error }));
        return error;
      } else {
        setFieldErrors(prev => {
          const { [field]: _, ...rest } = prev;
          return rest;
        });
        return null;
      }
    } catch (err) {
      console.error('Validation error:', err);
      return 'Validation failed';
    } finally {
      setIsValidating(false);
    }
  }, []);

  const validateForm = useCallback(async (formData: any): Promise<{ valid: boolean; errors: Record<string, string> }> => {
    setIsValidating(true);
    
    try {
      const { CreateArtistSchema } = await import('../lib/api/schemas/artistSchemas');
      const result = CreateArtistSchema.safeParse(formData);
      
      if (!result.success) {
        const errors = result.error.errors.reduce((acc, err) => ({
          ...acc,
          [err.path.join('.')]: err.message
        }), {});
        setFieldErrors(errors);
        return { valid: false, errors };
      } else {
        setFieldErrors({});
        return { valid: true, errors: {} };
      }
    } catch (err) {
      console.error('Form validation error:', err);
      const errors = { form: 'Validation failed' };
      setFieldErrors(errors);
      return { valid: false, errors };
    } finally {
      setIsValidating(false);
    }
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setFieldErrors({});
  }, []);

  return {
    fieldErrors,
    isValidating,
    validateField,
    validateForm,
    clearFieldError,
    clearAllErrors
  };
};

// Export types for better TypeScript support
export type { Artist, CreateArtistRequest, UpdateArtistRequest, ArtistQueryRequest, ArtistsError };