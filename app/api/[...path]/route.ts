import { NextRequest, NextResponse } from 'next/server'
import { Worker } from 'worker_threads'
import { getPageByEndpoint } from '@/utils/supabase/actions/page'

interface WorkerResponse {
  success: boolean
  response?: {
    body: any
    status: number
    headers: Record<string, string>
  }
  logs: string[]
  error?: string
}

const executeCodeWithWorker = (code: string, context: any, timeout = 5000): Promise<WorkerResponse> => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(`
      const { parentPort } = require('worker_threads');
      const nodeFetch = import('node-fetch').then(mod => mod.default);
      const axiosPromise = import('axios').then(mod => mod.default);
      // Set up logging collection
      const logs = [];
      const console = {
        log: (...args) => {
          const log = args.map(arg => {
            try {
              return typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            } catch (e) {
              return '[Unstringifiable Object]'
            }
          }).join(' ');
          logs.push(log);
        }
      };

      // Set up fetch implementation in global scope
      global.fetch = async (url, options = {}) => {
        try {
          const fetchFn = await nodeFetch;
          const res = await fetchFn(url, options);
          if (!res.ok) {
            throw new Error('HTTP error! status: ' + res.status);
          }
          const data = await res.json();
          return {
            ok: res.ok,
            status: res.status,
            statusText: res.statusText,
            headers: res.headers,
            json: () => Promise.resolve(data),
            text: () => Promise.resolve(JSON.stringify(data))
          };
        } catch (err) {
          console.log("Fetch error:", err.message);
          throw err;
        }
      };
      
      parentPort.on('message', async ({ code, context }) => {
        try {
          // Set up global context
          global.console = console;
          global.request = context.request;
          global.response = context.response;
          // Make data available globally for POST requests
          global.data = context.request.body?.data;
          
          // Make axios available in global scope
          global.axios = await axiosPromise;
          
          // Execute the code and wait for all promises to settle
          const result = await eval(code);
          
          // If the result is a promise, wait for it
          if (result && typeof result.then === 'function') {
            await result;
          }
          
          // Add a small delay to ensure any floating promises are settled
          await new Promise(resolve => setTimeout(resolve, 2500));
          
          parentPort.postMessage({ 
            success: true, 
            response: global.response,
            logs
          });
        } catch (error) {
          parentPort.postMessage({ 
            success: false, 
            error: error.message,
            logs
          });
        }
      });
    `, { eval: true });

    const timer = setTimeout(() => {
      worker.terminate();
      reject(new Error("Code execution timed out"));
    }, timeout);

    worker.on('message', (data) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(data);
    });

    worker.on('error', (error) => {
      clearTimeout(timer);
      worker.terminate();
      reject(error);
    });

    worker.postMessage({ code, context });
  });
};

export async function GET(request: NextRequest) {
  return handleRequest(request, 'GET', null)
}

export async function POST(request: NextRequest) {
  const data = await request.json()
  return handleRequest(request, 'POST', data)
}

async function handleRequest(request: NextRequest, method: string, data: any) {
  try {
    const pathname = request.nextUrl.pathname.split('/api/')[1]
    
    // Safely parse request data
    console.log('Pathname:', pathname)
    
    const page = await getPageByEndpoint(pathname, method)

    if (!page) {
      console.log('Endpoint not found')
      return NextResponse.json(
        { error: 'Endpoint not found' },
        { status: 404 }
      )
    }

    console.log('Found page:', page.id)

    // Prepare the execution context
    const context = {
      request: {
        method,
        url: request.url,
        headers: Object.fromEntries(request.headers),
        query: Object.fromEntries(request.nextUrl.searchParams),
        body: method === 'POST' ? {
          code: data.code,
          data: data.data // This is the parsed body data from the POST request
        } : null
      },
      response: {
        status: 200,
        headers: {},
        body: null
      }
    }

    // Wrap the code to handle async operations
    const wrappedCode = `
      (async function() {
        try {
          ${page.code}
        } catch(err) {
          console.log('Error:', err.message);
          response.body = { error: err.message };
          response.status = 500;
        }
      })();
    `

    try {
      const result = await executeCodeWithWorker(wrappedCode, context, 5000)
      
      if (!result.success) {
        return NextResponse.json({ 
          success: false,
          output: result.logs.join('\n'),
          error: result.error
        }, { status: 400 })
      }

      return NextResponse.json(
        (result.response?.body) || { 
          success: true,
          output: result.logs.join('\n') || 'Code executed successfully (no output)',
          error: null 
        },
        { 
          status: result.response?.status || 200,
          headers: result.response?.headers || {}
        }
      )

    } catch (error: any) {
      return NextResponse.json({ 
        success: false,
        output: null,
        error: `Execution Error: ${error.message}`
      }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Server error:', error)
    return NextResponse.json(
      { 
        success: false,
        output: null,
        error: `Server Error: ${error.message}`,
        details: error.stack
      },
      { status: 500 }
    )
  }
} 