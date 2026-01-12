import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LULU_API_KEY = Deno.env.get('LULU_API_KEY');
const LULU_API_SECRET = Deno.env.get('LULU_API_SECRET');
const LULU_BASE_URL = 'https://api.lulu.com';

interface BookOrderRequest {
  orderId: string;
  format: 'standard' | 'large';
  quantity: number;
  coverImageUrl: string;
  interiorPdfUrl: string;
  shippingAddress: {
    name: string;
    street1: string;
    street2?: string;
    city: string;
    stateCode: string;
    countryCode: string;
    postalCode: string;
    email: string;
    phone?: string;
  };
}

// Book specifications for Carlsen in Color
const BOOK_SPECS = {
  standard: {
    podPackageId: '0600X0900BWSTDPB060UW444MNG', // 6x9 Standard Color
    pageCount: 220,
    title: 'Carlsen in Color: Standard Edition',
    bindingType: 'case-wrap-hardcover',
    interiorColorType: 'standard-color',
    paperType: 'premium',
    trimSize: { width: 8.5, height: 11, unit: 'IN' },
    priceCents: 7999,
  },
  large: {
    podPackageId: '0850X1100BWSTDPB060UW444MNG', // 8.5x11 Premium Color
    pageCount: 220,
    title: 'Carlsen in Color: Large Format Edition',
    bindingType: 'case-wrap-hardcover',
    interiorColorType: 'premium-color',
    paperType: 'premium',
    trimSize: { width: 11, height: 14, unit: 'IN' },
    priceCents: 9999,
  },
};

async function getAccessToken(): Promise<string> {
  const credentials = btoa(`${LULU_API_KEY}:${LULU_API_SECRET}`);
  
  const response = await fetch(`${LULU_BASE_URL}/auth/realms/glasstree/protocol/openid-connect/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Lulu auth failed: ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function luluRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const accessToken = await getAccessToken();
  
  const response = await fetch(`${LULU_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  return response;
}

async function createPrintJob(order: BookOrderRequest): Promise<object> {
  const specs = BOOK_SPECS[order.format];
  
  const printJobPayload = {
    contact_email: order.shippingAddress.email,
    external_id: order.orderId,
    line_items: [
      {
        external_id: `${order.orderId}-book`,
        printable_normalization: {
          cover: {
            source_url: order.coverImageUrl,
          },
          interior: {
            source_url: order.interiorPdfUrl,
          },
          pod_package_id: specs.podPackageId,
        },
        quantity: order.quantity,
        title: specs.title,
      },
    ],
    production_delay: 120, // 2 minute delay for possible cancellation
    shipping_address: {
      city: order.shippingAddress.city,
      country_code: order.shippingAddress.countryCode,
      email: order.shippingAddress.email,
      name: order.shippingAddress.name,
      phone_number: order.shippingAddress.phone || '',
      postcode: order.shippingAddress.postalCode,
      state_code: order.shippingAddress.stateCode,
      street1: order.shippingAddress.street1,
      street2: order.shippingAddress.street2 || '',
    },
    shipping_level: 'MAIL', // Standard shipping
  };

  const response = await luluRequest('/print-jobs/', {
    method: 'POST',
    body: JSON.stringify(printJobPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Lulu print job creation failed: ${errorText}`);
  }

  return response.json();
}

async function getShippingOptions(countryCode: string, quantity: number, format: 'standard' | 'large'): Promise<object[]> {
  const specs = BOOK_SPECS[format];
  
  const response = await luluRequest(`/shipping/calculator/`, {
    method: 'POST',
    body: JSON.stringify({
      line_items: [
        {
          page_count: specs.pageCount,
          pod_package_id: specs.podPackageId,
          quantity: quantity,
        },
      ],
      shipping_address: {
        country_code: countryCode,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Lulu shipping calculation failed: ${errorText}`);
  }

  const data = await response.json();
  return data.shipping_options || [];
}

async function getPrintJobStatus(printJobId: string): Promise<object> {
  const response = await luluRequest(`/print-jobs/${printJobId}/`);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get print job status: ${errorText}`);
  }

  return response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authorization
    const authHeader = req.headers.get('Authorization');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!authHeader || !serviceRoleKey || !authHeader.includes(serviceRoleKey)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!LULU_API_KEY || !LULU_API_SECRET) {
      throw new Error('Lulu API credentials not configured');
    }

    const url = new URL(req.url);
    const path = url.pathname.replace('/lulu-book-order', '');

    // POST /create - Create a book print job
    if (req.method === 'POST' && path === '/create') {
      const body: BookOrderRequest = await req.json();
      const printJob = await createPrintJob(body);
      
      return new Response(JSON.stringify({ success: true, printJob }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /shipping - Calculate shipping options
    if (req.method === 'POST' && path === '/shipping') {
      const { countryCode, quantity, format } = await req.json();
      const shippingOptions = await getShippingOptions(countryCode, quantity || 1, format || 'standard');
      
      return new Response(JSON.stringify({ success: true, shippingOptions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /status/:id - Get print job status
    if (req.method === 'GET' && path.startsWith('/status/')) {
      const printJobId = path.replace('/status/', '');
      const status = await getPrintJobStatus(printJobId);
      
      return new Response(JSON.stringify({ success: true, status }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // GET /specs - Get book specifications
    if (req.method === 'GET' && path === '/specs') {
      return new Response(JSON.stringify({ 
        success: true, 
        specs: BOOK_SPECS,
        shipping: {
          baseCostCents: 999,
          weightBasedSurcharge: true,
          estimatedDays: { min: 5, max: 10 },
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Lulu book order error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});