import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders } from '../_shared/cors.ts';
import { securityHeaders } from '../../../src/lib/api/auth.ts';

// Import our services
import { CustomerService } from '../../../src/lib/api/services/customerService.ts';
import { InventoryService } from '../../../src/lib/api/services/inventoryService.ts';
import { FinanceService } from '../../../src/lib/api/services/financeService.ts';
import { StaffService } from '../../../src/lib/api/services/staffService.ts';
import { EventsService } from '../../../src/lib/api/services/eventsService.ts';
import { ArtistService } from '../../../src/lib/api/services/artistService.ts';

// Route handlers
interface RouteHandler {
  pattern: URLPattern;
  handler: (req: Request, params: Record<string, string>) => Promise<Response>;
}

const customerService = new CustomerService();
const inventoryService = new InventoryService();
const financeService = new FinanceService();
const staffService = new StaffService();
const eventsService = new EventsService();
const artistService = new ArtistService();

// Helper to create standardized responses
const createResponse = (data: unknown, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...securityHeaders,
    },
  });
};

const createErrorResponse = (message: string, status = 400) => {
  return new Response(
    JSON.stringify({
      error: {
        type: 'https://docs.trainstation-dashboard.com/errors/api-error',
        title: 'API Error',
        status,
        detail: message,
        instance: '/api',
        timestamp: new Date().toISOString(),
      },
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
        ...securityHeaders,
      },
    }
  );
};

// Route definitions
const routes: RouteHandler[] = [
  // Health check
  {
    pattern: new URLPattern({ pathname: '/api/health' }),
    handler: async () => {
      return createResponse({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: [
          'customers',
          'inventory', 
          'finances',
          'staff',
          'events',
          'artists'
        ]
      });
    },
  },

  // Customer endpoints
  {
    pattern: new URLPattern({ pathname: '/api/customers' }),
    handler: async (req) => {
      if (req.method === 'GET') {
        const url = new URL(req.url);
        const query = Object.fromEntries(url.searchParams);
        const result = await customerService.getCustomers(query);
        return createResponse(result, result.success ? 200 : 400);
      }
      
      if (req.method === 'POST') {
        try {
          const body = await req.json();
          const result = await customerService.createCustomer(body);
          return createResponse(result, result.success ? 201 : 400);
        } catch {
          return createErrorResponse('Invalid JSON body', 400);
        }
      }
      
      return createErrorResponse('Method not allowed', 405);
    },
  },

  {
    pattern: new URLPattern({ pathname: '/api/customers/:id' }),
    handler: async (req, params) => {
      const { id } = params;
      
      if (req.method === 'GET') {
        const result = await customerService.getCustomerById(id);
        return createResponse(result, result.success ? 200 : 404);
      }
      
      if (req.method === 'PUT') {
        try {
          const body = await req.json();
          const result = await customerService.updateCustomer(id, body);
          return createResponse(result, result.success ? 200 : 400);
        } catch {
          return createErrorResponse('Invalid JSON body', 400);
        }
      }
      
      if (req.method === 'DELETE') {
        const url = new URL(req.url);
        const hardDelete = url.searchParams.get('hard') === 'true';
        const result = await customerService.deleteCustomer(id, hardDelete);
        return createResponse(result, result.success ? 200 : 400);
      }
      
      return createErrorResponse('Method not allowed', 405);
    },
  },

  {
    pattern: new URLPattern({ pathname: '/api/customers/:id/interactions' }),
    handler: async (req, params) => {
      const { id } = params;
      
      if (req.method === 'GET') {
        const result = await customerService.getCustomerInteractions(id);
        return createResponse(result, result.success ? 200 : 404);
      }
      
      if (req.method === 'POST') {
        try {
          const body = await req.json();
          const interactionData = { ...body, customerId: id };
          const result = await customerService.createInteraction(interactionData);
          return createResponse(result, result.success ? 201 : 400);
        } catch {
          return createErrorResponse('Invalid JSON body', 400);
        }
      }
      
      return createErrorResponse('Method not allowed', 405);
    },
  },

  // Inventory endpoints
  {
    pattern: new URLPattern({ pathname: '/api/inventory' }),
    handler: async (req) => {
      if (req.method === 'GET') {
        const url = new URL(req.url);
        const query = Object.fromEntries(url.searchParams);
        const result = await inventoryService.getInventoryItems(query);
        return createResponse(result, result.success ? 200 : 400);
      }
      
      if (req.method === 'POST') {
        try {
          const body = await req.json();
          const result = await inventoryService.createInventoryItem(body);
          return createResponse(result, result.success ? 201 : 400);
        } catch {
          return createErrorResponse('Invalid JSON body', 400);
        }
      }
      
      return createErrorResponse('Method not allowed', 405);
    },
  },

  {
    pattern: new URLPattern({ pathname: '/api/inventory/:id' }),
    handler: async (req, params) => {
      const { id } = params;
      
      if (req.method === 'GET') {
        const result = await inventoryService.getInventoryItemById(id);
        return createResponse(result, result.success ? 200 : 404);
      }
      
      if (req.method === 'PUT') {
        try {
          const body = await req.json();
          const result = await inventoryService.updateInventoryItem(id, body);
          return createResponse(result, result.success ? 200 : 400);
        } catch {
          return createErrorResponse('Invalid JSON body', 400);
        }
      }
      
      if (req.method === 'DELETE') {
        const result = await inventoryService.deleteInventoryItem(id);
        return createResponse(result, result.success ? 200 : 400);
      }
      
      return createErrorResponse('Method not allowed', 405);
    },
  },

  {
    pattern: new URLPattern({ pathname: '/api/inventory/transactions' }),
    handler: async (req) => {
      if (req.method === 'POST') {
        try {
          const body = await req.json();
          const result = await inventoryService.recordTransaction(body);
          return createResponse(result, result.success ? 201 : 400);
        } catch {
          return createErrorResponse('Invalid JSON body', 400);
        }
      }
      
      return createErrorResponse('Method not allowed', 405);
    },
  },

  {
    pattern: new URLPattern({ pathname: '/api/inventory/categories' }),
    handler: async (req) => {
      if (req.method === 'GET') {
        const result = await inventoryService.getCategories();
        return createResponse(result, result.success ? 200 : 400);
      }
      
      if (req.method === 'POST') {
        try {
          const body = await req.json();
          const result = await inventoryService.createCategory(body);
          return createResponse(result, result.success ? 201 : 400);
        } catch {
          return createErrorResponse('Invalid JSON body', 400);
        }
      }
      
      return createErrorResponse('Method not allowed', 405);
    },
  },

  // Finance endpoints
  {
    pattern: new URLPattern({ pathname: '/api/finances/transactions' }),
    handler: async (req) => {
      if (req.method === 'GET') {
        const url = new URL(req.url);
        const query = Object.fromEntries(url.searchParams);
        const result = await financeService.getTransactions(query);
        return createResponse(result, result.success ? 200 : 400);
      }
      
      if (req.method === 'POST') {
        try {
          const body = await req.json();
          const result = await financeService.createTransaction(body);
          return createResponse(result, result.success ? 201 : 400);
        } catch {
          return createErrorResponse('Invalid JSON body', 400);
        }
      }
      
      return createErrorResponse('Method not allowed', 405);
    },
  },

  {
    pattern: new URLPattern({ pathname: '/api/finances/accounts' }),
    handler: async (req) => {
      if (req.method === 'GET') {
        const result = await financeService.getAccounts();
        return createResponse(result, result.success ? 200 : 400);
      }
      
      if (req.method === 'POST') {
        try {
          const body = await req.json();
          const result = await financeService.createAccount(body);
          return createResponse(result, result.success ? 201 : 400);
        } catch {
          return createErrorResponse('Invalid JSON body', 400);
        }
      }
      
      return createErrorResponse('Method not allowed', 405);
    },
  },

  {
    pattern: new URLPattern({ pathname: '/api/finances/budgets' }),
    handler: async (req) => {
      if (req.method === 'GET') {
        const result = await financeService.getBudgets();
        return createResponse(result, result.success ? 200 : 400);
      }
      
      if (req.method === 'POST') {
        try {
          const body = await req.json();
          const result = await financeService.createBudget(body);
          return createResponse(result, result.success ? 201 : 400);
        } catch {
          return createErrorResponse('Invalid JSON body', 400);
        }
      }
      
      return createErrorResponse('Method not allowed', 405);
    },
  },

  {
    pattern: new URLPattern({ pathname: '/api/finances/reports/:reportType' }),
    handler: async (req, params) => {
      const { reportType } = params;
      
      if (req.method === 'GET') {
        const url = new URL(req.url);
        const dateFrom = url.searchParams.get('dateFrom');
        const dateTo = url.searchParams.get('dateTo');
        
        switch (reportType) {
          case 'profit-loss': {
            const plResult = await financeService.generateProfitLossReport(dateFrom!, dateTo!);
            return createResponse(plResult, plResult.success ? 200 : 400);
          }
          case 'balance-sheet': {
            const bsResult = await financeService.generateBalanceSheetReport(dateFrom!);
            return createResponse(bsResult, bsResult.success ? 200 : 400);
          }
          case 'cash-flow': {
            const cfResult = await financeService.generateCashFlowReport(dateFrom!, dateTo!);
            return createResponse(cfResult, cfResult.success ? 200 : 400);
          }
          default:
            return createErrorResponse('Invalid report type', 400);
        }
      }
      
      return createErrorResponse('Method not allowed', 405);
    },
  },

  // Staff endpoints
  {
    pattern: new URLPattern({ pathname: '/api/staff' }),
    handler: async (req) => {
      if (req.method === 'GET') {
        const url = new URL(req.url);
        const query = Object.fromEntries(url.searchParams);
        const result = await staffService.getStaffMembers(query);
        return createResponse(result, result.success ? 200 : 400);
      }
      
      if (req.method === 'POST') {
        try {
          const body = await req.json();
          const result = await staffService.createStaffMember(body);
          return createResponse(result, result.success ? 201 : 400);
        } catch {
          return createErrorResponse('Invalid JSON body', 400);
        }
      }
      
      return createErrorResponse('Method not allowed', 405);
    },
  },

  {
    pattern: new URLPattern({ pathname: '/api/staff/:id' }),
    handler: async (req, params) => {
      const { id } = params;
      
      if (req.method === 'GET') {
        const result = await staffService.getStaffMemberById(id);
        return createResponse(result, result.success ? 200 : 404);
      }
      
      if (req.method === 'PUT') {
        try {
          const body = await req.json();
          const result = await staffService.updateStaffMember(id, body);
          return createResponse(result, result.success ? 200 : 400);
        } catch {
          return createErrorResponse('Invalid JSON body', 400);
        }
      }
      
      if (req.method === 'DELETE') {
        const result = await staffService.deleteStaffMember(id);
        return createResponse(result, result.success ? 200 : 400);
      }
      
      return createErrorResponse('Method not allowed', 405);
    },
  },

  {
    pattern: new URLPattern({ pathname: '/api/staff/:id/schedule' }),
    handler: async (req, params) => {
      const { id } = params;
      
      if (req.method === 'GET') {
        const url = new URL(req.url);
        const dateFrom = url.searchParams.get('dateFrom');
        const dateTo = url.searchParams.get('dateTo');
        const result = await staffService.getStaffSchedule(id, dateFrom, dateTo);
        return createResponse(result, result.success ? 200 : 404);
      }
      
      if (req.method === 'POST') {
        try {
          const body = await req.json();
          const result = await staffService.createScheduleEntry(body);
          return createResponse(result, result.success ? 201 : 400);
        } catch {
          return createErrorResponse('Invalid JSON body', 400);
        }
      }
      
      return createErrorResponse('Method not allowed', 405);
    },
  },

  // Events endpoints (existing service)
  {
    pattern: new URLPattern({ pathname: '/api/events' }),
    handler: async (req) => {
      if (req.method === 'GET') {
        const url = new URL(req.url);
        const query = Object.fromEntries(url.searchParams);
        const result = await eventsService.getEvents(query);
        return createResponse(result, result.success ? 200 : 400);
      }
      
      if (req.method === 'POST') {
        try {
          const body = await req.json();
          const result = await eventsService.createEvent(body);
          return createResponse(result, result.success ? 201 : 400);
        } catch {
          return createErrorResponse('Invalid JSON body', 400);
        }
      }
      
      return createErrorResponse('Method not allowed', 405);
    },
  },

  {
    pattern: new URLPattern({ pathname: '/api/events/:id' }),
    handler: async (req, params) => {
      const { id } = params;
      
      if (req.method === 'GET') {
        const result = await eventsService.getEventById(id);
        return createResponse(result, result.success ? 200 : 404);
      }
      
      if (req.method === 'PUT') {
        try {
          const body = await req.json();
          const result = await eventsService.updateEvent(id, body);
          return createResponse(result, result.success ? 200 : 400);
        } catch {
          return createErrorResponse('Invalid JSON body', 400);
        }
      }
      
      if (req.method === 'DELETE') {
        const result = await eventsService.deleteEvent(id);
        return createResponse(result, result.success ? 200 : 400);
      }
      
      return createErrorResponse('Method not allowed', 405);
    },
  },

  // Artists endpoints (existing service)
  {
    pattern: new URLPattern({ pathname: '/api/artists' }),
    handler: async (req) => {
      if (req.method === 'GET') {
        const url = new URL(req.url);
        const query = Object.fromEntries(url.searchParams);
        const result = await artistService.getArtists(query);
        return createResponse(result, result.success ? 200 : 400);
      }
      
      if (req.method === 'POST') {
        try {
          const body = await req.json();
          const result = await artistService.createArtist(body);
          return createResponse(result, result.success ? 201 : 400);
        } catch {
          return createErrorResponse('Invalid JSON body', 400);
        }
      }
      
      return createErrorResponse('Method not allowed', 405);
    },
  },

  {
    pattern: new URLPattern({ pathname: '/api/artists/:id' }),
    handler: async (req, params) => {
      const { id } = params;
      
      if (req.method === 'GET') {
        const result = await artistService.getArtistById(id);
        return createResponse(result, result.success ? 200 : 404);
      }
      
      if (req.method === 'PUT') {
        try {
          const body = await req.json();
          const result = await artistService.updateArtist(id, body);
          return createResponse(result, result.success ? 200 : 400);
        } catch {
          return createErrorResponse('Invalid JSON body', 400);
        }
      }
      
      if (req.method === 'DELETE') {
        const result = await ArtistService.deleteArtist({ id });
        return createResponse(result, result.success ? 200 : 400);
      }
      
      return createErrorResponse('Method not allowed', 405);
    },
  },
];

// Main handler
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    
    // Find matching route
    for (const route of routes) {
      const match = route.pattern.exec(url);
      if (match) {
        const params = match.pathname.groups || {};
        return await route.handler(req, params);
      }
    }

    // No route matched
    return createErrorResponse('Route not found', 404);
    
  } catch (err) {
    console.error('API Error:', err);
    return createErrorResponse('Internal server error', 500);
  }
}); 