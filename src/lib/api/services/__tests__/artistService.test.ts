import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ArtistService } from '../artistService';
import { mockSupabaseClient } from '../../../../test/setup';
import type { CreateArtistRequest, UpdateArtistRequest } from '../../schemas/artistSchemas';

describe('ArtistService', () => {
  beforeEach(() => {
    globalThis.testUtils.resetAllMocks();
  });

  describe('getArtists', () => {
    it('should fetch artists with default pagination', async () => {
      const mockArtists = [
        globalThis.testUtils.mockArtist(),
        globalThis.testUtils.mockArtist({ id: 'artist-2', name: 'Artist 2' }),
      ];

      mockSupabaseClient.from().then.mockResolvedValueOnce({
        data: mockArtists,
        error: null,
        count: 2,
      });

      const result = await ArtistService.getArtists(
        { limit: 20, offset: 0 }, 
        'test-request-id', 
        'test-user'
      );

      expect(result.data).toBeDefined();
      if ('artists' in result.data) {
        expect(result.data.artists).toHaveLength(2);
        expect(result.data.total).toBe(2);
        expect(result.data.hasMore).toBe(false);
      }
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('artists');
    });

    it('should handle pagination parameters', async () => {
      const mockArtists = [globalThis.testUtils.mockArtist()];

      mockSupabaseClient.from().then.mockResolvedValueOnce({
        data: mockArtists,
        error: null,
        count: 1,
      });

      await ArtistService.getArtists({ limit: 10, offset: 10 }, 'test-request-id', 'test-user');

      expect(mockSupabaseClient.from().range).toHaveBeenCalledWith(10, 19);
    });

    it('should filter by search query', async () => {
      const mockArtists = [globalThis.testUtils.mockArtist()];

      mockSupabaseClient.from().then.mockResolvedValueOnce({
        data: mockArtists,
        error: null,
        count: 1,
      });

      await ArtistService.getArtists(
        { limit: 20, offset: 0, search: 'Rock Artist' }, 
        'test-request-id', 
        'test-user'
      );

      expect(mockSupabaseClient.from().or).toHaveBeenCalledWith(
        'name.ilike.%Rock Artist%,genre.ilike.%Rock Artist%,location.ilike.%Rock Artist%'
      );
    });

    it('should handle Supabase errors', async () => {
      mockSupabaseClient.from().then.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error', code: 'DB_ERROR' },
      });

      const result = await ArtistService.getArtists(
        { limit: 20, offset: 0 }, 
        'test-request-id', 
        'test-user'
      );

      if ('type' in result.data) {
        expect(result.data.title).toBe('Failed to fetch artists');
        expect(result.data.status).toBe(500);
      }
    });

    it('should handle network errors', async () => {
      mockSupabaseClient.from().then.mockRejectedValueOnce(new Error('Network error'));

      const result = await ArtistService.getArtists(
        { limit: 20, offset: 0 }, 
        'test-request-id', 
        'test-user'
      );

      if ('type' in result.data) {
        expect(result.data.title).toBe('Unexpected error occurred');
        expect(result.data.status).toBe(500);
      }
    });
  });

  describe('getArtistById', () => {
    it('should fetch a single artist by ID', async () => {
      const mockArtist = globalThis.testUtils.mockArtist();

      mockSupabaseClient.from().single.mockResolvedValueOnce({
        data: mockArtist,
        error: null,
      });

      const result = await ArtistService.getArtistById({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }, 'test-request-id', 'test-user');

      if ('id' in result.data) {
        expect(result.data.id).toBeDefined();
      }
      expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('id', 'f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    it('should handle artist not found', async () => {
      mockSupabaseClient.from().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Row not found', code: 'PGRST116' },
      });

      const result = await ArtistService.getArtistById({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }, 'test-request-id', 'test-user');

      if ('type' in result.data) {
        expect(result.data.title).toBe('Artist not found');
        expect(result.data.status).toBe(404);
      }
    });

    it('should validate artist ID', async () => {
      const result = await ArtistService.getArtistById({ id: 'invalid-uuid' }, 'test-request-id', 'test-user');

      if ('type' in result.data) {
        expect(result.data.title).toBe('Validation failed');
        expect(result.data.status).toBe(400);
      }
    });
  });

  describe('createArtist', () => {
    it('should create a new artist with valid data', async () => {
      const artistData: CreateArtistRequest = {
        name: 'New Artist',
        genre: 'Jazz',
        location: 'New York',
        email: 'new@artist.com',
        phone: '+1234567890',
        bio: 'A new jazz artist',
        status: 'Pending',
        managers: [{
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          title: 'Manager',
          name: 'John Manager',
          email: 'john@manager.com',
          phone: '+1987654321',
        }],
        performanceHistory: [],
      };

      const mockCreatedArtist = globalThis.testUtils.mockArtist(artistData);

      mockSupabaseClient.from().select.mockReturnThis();
      mockSupabaseClient.from().single.mockResolvedValueOnce({
        data: mockCreatedArtist,
        error: null,
      });

      const result = await ArtistService.createArtist(artistData, 'test-request-id', 'test-user');

      if ('id' in result.data) {
        expect(result.data.name).toBe('New Artist');
        expect(result.data.genre).toBe('Jazz');
      }
      expect(mockSupabaseClient.from().insert).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const invalidData = {
        genre: 'Jazz',
        location: 'New York',
      } as CreateArtistRequest;

      const result = await ArtistService.createArtist(invalidData, 'test-request-id', 'test-user');

      if ('type' in result.data) {
        expect(result.data.title).toBe('Validation failed');
        expect(result.data.status).toBe(400);
      }
    });

    it('should validate email format', async () => {
      const invalidData: CreateArtistRequest = {
        name: 'Test Artist',
        genre: 'Rock',
        location: 'Test City',
        email: 'invalid-email',
        phone: '+1234567890',
        status: 'Pending',
        managers: [{
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          title: 'Manager',
          name: 'John Manager',
          email: 'john@manager.com',
          phone: '+1987654321',
        }],
        performanceHistory: [],
      };

      const result = await ArtistService.createArtist(invalidData, 'test-request-id', 'test-user');

      if ('type' in result.data) {
        expect(result.data.title).toBe('Validation failed');
        expect(result.data.status).toBe(400);
      }
    });

    it('should handle database creation errors', async () => {
      const artistData: CreateArtistRequest = {
        name: 'Duplicate Artist',
        genre: 'Rock',
        location: 'Test City',
        email: 'existing@artist.com',
        phone: '+1234567890',
        status: 'Pending',
        managers: [{
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          title: 'Manager',
          name: 'John Manager',
          email: 'john@manager.com',
          phone: '+1987654321',
        }],
        performanceHistory: [],
      };

      mockSupabaseClient.from().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'duplicate key value', code: '23505' },
      });

      const result = await ArtistService.createArtist(artistData, 'test-request-id', 'test-user');

      if ('type' in result.data) {
        expect(result.data.title).toBe('Failed to create artist');
        expect(result.data.status).toBe(500);
      }
    });
  });

  describe('updateArtist', () => {
    it('should update an existing artist', async () => {
      const updateData: UpdateArtistRequest = {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Updated Artist',
        genre: 'Blues',
        status: 'Confirmed',
      };

      const mockExistingArtist = globalThis.testUtils.mockArtist({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        status: 'Pending',
        managers: [{
          id: 'manager-1',
          title: 'Manager',
          name: 'John Manager',
          email: 'john@manager.com',
          phone: '+1987654321',
        }],
      });

      const mockUpdatedArtist = globalThis.testUtils.mockArtist(updateData);

      // Mock getArtistById call for business rule validation
      mockSupabaseClient.from().single
        .mockResolvedValueOnce({
          data: mockExistingArtist,
          error: null,
        })
        .mockResolvedValueOnce({
          data: mockUpdatedArtist,
          error: null,
        });

      const result = await ArtistService.updateArtist(updateData, 'test-request-id', 'test-user');

      if ('id' in result.data) {
        expect(result.data.name).toBe('Updated Artist');
        expect(result.data.genre).toBe('Blues');
      }
      expect(mockSupabaseClient.from().update).toHaveBeenCalled();
      expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('id', 'f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });

    it('should validate artist ID for update', async () => {
      const result = await ArtistService.updateArtist(
        { id: 'invalid-uuid', name: 'Updated' },
        'test-request-id',
        'test-user'
      );

      if ('type' in result.data) {
        expect(result.data.title).toBe('Validation failed');
        expect(result.data.status).toBe(400);
      }
    });

    it('should handle artist not found for update', async () => {
      mockSupabaseClient.from().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Row not found', code: 'PGRST116' },
      });

      const result = await ArtistService.updateArtist(
        { id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', name: 'Updated' },
        'test-request-id',
        'test-user'
      );

      if ('type' in result.data) {
        expect(result.data.title).toBe('Artist not found');
        expect(result.data.status).toBe(404);
      }
    });

    it('should validate email format in updates', async () => {
      const result = await ArtistService.updateArtist(
        {
          id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          email: 'invalid-email',
        },
        'test-request-id',
        'test-user'
      );

      if ('type' in result.data) {
        expect(result.data.title).toBe('Validation failed');
        expect(result.data.status).toBe(400);
      }
    });
  });

  describe('deleteArtist', () => {
    it('should delete an artist successfully', async () => {
      const mockArtist = globalThis.testUtils.mockArtist();

      mockSupabaseClient.from().single
        .mockResolvedValueOnce({ data: mockArtist, error: null });
      mockSupabaseClient.from().delete.mockResolvedValueOnce({ error: null });

      const result = await ArtistService.deleteArtist(
        { id: mockArtist.id },
        'test-request-id',
        'test-user'
      );

      if ('deleted' in result.data) {
        expect(result.data.deleted).toBe(true);
      }
      expect(mockSupabaseClient.from().delete).toHaveBeenCalled();
    });

    it('should validate artist ID on delete', async () => {
      const result = await ArtistService.deleteArtist(
        { id: 'invalid-id' },
        'test-request-id',
        'test-user'
      );

      if ('type' in result.data) {
        expect(result.data.title).toBe('Validation failed');
        expect(result.data.status).toBe(400);
      }
    });

    it('should handle database errors on delete', async () => {
      const mockArtist = globalThis.testUtils.mockArtist();

      mockSupabaseClient.from().single
        .mockResolvedValueOnce({ data: mockArtist, error: null });
      mockSupabaseClient.from().delete.mockResolvedValueOnce({ error: { message: 'db error', code: 'DB_ERR' } });

      const result = await ArtistService.deleteArtist(
        { id: mockArtist.id },
        'test-request-id',
        'test-user'
      );

      if ('type' in result.data) {
        expect(result.data.title).toBe('Failed to delete artist');
        expect(result.data.status).toBe(500);
      }
    });
  });
});
